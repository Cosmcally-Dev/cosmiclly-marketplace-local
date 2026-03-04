import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'npm:stripe@17';
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { advisorRate, maxMinutes, sessionId } = await req.json();

    if (!advisorRate || !maxMinutes || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: advisorRate, maxMinutes, sessionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's Stripe customer ID
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'no_payment_method', message: 'No payment method on file. Please add credits first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get customer's default payment method
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id, {
      expand: ['invoice_settings.default_payment_method'],
    });

    if (customer.deleted) {
      return new Response(
        JSON.stringify({ error: 'no_payment_method', message: 'Stripe customer not found.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to find a default payment method
    let paymentMethodId: string | null = null;

    // Check invoice_settings default
    const defaultPm = customer.invoice_settings?.default_payment_method;
    if (defaultPm && typeof defaultPm === 'object') {
      paymentMethodId = defaultPm.id;
    } else if (typeof defaultPm === 'string') {
      paymentMethodId = defaultPm;
    }

    // Fallback: list customer's payment methods and use the first one
    if (!paymentMethodId) {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: profile.stripe_customer_id,
        type: 'card',
        limit: 1,
      });

      if (paymentMethods.data.length > 0) {
        paymentMethodId = paymentMethods.data[0].id;
      }
    }

    if (!paymentMethodId) {
      return new Response(
        JSON.stringify({ error: 'no_payment_method', message: 'No saved payment method found.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate hold amount
    const holdAmountCents = Math.round(maxMinutes * advisorRate * 100);

    if (holdAmountCents < 50) {
      return new Response(
        JSON.stringify({ error: 'Hold amount too small (minimum $0.50)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create PaymentIntent with manual capture (Auth only)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: holdAmountCents,
      currency: 'usd',
      customer: profile.stripe_customer_id,
      payment_method: paymentMethodId,
      capture_method: 'manual',
      confirm: true,
      off_session: true,
      metadata: {
        session_id: sessionId,
        user_id: user.id,
        advisor_rate: advisorRate.toString(),
        max_minutes: maxMinutes.toString(),
      },
    });

    // Update session with the PaymentIntent ID
    await supabaseAdmin
      .from('sessions')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', sessionId);

    // Record the hold transaction
    await supabaseAdmin.from('transactions').insert({
      user_id: user.id,
      type: 'session_hold',
      amount_cents: holdAmountCents,
      stripe_payment_intent_id: paymentIntent.id,
      session_id: sessionId,
      status: paymentIntent.status === 'requires_capture' ? 'authorized' : 'pending',
      metadata: { advisor_rate: advisorRate, max_minutes: maxMinutes },
    });

    return new Response(
      JSON.stringify({
        paymentIntentId: paymentIntent.id,
        holdAmount: holdAmountCents,
        status: paymentIntent.status,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating session hold:', error);

    // Handle Stripe card errors gracefully
    if (error.type === 'StripeCardError') {
      return new Response(
        JSON.stringify({ error: 'card_declined', message: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
