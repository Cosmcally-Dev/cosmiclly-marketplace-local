# Spiritual Reading Website - Project Context

> **For AI assistants (Claude, etc.) continuing development on this project.**

## Tech Stack

- **Framework:** React 18 + Vite
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS + Shadcn UI (`@/components/ui/`)
- **Package Manager:** Bun
- **Backend:** Supabase (Auth, Postgres, Realtime, Edge Functions)
- **WebRTC Provider:** LiveKit (via `livekit-client` ^2.17.1)
- **State Management:** React Context (`AuthProvider`) + local component state
- **Routing:** React Router v6

## Supabase Project

- **Project ID:** `jxpzxdbforvuphqvvqkz`
- **Region:** Configured via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
- **Old project** (`egluycabmxfpnodlrvnz`): created by Lovable, no longer used
- **Edge Functions:** `supabase/functions/generate-livekit-token/index.ts` — generates LiveKit JWT tokens for session participants

## Database Schema (Key Tables)

### `profiles`
- Linked to `auth.users` via trigger (`handle_new_user`)
- Fields: `id`, `full_name`, `username`, `email`, `role` ('client' | 'advisor'), `credits` (decimal), `avatar_url`

### `sessions`
- Core RTC session table
- Fields: `id`, `client_id`, `advisor_id`, `type` (chat/audio/video), `status` (pending/active/completed/cancelled), `rate_per_minute`, `free_minutes_applied`, `started_at`, `ended_at`, `billable_minutes`, `cost_total`, `billing_status`, `connection_quality`, `session_metadata` (JSONB)
- Realtime enabled (Supabase publication)

### `messages`
- Chat messages for chat sessions
- Fields: `id`, `session_id`, `sender_id`, `content`, `created_at`, `is_ai_generated`
- Realtime enabled

### `transactions`
- Credit movement ledger (purchases, session deductions, AI chat deductions, refunds)
- Fields: `id`, `user_id`, `type` (credit_purchase/session_deduction/ai_chat_deduction/refund), `amount_cents`, `credits`, `stripe_checkout_session_id`, `session_id`, `status`, `metadata` (JSONB), `created_at`
- Deductions are automatically logged by `deduct_ai_credits` and `end_rtc_session` RPCs

### `user_favorites`
- User-advisor favorite bookmarks
- Fields: `id`, `user_id`, `advisor_id`, `created_at`
- Unique constraint on `(user_id, advisor_id)`
- RLS: users can only view/insert/delete their own favorites

## RPC Functions (Server-Side)

| Function | Purpose |
|---|---|
| `start_rtc_session` | Creates session with `status='pending'`, `started_at=NULL` |
| `accept_session` | Advisor accepts → sets `status='active'`, `started_at=NOW()` |
| `decline_session` | Either party cancels a pending session → `status='cancelled'` |
| `end_rtc_session` | Ends active session, calculates billing, deducts credits atomically, logs transaction |
| `deduct_ai_credits` | Deducts credits for AI chat messages, logs transaction |

## Session Lifecycle

```
Client initiates → start_rtc_session() → status: PENDING
                                              │
            ┌─────────────────────────────────┼─────────────────────┐
            ▼                                 ▼                     ▼
   Advisor accepts              Advisor declines          60s timeout
   accept_session()             decline_session()         decline_session()
   status: ACTIVE               status: CANCELLED         status: CANCELLED
            │
   [session runs: timer, billing, WebRTC/chat]
            │
   Either party ends
   end_rtc_session()
   status: COMPLETED
```

## Key Architecture Patterns

### Ringing/Accept Flow
All session types (chat, audio, video) follow the same pattern:
1. Client page creates a pending session via `start_rtc_session`
2. Client subscribes to session status changes via `useSessionRealtime`
3. Advisor sees incoming sessions via `useAdvisorIncomingCalls` (Realtime, not polling)
4. Advisor clicks Accept → `accept_session` RPC → status becomes `active`
5. Client detects `active` status → connects (starts WebRTC for audio/video, enables chat input for chat)
6. 60-second ringing timeout auto-cancels if advisor doesn't respond

### WebRTC (LiveKit)
- `src/services/webrtc.ts` — `WebRTCService` class wraps LiveKit Room
- `src/hooks/useWebRTC.ts` — React hook exposing `state`, `remoteStream`, `toggleAudio()`, `toggleVideo()`, `isMuted`, `isCameraOff`
- Token flow: Client calls Supabase Edge Function `generate-livekit-token` → gets JWT + LiveKit URL → connects to room
- The Edge Function requires `session.status === 'active'` before issuing tokens

### Chat Messaging
- `src/hooks/useChatMessages.ts` — fetches existing messages, subscribes to Realtime INSERTs, exposes `sendMessage(content, senderId)`
- Messages stored in `messages` table, delivered via Supabase Realtime `postgres_changes`

### Advisor Static Data
- `src/data/advisors.ts` — 58 static advisor profiles for UI display
- Only **Psychic Luna** (static `id='1'`) has a `dbId: '45dd82c1-c457-480b-af66-4c07bd0a9d01'` mapping to a real Supabase profile
- To test with other advisors, you need to create profiles in the DB and add their `dbId` to the static data

## File Map

### Pages (Routes)
| Route | Component | Description |
|---|---|---|
| `/` | `Index.tsx` | Landing page |
| `/advisors` | `AdvisorsListing.tsx` | Browse all advisors |
| `/advisor/:id` | `AdvisorProfile.tsx` | Advisor detail page (start chat/call/video) |
| `/chat/:id` | `Chat.tsx` | Client chat session (uses static advisor `id`) |
| `/call/:id` | `VoiceCall.tsx` | Client audio call (uses static advisor `id`) |
| `/video/:id` | `VideoCall.tsx` | Client video call (uses static advisor `id`) |
| `/advisor-call` | `AdvisorCall.tsx` | Advisor incoming sessions list |
| `/advisor-call/:sessionId` | `AdvisorCall.tsx` | Advisor active session view |
| `/advisor-portal` | `AdvisorPortal.tsx` | Advisor dashboard |
| `/add-credit` | `AddCredit.tsx` | Add credits |
| `/settings` | `Settings.tsx` | User settings |
| `/profile` | `Profile.tsx` | User profile |
| `/activity` | `Activity.tsx` | User session history (includes AI chat sessions) |
| `/advisor-activity` | `AdvisorActivity.tsx` | Advisor session history + income |
| `/transactions` | `Transactions.tsx` | User credit transaction history |
| `/favorites` | `Favorites.tsx` | User's favorite advisors |
| `/admin` | `AdminPanel.tsx` | Admin panel (protected, role='admin') |
| `/advisor/:id/ai` | `TwinChat.tsx` | AI text chat with advisor's digital clone |
| `/advisor/:id/ai-voice` | `TwinVoiceCall.tsx` | AI voice call with advisor's clone |
| `/contact` | `ContactUs.tsx` | Contact support form |
| `/become-advisor` | `BecomeAdvisor.tsx` | Advisor recruitment page |
| `/how-we-verify` | `HowWeVerify.tsx` | Advisor verification process info |
| `/support` | `Support.tsx` | Help Center (knowledge base, FAQ, links to /contact) |

### Hooks
| Hook | File | Purpose |
|---|---|---|
| `useAuth` | `hooks/useAuth.tsx` | Auth context: login, signup, session, credits |
| `useWebRTC` | `hooks/useWebRTC.ts` | LiveKit WebRTC connection management |
| `useSessionRealtime` | `hooks/useSessionRealtime.ts` | Subscribe to session status changes |
| `useAdvisorIncomingCalls` | `hooks/useAdvisorIncomingCalls.ts` | Realtime incoming sessions for advisors |
| `useChatMessages` | `hooks/useChatMessages.ts` | Realtime chat messages |
| `useAiChat` | `hooks/useAiChat.ts` | AI chat messaging with optimistic updates + Realtime dedup |
| `useFavorites` | `hooks/useFavorites.ts` | User favorite advisors (toggle, optimistic state) |
| `useAdvisors` | `hooks/useAdvisors.ts` | Merged static + DB advisor data |
| `useSessionBilling` | `hooks/useSessionBilling.ts` | Shared per-minute billing (credits first, free minutes fallback) |

### Services
| File | Purpose |
|---|---|
| `services/webrtc.ts` | `WebRTCService` class (LiveKit Room wrapper) |
| `integrations/supabase/client.ts` | Supabase client singleton |

### Types
| File | Purpose |
|---|---|
| `types/session.ts` | Session, billing, quality types (derived from DB) |
| `types/webrtc.ts` | WebRTC state, stats, config types |
| `integrations/supabase/types.gen.ts` | Auto-generated Supabase types |

## Migrations

Applied in order:
1. `20260213000001_initial_auth_setup.sql` — profiles table, handle_new_user trigger
2. `20260214000000_add_rtc_session_fields.sql` — sessions, messages tables, RPC functions
3. `20260214100000_fix_handle_new_user_trigger.sql` — trigger fix
4. `20260216000000_add_accept_decline_realtime.sql` — accept/decline RPCs, Realtime publication

5. `20260223000000_add_advisor_details_realtime.sql` — Advisor details Realtime
6. `20260224000000_milestone3_4_admin_chat.sql` — Read receipts, GDPR delete, admin RLS, `advisor_applications`
7. `20260225000000_fix_admin_rls_recursion.sql` — Fix admin RLS infinite recursion
8. `20260225100000_stripe_integration.sql` — Transactions table, Stripe columns, updated RPCs
9. `20260225200000_fix_start_rtc_session_overload.sql` — Fix `start_rtc_session` function overload
10. `20260226000000_reviews_table.sql` — Reviews system
11. `20260227000000_billing_credits_first.sql` — Credits-first billing logic (server-side)
12. `20260302000000_advisor_schedule_connect.sql` — Advisor schedule, Stripe Connect, approve/reject RPCs
13. `20260302100000_disputes_table.sql` — Disputes table with RLS
14. `20260303000000_twin_ai_infrastructure.sql` — pgvector, knowledge_base_documents, Twin AI columns, AI session RPCs
15. `20260303100000_seed_dummy_advisors.sql` — 20 dummy advisor accounts
16. `20260304000000_advisor_contracts_and_stats.sql` — Advisor contracts, dashboard stats RPCs
17. `20260306000000_transaction_logging_and_favorites.sql` — **NEEDS TO BE APPLIED** — Transaction logging in `deduct_ai_credits` and `end_rtc_session`, `user_favorites` table with RLS
18. `20260307000000_sessions_created_at_and_rls_fix.sql` — **NEEDS TO BE APPLIED** — Add `created_at` column to sessions table, fix advisor_details RLS to allow public view of all advisors (enables offline status visibility + Realtime)

### To apply pending migration:
```bash
npx supabase db push
```

### To regenerate types after migration:
```bash
npx supabase gen types typescript --linked > src/integrations/supabase/types.gen.ts
```

## Current MVP Status

### Working:
- **Audio calls** (`/call/:id`) — ringing/accept flow, LiveKit WebRTC, per-minute billing, credit warnings
- **Video calls** (`/video/:id`) — same flow as audio + camera toggle, fullscreen video UI
- **Chat** (`/chat/:id`) — ringing/accept flow, real-time messaging via Supabase Realtime
- **AI Chat** (`/advisor/:id/ai`) — RAG-powered AI text chat with optimistic updates
- **AI Voice** (`/advisor/:id/ai-voice`) — Vapi-powered AI voice calls with cloned voice
- **Advisor dashboard** (`/advisor-call`) — real-time incoming sessions, accept/decline, chat/audio/video session handling
- **Auth** — Supabase auth (email + Google OAuth) with profile sync, credit balance tracking
- **Activity** (`/activity`) — User session history including AI chat sessions, sorted by created_at
- **Advisor Activity** (`/advisor-activity`) — Advisor session history with income calculations
- **Transactions** (`/transactions`) — User credit transaction history (purchases, deductions, refunds)
- **Favorites** (`/favorites`) — Favorite advisors with optimistic toggle on AdvisorCard
- **Admin Panel** (`/admin`) — Dashboard, user management, sessions, approvals, disputes, transactions
- **Help Center** (`/support`) — Knowledge base, FAQ, quick help topics (links to /contact for support)
- **Contact Us** (`/contact`) — Contact form and support channels
- **Credit Purchase** (`/add-credit`) — Stripe checkout for credit purchases

### Known Limitations:
- Only Psychic Luna has a real DB profile — other advisors will fail at `start_rtc_session` because their IDs aren't valid UUIDs in `profiles`
- LiveKit server credentials need to be configured (LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL as Supabase Edge Function secrets)
- Credit deduction is client-side estimated + server-side atomic at session end — no real-time server-side enforcement during session
- No payment integration yet (credits are manually set in DB)

### Not Yet Built:
- Dynamic horoscopes (n8n workflow, database-driven content)
- PWA optimization (manifest.json, service worker, offline support)
- Push notifications for incoming calls
- Mobile responsiveness improvements
- E2E test suite

## Development Commands

```bash
bun install          # Install dependencies
bun run dev          # Start Vite dev server
bun run build        # Production build (runs tsc first)
npx tsc --noEmit     # Type-check without emitting
```

## Important Notes

- **Auth callback:** `onAuthStateChange` in `useAuth.tsx` must NOT be async — Supabase deadlocks if the callback is async. Profile fetching is deferred via `setTimeout`. `isLoading` is set to `true` before each deferred profile fetch to prevent role-guarded pages from redirecting during re-auth.
- **Supabase Realtime:** Tables must be added to the `supabase_realtime` publication. The migration handles this for `sessions`, `messages`, and `user_favorites`.
- **Static vs DB IDs:** Client pages use static advisor `id` (from URL params) to find the advisor object, then use `advisor.dbId` for database operations. If `dbId` is missing, it falls back to the static `id` (which will fail for non-UUID IDs).
- **AI Chat optimistic updates:** `useAiChat.ts` adds user messages to local state immediately (optimistic). When the Realtime subscription delivers the real DB record, it deduplicates by matching `sender_id + content`.
- **Transaction logging:** Credit deductions from `deduct_ai_credits` and `end_rtc_session` RPCs automatically insert rows into the `transactions` table. Credit purchases are logged by the `stripe-webhook` edge function.
- **Online/Offline status:** Stored in `advisor_details.status` ('online'/'offline'/'busy'). The `useAdvisors` hook subscribes to Realtime changes. The RLS policy allows public SELECT on all advisor_details rows (including offline). Default is 'offline'.
- **AI Twin availability:** AI Twin (text chat + voice call) is available 24/7 regardless of advisor online/offline status. The `AdvisorCard` shows an "AI Twin" button even when advisor is offline. `AdvisorProfile` has Twin Call always enabled.
