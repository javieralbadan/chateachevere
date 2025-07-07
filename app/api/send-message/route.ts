import { MessageBodyRequest } from '@/types/messages';
import { handleNextErrorResponse, handleNextSuccessResponse } from '@/utils/mappers/nextResponse';
import { getUnavailableResponse, isFirebaseStaticExport } from '@/utils/server/firebase-check';
import { sendWhatsappTemplateMessage } from '@/utils/server/whatsapp';

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

export async function POST(req: Request) {
  if (isFirebaseStaticExport()) {
    return getUnavailableResponse();
  }

  try {
    if (!isAuthorized(req)) {
      return handleNextErrorResponse('No autorizado', 401);
    }

    const { templateName, to, components } = (await req.json()) as MessageBodyRequest;

    if (!to || !templateName || !components) {
      return handleNextErrorResponse('Faltan parámetros');
    }

    console.log(
      '🖥️ [send-message POST] to, templateName, components:',
      to,
      templateName,
      JSON.stringify(components, null, 2),
    );
    const result = await sendWhatsappTemplateMessage({
      to,
      templateName,
      components,
    });

    return handleNextSuccessResponse({ success: true, response: result });
  } catch (error) {
    return handleNextErrorResponse(error as Error);
  }
}

function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  return token === INTERNAL_API_KEY;
}
