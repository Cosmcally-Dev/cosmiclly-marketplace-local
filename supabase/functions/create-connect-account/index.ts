import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'npm:stripe@17';
import { getCorsHeaders, getValidatedOrigin } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const jsonResponse = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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

    // 3. Verify user has role='advisor'
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, email, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Failed to fetch profile:', profileError);
      return jsonResponse({ error: 'Failed to fetch user profile' }, 500);
    }

    if (userProfile.role !== 'advisor') {
      return jsonResponse({ error: 'Only advisors can create Connect accounts' }, 403);
    }

    // 4. Check if advisor already has a Stripe Connect account
    const { data: existingDetails } = await supabaseAdmin
      .from('advisor_details')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    if (existingDetails?.stripe_account_id) {
      // Account already exists — generate a new onboarding link in case they need to finish
      let body;
      try {
        body = await req.json();
      } catch {
        return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
      }

      // Validate origin against server-side allowlist to prevent open redirect attacks
      const validatedOrigin = getValidatedOrigin(body.origin);

      const accountLink = await stripe.accountLinks.create({
        account: existingDetails.stripe_account_id,
        refresh_url: `${validatedOrigin}/advisor-portal?stripe=refresh`,
        return_url: `${validatedOrigin}/advisor-portal?stripe=success`,
        type: 'account_onboarding',
      });

      return jsonResponse({ url: accountLink.url });
    }

    // 5. Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    // Validate origin against server-side allowlist to prevent open redirect attacks
    const siteOrigin = getValidatedOrigin(body.origin);

    // 6. Create Stripe Connect Express account
    let account;
    try {
      account = await stripe.accounts.create({
        type: 'express',
        email: userProfile.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { supabase_user_id: user.id },
      });
    } catch (stripeErr: any) {
      console.error('Failed to create Stripe Connect account:', stripeErr);
      return jsonResponse({ error: `Stripe account creation failed: ${stripeErr.message}` }, 500);
    }

    // 7. Save the account ID to advisor_details
    const { error: upsertError } = await supabaseAdmin
      .from('advisor_details')
      .upsert(
        { id: user.id, stripe_account_id: account.id },
        { onConflict: 'id' }
      );

    if (upsertError) {
      console.error('Failed to save stripe_account_id:', upsertError);
      return jsonResponse({ error: 'Failed to save Connect account to database' }, 500);
    }

    // 8. Create Account Link for onboarding
    let accountLink;
    try {
      accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${siteOrigin}/advisor-portal?stripe=refresh`,
        return_url: `${siteOrigin}/advisor-portal?stripe=success`,
        type: 'account_onboarding',
      });
    } catch (stripeErr: any) {
      console.error('Failed to create account link:', stripeErr);
      return jsonResponse({ error: `Account link creation failed: ${stripeErr.message}` }, 500);
    }

    return jsonResponse({ url: accountLink.url });
  } catch (error: any) {
    console.error('Unexpected error in create-connect-account:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
});
