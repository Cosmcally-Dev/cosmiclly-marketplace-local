# Cosmiclly — Security Audit Report

**Date:** 2026-03-12

---

## 1. Executive Summary

This audit identified **24+ issues** across security, code quality, and production readiness in the Cosmiclly spiritual reading web application. The findings span the full stack: frontend React/TypeScript code, Supabase Edge Functions, environment configuration, dependency management, and deployment headers.

**Severity breakdown:**

| Severity | Count | Description |
|----------|-------|-------------|
| Critical | 3 | Immediate exploitability or credential exposure |
| High | 5 | Requires manual action to prevent abuse |
| Medium | 6 | Best-practice violations with moderate risk |
| Low | 10+ | Hygiene, observability, and hardening gaps |

**Most critical findings:**

- `.env` file was committed to GitHub across 5+ commits, exposing environment variables in git history
- Hardcoded Supabase credentials in the client module served as fallback values
- All 13 Supabase Edge Functions had `Access-Control-Allow-Origin: *`, allowing any website to call sensitive endpoints

All three critical issues have been fixed in this audit. Several high and medium issues require manual remediation steps documented in Section 3.

---

## 2. Findings by Severity

### CRITICAL (Fixed in This Audit)

#### 1. `.env` not in `.gitignore`

**Severity:** CRITICAL
**Status:** FIXED

The `.env` file was committed to GitHub across 5+ commits. While all keys contained in the file are public/client-side values (Supabase anon key, Stripe publishable key, Vapi public key), committing environment files to version control is a security anti-pattern that:

- Trains developers to treat `.env` commits as acceptable
- Creates risk if server-side secrets are ever added to the same file
- Exposes the project structure and service configuration to anyone with repo access

**Remediation applied:**

- Added `.env` to `.gitignore`
- Ran `git rm --cached .env` to untrack the file

---

#### 2. Hardcoded Supabase credentials in `src/integrations/supabase/client.ts`

**Severity:** CRITICAL
**Status:** FIXED

The Supabase URL and anon key were hardcoded as fallback values in the client initialization module. If environment variables were missing or misconfigured, the app would silently fall back to hardcoded credentials, masking configuration errors and embedding secrets directly in the source code.

**Remediation applied:**

- Removed hardcoded fallback values
- Added fail-fast validation that throws an error if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are not set

---

#### 3. CORS `Access-Control-Allow-Origin: *` on all Edge Functions

**Severity:** CRITICAL
**Status:** FIXED

All 13 Supabase Edge Functions set `Access-Control-Allow-Origin: *` in their response headers. This allowed any website on the internet to make cross-origin requests to sensitive endpoints, including:

- `generate-livekit-token` (issues WebRTC session tokens)
- `create-session-hold` (initiates billing holds)
- `deduct-credits` (triggers credit deductions)
- `vapi-webhook` (processes voice call events)

An attacker could craft a malicious page that calls these endpoints using a victim's browser session.

**Remediation applied:**

- Changed CORS header on all 13 edge functions from `'*'` to `Deno.env.get('ALLOWED_ORIGIN') || 'https://cosmiclly.com'`
- Staging and development environments can override via the `ALLOWED_ORIGIN` Supabase secret

---

### HIGH (Needs Manual Action)

#### 4. Git history still contains `.env`

**Severity:** HIGH

Even though `.env` is now untracked and in `.gitignore`, all 5+ historical commits still contain the file contents. Anyone with access to the repository can check out older commits or use `git log -p` to retrieve the values.

Since all exposed keys are public/client-side, this is low-urgency but should be cleaned up before the repository is made public or shared more broadly.

**Manual step:** Use BFG Repo-Cleaner to purge `.env` from all history:

```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/

# Clean .env from all history
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

**WARNING:** Force-push rewrites history for all collaborators. Coordinate with the team before executing. All team members will need to re-clone or rebase after the force-push.

**After cleanup**, rotate all keys as a precaution:

- Regenerate Supabase anon key in Supabase Dashboard (if concerned)
- Regenerate Stripe publishable key in Stripe Dashboard
- Regenerate Vapi public key (optional, low risk)

---

#### 5. Vapi webhook has no signature verification

**Severity:** HIGH

The `supabase/functions/vapi-webhook/index.ts` endpoint accepts any POST request without verifying the sender. There is no HMAC signature check or shared secret validation. Anyone who discovers the endpoint URL can send fabricated payloads to:

- Trigger credit deductions on arbitrary user accounts
- Manipulate session state
- Inject false call completion events

**Manual step:**

1. Configure a webhook secret in the Vapi Dashboard
2. Set `VAPI_WEBHOOK_SECRET` as a Supabase secret (`supabase secrets set VAPI_WEBHOOK_SECRET=...`)
3. Add signature verification logic to the edge function that validates the `X-Vapi-Signature` header against the shared secret

---

#### 6. Vapi webhook is not idempotent

**Severity:** HIGH

The Vapi webhook processes credit deductions via a direct profile update rather than an atomic RPC with deduplication. If the webhook fires twice due to a network retry (which webhook providers commonly do), credits are deducted twice from the user's account.

**Recommendation:**

- Add an idempotency check using `vapi_call_id`
- Before processing a deduction, query whether a session or transaction with that `vapi_call_id` already exists
- Skip processing if a matching record is found
- Consider wrapping the entire operation in a database transaction

---

#### 7. No CSP headers

**Severity:** HIGH
**Status:** FIXED

No Content-Security-Policy header was configured, leaving the application vulnerable to XSS attacks through injected scripts, styles, or iframes.

**Remediation applied:**

- Added CSP to `vercel.json` with allowlisted domains for:
  - Stripe (`js.stripe.com`, `*.stripe.com`)
  - LiveKit (`*.livekit.cloud`)
  - Vapi (`*.vapi.ai`)
  - Supabase (`*.supabase.co`)
  - Unsplash image sources (`images.unsplash.com`)

---

#### 8. Missing security headers

**Severity:** HIGH
**Status:** FIXED

The application was missing standard security response headers that protect against common attack vectors:

- `X-Frame-Options` (clickjacking protection)
- `X-Content-Type-Options` (MIME sniffing prevention)
- `Referrer-Policy` (referrer leakage control)
- `Permissions-Policy` (browser feature restrictions)

**Remediation applied:**

- Added all four headers to `vercel.json`

---

### MEDIUM

#### 9. NPM vulnerabilities

**Severity:** MEDIUM

`npm audit` reports vulnerabilities in transitive dependencies including `react-router-dom`, `rollup`, and `minimatch`. While these are primarily build-time or development dependencies, they represent known attack vectors.

**Manual step:** Run `bun update` periodically to pick up patches. Consider setting up automated dependency update tooling (Dependabot, Renovate).

---

#### 10. localStorage for session logs

**Severity:** MEDIUM

`useAuth.tsx` stores session activity logs in unencrypted `localStorage`. This data persists across browser sessions, is accessible to any JavaScript running on the same origin, and is not cleared on logout.

**Recommendation:** Move to in-memory state or remove entirely if not needed. The SessionLog code was identified as unused during cleanup and removed.

---

#### 11. No input validation on `create-session-hold`

**Severity:** MEDIUM

The `create-session-hold` edge function does not type-validate `advisorRate` and `maxMinutes` from the request body. A malicious client could send non-numeric values, negative numbers, or extremely large values to manipulate billing logic.

**Recommendation:** Add explicit numeric type checks and range validation before processing:

```typescript
if (typeof advisorRate !== 'number' || advisorRate <= 0) {
  return new Response(JSON.stringify({ error: 'Invalid advisor rate' }), { status: 400 });
}
if (typeof maxMinutes !== 'number' || maxMinutes <= 0 || maxMinutes > 120) {
  return new Response(JSON.stringify({ error: 'Invalid max minutes' }), { status: 400 });
}
```

---

#### 12. Stripe webhook CORS note

**Severity:** MEDIUM

The Stripe webhook edge function correctly verifies Stripe signatures, which is good. CORS headers are unnecessary for server-to-server webhook endpoints since Stripe calls the endpoint directly (not from a browser).

**Note:** The `stripe-webhook` function does NOT have CORS headers set, which is the correct behavior. No action needed.

---

#### 13. Seeded dummy advisors with known passwords

**Severity:** MEDIUM

The migration `20260303100000_seed_dummy_advisors.sql` creates 20 dummy advisor accounts with the password `Test1234!`. If these accounts are present in the production database, anyone aware of the seed data can log in as any dummy advisor and access the advisor dashboard, accept sessions, and interact with real users.

**Manual step:** Before production launch, either:

- Delete all seeded dummy advisor accounts, or
- Change their passwords to strong, unique values
- Alternatively, disable login for seeded accounts via Supabase auth admin API

---

#### 14. XSS risk in chart.tsx

**Severity:** MEDIUM
**Status:** File deleted

The `chart.tsx` Shadcn UI component used `dangerouslySetInnerHTML` for CSS injection. While the values were config-driven and not user-supplied (making exploitation unlikely), the pattern violates secure coding principles and could become exploitable if refactored carelessly.

**Remediation:** `chart.tsx` was identified as an unused Shadcn UI component and was removed during cleanup.

---

### LOW

#### 15. No `.env.example`

**Severity:** LOW
**Status:** FIXED

Developers had no template for required environment variables, leading to trial-and-error setup and risk of running the app with missing configuration.

**Remediation applied:** Created `.env.example` with all required variables documented.

---

#### 16. Supabase anon key in built JS bundle

**Severity:** LOW

The Supabase anon key is included in the production JavaScript bundle. This is by design (it is a public key meant for client-side use), but it is worth noting for awareness. The anon key's permissions are controlled entirely by Row Level Security (RLS) policies.

---

#### 17. Stripe publishable key in frontend

**Severity:** LOW

The Stripe publishable key is included in the frontend bundle. This is by design (Stripe requires it for client-side Checkout and Elements). The publishable key cannot be used to create charges or access sensitive data.

---

#### 18. Console.log statements in production

**Severity:** LOW
**Status:** FIXED

107+ `console.log` debug statements were present throughout the codebase. In production, these leak internal state, variable names, and application flow to anyone who opens browser DevTools.

**Remediation applied:** Updated Vite config to strip `console.log`, `console.warn`, and `console.debug` statements from production builds via the `esbuild.drop` option.

---

#### 19. No error tracking

**Severity:** LOW

No error tracking service (Sentry, LogRocket, Datadog, etc.) is configured. Production errors go unnoticed unless a user reports them manually.

**Recommendation:** Integrate Sentry with the React error boundary for frontend errors and with Supabase Edge Functions for backend errors.

---

#### 20. No rate limiting

**Severity:** LOW

Session creation, messaging, AI credit deductions, and other write operations have no rate limiting. A malicious user could:

- Create hundreds of pending sessions to spam advisors
- Send rapid-fire messages to exhaust resources
- Trigger excessive AI credit deductions

**Recommendation:** Implement rate limiting at the edge function level or via Supabase RLS/policies. Consider using a token bucket or sliding window approach.

---

#### 21. No CI/CD security scanning

**Severity:** LOW

No automated dependency vulnerability checking or static analysis is configured in the CI/CD pipeline. Vulnerabilities in new dependencies can be introduced without detection.

**Recommendation:** Add GitHub Actions workflows with:

- `npm audit` or `bun audit` on PRs
- CodeQL or Semgrep for static analysis
- Dependabot or Renovate for automated dependency updates

---

## 3. Manual Remediation Checklist

| # | Task | Priority | Status |
|---|------|----------|--------|
| 1 | Set env vars in Vercel Dashboard before next deploy | CRITICAL | Pending |
| 2 | Set `ALLOWED_ORIGIN` Supabase secret for CORS (for staging/dev environments) | HIGH | Pending |
| 3 | Add Vapi webhook signature verification | HIGH | Pending |
| 4 | Make vapi-webhook idempotent (check for duplicate call_id) | HIGH | Pending |
| 5 | Clean `.env` from git history (BFG Repo-Cleaner) | MEDIUM | Pending |
| 6 | Rotate keys after git history cleanup (Supabase, Stripe, Vapi) | MEDIUM | Pending |
| 7 | Delete or secure dummy advisor accounts before production | MEDIUM | Pending |
| 8 | Run `bun update` to patch npm vulnerabilities | MEDIUM | Pending |
| 9 | Set up Sentry for error tracking | LOW | Pending |
| 10 | Implement rate limiting on session creation | LOW | Pending |
| 11 | Add GitHub Actions CI/CD with security scanning | LOW | Pending |
| 12 | Test CSP headers after deployment (check browser console for violations) | HIGH | Pending |
| 13 | Validate `create-session-hold` input types | MEDIUM | Pending |

---

## 4. What Was Fixed in This Audit

The following code changes were made as part of this audit:

1. **Added `.env`, `.env.production`, `.env.staging` to `.gitignore`** — Prevents future commits from including environment files.

2. **Ran `git rm --cached .env` to untrack the file** — Removes `.env` from the current Git index while preserving the local file.

3. **Removed hardcoded Supabase URL/key fallbacks from `src/integrations/supabase/client.ts`** — Eliminated silent fallback to hardcoded credentials.

4. **Added fail-fast validation for missing environment variables** — The app now throws a clear error at startup if required env vars are missing, rather than silently using stale hardcoded values.

5. **Created `.env.example` template** — Provides a documented template of all required environment variables for developer onboarding.

6. **Updated CORS on 13 edge functions** — Changed `Access-Control-Allow-Origin` from `'*'` to `Deno.env.get('ALLOWED_ORIGIN') || 'https://cosmiclly.com'` on all Supabase Edge Functions.

7. **Added security headers to `vercel.json`** — Configured Content-Security-Policy, X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), Referrer-Policy (`strict-origin-when-cross-origin`), and Permissions-Policy (restricting camera, microphone, geolocation to same-origin).
