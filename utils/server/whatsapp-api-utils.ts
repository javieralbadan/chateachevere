const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;

interface SendTypingDotsProps {
  phoneNumberId: string;
  to: string | undefined;
  accessToken: string;
}

export const sendTypingDots = async ({ phoneNumberId, to, accessToken }: SendTypingDotsProps) => {
  if (!to) return;

  if (!process.env.WHATSAPP_API_URL) {
    throw new Error('WHATSAPP_API_URL no configurada');
  }

  const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'typing_on',
    }),
  });

  if (!response.ok) {
    console.error('❌ Error enviando typing_on:', await response.text());
  }
};
