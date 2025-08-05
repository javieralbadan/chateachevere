import { getTenantSetupFromDB } from '@/services/core/tenant';
import { createWhatsAppHandler } from '@/services/core/whatsapp-handler';
import { TenantSetup, WhatsAppMessage, WhatsAppWebhookBody } from '@/types/whatsapp';
import { handleNextSuccessResponse } from '@/utils/mappers/nextResponse';
import { getUnavailableResponse, isFirebaseStaticExport } from '@/utils/server/firebase-check';
import { NextRequest, NextResponse } from 'next/server';

const isDev = process.env.NODE_ENV === 'development';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
const STATUS_CODE = { status: 200 }; // Always response status: 200 to Meta Cloud API to avoid retries

// Verificación del webhook - Meta realiza request GET al Callback URL
export function GET(request: NextRequest) {
  if (isFirebaseStaticExport()) {
    return getUnavailableResponse();
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === INTERNAL_API_KEY) {
    console.log('Webhook verificado');
    return new NextResponse(challenge, STATUS_CODE);
  }

  return new NextResponse('Verificación fallida', { status: 403 });
}

// Manejo de mensajes entrantes (POST)
export async function POST(request: NextRequest) {
  if (isFirebaseStaticExport()) {
    return getUnavailableResponse();
  }

  try {
    const jsonData: unknown = await request.json();
    const body = jsonData as WhatsAppWebhookBody;

    if (body.object === 'whatsapp_business_account') {
      const changes = body.entry?.[0]?.changes?.[0];

      // Extraer phone_number_id del payload
      const phoneNumberId = changes.value?.metadata?.phone_number_id;

      if (!phoneNumberId) {
        console.error('❌ phone_number_id no encontrado en el payload');
        return new NextResponse('Webhook processed - Missing phone_number_id', STATUS_CODE);
      }

      // Obtener configuración del tenant basada en phone_number_id
      const tenantSetup = await getTenantSetupFromDB('phoneNumberId', phoneNumberId);
      if (!tenantSetup) {
        console.error(`❌ Tenant no encontrado para phone_number_id: ${phoneNumberId}`);
        return new NextResponse('Webhook processed - Tenant not found', STATUS_CODE);
      }

      console.log(`📱 Procesando mensaje para tenant ${tenantSetup.handlerKey} (${phoneNumberId})`);
      if (changes?.field === 'messages') {
        // console.log('[Webhook POST] Full request body:', JSON.stringify(jsonData, null, 2));
        const result = await processWhatsAppMessage(tenantSetup, changes.value?.messages);

        if (isDev && result) {
          return handleNextSuccessResponse({ success: true, response: result });
        }
      }
    }

    return new NextResponse('Webhook received', STATUS_CODE);
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

const processWhatsAppMessage = async (
  tenantSetup: TenantSetup,
  messages: WhatsAppMessage[] | undefined,
): Promise<string | null> => {
  if (!messages || messages.length === 0) return null;

  let sandboxResponse: string | null = null;

  for (const message of messages) {
    const phoneNumber = message?.from;
    const incomingMessage = message?.text?.body;

    if (message?.type !== 'text' || !phoneNumber || !incomingMessage) {
      throw new Error('WhatsAppMessage invalid structure (incoming - Meta webhook)');
    }

    console.log(`[Webhook POST] From: ${phoneNumber}. Message: "${incomingMessage}"`);
    try {
      // Use the closure-based handler
      const whatsappHandler = createWhatsAppHandler(tenantSetup);
      const responseMsg = await whatsappHandler.getResponse(phoneNumber, incomingMessage);

      if (isDev) {
        console.log('📤 Bot Response (DEV):', responseMsg);
        sandboxResponse = responseMsg;
      } else {
        console.log(`✅ Respuesta enviada exitosamente a ${phoneNumber}`);
        await whatsappHandler.sendTextMessage({ to: phoneNumber, message: responseMsg });
      }
    } catch (error) {
      console.error('Error processando WhatsAppMessage:', error);
    }
  }

  return sandboxResponse;
};
