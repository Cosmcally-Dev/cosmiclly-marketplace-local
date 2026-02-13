# Migrate Authentication to Supabase

## Goal

Replace n8n/Airtable authentication flow with native Supabase authentication, ensuring user profiles are automatically created in the database with proper credit persistence and role-based access control.

## Inputs

- `VITE_SUPABASE_URL` (from .env) - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` (from .env) - Supabase anon/public key
- `SUPABASE_URL` (from .env) - Python scripts URL
- `SUPABASE_KEY` (from .env) - Python scripts key
- User signup data: email, password, firstName, lastName, username, dateOfBirth, timeOfBirth
- User login data: email, password
- Database migration files in `supabase/migrations/`

## Tools/Scripts

- `supabase/migrations/20260213000001_initial_auth_setup.sql` - Creates tables, triggers, RLS policies, and helper functions
- `npx supabase db push` - Applies migrations to remote database
- `execution/verify_auth_migration.py` - Verifies migration was successful
- `src/hooks/useAuth.tsx` - React authentication hook (modified)
- `src/components/modals/AdvisorApplicationModal.tsx` - Advisor application form (modified)

## Process

### 1. Database Setup

1. Link Supabase project:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-id> --password stdin
   ```

2. Apply migration:
   ```bash
   npx supabase db push
   ```

3. Verify tables created:
   - `profiles` - User profiles with credits, role, and metadata
   - `advisor_details` - Extended advisor information
   - `sessions` - Chat/audio/video session records
   - `messages` - Session messages
   - `advisor_applications` - Advisor onboarding applications

4. Verify trigger created:
   - `on_auth_user_created` - Auto-creates profile when user signs up

5. Verify RLS policies enabled on all tables

### 2. Update Authentication Hook (useAuth.tsx)

**Removed:**
- n8n webhook calls for login/signup
- localStorage auth fallback (`optinet_user`)
- localStorage credits storage

**Added:**
- `supabase.auth.signInWithPassword()` for login
- `supabase.auth.signUp()` for signup with user_metadata
- Database queries to fetch profile and credits
- RPC calls to `add_credits()` function

**Key Changes:**
- Lines 73-139: Removed localStorage fallback, now only uses Supabase session
- Lines 141-184: Replaced n8n login with Supabase auth
- Lines 186-219: Replaced n8n signup with Supabase auth
- Lines 236-240: Replaced localStorage credits with database RPC

### 3. Update Advisor Application Modal

**Removed:**
- n8n webhook call for application submission

**Added:**
- Direct Supabase insert into `advisor_applications` table
- Status automatically set to 'pending'
- Timestamp automatically set to current time

### 4. Test Authentication Flows

Run verification script:
```bash
python execution/verify_auth_migration.py
```

Manual testing:
1. Signup with new user
2. Verify profile created in database
3. Login with credentials
4. Verify credits fetched from database
5. Add credits via `/add-credit` page
6. Verify credits persisted in database
7. Logout and login again
8. Verify credits still present

## Outputs

- **auth.users table** - Supabase user records with user_metadata
- **profiles table** - User profiles with credits, role, username
- **advisor_applications table** - Advisor application submissions
- **Session persistence** - JWT tokens stored in browser
- **Credits persistence** - Credits stored in database (no longer localStorage)

## Edge Cases

### 1. Email Already Exists

**Scenario:** User tries to sign up with email already in database

**Handling:**
- Supabase returns error: "User already registered"
- Frontend displays: "This email is already registered. Please login."
- User redirected to login page

### 2. Trigger Fails to Create Profile

**Scenario:** User signs up successfully but trigger fails

**Symptoms:**
- User exists in `auth.users` but not in `profiles`
- Login fails with "Profile not found"

**Mitigation:**
- Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created'`
- Check trigger function logs in Supabase dashboard
- Manual profile creation:
  ```sql
  INSERT INTO profiles (id, email, full_name, role, credits)
  VALUES ('<user_id>', '<email>', '<name>', 'client', 0);
  ```

### 3. Weak Password

**Scenario:** User submits password not meeting requirements

**Handling:**
- Supabase enforces minimum 6 characters by default
- Error returned: "Password should be at least 6 characters"
- Frontend displays validation error

### 4. Rate Limiting

**Scenario:** Too many signup/login attempts from same IP

**Handling:**
- Supabase rate limits authentication requests
- Error returned: "Too many requests"
- Frontend displays: "Please wait a few minutes and try again"

### 5. Orphaned Auth Records

**Scenario:** User in auth.users but no profile due to trigger failure

**Detection:**
```sql
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

**Resolution:**
```sql
-- Create missing profiles
INSERT INTO profiles (id, email, full_name, role, credits)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'firstName' || ' ' || u.raw_user_meta_data->>'lastName', u.email), 'client', 0
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

### 6. Credits Not Syncing

**Scenario:** User adds credits but balance not updating

**Debugging:**
1. Check RPC function exists: `SELECT * FROM pg_proc WHERE proname = 'add_credits'`
2. Test RPC directly:
   ```sql
   SELECT add_credits('<user_id>'::uuid, 100);
   ```
3. Check RLS policies allow credit updates
4. Verify user is authenticated (auth.uid() returns user ID)

**Resolution:**
- Ensure `GRANT EXECUTE ON FUNCTION add_credits TO authenticated` exists
- Check browser console for RPC errors
- Verify network requests in DevTools

### 7. Session Not Persisting Across Refreshes

**Scenario:** User logs in but gets logged out on page refresh

**Debugging:**
1. Check Supabase client config has `persistSession: true`
2. Verify localStorage contains `supabase.auth.token`
3. Check browser console for session errors

**Resolution:**
- Update `src/integrations/supabase/client.ts` with `persistSession: true` in createClient options
- Clear browser cache and try again

## Success Criteria

1. ✅ No n8n webhook URLs in codebase
   ```bash
   grep -r "n8n.cloud" src/
   # Should return: no matches
   ```

2. ✅ Migration applied successfully
   ```bash
   npx supabase db push --dry-run
   # Should show: no pending migrations
   ```

3. ✅ Trigger creates profile on signup
   - Signup new user → Check `profiles` table → Profile exists with matching ID

4. ✅ Login fetches profile from database
   - Login → Check browser console → Profile query returns data

5. ✅ Credits stored in database, not localStorage
   - Add credits → Refresh page → Credits still present
   - Check Application → Local Storage → No "credits" key

6. ✅ RLS policies protect data
   - Login as User A → Try updating User B's profile → Error: "permission denied"

7. ✅ Session persists across refreshes
   - Login → Refresh page (F5) → Still logged in

8. ✅ Advisor applications save to database
   - Submit application → Check `advisor_applications` table → Record exists

9. ✅ Logout clears session
   - Logout → Refresh page → Redirected to home, not authenticated

## Learnings

### What Worked Well

- **Database triggers** - Auto-creating profiles on signup eliminated need for separate API call
- **RLS policies** - Protected sensitive data without application-level checks
- **Supabase CLI** - Migration workflow was smooth and version-controlled
- **Type generation** - Auto-generated types caught errors at compile time

### Challenges Encountered

- **Async addCredits** - Had to update interface to `Promise<void>` since RPC calls are async
- **Profile fetching** - Had to fetch profile after login to get credits and role
- **localStorage cleanup** - Removed old localStorage keys to prevent conflicts

### Improvements for Next Time

- Add retry logic for RPC calls (network failures)
- Implement optimistic UI updates for credits
- Add loading states during profile fetching
- Create database backup before migrations
- Add monitoring for trigger failures

### Future Enhancements

1. **Email verification** - Require email confirmation before allowing login
2. **Password reset flow** - Add forgot password functionality
3. **Social auth** - Add Google/Facebook OAuth
4. **Credit transactions table** - Audit log for all credit changes
5. **Rate limiting** - Implement application-level rate limiting for sensitive operations
6. **Session analytics** - Track login patterns and session duration

---

**Related Directives:**
- None yet (this is the first directive)

**Related Execution Scripts:**
- `execution/verify_auth_migration.py` - Database verification

**Date Created:** 2026-02-13
**Last Updated:** 2026-02-13
**Status:** Completed
