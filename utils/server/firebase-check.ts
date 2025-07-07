/**
 * Utilidad para manejar endpoints que no funcionan en Firebase static export
 */
export function isFirebaseStaticExport(): boolean {
  return process.env.BUILD_TARGET === 'firebase';
}

export function getUnavailableResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'This endpoint is not available in static export',
      message: 'Use this endpoint on Vercel deployment',
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    },
  );
}
