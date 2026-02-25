-- Drop the OLD 5-parameter overload of start_rtc_session that conflicts
-- with the new 6-parameter version added in 20260225100000_stripe_integration.sql.
--
-- The new version has an optional p_stripe_payment_intent_id param (DEFAULT NULL),
-- so it handles both cases: calls with and without a Stripe payment intent.
--
-- Without this fix, PostgREST returns PGRST203 "Could not choose the best
-- candidate function" because both overloads match when called with 5 args.
DROP FUNCTION IF EXISTS public.start_rtc_session(UUID, UUID, session_type, DECIMAL, INTEGER);
