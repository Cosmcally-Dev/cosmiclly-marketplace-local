# Test Case: Footer Shows All Specialties

## Changes Made
- Imported `categories` from `@/data/categories` in `Footer.tsx`
- Replaced 5 hardcoded service links with all 19 specialties from categories data
- Rendered in a 3-column grid layout within the footer

## Verification Steps

### 1. Footer Visibility
- [ ] Scroll to the bottom of any page
- [ ] Verify the "Services" section in the footer is visible

### 2. All Specialties Present
- [ ] Verify all 19 specialties are listed (count them):
  - Tarot Reading, Astrology, Love & Relationships, Career Guidance, Dream Interpretation,
  - Psychic Reading, Mediumship, Numerology, Palm Reading, Aura Reading,
  - Past Life Reading, Angel Card Reading, Crystal Healing, Energy Healing,
  - Spiritual Guidance, Life Coaching, Pet Psychic, Chakra Balancing, Rune Reading

### 3. Layout
- [ ] On desktop: specialties appear in **3 columns** (or 2-3 depending on screen width)
- [ ] On mobile: columns should collapse appropriately
- [ ] Text should not overlap or be cut off

### 4. Links Work
- [ ] Click any specialty link (e.g., "Tarot Reading")
- [ ] Verify it navigates to `/advisors?category=tarot-reading` (or appropriate slug)
- [ ] Verify the advisors page filters by that category

### 5. Other Footer Sections
- [ ] Verify "Company" and "Support" sections still show correctly alongside the expanded Services section
