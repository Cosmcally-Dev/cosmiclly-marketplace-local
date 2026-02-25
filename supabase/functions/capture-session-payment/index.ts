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
    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'sessionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get session details
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('id, client_id, advisor_id, cost_total, stripe_payment_intent_id, billing_status')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is a participant
    if (session.client_id !== user.id && session.advisor_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized for this session' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no Stripe hold, this is a credits-only session — nothing to capture
    if (!session.stripe_payment_intent_id) {
      return new Response(
        JSON.stringify({ captured: false, reason: 'No Stripe hold on this session' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Already captured?
    if (session.billing_status === 'completed') {
      return new Response(
        JSON.stringify({ captured: true, reason: 'Already captured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate capture amount (cost_total is in dollars, convert to cents)
    const costTotal = session.cost_total || 0;
    const captureAmountCents = Math.round(costTotal * 100);

    if (captureAmountCents <= 0) {
      // Session was free (free minutes only) — cancel the hold entirely
      await stripe.paymentIntents.cancel(session.stripe_payment_intent_id);

      await supabaseAdmin
        .from('sessions')
        .update({ billing_status: 'completed' })
        .eq('id', sessionId);

      await supabaseAdmin.from('transactions').insert({
        user_id: session.client_id,
        type: 'session_capture',
        amount_cents: 0,
        stripe_payment_intent_id: session.stripe_payment_intent_id,
        session_id: sessionId,
        status: 'cancelled',
        metadata: { reason: 'Free session - hold cancelled' },
      });

      return new Response(
        JSON.stringify({ captured: false, reason: 'Free session - hold cancelled', amount: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Capture the exact cost (Stripe automatically releases the remainder)
    const capturedIntent = await stripe.paymentIntents.capture(
      session.stripe_payment_intent_id,
      { amount_to_capture: captureAmountCents }
    );

    // Update session billing status
    await supabaseAdmin
      .from('sessions')
      .update({ billing_status: 'completed' })
      .eq('id', sessionId);

    // Record capture transaction
    await supabaseAdmin.from('transactions').insert({
      user_id: session.client_id,
      type: 'session_capture',
      amount_cents: captureAmountCents,
      stripe_payment_intent_id: session.stripe_payment_intent_id,
      session_id: sessionId,
      status: 'completed',
      metadata: {
        captured_amount: captureAmountCents,
        stripe_status: capturedIntent.status,
      },
    });

    return new Response(
      JSON.stringify({
        captured: true,
        amount: captureAmountCents,
        status: capturedIntent.status,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error capturing session payment:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
