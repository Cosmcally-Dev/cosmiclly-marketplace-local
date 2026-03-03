-- =====================================================
-- Migration: Dynamic Horoscopes Table
-- Date: 2026-03-11
-- Description: Creates the horoscopes table for storing
--   dynamic daily/weekly/monthly/yearly horoscope content
--   populated by n8n workflows (free APIs + OpenAI fallback).
--   Frontend reads via useHoroscope hook with static fallback.
-- =====================================================

-- ============================================================
-- 1. Create horoscopes table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.horoscopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sign TEXT NOT NULL,                -- lowercase: 'aries', 'taurus', ..., 'pisces'
  period TEXT NOT NULL,              -- 'daily', 'weekly', 'monthly', 'yearly'
  date DATE NOT NULL,                -- the date this horoscope applies to
  content JSONB NOT NULL,            -- { daily, love, career, money, health }
  lucky JSONB,                       -- { numbers: number[], color: string, time: string }
  source TEXT DEFAULT 'api',         -- 'aztro', 'ohmanda', 'openai', 'manual', 'static'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sign, period, date)
);

-- ============================================================
-- 2. Performance index for frontend lookups
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_horoscopes_lookup
  ON public.horoscopes(sign, period, date DESC);

-- ============================================================
-- 3. Row Level Security: public read, service-role-only write
-- ============================================================
ALTER TABLE public.horoscopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read horoscopes"
  ON public.horoscopes FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies for anon or authenticated roles.
-- Only the service role (used by n8n or edge functions) can write.
