# Cosmiclly — Technical Gap Analysis

> **Updated:** 2026-03-06
> **Source Documents:** PRD v1.0, Project Roadmap v1.0, SDD v1.1, Twin AI Technical Specification v1.1
> **Codebase Commit:** latest (main)

---

## Executive Summary

| Phase | Description | Completion | Notes |
|-------|-------------|:----------:|-------|
| **Phase 1** | MVP Launch (Human-to-Human Marketplace) | **~97%** | Auth (email + Google), RTC core done, credits-only billing with shared hook, Stripe credit purchases + Connect payouts, admin with disputes/refunds + advisor contracts + transactions, advisor setup wizard + schedule + profile persistence, dynamic advisor dashboard stats, advisor activity page, Brevo email integration, 20 DB-backed advisors, transaction history (user + admin), favorite advisors, Help Center differentiation |
| **Phase 2** | Twin AI Expansion (Digital Clone) | **~95%** | Code complete: pgvector + knowledge ingestion, AI text chat (RAG), voice clone (Cartesia + Vapi). Needs deployment + API keys. |

### Quick Stats

- **Edge Functions:** 14 of 14 built (Phase 1: 10 incl. `send-email`, Phase 2: 4 — `ingest-knowledge`, `handle-ai-chat`, `clone-voice`, `vapi-webhook`)
- **Database Migrations:** 18 (15 applied + 3 pending: `20260304000000_advisor_contracts_and_stats.sql`, `20260306000000_transaction_logging_and_favorites.sql`, `20260307000000_sessions_created_at_and_rls_fix.sql`)
- **NPM Dependencies:** Core stack + Stripe SDK + LiveKit client + `@vapi-ai/web` installed
- **Advisors:** 20 defined in static code, all 20 with real DB profiles (auth accounts + advisor_details); `useAdvisors` hook merges DB + static
- **Environment Variables:** Supabase keys configured; LiveKit + Stripe keys need Supabase secrets; OpenAI, Cartesia, Vapi keys needed for Phase 2 deployment

### What Changed Since Last Review (2026-03-06)

| Area | Before (2026-03-04) | After (2026-03-06) |
|------|--------|-------|
| Migrations | 15 applied + 1 pending | 15 applied + 3 pending (+transaction_logging_and_favorites, +sessions_created_at_and_rls_fix) |
| Phase 1 | ~95% | ~97% |
| Lovable traces | Present (package.json, vite.config.ts, index.html) | Removed entirely, replaced with Cosmiclly branding |
| AI Chat | Message ordering bug (user msg appeared after AI reply) | Fixed — optimistic updates + Realtime deduplication |
| Admin Panel | Tab-switch caused redirect to homepage | Fixed — `isLoading` reset during re-auth prevents premature redirect |
| Advisor Dashboard | Brief flash of user dashboard on tab switch | Fixed — same useAuth isLoading fix |
| Activity Page | AI chats not shown; cancelled sessions first with "Unknown date" | AI sessions labeled distinctly; sorted by created_at; date fallback |
| Transaction History | Only credit purchases logged | All deductions logged; user page (/transactions) + admin tab added |
| Help Center vs Contact | Overlapping content | Differentiated — Help Center focuses on KB/FAQ, links to /contact |
| Favorites | NOT STARTED | DONE (user_favorites table, useFavorites hook, heart button on AdvisorCard, /favorites page) |
| Lovable Favicon | Old Lovable icon in browser tab | Replaced with Cosmiclly logo; favicon.ico deleted |
| Navigation Links | MobileMenu pointed to /settings | Fixed: Activity→/activity, Favorites→/favorites, Transactions added |
| Sessions Table | No `created_at` column | Added via migration (fixes "Unknown date" on cancelled sessions) |
| advisor_details RLS | Only allowed status='active' or 'online' | Fixed: allows public SELECT on all rows (enables offline visibility + Realtime) |
| AI Twin on Cards | Hidden when advisor offline | Shown 24/7 with "AI Twin — Available 24/7" button |

### What Changed (2026-03-03 → 2026-03-04)

| Area | Before (2026-03-03) | After (2026-03-04) |
|------|--------|-------|
| Migrations | 15 applied | 15 applied + 1 pending (+advisor_contracts_and_stats) |
| Edge Functions | 13 | 14 (+send-email for Brevo) |
| Phase 1 | ~90% | ~95% |
| Facebook OAuth | Wired (not working) | Removed entirely |
| Promo Banner | Active | Temporarily removed |
| Advisor Cards | Showing "Advisor" as name | Fixed — falls back to title, then "Advisor" |
| Footer Services | 5 hardcoded links | All 19 specialties in 3 columns |
| Advisor Contracts | NOT STARTED | DONE (admin contract modal, per-advisor share/fee, lock mechanism) |
| Advisor Dashboard Stats | Static/mock data | Dynamic via RPCs (pending balance, earnings, readings, rating) |
| Advisor Activity Page | NOT STARTED | DONE (session history + income calculation at /advisor-activity) |
| Brevo Email | NOT STARTED | DONE (send-email edge function + 6 email types + frontend triggers) |
| Stripe Production | Sandbox keys only | Audited — all env-var-based, .env documented for key swap |
| User Activity | 3 summary cards | 2 summary cards (Avg Duration removed) |
| Online/Offline | Existed but unverified | Verified working (toggle + realtime + card indicators) |

### What Changed (2026-03-02 → 2026-03-03)

| Area | Before (2026-03-02) | After (2026-03-03) |
|------|--------|-------|
| Migrations | 13 applied | 15 applied (+twin_ai_infrastructure, +seed_dummy_advisors) |
| Edge Functions | 9 | 13 (+ingest-knowledge, +handle-ai-chat, +clone-voice, +vapi-webhook) |
| Phase 2 | 0% — planning only | ~95% — code complete for Milestones 5, 6, 7 |
| pgvector | NOT STARTED | DONE (extension enabled, knowledge_base_documents table, HNSW index) |
| AI Text Chat | NOT STARTED | DONE (handle-ai-chat RAG pipeline, useAiChat hook, TwinChat page at /advisor/:id/ai) |
| AI Voice Call | NOT STARTED | DONE (clone-voice + vapi-webhook edge functions, VoiceRecordingCard, TwinVoiceCall page at /advisor/:id/ai-voice) |
| Twin Setup UI | NOT STARTED | DONE (TwinSetupCard + VoiceRecordingCard in advisor portal) |
| NPM Packages | @vapi-ai/web missing | @vapi-ai/web installed |
| Static Advisors | 58 advisors, 1 DB profile | 20 advisors, all 20 with DB profiles + auth accounts |
| Advisor Auth | Only Psychic Luna had DB profile | 20 dummy advisor accounts seeded (advisor{N}@cosmiclly.test / Test1234!) |

### What Changed (2026-02-27 → 2026-03-02)

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
| **Execute Supabase schema migrations** | Task 1.1 | DONE | All 15 migrations applied. Includes: initial auth, RTC sessions, accept/decline, advisor details realtime, admin/chat enhancements, Stripe integration, RLS fixes, reviews, billing credits-first, advisor schedule/connect, disputes table, Twin AI infrastructure, dummy advisor seeding. |
| **Finalize Authentication flows** | Task 1.2, FR-1.1 | DONE | Email/password signup and login work. Password reset via `Settings.tsx`. Google OAuth integrated. Facebook OAuth removed (Google-only). **Remaining:** email confirmation redirect handling. |
| **Build Advisor Onboarding Wizard** | Task 1.3, FR-1.3 | DONE | 4-step `AdvisorSetupWizard` (bio/photo/specialties/pricing). Auto-provisions on admin approval (`approve_advisor_application` RPC). `AdvisorPrivateProfile` persists to DB (bio, specialties, pricing, schedule). Stripe Connect for payouts via `StripeConnectCard`. Works for manually-added DB advisors via `profile_complete` flag. |
| **Connect frontend to live Supabase queries** | Task 1.4 | DONE | `useAdvisors` hook merges static data with `advisor_details` from DB. All 20 advisors have real DB profiles (auth accounts + advisor_details + profiles). DB advisors take priority in listing; static data serves as UI fallback for review counts and ratings. |
| **Role definition** | FR-1.2 | DONE | `profiles.role` stores `'client'`, `'advisor'`, or `'admin'`. Admin role supported in RLS with admin panel UI. |

#### What Exists (Milestone 1)
- `src/hooks/useAuth.tsx` — Auth context with login, signup, session management, credit tracking
- `src/components/modals/AuthModal.tsx` — Sign-in/sign-up modal with form validation
- `src/pages/Settings.tsx` — Profile editing, password reset, account deletion
- `src/components/modals/AdvisorApplicationModal.tsx` — Basic application form
- `supabase/migrations/` — 15 migration files (all applied)
- Database tables: `profiles`, `advisor_details`, `sessions`, `messages`, `advisor_applications`, `transactions`, `reviews`, `disputes`, `knowledge_base_documents`
- Database trigger: `handle_new_user()` auto-creates profile on signup
- 20 dummy advisor accounts seeded with auth + profiles + advisor_details (see `docs/DUMMY_ADVISORS.md`)

#### What's Missing (Milestone 1)
- Email confirmation redirect handling

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
| **Build /admin React route** | Task 4.1, FR-6.1 | DONE | `/admin` route exists with protected layout. `AdminPanel.tsx` with sidebar navigation (dashboard, approvals, users, sessions, disputes, transactions). RLS policies enforce `role='admin'`. `AdminTransactionsTable` shows all platform credit movements with search + filter. |
| **Advisor Approval dashboard** | Task 4.2, FR-6.2 | DONE | `AdminAdvisorApprovals.tsx` + `AdminApplicationReview.tsx`. `approve_advisor_application` RPC auto-creates `advisor_details` row with contract terms and updates role to 'advisor'. `reject_advisor_application` RPC. Notification emails sent via Brevo on approve/reject. Contract terms (advisor share %, platform share %, admin fee %) set before approval. |
| **Advisor Contracts/Deals** | — | DONE | `AdvisorContractModal.tsx` for per-advisor revenue shares. Admin can set advisor_share_percent, platform_share_percent, admin_fee_percent per advisor. Contract lock mechanism prevents edits. `update_advisor_contract` RPC with admin-only access. Clickable advisor rows in `AdminUsersTable`. |
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
- `src/components/admin/AdvisorContractModal.tsx` — Per-advisor contract management (share %, admin fee, lock)
- `src/components/admin/AdminTransactionsTable.tsx` — Platform-wide transaction history with search + type filter
- `src/hooks/useAdvisorStats.ts` — Advisor dashboard stats via RPCs (pending balance, earnings, readings, rating)
- `src/pages/AdvisorActivity.tsx` — Advisor session history + income page at `/advisor-activity`
- `src/pages/Transactions.tsx` — User-facing credit transaction history at `/transactions`
- `src/pages/Favorites.tsx` — User favorite advisors page at `/favorites`
- `src/hooks/useFavorites.ts` — Favorite advisors hook (toggle, optimistic state, isFavorite check)
- `src/services/email.ts` — Brevo email trigger utility (welcome, receipt, low credit, approval, rejection)
- `supabase/functions/send-email/index.ts` — Brevo transactional email edge function
- RLS policies: admin-only access enforced via `role='admin'` check

#### What Needs to Be Built (Milestone 4)
1. ~~**Approve → auto-provision**~~ — DONE
2. ~~**Dispute → Stripe refund**~~ — DONE
3. ~~**Notification emails**~~ — DONE (Brevo integration: welcome, approval, rejection, session receipt, low credit warning)
4. **QA test suite** — at minimum, integration tests for session lifecycle and billing calculations

---

## Phase 2: The Twin AI Expansion

### Milestone 5: The AI Brain (Roadmap Week 5)

| Task | Ref | Status | Details |
|------|-----|:------:|---------|
| **Enable pgvector in Supabase** | Task 5.1 | DONE | `CREATE EXTENSION IF NOT EXISTS vector` in migration `20260303000000_twin_ai_infrastructure.sql`. HNSW index created on `knowledge_base_documents.embedding`. |
| **Knowledge Ingestion UI** | Task 5.2, FR-5.1 | DONE | `TwinSetupCard` component in advisor portal with file upload (txt/md/pdf), system prompt textarea, pricing inputs, twin_enabled toggle. Files uploaded to `training_docs` storage bucket. |
| **Embedding Edge Function** | Task 5.3 | DONE | `ingest-knowledge` edge function: downloads file from storage, chunks text (~2000 chars, 200 overlap), calls OpenAI `text-embedding-3-small`, inserts into `knowledge_base_documents`. |

#### What Exists (Milestone 5)
- `supabase/migrations/20260303000000_twin_ai_infrastructure.sql` — pgvector extension, `knowledge_base_documents` table with HNSW index, Twin AI columns on `advisor_details`, `is_ai_generated` on `messages`, RPCs (`start_ai_session`, `end_ai_session`, `match_knowledge_base`)
- `supabase/functions/ingest-knowledge/index.ts` — Text chunking + OpenAI embedding pipeline
- `src/components/advisor/TwinSetupCard.tsx` — Twin AI configuration UI (toggle, system prompt, pricing, knowledge base upload)
- Storage bucket: `training_docs` (needs manual creation in Supabase Dashboard)

#### What's Missing (Milestone 5)
- `OPENAI_API_KEY` Supabase secret (manual step)
- `training_docs` storage bucket creation (manual step via Dashboard)
- Deploy `ingest-knowledge` edge function (manual step)

---

### Milestone 6: Text Clone Chatbot (Roadmap Week 6)

| Task | Ref | Status | Details |
|------|-----|:------:|---------|
| **RAG Edge Function** | Task 6.1, FR-5.2 | DONE | `handle-ai-chat` edge function: embeds query via OpenAI, retrieves top-3 knowledge chunks via `match_knowledge_base` RPC, generates response with `gpt-4o-mini`, deducts credits atomically, inserts AI message with `is_ai_generated=true`. |
| **AI Chat Hook** | Task 6.2 | DONE | `useAiChat` hook: fetches messages, Realtime subscription for new messages, calls `handle-ai-chat` edge function, tracks credits used in session. |
| **Dedicated AI Chat Page** | Task 6.3 | DONE | `TwinChat.tsx` at `/advisor/:id/ai`: creates immediate AI session via `start_ai_session` RPC (no ringing), purple AI theme with Bot icons, per-message billing display, "AI is thinking" animation, review modal on end. |

#### What Exists (Milestone 6)
- `supabase/functions/handle-ai-chat/index.ts` — RAG pipeline: embed → retrieve → generate → bill
- `src/hooks/useAiChat.ts` — React hook for AI chat messaging with Realtime
- `src/pages/TwinChat.tsx` — Dedicated AI text chat page
- `src/hooks/useChatMessages.ts` — Added `is_ai_generated` field to `ChatMessage` interface
- `src/data/advisors.ts` — Added `twinEnabled` to `Advisor` interface
- `src/hooks/useAdvisors.ts` — Fetches `twin_enabled` from DB, maps to `twinEnabled`

#### What's Missing (Milestone 6)
- `OPENAI_API_KEY` Supabase secret (shared with Milestone 5)
- Deploy `handle-ai-chat` edge function (manual step)

---

### Milestone 7: Voice Clone Agent (Roadmap Week 7)

| Task | Ref | Status | Details |
|------|-----|:------:|---------|
| **Cartesia voice cloning integration** | Task 7.1, FR-5.3 | DONE | `clone-voice` edge function: downloads audio from `training_docs` storage, sends to Cartesia API for voice cloning, creates Vapi assistant with cloned voice + system prompt, saves IDs to `advisor_details`. |
| **Vapi.ai Web SDK integration** | Task 7.2, FR-5.3 | DONE | `@vapi-ai/web` installed. `TwinVoiceCall.tsx` at `/advisor/:id/ai-voice`: dynamically imports Vapi SDK, starts call with metadata (session_id, client_id, advisor_id), mute/end controls, call timer. |
| **AI call billing** | Task 7.3, FR-5.4 | DONE | `vapi-webhook` edge function handles `end-of-call-report`: calculates billing (duration × `twin_voice_rate_per_min`), deducts credits, updates session to completed with transcript. Tiered pricing via separate `twin_text_rate_per_msg` and `twin_voice_rate_per_min` columns. |

#### What Exists (Milestone 7)
- `supabase/functions/clone-voice/index.ts` — Cartesia voice cloning + Vapi assistant creation
- `supabase/functions/vapi-webhook/index.ts` — Vapi call end webhook handler (billing + transcript)
- `src/components/advisor/VoiceRecordingCard.tsx` — Voice sample recording UI (MediaRecorder, min 30s, max 120s, playback preview)
- `src/pages/TwinVoiceCall.tsx` — AI voice call page with Vapi Web SDK
- `src/data/advisors.ts` — Added `vapiAgentId` to `Advisor` interface
- `src/hooks/useAdvisors.ts` — Fetches `vapi_agent_id` from DB, maps to `vapiAgentId`

#### What's Missing (Milestone 7)
- `CARTESIA_API_KEY` and `VAPI_API_KEY` Supabase secrets (manual step)
- `VITE_VAPI_PUBLIC_KEY` in `.env` frontend (manual step)
- Deploy `clone-voice` and `vapi-webhook` edge functions (manual step)
- Configure Vapi webhook URL in Vapi dashboard: `https://jxpzxdbforvuphqvvqkz.supabase.co/functions/v1/vapi-webhook`

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

### NPM Packages

All required packages are installed:

> Note: `stripe`, `openai` SDKs for edge functions are imported directly via Deno's `npm:` or `esm.sh` specifiers — no package.json entry needed. Cartesia uses direct REST API calls. `@vapi-ai/web` is installed as a frontend dependency for the AI voice call page.

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
| `send-email` | Brevo transactional emails (welcome, receipt, etc.) | Phase 1 | DONE |
| `ingest-knowledge` | Chunk text, generate embeddings, store in pgvector | Phase 2 | DONE |
| `clone-voice` | Send audio to Cartesia, create Vapi agent | Phase 2 | DONE |
| `handle-ai-chat` | RAG pipeline: embed → retrieve → generate | Phase 2 | DONE |
| `vapi-webhook` | Process AI call end events, billing, transcripts | Phase 2 | DONE |

### Missing Environment Variables (Supabase Secrets)

| Variable | Purpose | Phase | Status |
|----------|---------|-------|:------:|
| `LIVEKIT_API_KEY` | LiveKit token generation | Phase 1 | Needs setting |
| `LIVEKIT_API_SECRET` | LiveKit token signing | Phase 1 | Needs setting |
| `LIVEKIT_URL` | LiveKit WebSocket URL | Phase 1 | Needs setting |
| `STRIPE_SECRET_KEY` | Stripe server-side operations | Phase 1 | Needs setting |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification | Phase 1 | Needs setting |
| `OPENAI_API_KEY` | Embeddings + chat completions | Phase 2 | Needs setting |
| `CARTESIA_API_KEY` | Cartesia voice cloning API | Phase 2 | Needs setting |
| `VAPI_API_KEY` | Vapi agent management | Phase 2 | Needs setting |
| `BREVO_API_KEY` | Brevo transactional email API | Phase 1 | Needs setting |
| `VITE_VAPI_PUBLIC_KEY` | Vapi Web SDK (frontend .env) | Phase 2 | Needs setting |

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
| 14 | `20260303000000_twin_ai_infrastructure.sql` | pgvector extension, `knowledge_base_documents` table, Twin AI columns on `advisor_details`, `is_ai_generated` on `messages`, AI session RPCs |
| 15 | `20260303100000_seed_dummy_advisors.sql` | 20 dummy advisor auth accounts + profiles + advisor_details |
| 16 | `20260304000000_advisor_contracts_and_stats.sql` | Advisor contract columns (share %, admin fee, lock), dashboard stats RPCs, `update_advisor_contract` RPC |
| 17 | `20260306000000_transaction_logging_and_favorites.sql` | Transaction logging in `deduct_ai_credits` + `end_rtc_session` RPCs, `user_favorites` table with RLS |
| 18 | `20260307000000_sessions_created_at_and_rls_fix.sql` | Add `created_at` to sessions table, fix `advisor_details` RLS (allow public view of all advisors) |

---

## Database Schema Gaps

### New Tables — Status

| Table | Purpose | Phase | Status |
|-------|---------|-------|:------:|
| `knowledge_base_documents` | pgvector embeddings for advisor knowledge (RAG) | Phase 2 | DONE |
| `user_favorites` | User-advisor favorite bookmarks with RLS | Phase 1 | DONE (pending migration) |
| `horoscopes` | Dynamic daily/weekly horoscope content | Phase 2 | NOT STARTED |

### Column Additions — Status

All Phase 2 columns have been added via migration `20260303000000_twin_ai_infrastructure.sql`:

| Table | Column | Type | Status |
|-------|--------|------|:------:|
| `advisor_details` | `twin_enabled` | `BOOLEAN DEFAULT false` | DONE |
| `advisor_details` | `twin_text_rate_per_msg` | `DECIMAL(10,2) DEFAULT 0.50` | DONE |
| `advisor_details` | `twin_voice_rate_per_min` | `DECIMAL(10,2) DEFAULT 2.00` | DONE |
| `advisor_details` | `system_prompt` | `TEXT` | DONE |
| `advisor_details` | `cartesia_voice_id` | `VARCHAR(255)` | DONE |
| `advisor_details` | `vapi_agent_id` | `VARCHAR(255)` | DONE |
| `advisor_details` | `voice_sample_url` | `TEXT` | DONE |
| `advisor_details` | `advisor_share_percent` | `DECIMAL(5,2) DEFAULT 50.00` | DONE (pending migration) |
| `advisor_details` | `platform_share_percent` | `DECIMAL(5,2) DEFAULT 50.00` | DONE (pending migration) |
| `advisor_details` | `admin_fee_percent` | `DECIMAL(5,2) DEFAULT 5.00` | DONE (pending migration) |
| `advisor_details` | `contract_locked` | `BOOLEAN DEFAULT false` | DONE (pending migration) |
| `advisor_details` | `contract_locked_at` | `TIMESTAMPTZ` | DONE (pending migration) |
| `advisor_details` | `contract_locked_by` | `UUID REFERENCES auth.users(id)` | DONE (pending migration) |
| `messages` | `is_ai_generated` | `BOOLEAN DEFAULT false` | DONE |

### Extensions — Status

| Extension | Purpose | Phase | Status |
|-----------|---------|-------|:------:|
| `vector` (pgvector) | Vector similarity search for RAG | Phase 2 | DONE |
| `pg_cron` | Scheduled jobs (daily horoscope) | Phase 2 | NOT STARTED |

---

## Recent Improvements (2026-02-27)

### Billing Logic Fix
- **Before:** Free minutes consumed first, then credits deducted
- **After:** Credits consumed first; free minutes only kick in after credit balance reaches zero
- Implemented via shared `useSessionBilling` hook used by all 3 session pages (Chat, VoiceCall, VideoCall)
- Server-side `end_rtc_session` updated: client sends only paid minutes, free minutes no longer subtracted in cost calculation

### Coming Soon Pages
- Created themed `ComingSoon.tsx` page for unbuilt routes
- 5 routes now show Coming Soon instead of 404: `/about`, `/privacy`, `/terms`, `/cookies`, `/payment-methods`
- Fixed broken `/chat` link in Profile.tsx → redirects to `/advisors`

### Legal/Content Pages (Drafts)
- `docs/ABOUT_US.md` — Company mission, how the platform works, values
- `docs/PRIVACY_POLICY.md` — Data collection, GDPR/CCPA, user rights
- `docs/TERMS_OF_SERVICE.md` — Billing terms, session policies, liability
- `docs/COOKIE_POLICY.md` — Essential cookies, third-party (Stripe, LiveKit)

### Dynamic Horoscope Planning
- `docs/DYNAMIC_HOROSCOPE_PLAN.md` — Full architecture doc for replacing static horoscopes with n8n-automated dynamic content

---

## Remaining Steps (All Phases)

| # | Task | Effort | Phase | Status |
|---|------|--------|-------|--------|
| ~~1~~ | ~~Deploy Phase 1 edge functions~~ | ~~Low~~ | 1 | DONE (9 functions) |
| ~~2~~ | ~~Database-driven advisor listing~~ | ~~High~~ | 1 | DONE (20 advisors seeded with auth + DB profiles) |
| ~~3~~ | ~~Auth completion — OAuth~~ | ~~Medium~~ | 1 | DONE (Google only; Facebook removed) |
| ~~4~~ | ~~Facebook App creation~~ | ~~Low~~ | 1 | Removed — Facebook OAuth no longer used |
| 5 | **Dynamic horoscopes** — `horoscopes` table + n8n workflow per plan | Medium | 1 | Not started |
| 6 | **Render legal pages** — convert markdown drafts to React pages | Low | 1 | Not started |
| 7 | **E2E QA testing** — session lifecycle, billing edge cases | High | 1 | Not started |
| 8 | **Deploy all edge functions** — deploy all 13 to Supabase | Low | 1+2 | Manual step |
| 9 | **Set environment secrets** — LiveKit, Stripe, OpenAI, Cartesia, Vapi | Low | 1+2 | Manual step |
| 10 | **Create `training_docs` storage bucket** — private bucket in Supabase Dashboard | Low | 2 | Manual step |
| 11 | **Configure Vapi webhook URL** — set in Vapi dashboard | Low | 2 | Manual step |
| 12 | **Set `VITE_VAPI_PUBLIC_KEY`** — frontend .env for Vapi Web SDK | Low | 2 | Manual step |
| 13 | **Apply migration** — `supabase db push` for migrations 14-18 | Low | 1+2 | Manual step |
| 14 | **Set `BREVO_API_KEY`** — Brevo API key in Supabase secrets | Low | 1 | Manual step |
| 15 | **Create Brevo email templates** — 6 templates (welcome client/advisor, receipt, low credit, approved, rejected) | Medium | 1 | Manual step |
| 16 | **Configure Supabase SMTP** — Use Brevo SMTP relay for password reset emails | Low | 1 | Manual step |
| 17 | **Stripe production keys** — Swap `pk_test_...` → `pk_live_...` in `.env`, update `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in Supabase secrets | Low | 1 | Manual step |
| 18 | **Deploy `send-email` edge function** — `supabase functions deploy send-email` | Low | 1 | Manual step |

---

## Appendix: PRD Functional Requirements Cross-Reference

| FR | Description | Status | Implementation |
|----|-------------|:------:|----------------|
| FR-1.1 | Secure Signup/Login via Email & Password | DONE | `useAuth.tsx`, `AuthModal.tsx`, Supabase Auth. Welcome email via Brevo on signup. |
| FR-1.2 | Role definition (client, advisor, admin) | DONE | `profiles.role` column, admin panel exists |
| FR-1.3 | Advisor Application Flow | DONE | Application form + admin approval with contract terms + auto-provisioning + 4-step setup wizard + Stripe Connect. Approval/rejection emails via Brevo. |
| FR-2.1 | Stripe Connect Integration | DONE | `create-connect-account` + `check-connect-status` edge functions, `StripeConnectCard` UI |
| FR-2.2 | Credit Purchase | DONE | Credits-only model. `create-checkout` + `stripe-webhook`. Auth & Capture removed. |
| FR-2.3 | Billing on session end | DONE | `end_rtc_session` atomically deducts credits. `useSessionBilling` shared hook. |
| FR-2.4 | Token only after payment confirmed | N/A | Credits-only model — credit balance checked at session start |
| FR-3.1 | Browse advisors with filters | DONE | `AdvisorsListing.tsx` (DB + static merge via `useAdvisors`) |
| FR-3.2 | Detailed Advisor Profiles | DONE | `AdvisorProfile.tsx`, `AdvisorPrivateProfile.tsx` |
| FR-3.3 | Daily Horoscope | PARTIAL | Static horoscope UI; dynamic plan documented |
| FR-4.1 | Unified Live Chat | DONE | Real-time messaging, typing indicators, read receipts, cross-session history |
| FR-4.2 | Audio & Video Calls (LiveKit) | DONE | `VoiceCall.tsx`, `VideoCall.tsx`, `WebRTCService` |
| FR-4.3 | Secure Signaling (Edge Function tokens) | DONE | `generate-livekit-token` edge function |
| FR-4.4 | Call State Machine | DONE | `pending → active → completed/cancelled`, shared billing hook |
| FR-5.1 | Knowledge Base Ingestion (pgvector) | DONE | `ingest-knowledge` edge function + `TwinSetupCard` UI + `knowledge_base_documents` table with HNSW index |
| FR-5.2 | Text Mode (AI Chatbot) | DONE | `handle-ai-chat` RAG edge function + `useAiChat` hook + `TwinChat.tsx` page at `/advisor/:id/ai` |
| FR-5.3 | Voice Mode (Real-Time AI Call) | DONE | `clone-voice` + `vapi-webhook` edge functions + `VoiceRecordingCard` UI + `TwinVoiceCall.tsx` page at `/advisor/:id/ai-voice` |
| FR-5.4 | Tiered Pricing (Human vs AI) | DONE | Separate `twin_text_rate_per_msg` and `twin_voice_rate_per_min` columns, configurable in `TwinSetupCard` |
| FR-6.1 | Admin Panel (RLS-protected) | DONE | `AdminPanel.tsx` + 8 components + 5 hooks, full sidebar navigation |
| FR-6.2 | Advisor Approval Dashboard | DONE | Auto-provision on approval (creates advisor_details with contract terms + updates role). Per-advisor contracts via `AdvisorContractModal`. |
| FR-6.3 | Dispute Center / Refunds | DONE | `AdminDisputeCenter` + `AdminDisputeDetail` + `admin-refund` edge function + `disputes` table |
| NFR-1 | Data Privacy & RLS | DONE | RLS policies on all tables |
| NFR-2 | Right to be Forgotten | PARTIAL | `delete_my_account()` RPC + edge function + UI; needs full anonymization |
| NFR-3 | Performance targets | PARTIAL | LiveKit integration exists; latency not benchmarked |

---

## Pre-Launch Checklist

| # | Task | Category | Status |
|---|------|----------|:------:|
| 1 | Apply pending migrations (`supabase db push`) — `20260304000000`, `20260306000000`, `20260307000000` | DB | Manual step |
| 2 | Deploy all 14 edge functions (`supabase functions deploy`) | Infra | Manual step |
| 3 | Set Supabase secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BREVO_API_KEY`, `LIVEKIT_*`, `OPENAI_API_KEY`, etc. | Infra | Manual step |
| 4 | Swap Stripe keys to production (`pk_live_...`, `sk_live_...`) | Payments | Manual step |
| 5 | Create 6 Brevo email templates (welcome client, welcome advisor, session receipt, low credit, approved, rejected) | Email | Manual step |
| 6 | Configure Supabase Auth SMTP to use Brevo relay (`smtp-relay.brevo.com:587`) for password reset emails | Email | Manual step |
| 7 | Create `training_docs` storage bucket in Supabase Dashboard (private) | Storage | Manual step |
| 8 | Configure Vapi webhook URL in Vapi dashboard | AI Voice | Manual step |
| 9 | Set admin user in production database (`profiles.role = 'admin'`) | Auth | Manual step |
| 10 | Set custom domain for Supabase (optional) and update CORS origins | Infra | Manual step |
| 11 | Render legal pages (About Us, Privacy Policy, Terms of Service, Cookie Policy) from markdown drafts | Content | Not started |
| 12 | E2E testing: session lifecycle, billing, Stripe checkout, advisor onboarding | QA | Not started |
| 13 | Mobile responsiveness audit | UI | Not started |
| 14 | Browser compatibility testing (Chrome, Firefox, Safari, Edge) | QA | Not started |
