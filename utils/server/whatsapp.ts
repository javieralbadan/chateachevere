import * as carneBrava from '@/services/tenants/carne-brava/conversation-handler';
import * as cheefoodies from '@/services/tenants/cheefoodies/conversation-handler';
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
  if (!phoneNumber || !incomingMessage) {
    console.error('❌ phoneNumber o incomingMessage vacío');
    return 'Error: Datos incompletos';
  }

  const lowerMessage = incomingMessage.toLowerCase();
  try {
    if (lowerMessage.includes('reiniciar')) {
      await carneBrava.clearConvo(phoneNumber);
      await cheefoodies.clearConvo(phoneNumber);
    }

    // Direccionar conversación (nueva o existente) con su respectivo tenant handler
    const isCheefoodiesActive = await cheefoodies.hasActiveConvo(phoneNumber);
    if (isCheefoodiesActive || lowerMessage.includes('domicilios')) {
      console.log('🍽️ Procesando como conversación de Cheefoodies');
      return await cheefoodies.conversationHandler(phoneNumber, incomingMessage);
    }

    const isCarneBravaActive = await carneBrava.hasActiveConvo(phoneNumber);
    if (isCarneBravaActive || lowerMessage.includes('brava')) {
      console.log('🍽️ Procesando como conversación de Carne Brava');
      return await carneBrava.conversationHandler(phoneNumber, incomingMessage);
    }

    // Si no es ninguno, devolver el mensaje de bienvenida
    return getInitialAutoReply();
  } catch (error) {
    console.error('❌ Error en getResponseMessage:', error);
    return 'Lo siento, ocurrió un error. Intenta nuevamente.';
  }
}

const getInitialAutoReply =
  () => `Te damos la bienvenida al chat automático de prueba 👋🏼. Con las siguientes palabras puedes iniciar diferentes flujos de conversación:\n
"*domicilios*": selección de items (comida) por categorías\n
"*brava*": flujo por categorías los fines de semana y flujo secuencial para personalizar un almuerzo entre semana\n
*Responde con una de las palabras*
`;
