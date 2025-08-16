import { getTenantSetupFromDB } from '@/services/core/tenant';
import { createWhatsAppHandler } from '@/services/core/whatsapp-handler';
import { ProcessMsgFn, WhatsAppWebhookBody } from '@/types/whatsapp';
import { handleNextSuccessResponse } from '@/utils/mappers/nextResponse';
import { NextRequest, NextResponse } from 'next/server';

const isDev = process.env.NODE_ENV === 'development';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
const STATUS_CODE = { status: 200 }; // Always response status: 200 to Meta Cloud API to avoid retries

// Verificación del webhook - Meta realiza request GET al Callback URL
export function GET(request: NextRequest) {
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
  const jsonData: unknown = await request.json();
  const body = jsonData as WhatsAppWebhookBody;

  if (body.object !== 'whatsapp_business_account') {
    return new NextResponse('Webhook processed - body.object not WB account', STATUS_CODE);
  }

  const changes = body.entry?.[0]?.changes?.[0];
  const isFieldMessages = changes?.field === 'messages';
  const message = changes.value?.messages?.[0];
  const phoneNumberId = changes.value?.metadata?.phone_number_id;

  if (!isFieldMessages || !message || !phoneNumberId) {
    console.error('❌ WhatsApp message invalid structure (incoming - Meta webhook)');
    return new NextResponse('Webhook processed - invalid structure', STATUS_CODE);
  }

  try {
    // Obtener configuración del tenant basada en phone_number_id
    const tenantSetup = await getTenantSetupFromDB('phoneNumberId', phoneNumberId);
    if (!tenantSetup) {
      console.error(`❌ Tenant no encontrado para phone_number_id: ${phoneNumberId}`);
      return new NextResponse('Webhook processed - Tenant not found', STATUS_CODE);
    }

    // console.log('[Webhook POST] Full request body:', JSON.stringify(jsonData, null, 2));
    const result = await processWhatsAppMessage(tenantSetup, message);
    if (isDev && result) {
      // Solo en dev retornar el mensaje de respuesta (result) para el sandbox
      return handleNextSuccessResponse({ success: true, response: result });
    }

    return new NextResponse('Webhook received', STATUS_CODE);
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

const processWhatsAppMessage: ProcessMsgFn = async (tenantSetup, message) => {
  let sandboxResponse: string | null = null;
  const phoneNumber = message.from;
  const incomingMessage = message.text?.body;

  if (message.type !== 'text' || !phoneNumber || !incomingMessage) {
    throw new Error('WhatsApp message invalid structure (incoming - Meta webhook)');
  }

  console.log(`[Webhook POST] From: ${phoneNumber} (${tenantSetup.name}): "${incomingMessage}"`);
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
    console.error('Error processando WhatsApp message:', error);
  }

  return sandboxResponse;
};
