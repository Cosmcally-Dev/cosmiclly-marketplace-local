# Test Case: Remove Avg Duration from User Activity Page

## Changes Made
- Removed `averageDuration` useMemo calculation from `Activity.tsx`
- Removed "Avg Duration" summary card
- Changed grid from 3-column to 2-column layout

## Verification Steps

### 1. Activity Page Layout
- [ ] Log in as a client user
- [ ] Navigate to `/activity`
- [ ] Verify only **2 summary cards** are visible:
  - "Total Sessions" (with Hash icon)
  - "Total Spend" (with DollarSign icon)
- [ ] Verify "Avg Duration" card is NOT shown
- [ ] Verify cards are arranged in a 2-column grid on desktop

### 2. Data Accuracy
- [ ] Verify "Total Sessions" shows correct count
- [ ] Verify "Total Spend" shows correct total

### 3. Mobile Responsiveness
- [ ] On mobile, verify cards stack vertically (1-column)
- [ ] Verify no broken layout or extra empty space

### 4. No Console Errors
- [ ] Open DevTools → Console
- [ ] Verify no errors related to `averageDuration` or `Timer` import
