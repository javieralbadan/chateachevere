import {
  conversationHandler,
  hasActiveConvo,
} from '@/services/tenants/cheefoodies/conversation-handler';
import {
  WhatsAppTemplateMessage,
  WhatsAppTemplateRequest,
  WhatsAppTextMessage,
  WhatsAppTextRequest,
} from '@/types/whatsapp';
import { formatPhoneNumber } from '@/utils/formatters';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v22.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// Validación de configuración
function validateConfig(): boolean {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.error('WhatsApp API configuración incompleta');
    return false;
  }
  return true;
}

export async function sendWhatsappTextMessage({
  to,
  message,
}: WhatsAppTextMessage): Promise<unknown> {
  if (!validateConfig()) throw new Error('WhatsApp API configuración incompleta');

  const formattedPhone = formatPhoneNumber(to);
  console.log(`📧 Enviando mensaje de texto ${message}`);

  const bodyRequest: WhatsAppTextRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    type: 'text',
    to: formattedPhone,
    text: {
      body: message,
    },
  };

  return sendMessage({ bodyRequest, formattedPhone });
}

export async function sendWhatsappTemplateMessage({
  to,
  templateName,
  components,
  languageCode = 'es_CO',
}: WhatsAppTemplateMessage): Promise<unknown> {
  if (!validateConfig()) throw new Error('WhatsApp API configuration incomplete');

  const formattedPhone = formatPhoneNumber(to);
  console.log(`💌 Enviando mensaje de plantilla (template ${templateName})`);

  const bodyRequest: WhatsAppTemplateRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    type: 'template',
    to: formattedPhone,
    template: {
      language: { code: languageCode },
      name: templateName,
      components,
    },
  };

  return sendMessage({ bodyRequest, formattedPhone });
}

interface SendMessageProps {
  bodyRequest: WhatsAppTextRequest | WhatsAppTemplateRequest;
  formattedPhone: string;
}

async function sendMessage({ bodyRequest, formattedPhone }: SendMessageProps) {
  try {
    console.log(`➡️ Enviando mensaje WhatsApp a ${formattedPhone}`);

    const response = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
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

    console.log(`✅ WhatsApp enviado a ${formattedPhone}`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error enviando mensaje de WhatsApp:', error);
    throw error;
  }
}

// Función principal para obtener el mensaje de respuesta apropiado
export async function getResponseMessage(
  phoneNumber: string,
  incomingMessage: string,
): Promise<string> {
  const lowerMessage = incomingMessage.toLowerCase();
  const isRestaurantActive = await hasActiveConvo(phoneNumber);

  // Verificar si es una conversación de restaurante (nueva o existente)
  if (isRestaurantActive || lowerMessage.includes('restaurante')) {
    console.log('🍽️ Procesando como conversación de restaurante');
    return await conversationHandler(phoneNumber, incomingMessage);
  }

  // Verificar si es una conversación de pizzeria (nueva o existente)
  if (lowerMessage.includes('pizzeria')) {
    console.log('🍕 Procesando como mensaje de pizzeria');
    return processPizzeriaAutoReply();
  }

  // Si no es ninguno, devolver el mensaje de bienvenida
  return 'Hola 👋🏼\n\nEsta es un mensaje automático de bienvenida';
}

export function processPizzeriaAutoReply(): string {
  return '🍕 Bienvenido a Richezza 🍕\n\n¿qué pizza deseas pedir para hoy?';
}
