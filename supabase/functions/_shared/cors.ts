const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGIN') || 'https://cosmiclly.com')
  .split(',')
  .map((o) => o.trim());

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}
