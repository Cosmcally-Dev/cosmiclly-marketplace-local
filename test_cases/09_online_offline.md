# Test Case: Online/Offline Per Advisor

## Existing Implementation
- Toggle in `AdvisorPrivateProfile.tsx` updates `advisor_details.status` in DB
- Realtime subscription in `useAdvisors.ts` listens for `advisor_details` UPDATE events
- Status display in `AdvisorCard.tsx` shows ring color and badge

## Verification Steps

### 1. Advisor Toggle
- [ ] Log in as an advisor
- [ ] Navigate to advisor portal/dashboard
- [ ] Find the Online/Offline toggle
- [ ] Toggle to **Online** → verify toggle shows "Online" state
- [ ] Toggle to **Offline** → verify toggle shows "Offline" state

### 2. Real-Time Card Update
- [ ] Open a second browser tab (or incognito window) as a client
- [ ] Navigate to `/advisors` listing page
- [ ] Find the advisor's card
- [ ] In the advisor tab: toggle status to **Online**
- [ ] In the client tab: verify the card updates in real-time:
  - Green ring around avatar
  - "Online" status badge
- [ ] Toggle to **Offline** → verify card updates:
  - Gray/no ring around avatar
  - "Offline" status badge

### 3. Status Persistence
- [ ] Set advisor to "Online"
- [ ] Refresh the page
- [ ] Verify advisor is still shown as "Online" (status persisted in DB)
- [ ] Set to "Offline" → refresh → verify still "Offline"

### 4. Multiple Advisors
- [ ] If possible, test with 2+ advisor accounts
- [ ] Verify each advisor's status is independent
- [ ] Toggling one advisor's status should not affect others

### 5. Edge Case — Browser Close
- [ ] Note: Currently, closing the browser does NOT auto-set advisor to offline
- [ ] This is a known limitation — advisor must manually toggle offline before leaving
