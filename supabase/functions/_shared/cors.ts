const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGIN') || 'https://cosmiclly.com')
  .split(',')
  .map((o) => o.trim());

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow all Vercel preview deployment URLs
  if (origin.startsWith('https://') && origin.endsWith('.vercel.app')) return true;
  return false;
}

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowed = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}
