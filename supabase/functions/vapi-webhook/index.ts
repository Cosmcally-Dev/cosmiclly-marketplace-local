import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://cosmiclly-marketplace-local.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse webhook body
    let body;
    try {
      body = await req.json();
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
