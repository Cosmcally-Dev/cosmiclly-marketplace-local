import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminSession {
  id: string;
  client_id: string;
  advisor_id: string;
  type: string;
  status: string;
  rate_per_minute: number | null;
  started_at: string | null;
  ended_at: string | null;
  billable_minutes: number | null;
  cost_total: number | null;
  billing_status: string | null;
  session_metadata: Record<string, any> | null;
  client_name: string;
  advisor_name: string;
}

export function useAdminSessions(statusFilter?: string, typeFilter?: string) {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('sessions')
        .select(`
          id, client_id, advisor_id, type, status, rate_per_minute,
          started_at, ended_at, billable_minutes, cost_total, billing_status, session_metadata,
          client:profiles!sessions_client_id_fkey(full_name),
          advisor:profiles!sessions_advisor_id_fkey(full_name)
        `)
        .order('started_at', { ascending: false, nullsFirst: false })
        .limit(100);

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter && typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: AdminSession[] = (data || []).map((s: any) => ({
        ...s,
        client_name: s.client?.full_name || 'Unknown',
        advisor_name: s.advisor?.full_name || 'Unknown',
        client: undefined,
        advisor: undefined,
      }));

      setSessions(mapped);
    } catch (err) {
      console.error('[useAdminSessions] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, isLoading, refetch: fetchSessions };
}
