# Test Case: Fix Advisor Cards Showing "Advisor"

## Changes Made
- Updated `mapDBToAdvisor` in `useAdvisors.ts` to use `row.title` as fallback before "Advisor"
- Name resolution order: `profiles.full_name` → `advisor_details.title` → "Advisor"

## Verification Steps

### 1. Advisors Listing Page
- [ ] Navigate to `/advisors`
- [ ] Verify all advisor cards show **real names** (not just "Advisor")
- [ ] Check at least 5 different advisor cards for correct names
- [ ] Verify names match what's in the database (profiles.full_name or advisor_details.title)

### 2. Advisor Profile Page
- [ ] Click on an advisor card
- [ ] Verify the advisor's name on their profile page matches the card

### 3. Landing Page Featured Advisors
- [ ] Navigate to `/` (home page)
- [ ] If featured advisors are shown, verify they display real names

### 4. Edge Cases
- [ ] If any advisor has no `full_name` in profiles AND no `title` in advisor_details, it should show "Advisor" as last resort
- [ ] Verify no advisors show "undefined" or "null" as their name
