# Cosmiclly — Dynamic Horoscope Architecture Plan

> **Status:** Planning (not yet implemented)
> **Date:** 2026-02-27
> **Author:** Development Team

---

## 1. Current State

The horoscope feature is fully static:

- **`src/pages/Horoscope.tsx`** — Hardcoded `horoscopeContent` object (lines 11-108) with daily, love, career, money, health readings for all 12 signs. Includes lucky numbers, colors, and times.
- **`src/pages/Profile.tsx`** — Static zodiac profile (lines 55-63: sun sign, moon sign, ascendant, element, modality, lucky numbers) and hardcoded horoscope readings for today/tomorrow/week/month/year (lines 69-90).
- **`src/data/zodiacSigns.ts`** — 12 zodiac signs with symbol, date range, element, ruling planet, and PNG images. This data is inherently static and should remain hardcoded.
- **`src/components/home/DailyHoroscope.tsx`** — Homepage preview component with static reading text.

**Problem:** The same horoscope text is displayed every day, regardless of the actual date. The "today" readings never change.

---

## 2. Proposed Architecture

### 2.1 What Stays Static (Hardcoded)

These traits never change and should remain in `src/data/zodiacSigns.ts`:

| Trait | Example (Capricorn) | Rationale |
|-------|---------------------|-----------|
| Element | Earth | Fixed per sign |
| Modality | Cardinal | Fixed per sign |
| Ruling Planet | Saturn | Fixed per sign |
| Symbol | ♑ | Fixed per sign |
| Date Range | Dec 22 - Jan 19 | Fixed per sign |
| Sign Images | `zodiac/capricorn.png` | Static assets |

### 2.2 What Becomes Dynamic

| Content | Update Frequency | Source |
|---------|------------------|--------|
| Daily horoscope (overview, love, career, money, health) | Daily at midnight UTC | Free API → n8n → Supabase |
| Weekly horoscope | Weekly (Sunday midnight) | Free API / OpenAI fallback |
| Monthly horoscope | Monthly (1st of month) | Free API / OpenAI fallback |
| Yearly horoscope | Yearly (Jan 1) | OpenAI GPT-4o |
| Lucky numbers, color, time | Daily | Free API or generated |
| Moon sign / Ascendant (user profile) | Per-user, on demand | Swiss Ephemeris calculation |

### 2.3 High-Level Architecture

```
┌─────────────────────┐
│  Free Horoscope APIs │
│  (Aztro, Ohmanda,   │──────┐
│   horoscope-api)     │      │
└─────────────────────┘      │
                              ▼
┌─────────────────────┐  ┌──────────┐  ┌──────────────────┐
│  Swiss Ephemeris     │  │   n8n    │  │   Supabase       │
│  (self-hosted,       │──│ Workflow  │──│  horoscopes      │
│   birth charts)      │  │ (cron)   │  │  table           │
└─────────────────────┘  └──────────┘  └────────┬─────────┘
                              │                  │
                              ▼                  ▼
                     ┌──────────────┐   ┌──────────────────┐
                     │ OpenAI GPT-4o│   │ Frontend         │
                     │ (fallback    │   │ useHoroscope()   │
                     │  generation) │   │ hook → Supabase  │
                     └──────────────┘   │ → static fallback│
                                        └──────────────────┘
```

---

## 3. Database Schema

### `horoscopes` Table

```sql
CREATE TABLE public.horoscopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sign TEXT NOT NULL,                -- 'aries', 'taurus', ..., 'pisces'
  period TEXT NOT NULL,              -- 'daily', 'weekly', 'monthly', 'yearly'
  date DATE NOT NULL,                -- The date this horoscope is for
  content JSONB NOT NULL,            -- See structure below
  lucky JSONB,                       -- { numbers: [7,14,21], color: "Red", time: "2:00 PM" }
  source TEXT DEFAULT 'api',         -- 'aztro', 'ohmanda', 'openai', 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sign, period, date)
);

-- Fast lookup index
CREATE INDEX idx_horoscopes_lookup ON public.horoscopes(sign, period, date DESC);

-- RLS: public read, only service role can write
ALTER TABLE public.horoscopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read horoscopes"
  ON public.horoscopes FOR SELECT
  USING (true);
```

### Content JSONB Structure

```json
{
  "daily": "Today brings a wave of clarity to your personal goals...",
  "love": "Venus aligns with your sign, bringing warmth...",
  "career": "A new opportunity may present itself at work...",
  "money": "Financial decisions should be made carefully...",
  "health": "Take time to rest and recharge your energy..."
}
```

### Lucky JSONB Structure

```json
{
  "numbers": [6, 8, 15],
  "color": "Brown",
  "time": "8:00 AM"
}
```

---

## 4. Free/Open-Source Horoscope APIs

### Primary Options

| API | Type | Rate Limit | Pros | Cons |
|-----|------|-----------|------|------|
| **Aztro API** | REST | Generous free tier | Simple, reliable, daily horoscopes | Limited to daily only |
| **Ohmanda API** | REST | Free | Multiple time periods | Occasionally unreliable |
| **horoscope-api (GitHub)** | Self-hostable | Unlimited | No rate limits, scrapes multiple sources | Requires hosting |
| **vitorebatista/horoscopefree** | Open source | Unlimited | Fully free | Basic text quality |

### Fallback: OpenAI GPT-4o

When free APIs fail, use GPT-4o to generate horoscopes:

```
System: You are a professional astrologer writing daily horoscopes.
        Write engaging, positive, specific guidance for {sign} on {date}.
        Current planetary positions: {swiss_ephemeris_data}

Format: Return JSON with keys: daily, love, career, money, health.
        Each should be 2-3 sentences.
```

**Cost estimate:** 12 signs x ~200 tokens each = ~2,400 tokens/day ≈ $0.01/day with GPT-4o-mini.

---

## 5. n8n Automation Workflows

### 5.1 Daily Horoscope Workflow (runs at 00:05 UTC daily)

```
Trigger: Cron (0 5 0 * * *)
    │
    ├── For each of 12 signs:
    │   ├── HTTP Request → Aztro API (primary)
    │   ├── If Aztro fails → HTTP Request → Ohmanda (fallback)
    │   ├── If both fail → HTTP Request → OpenAI GPT-4o (last resort)
    │   │
    │   ├── Transform response → JSONB format
    │   ├── Generate lucky numbers/color/time
    │   │
    │   └── HTTP Request → Supabase REST API
    │       POST /rest/v1/horoscopes
    │       (upsert on sign + period + date)
    │
    └── Notify on failure (optional Slack/email alert)
```

### 5.2 Weekly Horoscope Workflow (runs Sunday at 00:15 UTC)

```
Trigger: Cron (0 15 0 * * 0)
    │
    └── For each of 12 signs:
        ├── HTTP Request → Ohmanda weekly (or OpenAI)
        ├── Transform → JSONB
        └── Upsert to Supabase horoscopes table
```

### 5.3 Monthly Horoscope Workflow (runs 1st of month at 00:30 UTC)

```
Trigger: Cron (0 30 0 1 * *)
    │
    └── For each of 12 signs:
        ├── HTTP Request → OpenAI GPT-4o with Swiss Ephemeris context
        ├── Include: planetary transits for the month, retrogrades, eclipses
        └── Upsert to Supabase horoscopes table
```

### Supabase REST API Call (from n8n)

```
POST https://jxpzxdbforvuphqvvqkz.supabase.co/rest/v1/horoscopes
Headers:
  apikey: <SUPABASE_ANON_KEY>
  Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
  Content-Type: application/json
  Prefer: resolution=merge-duplicates

Body:
{
  "sign": "capricorn",
  "period": "daily",
  "date": "2026-02-27",
  "content": { "daily": "...", "love": "...", ... },
  "lucky": { "numbers": [6,8,15], "color": "Brown", "time": "8:00 AM" },
  "source": "aztro"
}
```

---

## 6. Swiss Ephemeris Integration

### Purpose

The Swiss Ephemeris provides precise astronomical calculations for:
- **Birth chart computation** — Calculate user's moon sign and ascendant from birth date/time/location
- **Current planetary positions** — Feed into horoscope generation prompts for GPT-4o
- **Transits and aspects** — Identify significant astrological events

### Implementation Options

| Option | Hosting | Language | Complexity |
|--------|---------|----------|------------|
| `swisseph` npm package | Node.js runtime | JavaScript | Medium |
| `pyswisseph` | Python Docker container | Python | Medium |
| `starluck-epoch` | Self-hosted library | JavaScript | Low |
| Supabase Edge Function | Deno runtime | TypeScript | Medium |

### Recommended: `starluck-epoch` or `swisseph` npm

For birth chart calculations (user profile):
- User enters birth date, time, and location in Settings
- Supabase Edge Function computes: moon sign, ascendant, planetary positions
- Results stored in `profiles` table (new columns: `birth_date`, `birth_time`, `birth_location`, `calculated_chart JSONB`)

For daily planetary context (horoscope generation):
- n8n workflow calls Swiss Ephemeris before generating horoscopes
- Passes planetary positions to OpenAI prompt for more accurate content

---

## 7. Frontend Changes

### 7.1 New Hook: `useHoroscope`

```typescript
// src/hooks/useHoroscope.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { horoscopeContent } from '@/pages/Horoscope'; // static fallback

interface HoroscopeData {
  content: {
    daily: string;
    love: string;
    career: string;
    money: string;
    health: string;
  };
  lucky?: {
    numbers: number[];
    color: string;
    time: string;
  };
  source: string;
}

export function useHoroscope(sign: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly') {
  return useQuery({
    queryKey: ['horoscope', sign, period],
    queryFn: async (): Promise<HoroscopeData> => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('horoscopes')
        .select('content, lucky, source')
        .eq('sign', sign.toLowerCase())
        .eq('period', period)
        .lte('date', today)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // Fallback to static data
        const staticData = horoscopeContent[sign.toLowerCase()];
        if (staticData) {
          return {
            content: staticData,
            lucky: staticData.lucky,
            source: 'static',
          };
        }
        throw new Error('No horoscope data available');
      }

      return data as HoroscopeData;
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
    retry: 1,
  });
}
```

### 7.2 Update `Horoscope.tsx`

Replace the static `horoscopeContent` object usage with the `useHoroscope` hook:
- Fetch content based on selected sign and time period
- Show loading skeleton while fetching
- Fall back to static data if Supabase returns nothing (graceful degradation)

### 7.3 Update `Profile.tsx`

Replace the hardcoded zodiac profile readings with dynamic data:
- Fetch today's horoscope for the user's sun sign
- Keep static traits (element, modality, etc.) hardcoded

### 7.4 Update `DailyHoroscope.tsx` (Homepage)

Fetch today's horoscope for the selected sign from Supabase.

---

## 8. Implementation Phases

| Phase | Scope | Effort | Dependencies |
|-------|-------|--------|--------------|
| **A** | Create `horoscopes` table + RLS | 30 min | None |
| **B** | Create `useHoroscope` hook with static fallback | 1-2 hours | Phase A |
| **C** | Set up n8n daily workflow with Aztro API | 2-3 hours | Phase A, n8n instance |
| **D** | Update `Horoscope.tsx` to use dynamic data | 2-3 hours | Phase B |
| **E** | Update `Profile.tsx` and `DailyHoroscope.tsx` | 1-2 hours | Phase B |
| **F** | Add weekly/monthly n8n workflows | 1-2 hours | Phase C |
| **G** | Swiss Ephemeris integration (birth charts) | 4-6 hours | Independent |
| **H** | User birth chart UI in Settings/Profile | 2-3 hours | Phase G |

**Total estimated effort:** 14-22 hours

---

## 9. Cost Analysis

| Component | Cost | Notes |
|-----------|------|-------|
| Free horoscope APIs | $0/month | Rate limits are generous for 12 daily calls |
| OpenAI GPT-4o-mini (fallback) | ~$0.30/month | 12 signs x 30 days x ~200 tokens |
| Swiss Ephemeris | $0 | Open source library |
| n8n (self-hosted) | $0 | Already running |
| Supabase storage | Negligible | ~1KB per horoscope entry, 12 x 365 = 4,380 rows/year |

**Total: $0-0.30/month** (effectively free)

---

## 10. Assessment of User's Proposed Plan

The proposed approach is **solid and well-structured**. Here's the assessment:

### What's Great
- **Hardcoding static traits** — Correct. Element, modality, ruling planet never change.
- **Free API + n8n caching** — Smart cost-saving approach. Avoids per-request API calls.
- **Supabase as cache layer** — Perfect fit with existing infrastructure.
- **Swiss Ephemeris for calculations** — Industry-standard astronomical library.

### Recommended Additions
1. **Multi-API fallback chain** — Don't rely on a single free API. Use Aztro → Ohmanda → OpenAI as a chain.
2. **OpenAI as last resort, not primary** — Free APIs should be tried first to minimize costs.
3. **Graceful degradation** — If the database has no entry for today, fall back to static data rather than showing an error.
4. **Stale data handling** — If the n8n job fails, show yesterday's horoscope rather than nothing.
5. **Monitoring** — n8n should send alerts (Slack/email) if the daily job fails so it can be investigated.

### Potential Gotchas
- **Aztro API reliability** — It has historically been unreliable. Always have a fallback.
- **Timezone handling** — Swiss Ephemeris calculations require careful UTC/local timezone conversion for birth charts.
- **API format differences** — Each free API returns data in a different format. The n8n workflow needs transformers for each source.
- **User birth data (GDPR)** — Storing birth date/time/location is PII. Needs explicit consent and inclusion in the "Delete Account" flow.

---

## 11. Migration SQL (Ready to Apply)

```sql
-- Create horoscopes table for dynamic content
CREATE TABLE IF NOT EXISTS public.horoscopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sign TEXT NOT NULL,
  period TEXT NOT NULL,
  date DATE NOT NULL,
  content JSONB NOT NULL,
  lucky JSONB,
  source TEXT DEFAULT 'api',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sign, period, date)
);

CREATE INDEX IF NOT EXISTS idx_horoscopes_lookup
  ON public.horoscopes(sign, period, date DESC);

ALTER TABLE public.horoscopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read horoscopes"
  ON public.horoscopes FOR SELECT
  USING (true);

-- Only service role can insert/update (via n8n or edge functions)
-- No INSERT/UPDATE policies for authenticated users
```
