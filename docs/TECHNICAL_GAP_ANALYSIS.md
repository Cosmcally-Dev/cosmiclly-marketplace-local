# Cosmiclly — Technical Gap Analysis

> **Generated:** 2026-02-23
> **Source Documents:** PRD v1.0, Project Roadmap v1.0, SDD v1.0, Twin AI Technical Specification v1.0
> **Codebase Commit:** `944138f` (main)

---

## Executive Summary

| Phase | Description | Completion | Notes |
|-------|-------------|:----------:|-------|
| **Phase 1** | MVP Launch (Human-to-Human Marketplace) | **~40%** | Auth + RTC core done; payments, admin, and advisor onboarding missing |
| **Phase 2** | Twin AI Expansion (Digital Clone) | **0%** | No AI infrastructure exists yet |

### Quick Stats

- **Edge Functions:** 1 of 7 built (`generate-livekit-token`)
- **Database Migrations:** 3 of 4 applied (accept/decline migration pending)
- **NPM Dependencies:** Core stack installed; Stripe, OpenAI, ElevenLabs, Vapi SDKs missing
- **Static Advisors:** 58 defined in code; only 1 (Psychic Luna) has a real DB profile
- **Environment Variables:** Supabase keys configured; LiveKit, Stripe, AI keys not set

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
| **Execute Supabase schema migrations** | Task 1.1 | PARTIAL | 3 of 4 migrations applied. Pending: `20260216000000_add_accept_decline_realtime.sql` (adds `accept_session()`, `decline_session()` RPCs and enables Realtime publication). Run `npx supabase db push` to apply. |
| **Finalize Authentication flows** | Task 1.2, FR-1.1 | PARTIAL | Email/password signup and login work via Supabase Auth (`src/hooks/useAuth.tsx`, `src/components/modals/AuthModal.tsx`). **Missing:** password reset (placeholder only), email confirmation routing, OAuth (Google/Facebook buttons show "Coming soon"). |
| **Build Advisor Onboarding Wizard** | Task 1.3, FR-1.3 | PARTIAL | Basic `AdvisorApplicationModal` exists (`src/components/modals/AdvisorApplicationModal.tsx`) — collects name, email, specialty, social link. Saves to `advisor_applications` table with `status='pending'`. **Missing:** multi-step wizard with bio/specialty/pricing setup, document upload, post-approval onboarding, payout method setup. `AdvisorPortal.tsx` is a placeholder page. |
| **Connect frontend to live Supabase queries** | Task 1.4 | PARTIAL | `AdvisorPrivateProfile` component exists (`src/components/profile/AdvisorPrivateProfile.tsx`). Advisor listing (`src/pages/AdvisorsListing.tsx`) has full search/filter/sort UI but reads from **static data** (`src/data/advisors.ts`, 58 advisors). Only "Psychic Luna" (id `'1'`, dbId `'45dd82c1-c457-480b-af66-4c07bd0a9d01'`) has a real DB profile. **Missing:** Database-driven advisor listing, dynamic advisor profiles. |
| **Role definition** | FR-1.2 | DONE | `profiles.role` stores `'client'` or `'advisor'`. Set via `isAdvisor` metadata during signup. Admin role supported in RLS but no admin creation flow. |

#### What Exists (Milestone 1)
- `src/hooks/useAuth.tsx` — Auth context with login, signup, session management, credit tracking
- `src/components/modals/AuthModal.tsx` — Sign-in/sign-up modal with form validation
- `src/pages/Settings.tsx` — Profile editing page
- `src/components/modals/AdvisorApplicationModal.tsx` — Basic application form
- `supabase/migrations/` — 4 migration files (3 applied)
- Database tables: `profiles`, `advisor_details`, `sessions`, `messages`, `advisor_applications`
- Database trigger: `handle_new_user()` auto-creates profile on signup

#### What's Missing (Milestone 1)
- Password reset API/UI
- Email confirmation redirect handling
- OAuth provider integration (Google, Facebook)
- Multi-step advisor onboarding wizard (bio, specialties picker, pricing tiers, availability schedule, profile photo upload)
- Admin approval workflow for advisor applications (backend exists, no UI)
- Migrating advisor listing from static data to database queries
- Creating real DB profiles for all advisors (or a self-serve advisor signup → approval flow)

---

### Milestone 2: The Payment Engine (Roadmap Week 2)

| Task | Ref | Status | Details |
|------|-----|:------:|---------|
| **Integrate Stripe Connect for Advisors** | Task 2.1, FR-2.1 | NOT STARTED | No Stripe SDK installed. No Connect onboarding flow. No bank account linking. `@stripe/stripe-js` and `stripe` packages not in `package.json`. |
| **Build Client Checkout flow (Pre-Auth Hold)** | Task 2.2, FR-2.2 | NOT STARTED | PRD specifies Auth & Capture: client selects max duration, Stripe holds funds, captures on session end. **Current system:** credit-based (`profiles.credits` field). Credits are manually added via RPC. `src/pages/AddCredit.tsx` shows credit packages but payment methods (Google Pay, PayPal, card) are UI placeholders with no backend processing. |
| **Edge Function: verify Stripe hold before LiveKit token** | Task 2.3, FR-2.4 | NOT STARTED | `generate-livekit-token` checks `session.status === 'active'` but does NOT verify any payment hold. No Stripe integration in edge functions. |
| **Webhook handler: Capture final amount** | Task 2.4, FR-2.3 | NOT STARTED | No `stripe-webhook` edge function. No capture logic. No refund handling. |

#### What Exists (Milestone 2)
- `profiles.credits` field (decimal) — internal credit balance
- `add_credits()` and `deduct_credits()` RPC functions
- `end_rtc_session()` atomically deducts credits based on billable minutes
- `src/pages/AddCredit.tsx` — credit package selection UI
- `src/components/modals/PaymentMethodModal.tsx` — payment method UI (placeholder)
- `src/components/modals/CardDetailsModal.tsx` — card entry form (stores last 4 digits in localStorage only)
- Per-minute billing tracking in sessions table (`rate_per_minute`, `billable_minutes`, `cost_total`, `billing_status`)

#### What Needs to Be Built (Milestone 2)
1. Install `@stripe/stripe-js` (frontend) and add `stripe` as Supabase Edge Function dependency
2. **Stripe Connect onboarding flow** — advisor links bank account, KYC verification
3. **Pre-Auth Hold modal** — client selects max duration, system calculates hold amount, places Stripe `PaymentIntent` with `capture_method: 'manual'`
4. **Edge Function: `stripe-checkout`** — creates PaymentIntent, returns client secret
5. **Modify `generate-livekit-token`** — verify payment hold status before issuing token
6. **Edge Function: `stripe-webhook`** — listens for `payment_intent.succeeded`, `charge.dispute.*`, processes captures and refunds
7. **Capture logic** — on session end, calculate exact cost, capture from held amount, release remainder
8. **Advisor payout scheduling** — Stripe Connect transfers to advisor accounts
9. Set environment variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`

---

### Milestone 3: Real-Time Communications (Roadmap Week 3)

| Task | Ref | Status | Details |
|------|-----|:------:|---------|
| **Connect Chat UI to Supabase Realtime** | Task 3.1, FR-4.1 | PARTIAL | Chat messages work via `useChatMessages` hook (Realtime `postgres_changes` subscription + polling fallback). **Missing:** typing indicators, read receipts, persistent cross-session WhatsApp-style threads (current: messages are per-session only). |
| **Finalize LiveKit token generation** | Task 3.2, FR-4.3 | DONE | `supabase/functions/generate-livekit-token/index.ts` verifies auth, checks session status, validates participant identity, generates scoped JWT. Room names use `session-${sessionId}`. |
| **Implement Call State Management** | Task 3.3, FR-4.4 | DONE | Full state machine: `connecting → ringing → connected → ended`. Client creates pending session (`start_rtc_session`), advisor accepts (`accept_session`), 60s ringing timeout auto-cancels. Billing timer starts on `connected`. Implemented in `VoiceCall.tsx`, `VideoCall.tsx`, `Chat.tsx`, `AdvisorCall.tsx`. |
| **"Right to be Forgotten" API** | Task 3.4, NFR-2 | NOT STARTED | No data deletion endpoint, no anonymization logic, no GDPR compliance features. |

#### What Exists (Milestone 3)
- `src/pages/Chat.tsx` — Client chat with ringing/accept flow, real-time messages
- `src/pages/VoiceCall.tsx` — Client audio call with LiveKit WebRTC, billing timer
- `src/pages/VideoCall.tsx` — Client video call with camera toggle, fullscreen UI
- `src/pages/AdvisorCall.tsx` — Advisor dashboard: incoming session list + active session view (chat/audio/video)
- `src/hooks/useSessionRealtime.ts` — Session status polling (3s) + Realtime subscription
- `src/hooks/useAdvisorIncomingCalls.ts` — Incoming sessions polling (5s) + Realtime subscription
- `src/hooks/useChatMessages.ts` — Message fetch, Realtime subscription, send
- `src/hooks/useWebRTC.ts` — LiveKit connection management, stats collection
- `src/services/webrtc.ts` — `WebRTCService` class wrapping LiveKit `Room`
- `supabase/functions/generate-livekit-token/index.ts` — Token generation edge function
- Database RPCs: `start_rtc_session()`, `accept_session()`, `decline_session()`, `end_rtc_session()`

#### What's Missing (Milestone 3)
1. **Typing indicators** — needs `is_typing` presence channel or DB field, UI bubble in Chat.tsx
2. **Read receipts** — needs `read_at` timestamp on messages, UI checkmarks
3. **Persistent chat threads** — WhatsApp-style: one thread per client-advisor pair across sessions (currently messages are scoped to a single session)
4. **GDPR "Right to be Forgotten"** — Edge function to anonymize/delete user data on request
5. **LiveKit credentials deployment** — `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` must be set as Supabase secrets

---

### Milestone 4: Admin Controls & QA (Roadmap Week 4)

| Task | Ref | Status | Details |
|------|-----|:------:|---------|
| **Build /admin React route** | Task 4.1, FR-6.1 | NOT STARTED | No `/admin` route exists. No admin components. Database has `role='admin'` RLS support but no UI. |
| **Advisor Approval dashboard** | Task 4.2, FR-6.2 | NOT STARTED | `advisor_applications` table stores pending applications. No admin UI to review/approve/reject. |
| **Dispute Center** | Task 4.3, FR-6.3 | NOT STARTED | No dispute handling, no refund triggers, no session log review interface. Requires Stripe integration first. |
| **End-to-End QA Testing** | Task 4.4 | NOT STARTED | No automated tests. Manual testing only via `/test-guide` page. No network-drop or billing edge-case test coverage. |

#### What Needs to Be Built (Milestone 4)
1. **`/admin` route** — protected by `role='admin'` check, React layout with sidebar navigation
2. **Advisor Approval UI** — list pending `advisor_applications`, approve/reject with notes, auto-update `advisor_details` on approval
3. **Dispute Center** — view session logs, trigger Stripe refunds, flag/unflag sessions
4. **Global Dashboard** — active sessions count, total revenue, user metrics
5. **User Management** — list/search users, view profiles, suspend accounts
6. **QA test suite** — at minimum, integration tests for session lifecycle and billing calculations

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
     ADD COLUMN elevenlabs_voice_id VARCHAR(255),
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
1. **Add `is_ai_generated` column to `messages` table:**
   ```sql
   ALTER TABLE public.messages ADD COLUMN is_ai_generated BOOLEAN DEFAULT false;
   ```
2. **Supabase Database Webhook** — triggers on `messages` INSERT when:
   - The advisor's `twin_enabled = true`
   - The advisor's status is `offline`
   - Invokes `handle-ai-chat` edge function
3. **Edge Function: `handle-ai-chat`:**
   - Embeds the client's message using OpenAI
   - Queries `knowledge_base_documents` for top 3 relevant chunks (cosine similarity)
   - Calls `gpt-4o` with: system prompt (advisor's custom instructions) + retrieved context + last 5 messages
   - Inserts AI response into `messages` with `is_ai_generated: true`
4. **Update Chat.tsx and AdvisorCall.tsx** — visually distinguish AI messages (different styling, "AI" badge)
5. **Update `useChatMessages.ts`** — include `is_ai_generated` in message type

---

### Milestone 7: Voice Clone Agent (Roadmap Week 7)

| Task | Ref | Status | Details |
|------|-----|:------:|---------|
| **ElevenLabs voice cloning integration** | Task 7.1, FR-5.3 | NOT STARTED | No ElevenLabs SDK. No voice recording UI. No `clone-voice` edge function. |
| **Vapi.ai Web SDK integration** | Task 7.2, FR-5.3 | NOT STARTED | No `@vapi-ai/web` package. No Vapi call handling. No `vapi-webhook` edge function. |
| **AI call billing** | Task 7.3, FR-5.4 | NOT STARTED | No tiered pricing (human vs AI). No AI-specific billing logic. |

#### What Needs to Be Built (Milestone 7)
1. **Voice Recording UI** — in AdvisorPrivateProfile, advisor reads 60-second script, records via browser MediaRecorder API
2. **Edge Function: `clone-voice`:**
   - Receives audio blob
   - Sends to ElevenLabs `/v1/voices/add` (Instant Voice Cloning)
   - Saves returned `voice_id` to `advisor_details.elevenlabs_voice_id`
   - Creates/updates Vapi agent via Vapi API, links voice ID → saves `vapi_agent_id`
3. **AI Call Page** — new route or modified VoiceCall.tsx to initialize Vapi Web SDK (bypasses LiveKit for AI calls)
4. **Edge Function: `vapi-webhook`:**
   - Receives end-of-call events from Vapi
   - Extracts exact call duration
   - Processes billing (Stripe capture or credit deduction)
   - Saves call transcript to `sessions.session_metadata`
5. **Tiered Pricing UI** — advisor sets separate rates for human calls vs Twin AI calls; client sees both rates on advisor profile
6. **Install dependencies:** `@vapi-ai/web` (frontend), `elevenlabs` (edge functions)
7. **Set environment variables:** `ELEVENLABS_API_KEY`, `VAPI_API_KEY`

---

### Milestone 8: Polish & Retention (Roadmap Week 8)

| Task | Ref | Status | Details |
|------|-----|:------:|---------|
| **Daily Horoscope Edge Function** | Task 8.1, FR-3.3 | PARTIAL | Static horoscope page exists (`src/pages/Horoscope.tsx`) with 12 signs, daily/weekly/monthly tabs, and detailed content. Also `src/pages/DailyOracle.tsx` with 22 tarot cards. **Missing:** automated GPT-4o cron job for dynamic daily content, `articles`/`horoscopes` database tables. |
| **PWA Optimization** | Task 8.2 | NOT STARTED | No `manifest.json`, no service worker, no offline support, no install-to-home-screen. |
| **Push Notifications** | Task 8.3 | NOT STARTED | No push notification infrastructure. No FCM/Web Push subscription. No notification triggers. |

#### What Needs to Be Built (Milestone 8)
1. **Edge Function: `daily-horoscope`** — cron-triggered (Supabase pg_cron or external), calls GPT-4o, stores generated content in `horoscopes` table
2. **Database tables:** `horoscopes` and/or `articles` for dynamic content
3. **Update Horoscope.tsx** — fetch from database instead of static data
4. **`manifest.json`** — PWA manifest with app name, icons, theme colors, display mode
5. **Service Worker** — caching strategy for offline access, background sync
6. **Push Notifications:**
   - Web Push API subscription management
   - Backend: notification triggers ("Your favorite advisor is online!")
   - UI: notification preferences in Settings

---

## Infrastructure Gaps

### Missing NPM Packages

| Package | Purpose | Phase |
|---------|---------|-------|
| `@stripe/stripe-js` | Stripe frontend SDK (Elements, PaymentIntents) | Phase 1 |
| `openai` | OpenAI API for embeddings + chat completions (edge functions) | Phase 2 |
| `@vapi-ai/web` | Vapi Web SDK for AI voice calls | Phase 2 |

> Note: `stripe`, `openai`, `elevenlabs` SDKs for edge functions are imported directly via Deno's `npm:` specifier — no package.json entry needed.

### Missing Edge Functions

| Function | Purpose | Phase | Dependencies |
|----------|---------|-------|-------------|
| `stripe-checkout` | Create PaymentIntent with auth hold | Phase 1 | Stripe SDK |
| `stripe-webhook` | Process captures, refunds, disputes | Phase 1 | Stripe SDK |
| `ingest-knowledge` | Chunk text, generate embeddings, store in pgvector | Phase 2 | OpenAI SDK |
| `clone-voice` | Send audio to ElevenLabs, create Vapi agent | Phase 2 | ElevenLabs API |
| `handle-ai-chat` | RAG pipeline: embed query → retrieve → generate | Phase 2 | OpenAI SDK, pgvector |
| `vapi-webhook` | Process AI call end events, billing, transcripts | Phase 2 | Vapi API |
| `daily-horoscope` | Cron: generate daily content via GPT-4o | Phase 2 | OpenAI SDK |

### Missing Environment Variables (Supabase Secrets)

| Variable | Purpose | Phase |
|----------|---------|-------|
| `LIVEKIT_API_KEY` | LiveKit token generation | Phase 1 |
| `LIVEKIT_API_SECRET` | LiveKit token signing | Phase 1 |
| `LIVEKIT_URL` | LiveKit WebSocket URL | Phase 1 |
| `STRIPE_SECRET_KEY` | Stripe server-side operations | Phase 1 |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification | Phase 1 |
| `OPENAI_API_KEY` | Embeddings + chat completions | Phase 2 |
| `ELEVENLABS_API_KEY` | Voice cloning API | Phase 2 |
| `VAPI_API_KEY` | Vapi agent management | Phase 2 |

### Pending Migration

The following migration **must be applied** for the ringing/accept flow to work:

```bash
npx supabase db push
```

File: `supabase/migrations/20260216000000_add_accept_decline_realtime.sql`
- Adds `accept_session()` and `decline_session()` RPCs
- Modifies `start_rtc_session()` to create sessions as `status='pending'`
- Enables Realtime publication on `sessions` and `messages` tables

---

## Database Schema Gaps

### New Tables Required

| Table | Purpose | Phase |
|-------|---------|-------|
| `knowledge_base_documents` | pgvector embeddings for advisor knowledge (RAG) | Phase 2 |
| `horoscopes` | Dynamic daily/weekly horoscope content | Phase 2 |
| `articles` | Blog/editorial content for SEO/engagement | Phase 2 |
| `stripe_customers` | Map Supabase users to Stripe customer IDs | Phase 1 |
| `transactions` | Payment transaction ledger (holds, captures, refunds) | Phase 1 |

### Column Additions Required

| Table | Column | Type | Purpose | Phase |
|-------|--------|------|---------|-------|
| `advisor_details` | `twin_enabled` | `BOOLEAN DEFAULT false` | Toggle Twin AI on/off | Phase 2 |
| `advisor_details` | `twin_text_rate_per_msg` | `INTEGER DEFAULT 0` | AI text pricing | Phase 2 |
| `advisor_details` | `twin_voice_rate_per_min` | `INTEGER DEFAULT 0` | AI voice pricing | Phase 2 |
| `advisor_details` | `system_prompt` | `TEXT` | Custom AI instructions | Phase 2 |
| `advisor_details` | `elevenlabs_voice_id` | `VARCHAR(255)` | ElevenLabs voice clone ID | Phase 2 |
| `advisor_details` | `vapi_agent_id` | `VARCHAR(255)` | Vapi agent ID | Phase 2 |
| `messages` | `is_ai_generated` | `BOOLEAN DEFAULT false` | Flag AI-generated messages | Phase 2 |
| `profiles` | `stripe_customer_id` | `VARCHAR(255)` | Stripe customer mapping | Phase 1 |
| `profiles` | `stripe_connect_id` | `VARCHAR(255)` | Stripe Connect account (advisors) | Phase 1 |

### Extensions Required

| Extension | Purpose | Phase |
|-----------|---------|-------|
| `vector` (pgvector) | Vector similarity search for RAG | Phase 2 |
| `pg_cron` | Scheduled jobs (daily horoscope) | Phase 2 |

---

## Priority Recommendations

### Immediate (unblocks testing)
1. Apply pending migration (`npx supabase db push`)
2. Deploy LiveKit edge function (`supabase functions deploy generate-livekit-token`)
3. Set LiveKit secrets (`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`)

### Phase 1 Priority Order
1. **Stripe Integration** (Milestone 2) — Unblocks real payments. Auth & Capture is the billing model per PRD.
2. **Admin Panel** (Milestone 4) — Unblocks advisor approval pipeline.
3. **Advisor Onboarding Wizard** (Milestone 1, Task 1.3) — Unblocks advisor self-service signup.
4. **Database-driven Advisor Listing** (Milestone 1, Task 1.4) — Replace static data with real DB queries.
5. **Chat Enhancements** (Milestone 3, Task 3.1) — Typing indicators, read receipts, persistent threads.
6. **Auth Completion** (Milestone 1, Task 1.2) — Password reset, OAuth, email confirmation.
7. **GDPR API** (Milestone 3, Task 3.4) — Required for compliance.

### Phase 2 Priority Order
1. **pgvector + Knowledge Ingestion** (Milestone 5) — Foundation for all AI features.
2. **Text Clone Chatbot** (Milestone 6) — Lower complexity than voice; validates RAG pipeline.
3. **Voice Clone Agent** (Milestone 7) — Flagship differentiator; requires ElevenLabs + Vapi.
4. **Daily Horoscope Automation** (Milestone 8, Task 8.1) — Content marketing driver.
5. **PWA** (Milestone 8, Task 8.2) — Mobile experience improvement.
6. **Push Notifications** (Milestone 8, Task 8.3) — Retention/engagement tool.

---

## Appendix: PRD Functional Requirements Cross-Reference

| FR | Description | Status | Implementation |
|----|-------------|:------:|----------------|
| FR-1.1 | Secure Signup/Login via Email & Password | DONE | `useAuth.tsx`, `AuthModal.tsx`, Supabase Auth |
| FR-1.2 | Role definition (client, advisor, admin) | DONE | `profiles.role` column, set during signup |
| FR-1.3 | Advisor Application Flow | PARTIAL | Application form exists; no admin approval UI |
| FR-2.1 | Stripe Connect Integration | NOT STARTED | — |
| FR-2.2 | Pre-Auth Hold | NOT STARTED | Credit system exists as interim placeholder |
| FR-2.3 | Capture on session end | NOT STARTED | `end_rtc_session` deducts credits (not Stripe) |
| FR-2.4 | Token only after payment hold confirmed | NOT STARTED | Token checks session status but not payment |
| FR-3.1 | Browse advisors with filters | DONE | `AdvisorsListing.tsx` (static data) |
| FR-3.2 | Detailed Advisor Profiles | DONE | `AdvisorProfile.tsx`, `AdvisorPrivateProfile.tsx` |
| FR-3.3 | Daily Horoscope | PARTIAL | Static horoscope UI; no automated generation |
| FR-4.1 | Unified Live Chat | PARTIAL | Real-time messaging works; no typing indicators or persistent threads |
| FR-4.2 | Audio & Video Calls (LiveKit) | DONE | `VoiceCall.tsx`, `VideoCall.tsx`, `WebRTCService` |
| FR-4.3 | Secure Signaling (Edge Function tokens) | DONE | `generate-livekit-token` edge function |
| FR-4.4 | Call State Machine | DONE | `pending → active → completed/cancelled` |
| FR-5.1 | Knowledge Base Ingestion (pgvector) | NOT STARTED | — |
| FR-5.2 | Text Mode (Offline Chatbot) | NOT STARTED | — |
| FR-5.3 | Voice Mode (Real-Time AI Call) | NOT STARTED | — |
| FR-5.4 | Tiered Pricing (Human vs AI) | NOT STARTED | — |
| FR-6.1 | Admin Panel (RLS-protected) | NOT STARTED | — |
| FR-6.2 | Advisor Approval Dashboard | NOT STARTED | — |
| FR-6.3 | Dispute Center / Refunds | NOT STARTED | — |
| NFR-1 | Data Privacy & RLS | DONE | RLS policies on all tables |
| NFR-2 | Right to be Forgotten | NOT STARTED | — |
| NFR-3 | Performance targets | PARTIAL | LiveKit integration exists; latency not benchmarked |
