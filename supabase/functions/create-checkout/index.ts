import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'npm:stripe@17';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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

    // Auth client (user context)
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

    // Service role client (for writing to DB)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { amount, bonus, origin } = await req.json();
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalCredits = amount + (bonus || 0);
    const amountCents = Math.round(amount * 100);

    // Get or create Stripe customer
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Save stripe_customer_id to profile
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create Stripe Checkout Session
    const siteOrigin = origin || 'http://localhost:5173';

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${totalCredits} Cosmiclly Credits`,
              description: bonus > 0
                ? `$${amount} + $${bonus} bonus credits`
                : `$${amount} in credits`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        setup_future_usage: 'off_session', // Save card for future Auth & Capture
      },
      metadata: {
        user_id: user.id,
        credits: totalCredits.toString(),
        amount: amount.toString(),
        bonus: (bonus || 0).toString(),
      },
      success_url: `${siteOrigin}/add-credit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteOrigin}/add-credit`,
    });

    // Create pending transaction
    await supabaseAdmin.from('transactions').insert({
      user_id: user.id,
      type: 'credit_purchase',
      amount_cents: amountCents,
      credits: totalCredits,
      stripe_checkout_session_id: checkoutSession.id,
      status: 'pending',
      metadata: { amount, bonus: bonus || 0 },
    });

    return new Response(
      JSON.stringify({ url: checkoutSession.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
