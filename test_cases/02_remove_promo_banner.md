# Test Case: Remove Promo Banner

## Changes Made
- Removed `StickyPromoBar` import and usage from `StickyHeader.tsx`
- Component files kept intact for future re-enabling

## Verification Steps

### 1. Landing Page
- [ ] Navigate to `/` (home page)
- [ ] Verify NO "Get 3 Free Minutes + 70% Off" banner appears at top
- [ ] Verify the header/navigation still shows correctly
- [ ] Verify the header sticks to the top on scroll

### 2. Other Pages
- [ ] Navigate to `/advisors` — no promo banner
- [ ] Navigate to `/horoscope` — no promo banner
- [ ] Navigate to any advisor profile — no promo banner

### 3. No Layout Shift
- [ ] Verify page content starts at the correct position (no extra gap where banner was)
- [ ] Verify no console errors related to StickyPromoBar
