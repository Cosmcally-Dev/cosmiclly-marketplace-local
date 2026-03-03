# Test Case: Brevo Email Integration

## Changes Made
- New edge function: `supabase/functions/send-email/index.ts` (Brevo API integration)
- New service: `src/services/email.ts` (frontend helper)
- Email triggers added to:
  - `useAuth.tsx` — welcome email after client signup
  - `useAdminApplications.ts` — approved/rejected emails
  - `Chat.tsx`, `VoiceCall.tsx`, `VideoCall.tsx` — session receipt emails
  - `Chat.tsx`, `VoiceCall.tsx`, `VideoCall.tsx` — low credit warning emails

## Prerequisites
- `BREVO_API_KEY` must be set as Supabase secret
- 6 Brevo email templates must be created (IDs 1-6)
- `send-email` edge function must be deployed

## Email Types

| # | Type | Template ID | Trigger |
|---|------|:-----------:|---------|
| 1 | `welcome_client` | 1 | After client signup |
| 2 | `welcome_advisor` | 2 | After advisor application approved |
| 3 | `session_receipt` | 3 | After any session ends successfully |
| 4 | `low_credit_warning` | 4 | When credits drop to ~2 minutes remaining |
| 5 | `application_approved` | 5 | After admin approves application |
| 6 | `application_rejected` | 6 | After admin rejects application |

## Verification Steps

### 1. Welcome Email (Client)
- [ ] Register a new client account
- [ ] Check the registered email inbox
- [ ] Verify welcome email received with correct name
- [ ] If email not received: check Supabase Edge Function logs for errors

### 2. Application Approved Email
- [ ] As admin, approve a pending advisor application
- [ ] Check the applicant's email inbox
- [ ] Verify approval notification email received

### 3. Application Rejected Email
- [ ] As admin, reject a pending advisor application
- [ ] Check the applicant's email inbox
- [ ] Verify rejection notification email received

### 4. Session Receipt Email
- [ ] Complete a chat/call/video session as a client
- [ ] Check client's email inbox
- [ ] Verify receipt email with: advisor name, session type, duration, total cost

### 5. Low Credit Warning Email
- [ ] Start a session with low credit balance (enough for ~3 minutes)
- [ ] Wait until credits drop to ~2 minutes remaining
- [ ] Check client's email inbox
- [ ] Verify low credit warning email received

### 6. Error Handling
- [ ] Emails are fire-and-forget — failures should NOT break the main flow
- [ ] Verify no errors in console when email sending fails (e.g., if BREVO_API_KEY not set)
- [ ] Verify signup still works even if email fails
- [ ] Verify session end still works even if receipt email fails

### 7. Edge Function Logs
- [ ] Check Supabase Dashboard → Edge Functions → send-email → Logs
- [ ] Verify successful sends are logged
- [ ] Verify failures are logged with error details

### 8. Password Reset (Brevo SMTP)
- [ ] Configure Supabase Auth SMTP to use Brevo relay
- [ ] Trigger password reset from Settings page
- [ ] Verify password reset email is received via Brevo
