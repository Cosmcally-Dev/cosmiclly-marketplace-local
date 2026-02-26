import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'npm:stripe@17';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

    // 3. Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    const { amount, bonus, origin } = body;
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return jsonResponse({ error: 'Invalid amount — must be a positive number' }, 400);
    }

    const bonusAmount = typeof bonus === 'number' && bonus > 0 ? bonus : 0;
    const totalCredits = amount + bonusAmount;
    const amountCents = Math.round(amount * 100);

    // 4. Get or create Stripe customer
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to fetch profile:', profileError);
      return jsonResponse({ error: 'Failed to fetch user profile' }, 500);
    }

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: profile?.email || user.email,
          name: profile?.full_name || undefined,
          metadata: { supabase_user_id: user.id },
        });
        customerId = customer.id;

        await supabaseAdmin
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
      } catch (stripeErr: any) {
        console.error('Failed to create Stripe customer:', stripeErr);
        return jsonResponse({ error: `Stripe customer creation failed: ${stripeErr.message}` }, 500);
      }
    }

    // 5. Create Stripe Checkout Session
    const siteOrigin = origin || 'http://localhost:5173';

    let checkoutSession;
    try {
      checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${totalCredits} Cosmiclly Credits`,
                description: bonusAmount > 0
                  ? `$${amount} + $${bonusAmount} bonus credits`
                  : `$${amount} in credits`,
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          setup_future_usage: 'off_session',
        },
        metadata: {
          user_id: user.id,
          credits: totalCredits.toString(),
          amount: amount.toString(),
          bonus: bonusAmount.toString(),
        },
        success_url: `${siteOrigin}/add-credit/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteOrigin}/add-credit`,
      });
    } catch (stripeErr: any) {
      console.error('Failed to create checkout session:', stripeErr);
      return jsonResponse({ error: `Checkout creation failed: ${stripeErr.message}` }, 500);
    }

    // 6. Create pending transaction record
    const { error: txError } = await supabaseAdmin.from('transactions').insert({
      user_id: user.id,
      type: 'credit_purchase',
      amount_cents: amountCents,
      credits: totalCredits,
      stripe_checkout_session_id: checkoutSession.id,
      status: 'pending',
      metadata: { amount, bonus: bonusAmount },
    });

    if (txError) {
      console.warn('Failed to create transaction record (non-blocking):', txError);
      // Non-blocking — the checkout can still proceed
    }

    return jsonResponse({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Unexpected error in create-checkout:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
});
