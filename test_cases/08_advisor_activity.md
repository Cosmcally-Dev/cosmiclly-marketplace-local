# Test Case: Advisor Activity Page

## Changes Made
- New page: `AdvisorActivity.tsx` at `/advisor-activity`
- Added lazy import and route in `App.tsx`
- Fetches sessions where `advisor_id = current user`
- Calculates per-session income using contract terms from `advisor_details`

## Prerequisites
- Migration applied (for contract columns)
- User must be logged in as an advisor

## Verification Steps

### 1. Page Access
- [ ] Log in as an advisor
- [ ] Navigate to `/advisor-activity`
- [ ] Page should load without errors

### 2. Summary Cards
- [ ] Verify 3 summary cards are displayed:
  - **Total Sessions** — count of all filtered sessions (completed + cancelled)
  - **Total Income** — sum of advisor income for completed sessions
  - **Completed Readings** — count of completed sessions only

### 3. Session List
- [ ] Verify sessions are listed with:
  - Client name (or "Unknown Client")
  - Session type badge (chat / audio / video)
  - Date and time
  - Duration (N/A for cancelled)
  - Income amount (N/A for cancelled, calculated for completed)
- [ ] Cancelled sessions should show red "Cancelled" badge

### 4. Income Calculation
- [ ] For a completed session with cost_total = $10:
  - With 50/50 split and 5% admin fee: income = ($10 - $0.50) * 50% = $4.75
- [ ] Verify the displayed income matches the expected calculation

### 5. Filters
- [ ] **Type filter**: Select "Chat" → only chat sessions shown
- [ ] **Type filter**: Select "Voice Call" → only audio sessions shown
- [ ] **Type filter**: Select "All Types" → all sessions shown
- [ ] **Status filter**: Select "Completed" → only completed sessions shown
- [ ] **Status filter**: Select "Cancelled" → only cancelled sessions shown
- [ ] Verify the "Showing X sessions" counter updates with filters
- [ ] Verify summary cards update based on filtered data

### 6. Empty State
- [ ] For an advisor with no sessions: should show "No sessions found" message
- [ ] With filters that match nothing: should show "No sessions match your current filters"

### 7. Navigation
- [ ] Click "Back" button → should navigate to previous page
