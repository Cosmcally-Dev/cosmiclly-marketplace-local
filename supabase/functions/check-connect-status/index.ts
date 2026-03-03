import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'npm:stripe@17';

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
    // 1. Validate Stripe configuration
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set in edge function secrets');
      return jsonResponse({ error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in Supabase Edge Function secrets.' }, 500);
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });

    // 2. Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid or expired token' }, 401);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Fetch advisor_details for the user
    const { data: advisorDetails, error: detailsError } = await supabaseAdmin
      .from('advisor_details')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    if (detailsError || !advisorDetails?.stripe_account_id) {
      return jsonResponse({ connected: false });
    }

    // 4. Retrieve the Stripe Connect account to check status
    let account;
    try {
      account = await stripe.accounts.retrieve(advisorDetails.stripe_account_id);
    } catch (stripeErr: any) {
      console.error('Failed to retrieve Stripe account:', stripeErr);
      // If the account doesn't exist on Stripe's side, treat as not connected
      if (stripeErr.code === 'account_invalid' || stripeErr.statusCode === 404) {
        return jsonResponse({ connected: false });
      }
      return jsonResponse({ error: `Failed to check Stripe account: ${stripeErr.message}` }, 500);
    }

    return jsonResponse({
      connected: true,
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
      onboarding_complete: account.charges_enabled && account.details_submitted,
    });
  } catch (error: any) {
    console.error('Unexpected error in check-connect-status:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
});
