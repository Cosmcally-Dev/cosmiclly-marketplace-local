# Test Case: Dynamic Advisor Dashboard Stats

## Changes Made
- New hook: `useAdvisorStats.ts` calling 3 RPCs (`get_advisor_dashboard_stats`, `get_advisor_chart_data`, `get_advisor_recent_reviews`)
- Updated `AdvisorPrivateProfile.tsx` — replaced mock data with dynamic stats, charts, and reviews
- Added "View My Activity" button linking to `/advisor-activity`

## Prerequisites
- Migration `20260304000000_advisor_contracts_and_stats.sql` must be applied
- User must be logged in as an advisor

## Verification Steps

### 1. Dashboard Stats Cards
- [ ] Log in as an advisor
- [ ] Navigate to `/advisor-portal` or the advisor dashboard
- [ ] Verify 4 stat cards display:
  - **Monthly Earnings** — shows earnings for current month (or $0.00 for new advisors)
  - **Pending Balance** — shows total unpaid earnings
  - **Completed Readings** — shows total completed session count
  - **Average Rating** — shows average from reviews (or 0.0 if no reviews)

### 2. Stats Accuracy
- [ ] For an advisor with completed sessions:
  - Verify earnings calculation: `(session.cost_total - admin_fee%) * advisor_share%`
  - Verify reading count matches actual completed sessions in DB
- [ ] For a new advisor with no sessions:
  - All stats should show $0.00 / 0 / 0.0

### 3. Charts
- [ ] **Weekly Earnings chart** (line chart):
  - Shows last 7 days of earnings
  - Empty state message if no data: "No earnings data yet"
- [ ] **Monthly Readings chart** (bar chart):
  - Shows last 4 weeks of reading counts
  - Empty state message if no data: "No readings data yet"

### 4. Reviews Section
- [ ] If advisor has reviews: shows recent reviews with client name, rating, text, date
- [ ] If no reviews: shows "No reviews yet" empty state

### 5. Activity Link
- [ ] Verify "View My Activity" button is visible
- [ ] Click it → should navigate to `/advisor-activity`

### 6. No Console Errors
- [ ] Open DevTools → Console
- [ ] Navigate to advisor dashboard
- [ ] Verify no RPC errors (if migration is applied)
