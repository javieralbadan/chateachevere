import { ConversationHandlerModule } from '@/types/conversation';
import {
  GetResponseFn,
  SendTemplateMessageFn,
  SendTextMessageFn,
  TenantSetup,
  WhatsAppAnyRequest,
  WhatsAppTemplateRequest,
  WhatsAppTextRequest,
} from '@/types/whatsapp';
import { formatPhoneNumber } from '@/utils/formatters';

const logModule = process.env.LOG_CORE_WS_HANDLER === 'true';
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
// Lazy loading map for conversation handlers
const handlerImports = {
  'carne-brava': () => import('@/services/tenants/carne-brava/conversation-handler'),
  cheefoodies: () => import('@/services/tenants/cheefoodies/conversation-handler'),
  'chatea-chevere': () => import('@/services/tenants/chatea-chevere/conversation-handler'),
} as const;

// ===== CACHE FOR HANDLERS =====
const handlerCache = new Map<string, ConversationHandlerModule>();

// ===== LAZY LOAD HANDLER FUNCTION =====
const getHandler = async (
  handlerKey: keyof typeof handlerImports,
): Promise<ConversationHandlerModule | null> => {
  try {
    // Check cache first
    if (handlerCache.has(handlerKey)) {
      return handlerCache.get(handlerKey)!;
    }

    // Import and cache the handler
    const handlerModule = await handlerImports[handlerKey]();
    handlerCache.set(handlerKey, handlerModule);
    return handlerModule;
  } catch (error) {
    console.error(`❌ Error loading handler ${handlerKey}:`, error);
    return null;
  }
};

// ===== HANDLER CLOSURE FACTORY =====

export const createWhatsAppHandler = (tenantSetup: TenantSetup) => {
  if (logModule) console.log('🚀 ~ createWhatsAppHandler ~ tenantSetup:', tenantSetup);
  const { phoneNumberId, accessToken, handlerKey } = tenantSetup;

  if (!phoneNumberId || !accessToken || !handlerKey) {
    const errorMsg = !phoneNumberId ? 'phoneNumberId' : !accessToken ? 'accessToken' : 'handlerKey';
    throw new Error(`TenantSetup incompleto: falta ${errorMsg}`);
  }

  if (!process.env.WHATSAPP_API_URL) {
    throw new Error('WHATSAPP_API_URL no configurada');
  }

  const isProxyTenant = tenantSetup.handlerKey === 'chatea-chevere';

  // Main response handler with lazy loading and proxy support
  const getResponse: GetResponseFn = async (phoneNumber, incomingMessage) => {
    if (!phoneNumber || !incomingMessage) {
      console.error('❌ Datos incompletos en getResponse');
      return 'Error: Datos incompletos';
    }

    const lowerMessage = incomingMessage.toLowerCase();

    try {
      // Lazy load the specific handler
      const handler = await getHandler(tenantSetup.handlerKey as keyof typeof handlerImports);

      if (!handler) {
        console.error(`❌ Handler no encontrado para el tenant "${tenantSetup.name}"`);
        return 'Error: Servicio no configurado correctamente';
      }

      // Check for active conversation
      if (handler.hasActiveConvo) {
        const hasActiveConvo = await handler.hasActiveConvo(phoneNumber);

        if (hasActiveConvo && handler.conversationHandler) {
          if (logModule) console.log(`> Procesando conversación activa para ${tenantSetup.name}`);
          return await handler.conversationHandler(phoneNumber, lowerMessage);
        }
      }

      // Para tenant normal, ejecutar su conversationHandler
      if (!isProxyTenant && handler.conversationHandler) {
        return await handler.conversationHandler(phoneNumber, lowerMessage);
      }

      // Para tenant proxy, ejecutar su conversationHandler
      if (isProxyTenant && handler.conversationHandler) {
        return await handler.conversationHandler(phoneNumber, lowerMessage);
      }

      // Default welcome message
      return 'Este es un mensaje de respuesta automático';
    } catch (error) {
      console.error('❌ Error en getResponse:', error);
      return 'Lo siento, ocurrió un error. Intenta nuevamente.';
    }
  };

  // Private send message function with closure over tenantSetup
  const sendMessage = async (bodyRequest: WhatsAppAnyRequest, to: string) => {
    const formattedPhone = formatPhoneNumber(to);
    if (logModule) console.log(`➡️ [${phoneNumberId}] Enviando WhatsApp a ${formattedPhone}`);

    try {
      const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(bodyRequest),
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        const { error } = result as { error?: { message: string } };
        const errorMessage =
          typeof error === 'string' ? error : error?.message || 'Error al enviar el mensaje';
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (logModule) console.log(`✅ [${phoneNumberId}] WhatsApp enviado a ${formattedPhone}`);
      return result;
    } catch (error) {
      console.error(`❌ [${phoneNumberId}] Error enviando mensaje de WhatsApp:`, error);
      throw error;
    }
  };

  // Send text message handler with proxy support
  const sendTextMessage: SendTextMessageFn = async ({ to, message }) => {
    if (logModule) console.log(`📧 Enviando mensaje de texto ${message}`);

    // Envío normal (sin proxy) o fallback
    const bodyRequest: WhatsAppTextRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      type: 'text',
      to: formatPhoneNumber(to),
      text: {
        body: message,
      },
    };

    return sendMessage(bodyRequest, to);
  };

  // Send template message handler
  const sendTemplateMessage: SendTemplateMessageFn = async ({
    to,
    templateName,
    components,
    languageCode = 'es_CO',
  }) => {
    if (logModule) console.log(`💌 Enviando mensaje de plantilla (template ${templateName})`);

    const bodyRequest: WhatsAppTemplateRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      type: 'template',
      to: formatPhoneNumber(to),
      template: {
        language: { code: languageCode },
        name: templateName,
        components,
      },
    };

    return sendMessage(bodyRequest, to);
  };

  return {
    getResponse,
    sendTextMessage,
    sendTemplateMessage,
  };
};
