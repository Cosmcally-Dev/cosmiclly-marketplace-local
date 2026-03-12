# Spiritual Reading Website - Project Context

> **For AI assistants (Claude, etc.) continuing development on this project.**

## Initialization

When initializing this file, also review and update the following docs as needed:
- `docs/TECHNICAL_GAP_ANALYSIS.md` — current project status, completion tracking
- `docs/ABOUT_US.md` — About Cosmiclly content (rendered at `/about`)
- `docs/COOKIE_POLICY.md` — Cookie Policy content (rendered at `/cookies`)
- `docs/PRIVACY_POLICY.md` — Privacy Policy content (rendered at `/privacy`)
- `docs/TERMS_OF_SERVICE.md` — Terms of Service content (rendered at `/terms`)

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

### `horoscopes`
- Dynamic horoscope content populated by n8n workflows
- Fields: `id`, `sign` (lowercase), `period` (daily/weekly/monthly/yearly), `date`, `content` (JSONB: daily/love/career/money/health), `lucky` (JSONB: numbers/color/time), `source`, `created_at`
- UNIQUE constraint on `(sign, period, date)`
- RLS: public read, service-role-only write (n8n / edge functions)
- Frontend reads via `useHoroscope` hook with static fallback from `src/data/horoscopeContent.ts`

## RPC Functions (Server-Side)

| Function | Purpose |
|---|---|
| `start_rtc_session` | Creates session with `status='pending'`, `started_at=NULL` |
| `accept_session` | Advisor accepts → sets `status='active'`, `started_at=NOW()` |
| `decline_session` | Either party cancels a pending session → `status='cancelled'` |
| `end_rtc_session` | Ends active session, calculates billing, deducts credits atomically, logs transaction |
| `deduct_ai_credits` | Deducts credits for AI chat messages, logs transaction |
| `delete_my_account` | Full GDPR anonymization: messages, knowledge docs, favorites, reviews, disputes, profile |
| `is_username_available` | Check username uniqueness (callable by anon for signup validation) |

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

### Advisor Data (Database-Driven)
- Advisors are loaded from Supabase `advisor_details` + `profiles` tables via `useAdvisors()` hook
- `src/data/advisors.ts` — only exports the `Advisor` TypeScript interface (static array removed)
- All components use the `useAdvisors()` hook to get advisor data; no static data fallback
- URLs use database UUIDs (e.g., `/advisor/45dd82c1-...`) instead of sequential IDs
- Advisor status (`online`/`offline`/`busy`) is updated via Realtime subscriptions
- **Busy status** is set automatically: `accept_session` RPC sets advisor to 'busy', `end_rtc_session` reverts to 'online' (if no other active sessions)

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
| `/about` | `AboutUs.tsx` | About Cosmiclly (rendered from `docs/ABOUT_US.md`) |
| `/privacy` | `PrivacyPolicy.tsx` | Privacy Policy (rendered from `docs/PRIVACY_POLICY.md`) |
| `/terms` | `TermsOfService.tsx` | Terms of Service (rendered from `docs/TERMS_OF_SERVICE.md`) |
| `/cookies` | `CookiePolicy.tsx` | Cookie Policy (rendered from `docs/COOKIE_POLICY.md`) |

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
| `useAdvisors` | `hooks/useAdvisors.ts` | DB advisor data + batch public stats (readings, rating, reviews) |
| `useSessionBilling` | `hooks/useSessionBilling.ts` | Shared per-minute billing (credits first, free minutes fallback) |
| `useHoroscope` | `hooks/useHoroscope.ts` | Dynamic horoscope data (DB via react-query, static fallback) |

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

### UI Components (New)
| Component | File | Purpose |
|---|---|---|
| `Alert` | `components/ui/alert.tsx` | CVA alert with 5 variants (default/info/success/warning/destructive) |
| `AvatarGroup` | `components/ui/avatar-group.tsx` | Overlapping avatars with "+N" overflow |
| `Breadcrumb` | `components/ui/breadcrumb.tsx` | Semantic breadcrumb nav (`<nav>` + `<ol>`) |
| `ButtonGroup` | `components/ui/button-group.tsx` | Flex wrapper rounding first/last child |
| `ConfirmDialog` | `components/ui/confirm-dialog.tsx` | Standardized confirm/cancel dialog |
| `EmptyState` | `components/ui/empty-state.tsx` | Icon + title + description + action |
| `NotificationBadge` | `components/ui/notification-badge.tsx` | Red circle count badge (caps at 99+) |
| `PageLoader` | `components/ui/page-loader.tsx` | Full-page centered spinner (Suspense fallback) |
| `Pagination` | `components/ui/pagination.tsx` | Page numbers with prev/next arrows |
| `PasswordInput` | `components/ui/password-input.tsx` | Input with Eye/EyeOff password toggle |
| `PriceDisplay` | `components/ui/price-display.tsx` | Original/discounted price display |
| `Progress` | `components/ui/progress.tsx` | Radix progress bar |
| `RadioGroup` | `components/ui/radio-group.tsx` | Radix radio group |
| `SearchInput` | `components/ui/search-input.tsx` | Search input with clear button |
| `Spinner` | `components/ui/spinner.tsx` | Loading spinner (sm/md/lg) with aria |
| `StarRating` | `components/ui/star-rating.tsx` | Filled/half/empty star display |
| `StatCard` | `components/ui/stat-card.tsx` | Dashboard stat card with trend |
| `StepIndicator` | `components/ui/step-indicator.tsx` | Horizontal step dots with lines |
| `Skeletons` | `components/skeletons/index.tsx` | 5 skeleton variants: ProfileHeader, SessionPage, ActivityRow, TransactionRow, StatCard |
| `RouteAnnouncer` | `components/RouteAnnouncer.tsx` | Screen reader route change announcements |
| `LegalPage` | `components/layout/LegalPage.tsx` | Reusable markdown page wrapper (react-markdown + remark-gfm) |

### Documentation
| File | Purpose |
|---|---|
| `docs/CURRENT_UI_KIT.md` | Complete reference of current UI components, tokens, and patterns |
| `docs/UI_KIT_SUGGESTIONS.md` | Suggested UI Kit improvements and expansions (Markdown source) |
| `docs/UI_KIT_SUGGESTIONS.docx` | Same suggestions in Word format (generated by `scripts/generate-ui-kit-docx.cjs`) |
| `docs/UI_CHANGES.md` | Changelog of all UI Kit improvements (8 phases) |

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
10. `20260225250000_add_schedule_to_advisor_details.sql` — Add `schedule` jsonb column to advisor_details
11. `20260226000000_reviews_table.sql` — Reviews system
12. `20260227000000_billing_credits_first.sql` — Credits-first billing logic (server-side)
13. `20260302000000_advisor_schedule_connect.sql` — Advisor schedule, Stripe Connect, approve/reject RPCs
14. `20260302100000_disputes_table.sql` — Disputes table with RLS
15. `20260303000000_twin_ai_infrastructure.sql` — pgvector, knowledge_base_documents, Twin AI columns, AI session RPCs
16. `20260303100000_seed_dummy_advisors.sql` — 20 dummy advisor accounts
17. `20260304000000_advisor_contracts_and_stats.sql` — Advisor contracts, dashboard stats RPCs
18. `20260305000000_fix_remaining_rls_and_ai_credits.sql` — Fix recursive RLS policies, add `deduct_ai_credits` RPC
19. `20260306000000_transaction_logging_and_favorites.sql` — Transaction logging in `deduct_ai_credits` and `end_rtc_session`, `user_favorites` table with RLS
20. `20260307000000_sessions_created_at_and_rls_fix.sql` — Add `created_at` column to sessions table, fix advisor_details RLS to allow public view of all advisors (enables offline status visibility + Realtime)
21. `20260308000000_fix_rls_and_diagnostics.sql` — Fix RLS policies on `disputes` and `knowledge_base_documents`, fix NULL string columns in `auth.users` for seeded accounts (GoTrue crash fix)
22. `20260309000000_auto_busy_status.sql` — Auto-set advisor status to 'busy' in `accept_session`, revert to 'online' in `end_rtc_session` (if no other active sessions)
23. `20260310000000_fix_seeded_advisor_status.sql` — Fix seeded dummy advisors status from 'online' to 'offline'
24. `20260311000000_horoscopes_table.sql` — Dynamic horoscopes table with RLS (public read, service-role write)
25. `20260312000000_public_advisor_profiles_rls.sql` — Add anon SELECT policy on `profiles` scoped to advisor profiles (fixes avatars/names not loading when logged out)
26. `20260313000000_advisor_public_stats_rpc.sql` — Batch `get_all_advisor_public_stats()` RPC (readings, rating, review counts per advisor), anon SELECT on reviews
27. `20260314000000_fix_handle_new_user_username_conflict.sql` — `is_username_available` RPC, fix handle_new_user trigger for username unique_violation
28. `20260315000000_full_gdpr_anonymization.sql` — Full GDPR `delete_my_account` RPC (messages, knowledge docs, favorites, reviews, disputes, profile), fix `reviewed_by` FK constraint

All 28 migrations are applied. To regenerate types after any new migration:
```bash
npx supabase db push                    # Apply new migrations
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
- **Legal Pages** (`/about`, `/privacy`, `/terms`, `/cookies`) — Rendered from markdown docs via react-markdown + LegalPage wrapper
- **Cookie Consent** — Global banner on all pages, stores preference in localStorage, links to `/cookies`

### Known Limitations:
- Advisors must exist in `advisor_details` + `profiles` tables to appear on the site
- Credit deduction is client-side estimated + server-side atomic at session end — no real-time server-side enforcement during session
- **Stripe Connect** must be enabled on the Stripe account before advisors can set up payouts. Go to Stripe Dashboard > Settings > Connect to activate. Without it, `create-connect-account` edge function returns "signed up for Connect" error.

### Partially Built:
- **Dynamic horoscopes** — DB table + `useHoroscope` react-query hook + frontend pages updated with static fallback. **Pending:** n8n workflow to populate DB.

### Not Yet Built:
- PWA optimization (manifest.json, service worker, offline support)
- Push notifications for incoming calls
- E2E test suite
- Sentry error tracking
- GitHub Actions CI/CD pipeline

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
- **Advisor IDs:** All advisor IDs are Supabase UUIDs. URLs use UUIDs directly (e.g., `/advisor/45dd82c1-...`). The `Advisor.id` and `Advisor.dbId` are the same value for DB-loaded advisors.
- **AI Chat optimistic updates:** `useAiChat.ts` adds user messages to local state immediately (optimistic). When the Realtime subscription delivers the real DB record, it deduplicates by matching `sender_id + content`.
- **Transaction logging:** Credit deductions from `deduct_ai_credits` and `end_rtc_session` RPCs automatically insert rows into the `transactions` table. Credit purchases are logged by the `stripe-webhook` edge function.
- **Online/Offline status:** Stored in `advisor_details.status` ('online'/'offline'/'busy'). The `useAdvisors` hook subscribes to Realtime changes. The RLS policy allows public SELECT on all advisor_details rows (including offline). Default is 'offline'.
- **AI Twin availability:** AI Twin (text chat + voice call) is available 24/7 regardless of advisor online/offline status. The `AdvisorCard` shows an "AI Twin" button even when advisor is offline. `AdvisorProfile` has Twin Call always enabled.
- **`@tanstack/react-query`:** Installed and configured (`QueryClientProvider` in `App.tsx`). First usage is `useHoroscope` hook. Uses `placeholderData` for instant static content while DB fetches, `maybeSingle()` for graceful empty-table handling, and `staleTime: 1h` to avoid excessive refetches.
- **Seeding auth.users:** When inserting directly into `auth.users`, all string columns that GoTrue scans (e.g., `email_change`, `phone`, `phone_change`, `email_change_token_new`, `email_change_token_current`, `phone_change_token`, `reauthentication_token`) must be set to `''` not `NULL`. GoTrue's Go code uses `string` (not `*string`), so NULL causes `"Scan error... converting NULL to string is unsupported"`.
- **Role-guarded pages:** Any page that renders different views based on `user?.isAdvisor` or `user?.isAdmin` must check `isLoading` from `useAuth()` first and show a spinner. Without this, the page briefly renders the wrong view (or blank) during auth state resolution. See `Profile.tsx` and `AdminPanel.tsx` for the correct pattern.
- **Button variants:** `<Button>` supports 11 variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `hero` (purple gradient CTA), `gold` (warm accent), `mystical` (purple-bordered), `success` (emerald), `warning` (amber). Sizes: `default`, `sm`, `lg`, `xl`, `icon`. All support `loading?: boolean` — when true, prepends a spinner, disables the button, adds `opacity-80`. For buttons with icons, hide the icon when loading: `{!isLoading && <Icon />}`.
- **Toast variants:** `toast()` supports 5 variants: `default`, `destructive`, `success`, `warning`, `info`. Toaster auto-renders contextual icons (CheckCircle, XCircle, AlertTriangle, Info) per variant. Use `toast({ variant: 'success', title: '...' })` instead of plain `toast({ title: '...' })`.
- **Breadcrumb component:** Use `<Breadcrumb>` from `components/ui/breadcrumb.tsx` instead of inline `<nav>` breadcrumbs. Provides semantic `<nav aria-label>` + `<ol>` structure. See `AdvisorsListing.tsx` for usage example.
- **Spinner component:** Use `<Spinner>` from `components/ui/spinner.tsx` (sizes: sm/md/lg) instead of raw `<Loader2 className="animate-spin">`. Includes `role="status"` and `aria-label="Loading"` for accessibility.
- **Accessibility:** Skip-to-content link and `RouteAnnouncer` are in `App.tsx`. All icon-only buttons must have `aria-label`. Use dynamic labels for toggle buttons (e.g., `aria-label={isMuted ? 'Unmute' : 'Mute'}`).
- **MobileMenu auth props:** `MobileMenu` accepts `onAuth` and `isAuthenticated` props. Always pass these from Header so auth buttons work on mobile and auth-required menu items are conditionally shown. See `Header.tsx` for the pattern.
- **Mobile touch targets:** All interactive elements must be at least 44x44px on mobile. Use `min-w-11 min-h-11` for icon-only buttons. See `docs/CURRENT_UI_KIT.md` Section 8 for full mobile guidelines.
- **GDPR account deletion:** The `delete-account` edge function + `delete_my_account` RPC perform full anonymization: messages→[deleted], delete knowledge_base_documents/favorites/reviews, anonymize disputes, anonymize profile (name→"Deleted User", email→deleted-{id}@deleted.local), fix orphaned FKs, delete auth.users. The profile row is **kept but anonymized** (not deleted) to preserve session/transaction FK integrity.
- **Legal/content pages:** The 4 legal pages (`/about`, `/privacy`, `/terms`, `/cookies`) are rendered from markdown files in `docs/` using the `LegalPage` wrapper component + `react-markdown` + `remark-gfm`. To update legal content, edit the corresponding markdown file in `docs/` — the page will reflect changes on next build. The first `# Title` heading is stripped from each markdown file since `LegalPage` renders its own hero title.
- **CookieConsent banner:** Mounted globally in `App.tsx` (not page-specific). Shows on all pages after 1.5s delay if no consent stored in localStorage (`cookie-consent`). "Learn more" links to `/cookies`. Buttons: Decline (stores `declined`) and Accept All (stores `accepted`). Essential cookies (auth tokens) work regardless of choice.
- **Username uniqueness:** `profiles.username` has a UNIQUE constraint. The `is_username_available` RPC (callable by anon) checks availability before signup. The `handle_new_user` trigger retries with `username=NULL` on unique_violation to prevent orphaned auth users without profiles.

## Frontend

DISTILLED_AESTHETICS_PROMPT = """
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>
"""