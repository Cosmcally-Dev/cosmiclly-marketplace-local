# Test Case: Remove Facebook OAuth

## Changes Made
- Removed `signInWithFacebook` function from `useAuth.tsx`
- Removed Facebook login button and `handleFacebookLogin` from `AuthModal.tsx`
- Changed social login layout from 2-column grid to single full-width Google button

## Verification Steps

### 1. Auth Modal — Sign In Tab
- [ ] Open the website and click "Sign In"
- [ ] Verify only **Google** button is shown (no Facebook button)
- [ ] Verify Google button is full-width (not half-width)
- [ ] Click Google button → should redirect to Google OAuth flow
- [ ] Complete Google sign-in → should return authenticated

### 2. Auth Modal — Sign Up Tab
- [ ] Switch to "Sign Up" tab
- [ ] Verify only **Google** button is shown (no Facebook button)
- [ ] Verify Google button is full-width

### 3. No Console Errors
- [ ] Open browser DevTools → Console
- [ ] Open and close the auth modal multiple times
- [ ] Verify no errors related to Facebook or missing functions

### 4. TypeScript Compilation
- [ ] Run `npx tsc --noEmit` — should pass with no errors
