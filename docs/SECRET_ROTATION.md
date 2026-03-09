# Secret Key Rotation Guide

> Rotate all secrets every **90 days**. Set a recurring calendar reminder.

## Rotation Checklist

### 1. Supabase Keys
- **Dashboard:** Supabase Dashboard > Settings > API
- **Keys to rotate:** `SUPABASE_SERVICE_ROLE_KEY` (service role), `SUPABASE_ANON_KEY` (anon/public)
- **After rotation:**
  - Update Vercel env vars: `VITE_SUPABASE_PUBLISHABLE_KEY`
  - Update Supabase Edge Function secrets (service role is auto-available)
  - Redeploy frontend

### 2. Stripe Keys
- **Dashboard:** Stripe Dashboard > Developers > API keys > "Roll key"
- **Keys to rotate:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY`
- **After rotation:**
  - `supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_...`
  - Update Vercel env var: `VITE_STRIPE_PUBLISHABLE_KEY`
  - Redeploy edge functions and frontend

### 3. OpenAI API Key
- **Dashboard:** platform.openai.com > API keys
- **Key:** `OPENAI_API_KEY`
- **After rotation:**
  - `supabase secrets set OPENAI_API_KEY=sk-...`

### 4. LiveKit Keys
- **Dashboard:** LiveKit Cloud Dashboard > Settings
- **Keys:** `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`
- **After rotation:**
  - `supabase secrets set LIVEKIT_API_KEY=... LIVEKIT_API_SECRET=... LIVEKIT_URL=...`

### 5. Cartesia API Key
- **Dashboard:** Cartesia Dashboard > API Keys
- **Key:** `CARTESIA_API_KEY`
- **After rotation:**
  - `supabase secrets set CARTESIA_API_KEY=...`

### 6. Vapi API Key
- **Dashboard:** Vapi Dashboard > Settings > API Keys
- **Keys:** `VAPI_API_KEY`, `VAPI_WEBHOOK_SECRET`, `VITE_VAPI_PUBLIC_KEY`
- **After rotation:**
  - `supabase secrets set VAPI_API_KEY=... VAPI_WEBHOOK_SECRET=...`
  - Update Vercel env var: `VITE_VAPI_PUBLIC_KEY`
  - Redeploy frontend

### 7. Brevo (Email) API Key
- **Dashboard:** Brevo > SMTP & API > API Keys
- **Key:** `BREVO_API_KEY`
- **After rotation:**
  - `supabase secrets set BREVO_API_KEY=...`

## Post-Rotation Verification

After rotating any key:
1. Test the affected feature end-to-end (e.g., Stripe checkout, AI chat, voice calls)
2. Check Supabase Edge Function logs for auth errors
3. Verify frontend loads correctly (Supabase connection, Stripe Elements)

## Emergency Rotation

If a key is compromised:
1. Immediately rotate the key in the provider's dashboard
2. Update all deployment environments (Supabase secrets + Vercel env vars)
3. Redeploy affected services
4. Audit logs for unauthorized usage during the exposure window
