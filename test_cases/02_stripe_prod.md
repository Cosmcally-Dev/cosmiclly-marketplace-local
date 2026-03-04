# Test Case: Stripe Sandbox to Production

## Changes Made
- Added production switch comments to `.env`
- Verified all 6 Stripe edge functions read `STRIPE_SECRET_KEY` from `Deno.env.get()` (no hardcoded keys)
- Verified `stripe-webhook` uses `STRIPE_WEBHOOK_SECRET` for signature verification
- Verified frontend passes `window.location.origin` for redirect URLs (production-ready)

## Stripe Edge Functions Audited

| Function | Key Source | Notes |
|----------|-----------|-------|
| `create-checkout` | `Deno.env.get('STRIPE_SECRET_KEY')` | Uses `origin` from request body for redirect URLs |
| `stripe-webhook` | `Deno.env.get('STRIPE_SECRET_KEY')` + `Deno.env.get('STRIPE_WEBHOOK_SECRET')` | Verifies webhook signatures |
| `create-session-hold` | `Deno.env.get('STRIPE_SECRET_KEY')` | Auth hold for sessions |
| `capture-session-payment` | `Deno.env.get('STRIPE_SECRET_KEY')` | Captures held amounts |
| `create-connect-account` | `Deno.env.get('STRIPE_SECRET_KEY')` | Uses `origin` from request for onboarding redirects |
| `check-connect-status` | `Deno.env.get('STRIPE_SECRET_KEY')` | Checks Connect account status |
| `admin-refund` | `Deno.env.get('STRIPE_SECRET_KEY')` | Admin-initiated refunds |

## Steps to Switch to Production

1. **Frontend `.env`:**
   - Change `VITE_STRIPE_PUBLISHABLE_KEY` from `pk_test_...` to `pk_live_...`

2. **Supabase Secrets:**
   - Update `STRIPE_SECRET_KEY` from `sk_test_...` to `sk_live_...`
   - Update `STRIPE_WEBHOOK_SECRET` to production webhook secret

3. **Stripe Dashboard:**
   - Create production webhook endpoint pointing to: `https://jxpzxdbforvuphqvvqkz.supabase.co/functions/v1/stripe-webhook`
   - Enable events: `checkout.session.completed`, `charge.refunded`

## Verification Steps

### 1. Credit Purchase (Test Mode)
- [ ] With test keys, go to `/add-credit`
- [ ] Select a credit amount and click purchase
- [ ] Verify Stripe Checkout loads with test mode banner
- [ ] Use test card `4242 4242 4242 4242` → complete purchase
- [ ] Verify redirected to `/add-credit/success`
- [ ] Verify credits added to account

### 2. Webhook Processing
- [ ] After successful test purchase, check Stripe Dashboard → Webhooks
- [ ] Verify `checkout.session.completed` event was received and processed
- [ ] Check Supabase Edge Function logs for `stripe-webhook`

### 3. Redirect URLs
- [ ] During checkout, note the success/cancel URLs in the Stripe Checkout page source
- [ ] Verify they use `window.location.origin` (not hardcoded localhost)
- [ ] On production domain, URLs should point to production domain

### 4. Environment Variable Audit
- [ ] Verify NO hardcoded Stripe keys in any edge function source code
- [ ] Verify `.env` has production switch comments
- [ ] Verify no `pk_test_` or `sk_test_` strings in committed code (only in `.env`)

### 5. Post-Production Switch
- [ ] After switching to live keys:
  - [ ] Test a real $1 credit purchase
  - [ ] Verify webhook fires and credits are added
  - [ ] Issue a test refund from admin panel
  - [ ] Verify Stripe refund processes correctly
