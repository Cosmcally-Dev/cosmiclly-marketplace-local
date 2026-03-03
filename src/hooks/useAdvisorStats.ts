import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdvisorStats {
  pendingBalance: number;
  monthlyEarnings: number;
  completedReadings: number;
  averageRating: number;
}

interface ChartData {
  weeklyEarnings: { day: string; earnings: number }[];
  monthlyReadings: { week: string; readings: number }[];
}

interface Review {
  id: string;
  name: string;
  rating: number;
  date: string;
  text: string;
}

export function useAdvisorStats(advisorId: string | undefined) {
  const [stats, setStats] = useState<AdvisorStats>({
    pendingBalance: 0,
    monthlyEarnings: 0,
    completedReadings: 0,
    averageRating: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({
    weeklyEarnings: [],
    monthlyReadings: [],
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!advisorId) return;

    try {
      // Fetch dashboard stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_advisor_dashboard_stats', { p_advisor_id: advisorId });

      if (statsError) {
        console.warn('[useAdvisorStats] Stats error:', statsError.message);
      } else if (statsData) {
        const parsed = typeof statsData === 'string' ? JSON.parse(statsData) : statsData;
        setStats({
          pendingBalance: Number(parsed.pending_balance) || 0,
          monthlyEarnings: Number(parsed.monthly_earnings) || 0,
          completedReadings: Number(parsed.completed_readings) || 0,
          averageRating: Number(parsed.average_rating) || 0,
        });
      }

      // Fetch chart data
      const { data: chartResult, error: chartError } = await supabase
        .rpc('get_advisor_chart_data', { p_advisor_id: advisorId });

      if (chartError) {
        console.warn('[useAdvisorStats] Chart error:', chartError.message);
      } else if (chartResult) {
        const parsed = typeof chartResult === 'string' ? JSON.parse(chartResult) : chartResult;
        setChartData({
          weeklyEarnings: parsed.weekly_earnings || [],
          monthlyReadings: parsed.monthly_readings || [],
        });
      }

      // Fetch recent reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .rpc('get_advisor_recent_reviews', { p_advisor_id: advisorId, p_limit: 5 });

      if (reviewsError) {
        console.warn('[useAdvisorStats] Reviews error:', reviewsError.message);
      } else if (reviewsData) {
        const parsed = typeof reviewsData === 'string' ? JSON.parse(reviewsData) : reviewsData;
        setReviews(Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      console.warn('[useAdvisorStats] Exception:', err);
    } finally {
      setIsLoading(false);
    }
  }, [advisorId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, chartData, reviews, isLoading, refetch: fetchStats };
}
