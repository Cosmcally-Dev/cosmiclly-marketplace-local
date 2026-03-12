import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract the sub-path after the function name
    // SDK calls paths like /call/web, /call/{id}/stop, etc.
    const url = new URL(req.url);
    const fnPrefix = '/functions/v1/vapi-call-proxy';
    const subPath = url.pathname.startsWith(fnPrefix)
      ? url.pathname.slice(fnPrefix.length)
      : '';
    const vapiUrl = `https://api.vapi.ai${subPath || '/call/web'}${url.search}`;

    // Forward original headers (SDK sends public key auth — keep it as-is)
    const forwardHeaders = new Headers();
    const authHeader = req.headers.get('Authorization');
    if (authHeader) forwardHeaders.set('Authorization', authHeader);
    forwardHeaders.set('Content-Type', req.headers.get('Content-Type') || 'application/json');

    const body = req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.arrayBuffer()
      : undefined;

    const vapiResponse = await fetch(vapiUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    // Build response with CORS headers
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', vapiResponse.headers.get('Content-Type') || 'application/json');
    Object.entries(corsHeaders).forEach(([k, v]) => responseHeaders.set(k, v));

    return new Response(vapiResponse.body, {
      status: vapiResponse.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Vapi proxy error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Proxy error' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
