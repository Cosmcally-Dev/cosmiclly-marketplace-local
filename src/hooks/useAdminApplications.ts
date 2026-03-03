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

  const approve = async (
    applicationId: string,
    notes?: string,
    contract?: { advisorShare: number; platformShare: number; adminFee: number }
  ) => {
    try {
      const { error } = await supabase.rpc('approve_advisor_application', {
        p_application_id: applicationId,
        p_admin_notes: notes || null,
        p_advisor_share: contract?.advisorShare ?? 50,
        p_platform_share: contract?.platformShare ?? 50,
        p_admin_fee: contract?.adminFee ?? 5,
      });
      if (error) throw error;

      // Send approval email (fire-and-forget)
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        import('@/services/email').then(({ sendEmail }) => {
          sendEmail({
            toEmail: app.email,
            toName: app.full_name,
            emailType: 'application_approved',
            templateParams: { advisor_name: app.full_name },
          });
        }).catch(() => {});
      }

      toast({ title: 'Application Approved', description: 'The advisor has been activated with contract terms.' });
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

      // Send rejection email (fire-and-forget)
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        import('@/services/email').then(({ sendEmail }) => {
          sendEmail({
            toEmail: app.email,
            toName: app.full_name,
            emailType: 'application_rejected',
            templateParams: { advisor_name: app.full_name },
          });
        }).catch(() => {});
      }

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
