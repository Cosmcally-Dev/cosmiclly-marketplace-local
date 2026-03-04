# Cosmiclly — Production Upgrade Guide

## From Development to Production: Infrastructure, Services & Improvements

This document covers everything needed to take the Cosmiclly spiritual reading platform from development/free tiers to a production-ready deployment. It includes service tier upgrades, missing features, cost estimation, and a pre-launch checklist.

---

## 1. Service Tier Upgrades

### 1.1 Supabase (Database + Auth + Realtime + Edge Functions + Storage)

| | |
|---|---|
| **Current Tier** | Free |
| **Production Recommendation** | Pro Plan |
| **Pricing** | $25/month |

**Why upgrade:**

- **Free tier limits** that will be hit quickly with moderate traffic:
  - 500MB database storage
  - 2GB bandwidth per month
  - 200 concurrent Realtime connections
  - 500K edge function invocations per month
- **Pro tier provides:**
  - 8GB database storage
  - 250GB bandwidth per month
  - 500 concurrent Realtime connections
  - 2M edge function invocations per month
- The application uses Realtime extensively for sessions, messages, advisor status updates, and favorites. With even moderate concurrent users, the 200-connection free tier limit will be exhausted quickly.
- Edge functions are called frequently for AI chat completions, LiveKit token generation, Stripe checkout and webhook processing, and Vapi interactions.

**Action steps:**

1. Go to Supabase Dashboard → Settings → Billing → Upgrade to Pro.
2. Enable Point-in-Time Recovery (PITR) for database backups. This is critical for production — it allows restoring the database to any point within the retention window.
3. Consider enabling Read Replicas if traffic becomes read-heavy (advisor listings, horoscope lookups, profile views generate far more reads than writes).

---

### 1.2 Stripe (Payments + Connect)

| | |
|---|---|
| **Current Tier** | Test/sandbox keys (`.env` has `pk_live_` but backend may still use test keys) |
| **Production Recommendation** | Production keys |
| **Pricing** | 2.9% + $0.30 per transaction (standard). Connect: additional 0.25% for Express accounts |

**Action steps:**

1. **Activate Stripe Connect:** Dashboard → Settings → Connect. This must be enabled before advisors can set up payouts. Without it, the `create-connect-account` edge function will return a "signed up for Connect" error.
2. **Set production keys:** Add `STRIPE_SECRET_KEY` (`sk_live_...`) as a Supabase secret via `supabase secrets set STRIPE_SECRET_KEY=sk_live_...`.
3. **Set webhook secret:** Add `STRIPE_WEBHOOK_SECRET` for the production webhook endpoint as a Supabase secret.
4. **Configure webhook endpoint** in Stripe Dashboard → Developers → Webhooks. Point it to: `https://jxpzxdbforvuphqvvqkz.supabase.co/functions/v1/stripe-webhook`. Subscribe to events: `checkout.session.completed`, `account.updated`, and any other events the webhook handler processes.
5. **Verify PCI compliance:** Stripe handles most PCI requirements via their JavaScript SDK (Stripe.js / Elements). Ensure the frontend never sends raw card numbers to your server.
6. **Update frontend env var:** Set `VITE_STRIPE_PUBLISHABLE_KEY` to the production publishable key (`pk_live_...`) in your hosting environment.

---

### 1.3 LiveKit Cloud (WebRTC Audio/Video)

| | |
|---|---|
| **Current Tier** | Not fully configured (keys not set) |
| **Production Recommendation** | Starter plan ($50/month includes 1,000 participant-minutes) or pay-as-you-go |

**Why needed:**

LiveKit powers all audio and video calls between clients and advisors. The `WebRTCService` class in `src/services/webrtc.ts` wraps the LiveKit Room SDK, and the `generate-livekit-token` edge function issues JWT tokens for session participants.

**Action steps:**

1. Create an account at [livekit.io](https://livekit.io).
2. Set Supabase secrets:
   ```bash
   supabase secrets set LIVEKIT_API_KEY=your_api_key
   supabase secrets set LIVEKIT_API_SECRET=your_api_secret
   supabase secrets set LIVEKIT_URL=wss://your-project.livekit.cloud
   ```
3. Monitor usage carefully. Each 1-on-1 call consumes 2 participant-minutes per minute of call time. The Starter plan's 1,000 participant-minutes translates to roughly 500 minutes of 1-on-1 calls per month. Overage is billed at $0.04/participant-minute.

---

### 1.4 Vapi (AI Voice Calls)

| | |
|---|---|
| **Current Tier** | Not fully configured |
| **Production Recommendation** | Pay-as-you-go ($0.05/minute for voice) or Growth plan |

**Why needed:**

Vapi powers the AI Twin voice call feature (`/advisor/:id/ai-voice`), enabling clients to have voice conversations with AI-cloned versions of advisors 24/7 regardless of advisor online status.

**Action steps:**

1. Create an account at [vapi.ai](https://vapi.ai).
2. Set Supabase secret:
   ```bash
   supabase secrets set VAPI_API_KEY=your_vapi_api_key
   ```
3. Set frontend environment variable: `VITE_VAPI_PUBLIC_KEY` in your hosting dashboard.
4. Configure webhook URL in Vapi Dashboard to point to: `https://jxpzxdbforvuphqvvqkz.supabase.co/functions/v1/vapi-webhook`.

---

### 1.5 Cartesia (Voice Cloning)

| | |
|---|---|
| **Current Tier** | Not configured |
| **Production Recommendation** | Pay-per-clone pricing |

**Why needed:**

Cartesia creates the voice clones that power the AI Twin voice feature. Each advisor who opts into AI Twin voice needs a cloned voice model created from their audio samples.

**Action steps:**

1. Create an account at [cartesia.ai](https://cartesia.ai).
2. Set Supabase secret:
   ```bash
   supabase secrets set CARTESIA_API_KEY=your_cartesia_api_key
   ```

---

### 1.6 OpenAI (AI Chat RAG)

| | |
|---|---|
| **Current Tier** | Not configured |
| **Production Recommendation** | Pay-per-token ($0.15/1M input tokens for text-embedding-3-small, $0.15/1M input tokens for gpt-4o-mini) |

**Why needed:**

OpenAI powers the AI Twin text chat feature (`/advisor/:id/ai`). It is used for both generating embeddings for RAG (Retrieval-Augmented Generation) retrieval from the advisor's knowledge base and producing chat completions that mimic the advisor's style.

**Action steps:**

1. Create an OpenAI API key at [platform.openai.com](https://platform.openai.com).
2. Set Supabase secret:
   ```bash
   supabase secrets set OPENAI_API_KEY=your_openai_api_key
   ```
3. Set usage limits in the OpenAI dashboard (Settings → Limits) to prevent runaway costs. Recommended: start with a $50/month hard limit and adjust based on actual usage patterns.

---

### 1.7 Brevo (Transactional Email)

| | |
|---|---|
| **Current Tier** | Not configured |
| **Production Recommendation** | Free tier (300 emails/day) sufficient initially; Starter ($9/month for 5K/month) for scale |

**Why needed:**

Brevo handles transactional emails critical to the user experience:
- Welcome emails for new clients and advisors
- Session receipt emails after completed sessions
- Low credit warning notifications
- Advisor application approval/rejection notifications

**Action steps:**

1. Create a Brevo account at [brevo.com](https://www.brevo.com).
2. Set Supabase secret:
   ```bash
   supabase secrets set BREVO_API_KEY=your_brevo_api_key
   ```
3. Create 6 email templates in Brevo's template editor:
   - Welcome Client
   - Welcome Advisor
   - Session Receipt
   - Low Credit Warning
   - Advisor Application Approved
   - Advisor Application Rejected
4. Configure Supabase Auth SMTP so that auth emails (confirmation, password reset, magic link) are sent via Brevo instead of the default Supabase mailer:
   - Go to Supabase Dashboard → Settings → Auth → SMTP Settings
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
   - Username: your Brevo SMTP login
   - Password: your Brevo SMTP key
   - Sender email: `noreply@cosmiclly.com` (must be verified in Brevo)

---

### 1.8 Vercel (Hosting)

| | |
|---|---|
| **Current Tier** | Free tier (likely) |
| **Production Recommendation** | Free tier sufficient for launch; Pro ($20/month) for analytics, more build minutes (45min → 6,000min), team features, and custom domains with SSL |

**Action steps:**

1. Add custom domain `cosmiclly.com` in Vercel Dashboard → Settings → Domains.
2. Configure DNS records as directed by Vercel (typically an A record and/or CNAME).
3. Set environment variables in Vercel Dashboard → Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `VITE_VAPI_PUBLIC_KEY`
4. Vercel automatically provisions SSL certificates for custom domains.

---

## 2. Missing Features for Production

### 2.1 Error Tracking (HIGH Priority)

**Recommendation:** Sentry (free tier: 5K events/month)

Error tracking is essential for production. Without it, you are blind to client-side errors, failed API calls, and edge function crashes.

**Implementation:**

- Install `@sentry/react` and `@sentry/vite-plugin`.
- Initialize Sentry in `main.tsx` before the React root renders.
- Sentry integrates with React Error Boundary for automatic error capture — wrap your app in `Sentry.ErrorBoundary`.
- Enable Session Replay to visually reproduce user-reported issues.
- Create Sentry alerts for high-frequency errors and new issue types.

---

### 2.2 CI/CD Pipeline (HIGH Priority)

**Recommendation:** GitHub Actions

A CI/CD pipeline prevents broken code from reaching production and automates the deployment process.

**Implementation:**

Create `.github/workflows/ci.yml` with the following stages:

- **On push/PR to main:**
  1. Install dependencies (`bun install`)
  2. Lint (`bun run lint`)
  3. Typecheck (`npx tsc --noEmit`)
  4. Build (`bun run build`)
  5. Run tests (once test suite exists)
  6. `npm audit` step for security scanning of dependencies
  7. Lighthouse CI for performance regression detection
- **On merge to main:**
  - Auto-deploy via Vercel webhook or Vercel GitHub integration (automatic if connected)

---

### 2.3 Rate Limiting (MEDIUM Priority)

Without rate limiting, malicious or buggy clients can spam session creation, flood AI chat, or abuse edge functions.

**Implementation areas:**

- **Session creation:** Add a check in the `start_rtc_session` RPC to limit concurrent pending sessions per user (e.g., max 3 pending sessions at a time). This prevents session spam.
- **AI chat messages:** Limit messages per minute per user in the `deduct_ai_credits` RPC or the AI chat edge function (e.g., max 20 messages per minute).
- **Edge functions:** Consider Upstash Redis for distributed rate limiting, or implement Supabase Postgres-based counters using a `rate_limits` table with timestamp-based sliding windows.

---

### 2.4 PWA Support (MEDIUM Priority)

Making the app a Progressive Web App enables mobile installation, offline caching, and push notifications.

**Implementation:**

- Create `public/manifest.json` with app name (`Cosmiclly`), icons (192x192, 512x512), theme colors, and display mode (`standalone`).
- Add a service worker for offline caching of static assets. Use Workbox (`vite-plugin-pwa`) for easy integration with Vite.
- Enable push notifications for incoming calls — this is critical for advisor UX so they do not miss sessions.
- The manifest and service worker make the app installable on mobile devices via "Add to Home Screen".

---

### 2.5 Dynamic SEO (MEDIUM Priority)

The current SPA has a single HTML title. Search engines need per-page metadata to index the site properly.

**Implementation:**

- Install `react-helmet-async` for per-page `<title>` and `<meta description>` tags.
- Generate an XML sitemap (`/sitemap.xml`) listing all public pages and advisor profile URLs. This can be a static file updated periodically or a Supabase edge function that queries active advisors.
- Add Schema.org JSON-LD structured data to advisor profile pages (type: `Person` with `jobTitle: "Spiritual Advisor"`).
- Add canonical URLs (`<link rel="canonical">`) to prevent duplicate content issues.

---

### 2.6 Accessibility (MEDIUM Priority)

Accessibility is both a legal requirement in many jurisdictions and an ethical responsibility.

**Implementation:**

- Add `alt` text to all images (advisor avatars, logos, zodiac signs, decorative images).
- Ensure color contrast meets WCAG AA standards (minimum 4.5:1 ratio for normal text, 3:1 for large text). The current dark/mystical theme should be audited carefully.
- Add `aria-label` attributes to all icon-only buttons (mute, camera toggle, hang up, favorite heart, etc.).
- Install `eslint-plugin-jsx-a11y` and add it to the ESLint config for automated accessibility linting.
- Test with screen readers: NVDA on Windows, VoiceOver on macOS/iOS.

---

### 2.7 E2E Testing (MEDIUM Priority)

End-to-end tests catch integration issues that unit tests miss, especially around the complex session lifecycle.

**Recommendation:** Playwright or Cypress

**Priority test cases:**

1. User signup and login flow (email + Google OAuth)
2. Credit purchase via Stripe checkout (use Stripe test mode)
3. Session lifecycle: create pending session → advisor accepts → session runs → either party ends → billing calculated correctly
4. AI chat session: create → send message → receive AI response → credits deducted
5. Advisor onboarding flow: apply → admin approves → advisor sets up profile

---

### 2.8 Mobile Responsiveness (LOW Priority)

**Implementation:**

- Audit all pages at mobile viewports: 375px (iPhone SE), 414px (iPhone Plus/Max), and 390px (iPhone 14).
- Fix overflow issues — horizontal scroll should never appear.
- Ensure all touch targets are at least 44x44px (Apple HIG recommendation).
- Check font sizes are readable without zooming (minimum 16px for body text on mobile to prevent iOS auto-zoom).
- Test on actual iOS (Safari) and Android (Chrome) devices, not just browser DevTools emulation.

---

### 2.9 Legal Pages (LOW Priority)

**Implementation:**

- Convert existing markdown drafts to React pages:
  - `docs/ABOUT_US.md` → `/about`
  - `docs/PRIVACY_POLICY.md` → `/privacy`
  - `docs/TERMS_OF_SERVICE.md` → `/terms`
  - `docs/COOKIE_POLICY.md` → `/cookies`
- Add a cookie consent banner for GDPR compliance. Use a lightweight library like `react-cookie-consent` or build a custom banner.
- Link legal pages from the site footer.
- Have legal documents reviewed by a lawyer before launch.

---

## 3. Cost Estimation

| Service | Free Tier | Production Tier | Monthly Cost |
|---------|-----------|-----------------|:------------:|
| Supabase | Free | Pro | $25 |
| Vercel | Free | Free (or Pro $20) | $0-20 |
| LiveKit | — | Starter | ~$50 |
| Stripe | — | Pay-per-transaction | ~2.9% + $0.30/txn |
| Vapi | — | Pay-per-minute | ~$0.05/min |
| OpenAI | — | Pay-per-token | ~$5-20 (depends on usage) |
| Cartesia | — | Pay-per-clone | Varies |
| Brevo | 300/day | Free or Starter | $0-9 |
| Sentry | 5K events | Free | $0 |
| **Total base** | | | **~$80-125/month** |

Notes on the cost estimate:
- The total base cost assumes minimal to moderate usage. Stripe and Vapi costs scale directly with revenue and usage respectively.
- OpenAI costs depend heavily on AI Twin usage volume. At 1,000 AI chat sessions per month with average 10 messages each, expect roughly $5-10/month.
- LiveKit overage beyond the Starter plan's 1,000 participant-minutes is billed at $0.04/participant-minute.
- As traffic grows, Supabase Pro plan add-ons (additional compute, storage, bandwidth) may increase the base $25/month.

---

## 4. Pre-Launch Checklist

1. Upgrade Supabase to Pro plan.
2. Apply all pending database migrations (`npx supabase db push`).
3. Deploy all edge functions (`supabase functions deploy`).
4. Set all Supabase secrets:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   - `LIVEKIT_URL`
   - `OPENAI_API_KEY`
   - `CARTESIA_API_KEY`
   - `VAPI_API_KEY`
   - `BREVO_API_KEY`
   - `ALLOWED_ORIGIN`
5. Activate Stripe Connect in Stripe Dashboard (Settings → Connect).
6. Swap Stripe keys to production (`pk_live_...`, `sk_live_...`).
7. Configure Stripe webhook URL for production: `https://jxpzxdbforvuphqvvqkz.supabase.co/functions/v1/stripe-webhook`.
8. Set up LiveKit Cloud account and configure API keys.
9. Set up Vapi account and configure webhook URL.
10. Set up OpenAI API key with usage limits.
11. Set up Cartesia API key.
12. Set up Brevo account and create 6 email templates (welcome client, welcome advisor, session receipt, low credit warning, approval, rejection).
13. Configure Supabase Auth SMTP with Brevo relay (`smtp-relay.brevo.com:587`).
14. Set environment variables in Vercel Dashboard (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_VAPI_PUBLIC_KEY`).
15. Add custom domain (`cosmiclly.com`) to Vercel.
16. Create `training_docs` storage bucket in Supabase Dashboard (Storage → New bucket).
17. Set admin user in production database (update `profiles.role` to `'admin'` for the designated admin account).
18. Delete or change passwords on 20 dummy advisor accounts (seeded via migration `20260303100000_seed_dummy_advisors.sql`).
19. Test CSP headers — check browser console for Content Security Policy violations on all pages.
20. Run smoke tests on all core flows: signup, login, credit purchase, session lifecycle, AI chat.
21. Set up Sentry error tracking (install `@sentry/react`, initialize in `main.tsx`).
22. Set up GitHub Actions CI/CD pipeline (create `.github/workflows/ci.yml`).
