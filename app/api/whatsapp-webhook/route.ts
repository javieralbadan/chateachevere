import { getActiveConversationsStats } from '@/services/tenants/cheefoodies/conversation-handler';
import { WhatsAppWebhookBody } from '@/types/whatsapp';
import { getUnavailableResponse, isFirebaseStaticExport } from '@/utils/server/firebase-check';
import { getResponseMessage, sendWhatsappTextMessage } from '@/utils/server/whatsapp';
import { NextRequest, NextResponse } from 'next/server';

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

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
    return new NextResponse(challenge, { status: 200 });
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
    console.log('📲 [Webhook POST] Full request body:', JSON.stringify(jsonData, null, 2));

    if (body.object === 'whatsapp_business_account') {
      const changes = body.entry?.[0]?.changes?.[0];

      if (changes?.field === 'messages') {
        const messages = changes.value?.messages;
        if (messages && messages.length > 0) {
          for (const message of messages) {
            if (message.type === 'text' && message.text && message.text.body) {
              // await sendAutoReply(message.from);
              await sendIntelligentReply(message.from, message.text.body);
            }
          }
        }
      }
    }

    const stats = getActiveConversationsStats();
    console.log('📊 Stats:', stats);

    return new NextResponse('Webhook received', { status: 200 });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function sendIntelligentReply(phoneNumber: string, incomingMessage: string) {
  console.log(
    `📥 [Webhook POST] sendIntelligentReply ~ from: ${phoneNumber}, message: "${incomingMessage}"`,
  );

  try {
    // Obtener la respuesta apropiada basada en el mensaje y contexto
    const responseMessage = getResponseMessage(phoneNumber, incomingMessage);

    // Enviar el mensaje de respuesta
    await sendWhatsappTextMessage({
      to: phoneNumber,
      message: responseMessage,
    });

    console.log(`✅ Respuesta enviada exitosamente a ${phoneNumber}`);
  } catch (error) {
    console.error('Error en respuesta inteligente:', error);
  }
}
