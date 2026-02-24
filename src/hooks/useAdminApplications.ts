import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminApplication {
  id: string;
  full_name: string;
  email: string;
  specialty: string;
  social_link: string | null;
  extra_info: string | null;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  notes: string | null;
}

export function useAdminApplications(statusFilter?: string) {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('advisor_applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setApplications((data || []) as AdminApplication[]);
    } catch (err) {
      console.error('[useAdminApplications] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const approve = async (applicationId: string, notes?: string) => {
    try {
      const { error } = await supabase.rpc('approve_advisor_application', {
        p_application_id: applicationId,
        p_notes: notes || null,
      });
      if (error) throw error;
      toast({ title: 'Application Approved', description: 'The advisor has been activated.' });
      await fetchApplications();
      return true;
    } catch (err: any) {
      console.error('[useAdminApplications] Approve error:', err);
      toast({ variant: 'destructive', title: 'Approval Failed', description: err.message });
      return false;
    }
  };

  const reject = async (applicationId: string, notes: string) => {
    try {
      const { error } = await supabase.rpc('reject_advisor_application', {
        p_application_id: applicationId,
        p_notes: notes,
      });
      if (error) throw error;
      toast({ title: 'Application Rejected' });
      await fetchApplications();
      return true;
    } catch (err: any) {
      console.error('[useAdminApplications] Reject error:', err);
      toast({ variant: 'destructive', title: 'Rejection Failed', description: err.message });
      return false;
    }
  };

  return { applications, isLoading, refetch: fetchApplications, approve, reject };
}
