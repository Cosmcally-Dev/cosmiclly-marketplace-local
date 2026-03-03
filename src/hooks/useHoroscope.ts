import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { horoscopeContent } from '@/data/horoscopeContent';

export interface HoroscopeData {
  content: {
    daily: string;
    love: string;
    career: string;
    money: string;
    health: string;
  };
  lucky: {
    numbers: number[];
    color: string;
    time: string;
  } | null;
  source: string;
  date: string;
}

export type HoroscopePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

function getStaticFallback(sign: string): HoroscopeData | null {
  const entry = horoscopeContent[sign.toLowerCase()];
  if (!entry) return null;
  return {
    content: {
      daily: entry.daily,
      love: entry.love,
      career: entry.career,
      money: entry.money,
      health: entry.health,
    },
    lucky: entry.lucky,
    source: 'static',
    date: new Date().toISOString().split('T')[0],
  };
}

/**
 * Fetches horoscope data from Supabase with static fallback.
 *
 * @param sign - Zodiac sign name (case-insensitive), or null to disable
 * @param period - 'daily', 'weekly', 'monthly', or 'yearly'
 * @param targetDate - ISO date string (YYYY-MM-DD) to query; defaults to today
 */
export function useHoroscope(
  sign: string | null,
  period: HoroscopePeriod = 'daily',
  targetDate?: string,
) {
  const placeholder = sign ? getStaticFallback(sign) : null;

  return useQuery<HoroscopeData | null>({
    queryKey: ['horoscope', sign?.toLowerCase() ?? null, period, targetDate ?? null],
    queryFn: async (): Promise<HoroscopeData | null> => {
      if (!sign) return null;

      const dateToQuery = targetDate || new Date().toISOString().split('T')[0];

      // The horoscopes table may not exist yet (migration not applied).
      // maybeSingle() returns null when no rows match instead of throwing.
      const { data, error } = await supabase
        .from('horoscopes' as string)
        .select('content, lucky, source, date')
        .eq('sign', sign.toLowerCase())
        .eq('period', period)
        .lte('date', dateToQuery)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        // Graceful degradation: return static fallback
        return getStaticFallback(sign);
      }

      // Merge DB content with static fallback per-field.
      // Uses || so empty strings ("") trigger the fallback.
      const fallback = getStaticFallback(sign);
      const dbContent = data.content as Record<string, string> | null;

      return {
        content: {
          daily:  dbContent?.daily  || fallback?.content.daily  || '',
          love:   dbContent?.love   || fallback?.content.love   || '',
          career: dbContent?.career || fallback?.content.career || '',
          money:  dbContent?.money  || fallback?.content.money  || '',
          health: dbContent?.health || fallback?.content.health || '',
        },
        lucky: (data.lucky as HoroscopeData['lucky']) ?? fallback?.lucky ?? null,
        source: (data.source as string) || 'api',
        date: data.date as string,
      };
    },
    enabled: !!sign,
    staleTime: 1000 * 60 * 60,         // 1 hour
    gcTime: 1000 * 60 * 60 * 24,       // 24 hours
    retry: 1,
    placeholderData: placeholder ?? undefined,
  });
}
