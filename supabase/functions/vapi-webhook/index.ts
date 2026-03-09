import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getCorsHeaders } from '../_shared/cors.ts';

/** Verify Vapi webhook signature using HMAC-SHA256 */
async function verifyVapiSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const expectedHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  // Constant-time comparison to prevent timing attacks
  if (expectedHex.length !== signatureHeader.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    mismatch |= expectedHex.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  }
  return mismatch === 0;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const jsonResponse = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Read raw body for signature verification
    const rawBody = await req.text();

    // Verify webhook signature if secret is configured
    const vapiWebhookSecret = Deno.env.get('VAPI_WEBHOOK_SECRET');
    if (vapiWebhookSecret) {
      const signature = req.headers.get('x-vapi-signature');
      const isValid = await verifyVapiSignature(rawBody, signature, vapiWebhookSecret);
      if (!isValid) {
        console.error('Vapi webhook signature verification failed');
        return jsonResponse({ error: 'Invalid webhook signature' }, 401);
      }
    } else {
      console.warn('VAPI_WEBHOOK_SECRET not configured — skipping signature verification. Set it via: supabase secrets set VAPI_WEBHOOK_SECRET=...');
    }

    // Parse webhook body
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    const message = body?.message;
    if (!message || !message.type) {
      return jsonResponse({ error: 'Missing message or message.type in webhook payload' }, 400);
    }

    console.log(`Vapi webhook received: ${message.type}`);

    // Only process end-of-call-report events
    if (message.type !== 'end-of-call-report') {
      return jsonResponse({ received: true });
    }

    // ========================
    // Handle end-of-call-report
    // ========================
    const call = message.call;
    const metadata = call?.metadata;

    if (!metadata?.session_id || !metadata?.client_id || !metadata?.advisor_id) {
      console.error('Missing required metadata in end-of-call-report:', metadata);
      return jsonResponse({ error: 'Missing session_id, client_id, or advisor_id in call.metadata' }, 400);
    }

    const { session_id, client_id, advisor_id } = metadata;
    const durationSeconds: number = message.durationSeconds || 0;
    const transcript: string = message.transcript || '';

    // Service role client for DB operations (no user auth on webhooks)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch advisor's twin voice rate
    const { data: advisor, error: advisorError } = await supabase
      .from('advisor_details')
      .select('twin_voice_rate_per_min')
      .eq('id', advisor_id)
      .single();

    if (advisorError || !advisor) {
      console.error('Failed to fetch advisor details:', advisorError);
      return jsonResponse({ error: 'Advisor details not found' }, 404);
    }

    const ratePerMin = advisor.twin_voice_rate_per_min || 0;
    const billableMinutes = Math.ceil(durationSeconds / 60);
    const cost = billableMinutes * ratePerMin;

    console.log(
      `End-of-call: session=${session_id}, duration=${durationSeconds}s, ` +
      `billable=${billableMinutes}min, rate=${ratePerMin}/min, cost=${cost}`
    );

    // Deduct credits from client
    const { data: clientProfile, error: clientFetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', client_id)
      .single();

    if (clientFetchError || !clientProfile) {
      console.error('Failed to fetch client profile:', clientFetchError);
      return jsonResponse({ error: 'Client profile not found' }, 404);
    }

    const newCredits = (clientProfile.credits || 0) - cost;

    const { error: deductError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', client_id);

    if (deductError) {
      console.error('Failed to deduct credits:', deductError);
      return jsonResponse({ error: 'Failed to deduct credits' }, 500);
    }

    // Update session to completed with billing info and transcript
    const { data: existingSession, error: sessionFetchError } = await supabase
      .from('sessions')
      .select('session_metadata')
      .eq('id', session_id)
      .single();

    if (sessionFetchError) {
      console.error('Failed to fetch session:', sessionFetchError);
    }

    const existingMetadata = (existingSession?.session_metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...existingMetadata,
      transcript,
      vapi_call_id: call.id,
    };

    const { error: sessionUpdateError } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        billable_minutes: billableMinutes,
        cost_total: cost,
        billing_status: 'completed',
        session_metadata: updatedMetadata,
      })
      .eq('id', session_id);

    if (sessionUpdateError) {
      console.error('Failed to update session:', sessionUpdateError);
      return jsonResponse({ error: 'Failed to update session' }, 500);
    }

    console.log(`Session ${session_id} completed. Deducted ${cost} credits from client ${client_id}.`);

    return jsonResponse({ success: true });
  } catch (error: any) {
    console.error('Unexpected error in vapi-webhook:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
});
