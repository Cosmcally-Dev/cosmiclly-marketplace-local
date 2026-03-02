import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'npm:stripe@17';

Deno.serve(async (req) => {
  // Webhooks only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey || !webhookSecret) {
      console.error('Missing Stripe environment variables');
      return new Response('Server configuration error', { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });

    // Verify webhook signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Service role client for DB writes (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      // ========================
      // Credit purchase completed
      // ========================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const credits = parseInt(session.metadata?.credits || '0', 10);

        if (!userId || credits <= 0) {
          console.error('Invalid metadata in checkout session:', session.metadata);
          break;
        }

        // Add credits to user's account
        const { error: creditsError } = await supabase.rpc('add_credits', {
          user_id: userId,
          amount: credits,
        });

        if (creditsError) {
          console.error('Failed to add credits:', creditsError);
          // Update transaction as failed
          await supabase
            .from('transactions')
            .update({ status: 'failed', metadata: { error: creditsError.message } })
            .eq('stripe_checkout_session_id', session.id);
          break;
        }

        // Update transaction to completed
        await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('stripe_checkout_session_id', session.id);

        // Ensure stripe_customer_id is saved on profile
        if (session.customer) {
          await supabase
            .from('profiles')
            .update({ stripe_customer_id: session.customer as string })
            .eq('id', userId);
        }

        console.log(`Added ${credits} credits to user ${userId}`);
        break;
      }

      // ========================
      // Refund processed
      // ========================
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          // Mark the original credit purchase transaction as refunded
          await supabase
            .from('transactions')
            .update({ status: 'refunded' })
            .eq('stripe_payment_intent_id', paymentIntentId);

          console.log(`Refund processed for payment intent ${paymentIntentId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
