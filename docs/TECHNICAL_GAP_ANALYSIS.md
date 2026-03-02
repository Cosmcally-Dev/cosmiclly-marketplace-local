# Cosmiclly — Technical Gap Analysis

> **Updated:** 2026-03-02
> **Source Documents:** PRD v1.0, Project Roadmap v1.0, SDD v1.1, Twin AI Technical Specification v1.1
> **Codebase Commit:** latest (main)

---

## Executive Summary

| Phase | Description | Completion | Notes |
|-------|-------------|:----------:|-------|
| **Phase 1** | MVP Launch (Human-to-Human Marketplace) | **~85%** | Auth (email + Google + Facebook wired), RTC core done, credits-only billing with shared hook, Stripe credit purchases + Connect payouts, admin with disputes/refunds, advisor setup wizard + schedule + profile persistence |
| **Phase 2** | Twin AI Expansion (Digital Clone) | **0%** | Planning complete; implementation starting |

### Quick Stats

- **Edge Functions:** 9 of 13 built (Phase 1: `generate-livekit-token`, `create-checkout`, `create-session-hold`, `capture-session-payment`, `stripe-webhook`, `delete-account`, `create-connect-account`, `check-connect-status`, `admin-refund`; Phase 2 pending: `ingest-knowledge`, `handle-ai-chat`, `clone-voice`, `vapi-webhook`)
- **Database Migrations:** 13 applied (up from 11 at last review)
- **NPM Dependencies:** Core stack + Stripe SDK + LiveKit client installed; `@vapi-ai/web` still missing (Phase 2)
- **Static Advisors:** 58 defined in code; only 1 (Psychic Luna) has a real DB profile; `useAdvisors` hook merges DB + static
- **Environment Variables:** Supabase keys configured; LiveKit + Stripe keys need Supabase secrets; OpenAI, Cartesia, Vapi keys needed for Phase 2

### What Changed Since Last Review (2026-03-02)

| Area | Before (2026-02-27) | After (2026-03-02) |
|------|--------|-------|
| Migrations | 11 applied | 13 applied (+advisor_schedule_connect, +disputes_table) |
| Edge Functions | 6 | 9 (+create-connect-account, +check-connect-status, +admin-refund) |
| Auth | Email/password only | Email/password + Google OAuth + Facebook OAuth (wired) |
| Billing | Credits-only (shared hook) + Auth & Capture artifacts | Credits-only clean (Auth & Capture removed from session pages) |
| Stripe Connect | NOT STARTED | DONE (edge functions + StripeConnectCard UI) |
| Advisor Portal | Basic profile page | Full: 4-step setup wizard, DB-persisted profile, schedule management, Stripe Connect |
| Admin Disputes | Placeholder "Coming Soon" | DONE (disputes table, AdminDisputeCenter, AdminDisputeDetail, admin-refund) |
| Admin Approvals | List + review only | DONE with auto-provision (approve → creates advisor_details + updates role) |
| Sessions Table | View only | View + Flag action (creates dispute from completed session) |

### What Changed (2026-02-23 → 2026-02-27)

| Area | Before | After |
|------|--------|-------|
| Migrations | 4 (1 pending) | 11 applied |
| Edge Functions | 1 | 6 |
| Stripe Integration | NOT STARTED | PARTIAL (4 edge functions, transactions table, session hold modal) |
| Admin Panel | NOT STARTED | PARTIAL (7 components, 4 hooks, full layout) |
| Typing Indicators | NOT STARTED | DONE |
| Read Receipts | NOT STARTED | DONE |
| Chat History | NOT STARTED | DONE (cross-session) |
| GDPR Delete Account | NOT STARTED | PARTIAL (RPC + edge function + UI) |
| Reviews System | NOT IN DOC | DONE (reviews table + ReviewModal) |
| Billing Logic | Free minutes first | Credits first, free minutes as fallback (shared hook) |
| Broken Links | 9 routes → 404 | Coming Soon page for all unbuilt routes |
| Legal Pages | None | Drafts: About Us, Privacy Policy, Terms of Service, Cookie Policy |

---

## Status Legend

| Label | Meaning |
|-------|---------|
| DONE | Feature is fully implemented and working |
| PARTIAL | Some code exists but feature is incomplete or has gaps |
| NOT STARTED | No implementation exists in the codebase |

---

## Phase 1: The MVP Launch

### Milestone 1: Data & Authentication Wiring (Roadmap Week 1)

| Task | Ref | Status | Details |
|------|-----|:------:|---------|
| **Execute Supabase schema migrations** | Task 1.1 | DONE | All 13 migrations applied. Includes: initial auth, RTC sessions, accept/decline, advisor details realtime, admin/chat enhancements, Stripe integration, RLS fixes, reviews, billing credits-first, advisor schedule/connect, disputes table. |
| **Finalize Authentication flows** | Task 1.2, FR-1.1 | DONE | Email/password signup and login work. Password reset via `Settings.tsx`. Google OAuth integrated. Facebook OAuth wired (needs FB app creation in Meta Developer dashboard). **Remaining:** email confirmation redirect handling, FB app creation (manual step). |
| **Build Advisor Onboarding Wizard** | Task 1.3, FR-1.3 | DONE | 4-step `AdvisorSetupWizard` (bio/photo/specialties/pricing). Auto-provisions on admin approval (`approve_advisor_application` RPC). `AdvisorPrivateProfile` persists to DB (bio, specialties, pricing, schedule). Stripe Connect for payouts via `StripeConnectCard`. Works for manually-added DB advisors via `profile_complete` flag. |
| **Connect frontend to live Supabase queries** | Task 1.4 | PARTIAL | `useAdvisors` hook merges static data with `advisor_details` from DB. Only "Psychic Luna" has a real DB profile. **Missing:** fully database-driven advisor listing (remove dependency on static data). |
| **Role definition** | FR-1.2 | DONE | `profiles.role` stores `'client'`, `'advisor'`, or `'admin'`. Admin role supported in RLS with admin panel UI. |

#### What Exists (Milestone 1)
- `src/hooks/useAuth.tsx` — Auth context with login, signup, session management, credit tracking
- `src/components/modals/AuthModal.tsx` — Sign-in/sign-up modal with form validation
- `src/pages/Settings.tsx` — Profile editing, password reset, account deletion
- `src/components/modals/AdvisorApplicationModal.tsx` — Basic application form
- `supabase/migrations/` — 11 migration files (all applied)
- Database tables: `profiles`, `advisor_details`, `sessions`, `messages`, `advisor_applications`, `transactions`, `reviews`
- Database trigger: `handle_new_user()` auto-creates profile on signup

#### What's Missing (Milestone 1)
- Email confirmation redirect handling
- OAuth provider integration (Google, Facebook)
- Multi-step advisor onboarding wizard (bio, specialties picker, pricing tiers, availability schedule, profile photo upload)
- Migrating advisor listing from static data to database queries
- Creating real DB profiles for all advisors (or a self-serve advisor signup → approval flow)

---

### Milestone 2: The Payment Engine (Roadmap Week 2)

| Task | Ref | Status | Details |
|------|-----|:------:|---------|
| **Integrate Stripe Connect for Advisors** | Task 2.1, FR-2.1 | DONE | `create-connect-account` + `check-connect-status` edge functions. `StripeConnectCard` UI component in advisor portal. `advisor_details.stripe_account_id` column. Express onboarding flow with redirect. |
| **Build Client Credit Purchase flow** | Task 2.2, FR-2.2 | DONE | Credits-only billing model (Auth & Capture removed from session pages). `create-checkout` edge function. `stripe-webhook` handles `checkout.session.completed`. `AddCredit` page with Stripe Checkout redirect + `AddCreditSuccess` with polling retry. `useSessionBilling` shared hook for per-minute credit deduction. |
| **Edge Function: verify payment before LiveKit token** | Task 2.3, FR-2.4 | N/A | Not needed — credits-only model. Credits checked at session start, not via Stripe hold. |
| **Webhook handler: Process Stripe events** | Task 2.4, FR-2.3 | DONE | `stripe-webhook` handles `checkout.session.completed` (credit purchases) and `charge.refunded` (dispute refunds). `admin-refund` edge function for admin-initiated refunds. Auth & Capture handlers removed. |

#### What Exists (Milestone 2)
- `@stripe/stripe-js` installed (frontend)
- `src/hooks/useStripePayment.ts` — Hook for session hold creation and capture
- `src/components/modals/SessionHoldModal.tsx` — Pre-session payment hold modal
- `supabase/functions/create-checkout/` — Creates Stripe checkout session
- `supabase/functions/create-session-hold/` — Creates payment hold (auth & capture)
- `supabase/functions/capture-session-payment/` — Captures held amount at session end
- `supabase/functions/stripe-webhook/` — Webhook handler for Stripe events
- `transactions` table — Payment transaction ledger with Stripe columns
- `profiles.credits` field — Internal credit balance (interim)
- `end_rtc_session()` — Atomically deducts credits, checks for Stripe payment intent
- Per-minute billing tracking in sessions table (`rate_per_minute`, `billable_minutes`, `cost_total`, `billing_status`)
- Billing logic: credits consumed first, free minutes as fallback (`useSessionBilling` shared hook)

#### What Needs to Be Built (Milestone 2)
1. **Stripe Connect onboarding flow** — advisor links bank account, KYC verification
2. **Credit purchase via Stripe** — replace placeholder `AddCredit.tsx` with real Stripe checkout
3. **Modify `generate-livekit-token`** — optionally verify payment hold status before issuing token
4. **End-to-end Stripe testing** — checkout → hold → session → capture → payout
5. **Advisor payout scheduling** — Stripe Connect transfers to advisor accounts
6. **Set environment variables:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`
7. **Deploy edge functions:** All 6 functions need `supabase functions deploy`

---

### Milestone 3: Real-Time Communications (Roadmap Week 3)

| Task | Ref | Status | Details |
|------|-----|:------:|---------|
| **Connect Chat UI to Supabase Realtime** | Task 3.1, FR-4.1 | DONE | Chat messages via `useChatMessages` (Realtime subscription). Typing indicators via `useTypingIndicator`. Read receipts via `read_at` column + `markAsRead()`. Cross-session chat history via `useChatHistory`. |
| **Finalize LiveKit token generation** | Task 3.2, FR-4.3 | DONE | `generate-livekit-token` edge function: verifies auth, checks session status, validates identity, generates scoped JWT. |
| **Implement Call State Management** | Task 3.3, FR-4.4 | DONE | Full state machine: `connecting → ringing → connected → ended`. Shared billing hook (`useSessionBilling`) with credits-first logic across all 3 session types. |
| **"Right to be Forgotten" API** | Task 3.4, NFR-2 | PARTIAL | `delete_my_account()` RPC exists. `delete-account` edge function built. Settings.tsx has "Delete Account" UI. **Missing:** full data anonymization (messages, session metadata), confirmation email, admin audit log of deletions. |

#### What Exists (Milestone 3)
- `src/pages/Chat.tsx` — Client chat with ringing/accept flow, real-time messages, typing indicators, read receipts, chat history
- `src/pages/VoiceCall.tsx` — Client audio call with LiveKit WebRTC, shared billing hook
- `src/pages/VideoCall.tsx` — Client video call with camera toggle, fullscreen UI, shared billing hook
- `src/pages/AdvisorCall.tsx` — Advisor dashboard: incoming session list + active session view (chat/audio/video)
- `src/hooks/useSessionBilling.ts` — Shared billing hook (credits first, free minutes fallback)
- `src/hooks/useSessionRealtime.ts` — Session status Realtime subscription
- `src/hooks/useAdvisorIncomingCalls.ts` — Incoming sessions Realtime subscription
- `src/hooks/useChatMessages.ts` — Message fetch, Realtime subscription, send, `markAsRead`
- `src/hooks/useTypingIndicator.ts` — Typing presence indicator
- `src/hooks/useChatHistory.ts` — Cross-session chat history between client-advisor pairs
- `src/hooks/useWebRTC.ts` — LiveKit connection management, stats collection
- `src/services/webrtc.ts` — `WebRTCService` class wrapping LiveKit `Room`
- `supabase/functions/generate-livekit-token/` — Token generation edge function
- `supabase/functions/delete-account/` — Account deletion edge function
- Database RPCs: `start_rtc_session()`, `accept_session()`, `decline_session()`, `end_rtc_session()`, `delete_my_account()`

#### What's Missing (Milestone 3)
1. **Full GDPR data anonymization** — messages should be anonymized (not just deleted), session metadata scrubbed
2. **LiveKit credentials deployment** — `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` must be set as Supabase secrets
3. **Network resilience** — reconnection handling for dropped connections during sessions

---

### Milestone 4: Admin Controls & QA (Roadmap Week 4)

| Task | Ref | Status | Details |
|------|-----|:------:|---------|
| **Build /admin React route** | Task 4.1, FR-6.1 | PARTIAL | `/admin` route exists with protected layout. `AdminPanel.tsx` with sidebar navigation, dashboard, and sub-pages. RLS policies enforce `role='admin'`. **Missing:** some sub-pages need polish, production admin user creation flow. |
| **Advisor Approval dashboard** | Task 4.2, FR-6.2 | DONE | `AdminAdvisorApprovals.tsx` + `AdminApplicationReview.tsx`. `approve_advisor_application` RPC auto-creates `advisor_details` row (profile_complete=false) and updates role to 'advisor'. `reject_advisor_application` RPC. **Remaining:** notification emails to applicants. |
| **Dispute Center** | Task 4.3, FR-6.3 | DONE | Full `AdminDisputeCenter` with status filters + dispute table. `AdminDisputeDetail` modal with refund controls. `admin-refund` edge function (restores credits + optional Stripe refund). `disputes` table with RLS. `AdminSessionsTable` has "Flag" action to create disputes from completed sessions. `useAdminDisputes` hook. |
| **End-to-End QA Testing** | Task 4.4 | NOT STARTED | No automated tests. Manual testing only. No network-drop or billing edge-case test coverage. |

#### What Exists (Milestone 4)
- `src/pages/admin/AdminPanel.tsx` — Main admin layout with sidebar
- `src/components/admin/AdminSidebar.tsx` — Navigation sidebar
- `src/components/admin/AdminDashboard.tsx` — Overview dashboard with stats
- `src/components/admin/AdminAdvisorApprovals.tsx` — Advisor application review
- `src/components/admin/AdminApplicationReview.tsx` — Detailed application view
- `src/components/admin/AdminUsersTable.tsx` — User management table
- `src/components/admin/AdminSessionsTable.tsx` — Session monitoring table
- `src/components/admin/AdminDisputeCenter.tsx` — Dispute handling UI
- `src/hooks/useAdminApplications.ts` — Advisor application data hook
- `src/hooks/useAdminSessions.ts` — Session data hook for admin
- `src/hooks/useAdminStats.ts` — Admin dashboard statistics hook
- `src/hooks/useAdminUsers.ts` — User management data hook
- RLS policies: admin-only access enforced via `role='admin'` check

#### What Needs to Be Built (Milestone 4)
1. **Approve → auto-provision** — on approval, create `advisor_details` + update `profiles.role` to `'advisor'`
2. **Dispute → Stripe refund** — connect dispute resolution to Stripe refund API
3. **Notification emails** — approval/rejection emails to advisor applicants
4. **QA test suite** — at minimum, integration tests for session lifecycle and billing calculations

---

## Phase 2: The Twin AI Expansion

### Milestone 5: The AI Brain (Roadmap Week 5)

| Task | Ref | Status | Details |
|------|-----|:------:|---------|
| **Enable pgvector in Supabase** | Task 5.1 | NOT STARTED | No `CREATE EXTENSION vector` in any migration. |
| **Knowledge Ingestion UI** | Task 5.2, FR-5.1 | NOT STARTED | No upload UI for advisors. No `knowledge_base_documents` table. |
| **Embedding Edge Function** | Task 5.3 | NOT STARTED | No `ingest-knowledge` edge function. No OpenAI SDK dependency. |

#### What Needs to Be Built (Milestone 5)
1. **Database migration:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;

   ALTER TABLE public.advisor_details
     ADD COLUMN twin_enabled BOOLEAN DEFAULT false,
     ADD COLUMN twin_text_rate_per_msg INTEGER DEFAULT 0,
     ADD COLUMN twin_voice_rate_per_min INTEGER DEFAULT 0,
     ADD COLUMN system_prompt TEXT,
     ADD COLUMN cartesia_voice_id VARCHAR(255),
     ADD COLUMN vapi_agent_id VARCHAR(255);

   CREATE TABLE public.knowledge_base_documents (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     advisor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
     content TEXT NOT NULL,
     embedding VECTOR(1536),
     source_filename VARCHAR(255),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE INDEX ON public.knowledge_base_documents
     USING hnsw (embedding vector_cosine_ops);
   ```
2. **Supabase Storage bucket** — `training_docs` for uploaded PDFs/text files
3. **Edge Function: `ingest-knowledge`** — downloads file from storage, chunks text (~500 tokens), calls OpenAI Embeddings API (`text-embedding-3-small`), inserts into `knowledge_base_documents`
4. **Advisor Portal UI** — "Twin Setup" wizard section: upload documents, write system prompt, toggle on/off
5. **Install dependencies:** `openai` in edge functions
6. **Set environment variable:** `OPENAI_API_KEY`

---

### Milestone 6: Text Clone Chatbot (Roadmap Week 6)

| Task | Ref | Status | Details |
|------|-----|:------:|---------|
| **Database Webhook for offline messages** | Task 6.1, FR-5.2 | NOT STARTED | No webhook on `messages` table INSERT. No offline advisor detection. |
| **RAG Edge Function** | Task 6.2 | NOT STARTED | No `handle-ai-chat` edge function. No RAG pipeline. |
| **AI message labeling in Chat UI** | Task 6.3 | NOT STARTED | No `is_ai_generated` column on `messages` table. No visual distinction in Chat.tsx. |

#### What Needs to Be Built (Milestone 6)
1. **Add `is_ai_generated` column to `messages` table**
2. **Supabase Database Webhook** — triggers on `messages` INSERT when advisor's `twin_enabled = true` and advisor is offline
3. **Edge Function: `handle-ai-chat`** — embed query → retrieve top-3 chunks → generate response with `gpt-4o`
4. **Update Chat.tsx** — visually distinguish AI messages (different styling, "AI" badge)

---

### Milestone 7: Voice Clone Agent (Roadmap Week 7)

| Task | Ref | Status | Details |
|------|-----|:------:|---------|
| **Cartesia voice cloning integration** | Task 7.1, FR-5.3 | NOT STARTED | No Cartesia SDK. No voice recording UI. |
| **Vapi.ai Web SDK integration** | Task 7.2, FR-5.3 | NOT STARTED | No `@vapi-ai/web` package. No Vapi call handling. |
| **AI call billing** | Task 7.3, FR-5.4 | NOT STARTED | No tiered pricing (human vs AI). |

#### What Needs to Be Built (Milestone 7)
1. **Voice Recording UI** — advisor reads script, records via MediaRecorder API
2. **Edge Function: `clone-voice`** — sends audio to Cartesia, creates Vapi agent
3. **AI Call Page** — route using Vapi Web SDK (bypasses LiveKit for AI calls)
4. **Edge Function: `vapi-webhook`** — processes AI call end events, billing, transcripts
5. **Tiered Pricing UI** — separate rates for human vs Twin AI
6. **Install dependencies:** `@vapi-ai/web` (frontend)
7. **Set environment variables:** `CARTESIA_API_KEY`, `VAPI_API_KEY`

---

### Milestone 8: Polish & Retention (Roadmap Week 8)

| Task | Ref | Status | Details |
|------|-----|:------:|---------|
| **Daily Horoscope Edge Function** | Task 8.1, FR-3.3 | PARTIAL | Static horoscope page exists (`Horoscope.tsx`) with 12 signs. Static zodiac data in `src/data/zodiacSigns.ts`. Architecture plan created (`docs/DYNAMIC_HOROSCOPE_PLAN.md`) — covers n8n automation, free APIs, Swiss Ephemeris, database schema. **Missing:** `horoscopes` table, n8n workflow, dynamic frontend hook. |
| **PWA Optimization** | Task 8.2 | NOT STARTED | No `manifest.json`, no service worker, no offline support. |
| **Push Notifications** | Task 8.3 | NOT STARTED | No push notification infrastructure. |

#### What Needs to Be Built (Milestone 8)
1. **`horoscopes` table** — sign, period, date, content (JSONB), lucky data
2. **n8n workflow** — daily cron fetching from free APIs (Aztro, Ohmanda) with GPT-4o fallback
3. **`useHoroscope` hook** — fetch from Supabase, fallback to static data
4. **Update `Horoscope.tsx`** — use dynamic data
5. **PWA manifest + service worker**
6. **Push notifications** — Web Push subscription, triggers ("advisor is online!")

---

## Infrastructure Gaps

### Missing NPM Packages

| Package | Purpose | Phase |
|---------|---------|-------|
| `openai` | OpenAI API for embeddings + chat completions (edge functions) | Phase 2 |
| `@vapi-ai/web` | Vapi Web SDK for AI voice calls | Phase 2 |

> Note: `stripe`, `openai` SDKs for edge functions are imported directly via Deno's `npm:` specifier — no package.json entry needed. Cartesia uses direct REST API calls.

### Edge Functions Status

| Function | Purpose | Phase | Status |
|----------|---------|-------|:------:|
| `generate-livekit-token` | LiveKit JWT token generation | Phase 1 | DONE |
| `create-checkout` | Create Stripe checkout session | Phase 1 | DONE |
| `create-session-hold` | Create Stripe auth hold before session | Phase 1 | DONE |
| `capture-session-payment` | Capture held amount at session end | Phase 1 | DONE |
| `stripe-webhook` | Process Stripe events (captures, disputes) | Phase 1 | DONE |
| `delete-account` | GDPR account deletion | Phase 1 | DONE |
| `create-connect-account` | Create Stripe Connect account for advisors | Phase 1 | DONE |
| `check-connect-status` | Check advisor's Stripe Connect status | Phase 1 | DONE |
| `admin-refund` | Admin-initiated dispute refund (credits + Stripe) | Phase 1 | DONE |
| `ingest-knowledge` | Chunk text, generate embeddings, store in pgvector | Phase 2 | NOT STARTED |
| `clone-voice` | Send audio to Cartesia, create Vapi agent | Phase 2 | NOT STARTED |
| `handle-ai-chat` | RAG pipeline: embed → retrieve → generate | Phase 2 | NOT STARTED |
| `vapi-webhook` | Process AI call end events, billing, transcripts | Phase 2 | NOT STARTED |

### Missing Environment Variables (Supabase Secrets)

| Variable | Purpose | Phase | Status |
|----------|---------|-------|:------:|
| `LIVEKIT_API_KEY` | LiveKit token generation | Phase 1 | Needs setting |
| `LIVEKIT_API_SECRET` | LiveKit token signing | Phase 1 | Needs setting |
| `LIVEKIT_URL` | LiveKit WebSocket URL | Phase 1 | Needs setting |
| `STRIPE_SECRET_KEY` | Stripe server-side operations | Phase 1 | Needs setting |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification | Phase 1 | Needs setting |
| `OPENAI_API_KEY` | Embeddings + chat completions | Phase 2 | — |
| `CARTESIA_API_KEY` | Cartesia voice cloning API | Phase 2 | — |
| `VAPI_API_KEY` | Vapi agent management | Phase 2 | — |

### Applied Migrations

| # | Migration | Purpose |
|---|-----------|---------|
| 1 | `20260213000001_initial_auth_setup.sql` | Profiles table, `handle_new_user` trigger |
| 2 | `20260214000000_add_rtc_session_fields.sql` | Sessions, messages tables, core RPCs |
| 3 | `20260214100000_fix_handle_new_user_trigger.sql` | Trigger fix |
| 4 | `20260216000000_add_accept_decline_realtime.sql` | Accept/decline RPCs, Realtime publication |
| 5 | `20260223000000_add_advisor_details_realtime.sql` | Advisor details Realtime |
| 6 | `20260224000000_milestone3_4_admin_chat.sql` | Read receipts, GDPR delete, admin RLS, `advisor_applications` |
| 7 | `20260225000000_fix_admin_rls_recursion.sql` | Fix admin RLS infinite recursion |
| 8 | `20260225100000_stripe_integration.sql` | Transactions table, Stripe columns, updated RPCs |
| 9 | `20260225200000_fix_start_rtc_session_overload.sql` | Fix `start_rtc_session` function overload |
| 10 | `20260226000000_reviews_table.sql` | Reviews system |
| 11 | `20260227000000_billing_credits_first.sql` | Credits-first billing logic (server-side) |
| 12 | `20260302000000_advisor_schedule_connect.sql` | Advisor schedule JSONB, profile_complete, Stripe Connect columns, approve/reject RPCs |
| 13 | `20260302100000_disputes_table.sql` | Disputes table with RLS for admin dispute resolution |

---

## Database Schema Gaps

### New Tables Required

| Table | Purpose | Phase |
|-------|---------|-------|
| `knowledge_base_documents` | pgvector embeddings for advisor knowledge (RAG) | Phase 2 |
| `horoscopes` | Dynamic daily/weekly horoscope content | Phase 1/2 |

### Column Additions Required

| Table | Column | Type | Purpose | Phase |
|-------|--------|------|---------|-------|
| `advisor_details` | `twin_enabled` | `BOOLEAN DEFAULT false` | Toggle Twin AI on/off | Phase 2 |
| `advisor_details` | `twin_text_rate_per_msg` | `INTEGER DEFAULT 0` | AI text pricing | Phase 2 |
| `advisor_details` | `twin_voice_rate_per_min` | `INTEGER DEFAULT 0` | AI voice pricing | Phase 2 |
| `advisor_details` | `system_prompt` | `TEXT` | Custom AI instructions | Phase 2 |
| `advisor_details` | `cartesia_voice_id` | `VARCHAR(255)` | Cartesia voice clone ID | Phase 2 |
| `advisor_details` | `vapi_agent_id` | `VARCHAR(255)` | Vapi agent ID | Phase 2 |
| `messages` | `is_ai_generated` | `BOOLEAN DEFAULT false` | Flag AI-generated messages | Phase 2 |

### Extensions Required

| Extension | Purpose | Phase |
|-----------|---------|-------|
| `vector` (pgvector) | Vector similarity search for RAG | Phase 2 |
| `pg_cron` | Scheduled jobs (daily horoscope) | Phase 2 |

---

## Recent Improvements (2026-02-27)

### Billing Logic Fix
- **Before:** Free minutes consumed first, then credits deducted
- **After:** Credits consumed first; free minutes only kick in after credit balance reaches zero
- Implemented via shared `useSessionBilling` hook used by all 3 session pages (Chat, VoiceCall, VideoCall)
- Server-side `end_rtc_session` updated: client sends only paid minutes, free minutes no longer subtracted in cost calculation

### Coming Soon Pages
- Created themed `ComingSoon.tsx` page for unbuilt routes
- 7 routes now show Coming Soon instead of 404: `/about`, `/privacy`, `/terms`, `/cookies`, `/favorites`, `/payment-methods`, `/advisor/:id/ai`
- Fixed broken `/chat` link in Profile.tsx → redirects to `/advisors`

### Legal/Content Pages (Drafts)
- `docs/ABOUT_US.md` — Company mission, how the platform works, values
- `docs/PRIVACY_POLICY.md` — Data collection, GDPR/CCPA, user rights
- `docs/TERMS_OF_SERVICE.md` — Billing terms, session policies, liability
- `docs/COOKIE_POLICY.md` — Essential cookies, third-party (Stripe, LiveKit)

### Dynamic Horoscope Planning
- `docs/DYNAMIC_HOROSCOPE_PLAN.md` — Full architecture doc for replacing static horoscopes with n8n-automated dynamic content

---

## Phase 1 Remaining Steps

| # | Task | Effort | Status |
|---|------|--------|--------|
| ~~1~~ | ~~Deploy edge functions~~ | ~~Low~~ | DONE (9 functions) |
| ~~2~~ | ~~Set environment secrets~~ | ~~Low~~ | Manual step — needs LiveKit + Stripe keys |
| ~~3~~ | ~~Complete Stripe flow~~ | ~~Medium~~ | DONE (credits-only, Auth & Capture removed) |
| ~~4~~ | ~~Credit purchase via Stripe~~ | ~~Medium~~ | DONE (AddCredit + Stripe Checkout) |
| ~~5~~ | ~~Complete admin panel~~ | ~~Medium~~ | DONE (disputes, approvals, refunds) |
| ~~6~~ | ~~Advisor onboarding wizard~~ | ~~High~~ | DONE (4-step wizard + profile persistence) |
| 7 | **Database-driven advisor listing** — replace static data fully | High | Remaining |
| ~~8~~ | ~~Auth completion — OAuth~~ | ~~Medium~~ | DONE (Google + Facebook wired) |
| 9 | **Facebook App creation** — create Meta app, enable Supabase provider | Low | Manual step |
| 10 | **Dynamic horoscopes** — `horoscopes` table + n8n workflow per plan | Medium | Not started |
| 11 | **Render legal pages** — convert markdown drafts to React pages | Low | Not started |
| 12 | **E2E QA testing** — session lifecycle, billing edge cases | High | Not started |
| 13 | **Deploy edge functions + set secrets** — deploy all 9 to Supabase | Low | Manual step |

---

## Appendix: PRD Functional Requirements Cross-Reference

| FR | Description | Status | Implementation |
|----|-------------|:------:|----------------|
| FR-1.1 | Secure Signup/Login via Email & Password | DONE | `useAuth.tsx`, `AuthModal.tsx`, Supabase Auth |
| FR-1.2 | Role definition (client, advisor, admin) | DONE | `profiles.role` column, admin panel exists |
| FR-1.3 | Advisor Application Flow | DONE | Application form + admin approval with auto-provisioning + 4-step setup wizard + Stripe Connect |
| FR-2.1 | Stripe Connect Integration | DONE | `create-connect-account` + `check-connect-status` edge functions, `StripeConnectCard` UI |
| FR-2.2 | Credit Purchase | DONE | Credits-only model. `create-checkout` + `stripe-webhook`. Auth & Capture removed. |
| FR-2.3 | Billing on session end | DONE | `end_rtc_session` atomically deducts credits. `useSessionBilling` shared hook. |
| FR-2.4 | Token only after payment confirmed | N/A | Credits-only model — credit balance checked at session start |
| FR-3.1 | Browse advisors with filters | DONE | `AdvisorsListing.tsx` (static data) |
| FR-3.2 | Detailed Advisor Profiles | DONE | `AdvisorProfile.tsx`, `AdvisorPrivateProfile.tsx` |
| FR-3.3 | Daily Horoscope | PARTIAL | Static horoscope UI; dynamic plan documented |
| FR-4.1 | Unified Live Chat | DONE | Real-time messaging, typing indicators, read receipts, cross-session history |
| FR-4.2 | Audio & Video Calls (LiveKit) | DONE | `VoiceCall.tsx`, `VideoCall.tsx`, `WebRTCService` |
| FR-4.3 | Secure Signaling (Edge Function tokens) | DONE | `generate-livekit-token` edge function |
| FR-4.4 | Call State Machine | DONE | `pending → active → completed/cancelled`, shared billing hook |
| FR-5.1 | Knowledge Base Ingestion (pgvector) | NOT STARTED | — |
| FR-5.2 | Text Mode (Offline Chatbot) | NOT STARTED | — |
| FR-5.3 | Voice Mode (Real-Time AI Call) | NOT STARTED | — |
| FR-5.4 | Tiered Pricing (Human vs AI) | NOT STARTED | — |
| FR-6.1 | Admin Panel (RLS-protected) | DONE | `AdminPanel.tsx` + 8 components + 5 hooks, full sidebar navigation |
| FR-6.2 | Advisor Approval Dashboard | DONE | Auto-provision on approval (creates advisor_details + updates role) |
| FR-6.3 | Dispute Center / Refunds | DONE | `AdminDisputeCenter` + `AdminDisputeDetail` + `admin-refund` edge function + `disputes` table |
| NFR-1 | Data Privacy & RLS | DONE | RLS policies on all tables |
| NFR-2 | Right to be Forgotten | PARTIAL | `delete_my_account()` RPC + edge function + UI; needs full anonymization |
| NFR-3 | Performance targets | PARTIAL | LiveKit integration exists; latency not benchmarked |
