# Dummy Advisor Accounts

> **Created:** 2026-03-03
> **Migration:** `20260303100000_seed_dummy_advisors.sql`

All 20 test advisor accounts share the same password: **`Test1234!`**

Emails use the `.test` reserved TLD (RFC 2606) — these are not real email addresses.

## Credentials

| # | Name | Email | Password | UUID | Title |
|---|------|-------|----------|------|-------|
| 1 | Psychic Luna | advisor1@cosmiclly.test | Test1234! | `45dd82c1-c457-480b-af66-4c07bd0a9d01` | 5 Star Love Expert |
| 2 | Master Chen | advisor2@cosmiclly.test | Test1234! | `d0000002-0000-4000-a000-000000000002` | Astrology & Numerology |
| 3 | Mystic Rose | advisor3@cosmiclly.test | Test1234! | `d0000003-0000-4000-a000-000000000003` | Tarot Card Reader |
| 4 | Spirit Guide Sam | advisor4@cosmiclly.test | Test1234! | `d0000004-0000-4000-a000-000000000004` | Psychic Medium |
| 5 | Oracle Maya | advisor5@cosmiclly.test | Test1234! | `d0000005-0000-4000-a000-000000000005` | Dream Interpreter |
| 6 | Crystal Claire | advisor6@cosmiclly.test | Test1234! | `d0000006-0000-4000-a000-000000000006` | Energy Healer |
| 7 | Sage Alexander | advisor7@cosmiclly.test | Test1234! | `d0000007-0000-4000-a000-000000000007` | Career & Finance |
| 8 | Starlight Sophia | advisor8@cosmiclly.test | Test1234! | `d0000008-0000-4000-a000-000000000008` | Clairvoyant |
| 9 | Aurora Skye | advisor9@cosmiclly.test | Test1234! | `d0000009-0000-4000-a000-000000000009` | Aura Specialist |
| 10 | Destiny Dawn | advisor10@cosmiclly.test | Test1234! | `d0000010-0000-4000-a000-000000000010` | Palm Reader |
| 11 | Phoenix Fire | advisor11@cosmiclly.test | Test1234! | `d0000011-0000-4000-a000-000000000011` | Past Life Expert |
| 12 | Harmony Hope | advisor12@cosmiclly.test | Test1234! | `d0000012-0000-4000-a000-000000000012` | Relationship Coach |
| 13 | Cosmic Carlos | advisor13@cosmiclly.test | Test1234! | `d0000013-0000-4000-a000-000000000013` | Astrologer |
| 14 | Serene Sarah | advisor14@cosmiclly.test | Test1234! | `d0000014-0000-4000-a000-000000000014` | Manifestation Guide |
| 15 | Mystic Marcus | advisor15@cosmiclly.test | Test1234! | `d0000015-0000-4000-a000-000000000015` | Tarot Master |
| 16 | Divine Diana | advisor16@cosmiclly.test | Test1234! | `d0000016-0000-4000-a000-000000000016` | Spiritual Medium |
| 17 | Wisdom Walker | advisor17@cosmiclly.test | Test1234! | `d0000017-0000-4000-a000-000000000017` | Life Path Advisor |
| 18 | Celestial Celia | advisor18@cosmiclly.test | Test1234! | `d0000018-0000-4000-a000-000000000018` | Dream Analyst |
| 19 | Radiant Ray | advisor19@cosmiclly.test | Test1234! | `d0000019-0000-4000-a000-000000000019` | Energy Master |
| 20 | Luna Light | advisor20@cosmiclly.test | Test1234! | `d0000020-0000-4000-a000-000000000020` | Love Psychic |

## Notes

- All accounts start with **100 credits** and role `advisor`
- All advisor_details rows are set to `status = 'online'` and `profile_complete = true`
- The static data in `src/data/advisors.ts` serves as a UI fallback (review counts, rating stars, etc.)
- Database advisors take priority in the listing via `useAdvisors` merge logic
- Psychic Luna (advisor 1) uses a pre-existing UUID; all others use deterministic UUIDs with the `d0000...` pattern

## How to Apply

```bash
# Push the migration to your Supabase project
supabase db push

# Regenerate TypeScript types (if schema changed)
supabase gen types typescript --linked > src/integrations/supabase/types.gen.ts
```

## Testing Login

1. Go to the login page
2. Enter email: `advisor2@cosmiclly.test`
3. Enter password: `Test1234!`
4. You should be logged in as "Master Chen" with advisor role
5. Navigate to `/advisor-portal` to see the advisor dashboard
