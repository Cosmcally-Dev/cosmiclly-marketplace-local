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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validate environment variables
    const cartesiaApiKey = Deno.env.get('CARTESIA_API_KEY');
    const vapiApiKey = Deno.env.get('VAPI_API_KEY');

    if (!cartesiaApiKey) {
      console.error('CARTESIA_API_KEY is not set in edge function secrets');
      return jsonResponse({ error: 'Cartesia is not configured' }, 500);
    }

    if (!vapiApiKey) {
      console.error('VAPI_API_KEY is not set in edge function secrets');
      return jsonResponse({ error: 'Vapi is not configured' }, 500);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    // 2. Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid or expired token' }, 401);
    }

    // Service role client for DB operations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    const { advisor_id, audio_file_path } = body;

    if (!advisor_id || typeof advisor_id !== 'string') {
      return jsonResponse({ error: 'advisor_id is required and must be a string' }, 400);
    }

    if (!audio_file_path || typeof audio_file_path !== 'string') {
      return jsonResponse({ error: 'audio_file_path is required and must be a string' }, 400);
    }

    // 4. Verify caller is the advisor or an admin
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !callerProfile) {
      console.error('Failed to fetch caller profile:', profileError);
      return jsonResponse({ error: 'Failed to verify user role' }, 500);
    }

    const isAdmin = callerProfile.role === 'admin';
    const isOwner = user.id === advisor_id;

    if (!isAdmin && !isOwner) {
      return jsonResponse({ error: 'Forbidden: you can only clone a voice for your own advisor profile' }, 403);
    }

    // 5. Fetch the advisor's name from profiles
    const { data: advisorProfile, error: advisorProfileError } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', advisor_id)
      .single();

    if (advisorProfileError || !advisorProfile) {
      console.error('Failed to fetch advisor profile:', advisorProfileError);
      return jsonResponse({ error: 'Advisor profile not found' }, 404);
    }

    const advisorName = advisorProfile.full_name || 'Unknown Advisor';

    // 6. Download the audio file from training_docs Storage bucket
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('training_docs')
      .download(audio_file_path);

    if (downloadError || !fileData) {
      console.error('Failed to download audio file from storage:', downloadError);
      return jsonResponse({ error: 'Failed to download audio file from storage' }, 404);
    }

    // 7. Call Cartesia API to clone the voice
    const cartesiaFormData = new FormData();
    cartesiaFormData.append('clip', fileData, 'audio_clip');

    const cartesiaResponse = await fetch('https://api.cartesia.ai/voices/clone/clip', {
      method: 'POST',
      headers: {
        'X-API-Key': cartesiaApiKey,
        'Cartesia-Version': '2024-06-10',
      },
      body: cartesiaFormData,
    });

    if (!cartesiaResponse.ok) {
      const cartesiaError = await cartesiaResponse.text();
      console.error('Cartesia voice clone failed:', cartesiaResponse.status, cartesiaError);
      return jsonResponse({ error: `Voice cloning failed: ${cartesiaError}` }, 502);
    }

    const cartesiaResult = await cartesiaResponse.json();
    const cartesiaVoiceId = cartesiaResult.id;

    if (!cartesiaVoiceId) {
      console.error('Cartesia response missing voice id:', cartesiaResult);
      return jsonResponse({ error: 'Voice cloning returned an unexpected response' }, 502);
    }

    console.log(`Cartesia voice cloned successfully: ${cartesiaVoiceId}`);

    // 8. Fetch the advisor's system_prompt from advisor_details
    const { data: advisorDetails, error: detailsError } = await supabaseAdmin
      .from('advisor_details')
      .select('system_prompt')
      .eq('id', advisor_id)
      .single();

    if (detailsError || !advisorDetails) {
      console.error('Failed to fetch advisor_details:', detailsError);
      return jsonResponse({ error: 'Advisor details not found' }, 404);
    }

    const systemPrompt = advisorDetails.system_prompt || '';

    // 9. Create a Vapi assistant
    const vapiResponse = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Twin AI - ${advisorName}`,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          systemMessage: systemPrompt,
          temperature: 0.7,
          maxTokens: 500,
        },
        voice: {
          provider: 'cartesia',
          voiceId: cartesiaVoiceId,
        },
        serverUrl: `${supabaseUrl}/functions/v1/vapi-webhook`,
      }),
    });

    if (!vapiResponse.ok) {
      const vapiError = await vapiResponse.text();
      console.error('Vapi assistant creation failed:', vapiResponse.status, vapiError);
      return jsonResponse({ error: `Vapi assistant creation failed: ${vapiError}` }, 502);
    }

    const vapiResult = await vapiResponse.json();
    const vapiAgentId = vapiResult.id;

    if (!vapiAgentId) {
      console.error('Vapi response missing assistant id:', vapiResult);
      return jsonResponse({ error: 'Vapi assistant creation returned an unexpected response' }, 502);
    }

    console.log(`Vapi assistant created successfully: ${vapiAgentId}`);

    // 10. Update advisor_details with cartesia_voice_id and vapi_agent_id
    const { error: updateError } = await supabaseAdmin
      .from('advisor_details')
      .update({
        cartesia_voice_id: cartesiaVoiceId,
        vapi_agent_id: vapiAgentId,
      })
      .eq('id', advisor_id);

    if (updateError) {
      console.error('Failed to update advisor_details:', updateError);
      return jsonResponse({ error: 'Failed to save voice clone data to database' }, 500);
    }

    // 11. Return success
    console.log(`Voice clone complete for advisor ${advisor_id}: cartesia=${cartesiaVoiceId}, vapi=${vapiAgentId}`);
    return jsonResponse({
      success: true,
      cartesia_voice_id: cartesiaVoiceId,
      vapi_agent_id: vapiAgentId,
    });
  } catch (error: any) {
    console.error('Unexpected error in clone-voice:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
});
