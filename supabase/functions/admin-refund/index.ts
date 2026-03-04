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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validate environment
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set in edge function secrets');
      return jsonResponse({ error: 'Stripe is not configured' }, 500);
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });

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

    const { data: { user: adminUser }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !adminUser) {
      return jsonResponse({ error: 'Invalid or expired token' }, 401);
    }

    // Service role client for all DB operations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Verify the caller has admin role
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single();

    if (profileError || !adminProfile) {
      console.error('Failed to fetch admin profile:', profileError);
      return jsonResponse({ error: 'Failed to verify admin role' }, 500);
    }

    if (adminProfile.role !== 'admin') {
      return jsonResponse({ error: 'Forbidden: admin role required' }, 403);
    }

    // 4. Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    const { session_id: sessionId, refund_credits: refundCredits, reason } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return jsonResponse({ error: 'session_id is required and must be a string' }, 400);
    }

    if (!refundCredits || typeof refundCredits !== 'number' || refundCredits <= 0) {
      return jsonResponse({ error: 'refund_credits is required and must be a positive number' }, 400);
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return jsonResponse({ error: 'reason is required and must be a non-empty string' }, 400);
    }

    // 5. Fetch the session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('id, client_id, advisor_id, cost_total, billing_status')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('Failed to fetch session:', sessionError);
      return jsonResponse({ error: 'Session not found' }, 404);
    }

    if (refundCredits > (session.cost_total || 0)) {
      return jsonResponse(
        { error: `Refund amount ($${refundCredits}) exceeds session cost ($${session.cost_total || 0})` },
        400
      );
    }

    // 6. Restore credits to the client's account
    const { error: creditsError } = await supabaseAdmin.rpc('add_credits', {
      user_id: session.client_id,
      amount: refundCredits,
    });

    if (creditsError) {
      console.error('Failed to restore credits:', creditsError);
      return jsonResponse({ error: 'Failed to restore credits to client account' }, 500);
    }

    // 7. Optionally issue a Stripe refund if a matching credit purchase transaction exists
    let stripeRefunded = false;
    let stripeRefund: Stripe.Refund | null = null;

    try {
      // Find the most recent completed credit_purchase transaction for this user
      const { data: transaction } = await supabaseAdmin
        .from('transactions')
        .select('stripe_checkout_session_id')
        .eq('user_id', session.client_id)
        .eq('type', 'credit_purchase')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (transaction?.stripe_checkout_session_id) {
        // Retrieve the Stripe checkout session to get the payment_intent
        const checkoutSession = await stripe.checkout.sessions.retrieve(
          transaction.stripe_checkout_session_id
        );

        const paymentIntentId = checkoutSession.payment_intent as string;

        if (paymentIntentId) {
          const refundAmountCents = Math.round(refundCredits * 100);

          stripeRefund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: refundAmountCents,
          });

          stripeRefunded = true;
          console.log(`Stripe refund created: ${stripeRefund.id} for $${refundCredits}`);
        }
      }
    } catch (stripeErr: any) {
      // If Stripe refund fails, still proceed — credits were already restored
      console.error('Stripe refund failed (non-blocking):', stripeErr.message);
    }

    // 8. Record the refund in the transactions table
    const { error: txError } = await supabaseAdmin.from('transactions').insert({
      user_id: session.client_id,
      type: 'refund',
      amount_cents: refundCredits * 100,
      credits: refundCredits,
      session_id: sessionId,
      status: 'completed',
      metadata: {
        reason,
        admin_id: adminUser.id,
        stripe_refund_id: stripeRefund?.id || null,
      },
    });

    if (txError) {
      console.error('Failed to record refund transaction (non-blocking):', txError);
      // Non-blocking — credits are already restored
    }

    // 9. Update the session's billing_status to 'refunded'
    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({ billing_status: 'refunded' })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to update session billing_status (non-blocking):', updateError);
    }

    // 10. Return success response
    return jsonResponse({
      success: true,
      credits_refunded: refundCredits,
      stripe_refunded: stripeRefunded,
    });
  } catch (error: any) {
    console.error('Unexpected error in admin-refund:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
});
