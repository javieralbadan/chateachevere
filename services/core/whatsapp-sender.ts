import { WhatsAppAnyRequest, WhatsAppTextRequest } from '@/types/whatsapp';
import { formatPhoneNumber } from '@/utils/formatters';

const logModule = process.env.LOG_CORE_WS_SENDER === 'true';
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const DEFAULT_ACCESS_TOKEN = process.env.DEFAULT_WHATSAPP_ACCESS_TOKEN;

export interface SendMessageParams {
  phoneNumberId: string;
  accessToken: string;
  bodyRequest: WhatsAppAnyRequest;
}

export const sendMessage = async ({
  phoneNumberId,
  accessToken,
  bodyRequest,
}: SendMessageParams) => {
  if (logModule) console.log(`➡️ [${phoneNumberId}] Enviando WhatsApp a ${bodyRequest.to}`);

  if (!process.env.WHATSAPP_API_URL) {
    throw new Error('WHATSAPP_API_URL no configurada');
  }

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

    if (logModule) console.log(`✅ [${phoneNumberId}] WhatsApp enviado a ${bodyRequest.to}`);
    return result;
  } catch (error) {
    console.error(`❌ [${phoneNumberId}] Error enviando mensaje de WhatsApp:`, error);
    throw error;
  }
};

export const sendImmediateProcessingMessage = async (phoneNumberId: string, to: string) => {
  const bodyRequest: WhatsAppTextRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    type: 'text',
    to: formatPhoneNumber(to),
    text: {
      body: '⏳ Procesando...',
    },
  };

  return sendMessage({ phoneNumberId, accessToken: DEFAULT_ACCESS_TOKEN!, bodyRequest });
};
