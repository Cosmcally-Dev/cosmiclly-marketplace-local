import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AdvisorApplication {
  id: string;
  full_name: string;
  email: string;
  specialty: string;
  social_link: string | null;
  extra_info: string | null;
  status: string;
  submitted_at: string | null;
  notes: string | null;
}

export interface UseAdvisorApplicationResult {
  application: AdvisorApplication | null;
  hasAdvisorDetails: boolean;
  isProfileComplete: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useAdvisorApplication(): UseAdvisorApplicationResult {
  const { user } = useAuth();
  const [application, setApplication] = useState<AdvisorApplication | null>(null);
  const [hasAdvisorDetails, setHasAdvisorDetails] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.email) {
      setApplication(null);
      setHasAdvisorDetails(false);
      setIsProfileComplete(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch most recent application by this user's email
      const { data: appData, error: appError } = await supabase
        .from('advisor_applications')
        .select('*')
        .eq('email', user.email)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (appError) {
        console.warn('[useAdvisorApplication] Application fetch error:', appError.message);
      }

      setApplication(appData as AdvisorApplication | null);

      // Check if this user has an advisor_details row (means they're an approved advisor)
      if (user.id) {
        const { data: detailsData, error: detailsError } = await supabase
          .from('advisor_details')
          .select('id, profile_complete')
          .eq('id', user.id)
          .maybeSingle();

        if (detailsError) {
          console.warn('[useAdvisorApplication] Details fetch error:', detailsError.message);
        }

        setHasAdvisorDetails(!!detailsData);
        setIsProfileComplete(detailsData?.profile_complete === true);
      }
    } catch (err) {
      console.error('[useAdvisorApplication] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    application,
    hasAdvisorDetails,
    isProfileComplete,
    isLoading,
    refetch: fetchData,
  };
}
