import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Dispute {
  id: string;
  session_id: string;
  client_id: string;
  advisor_id: string;
  reason: string;
  status: 'open' | 'investigating' | 'resolved' | 'rejected';
  resolution: string | null;
  refund_amount_cents: number;
  admin_id: string | null;
  created_at: string;
  resolved_at: string | null;
  // Joined from profiles
  client_name: string;
  client_email: string;
  advisor_name: string;
  // Joined from sessions
  session_type: string;
  session_cost: number | null;
}

export function useAdminDisputes(statusFilter = 'all') {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDisputes = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('disputes')
        .select(`
          *,
          client:profiles!disputes_client_id_fkey(full_name, email),
          advisor:profiles!disputes_advisor_id_fkey(full_name),
          session:sessions!disputes_session_id_fkey(type, cost_total)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useAdminDisputes] fetch error:', error.message);
        setDisputes([]);
        return;
      }

      const mapped: Dispute[] = (data || []).map((d: any) => ({
        id: d.id,
        session_id: d.session_id,
        client_id: d.client_id,
        advisor_id: d.advisor_id,
        reason: d.reason,
        status: d.status,
        resolution: d.resolution,
        refund_amount_cents: d.refund_amount_cents || 0,
        admin_id: d.admin_id,
        created_at: d.created_at,
        resolved_at: d.resolved_at,
        client_name: d.client?.full_name || 'Unknown',
        client_email: d.client?.email || '',
        advisor_name: d.advisor?.full_name || 'Unknown',
        session_type: d.session?.type || 'unknown',
        session_cost: d.session?.cost_total ?? null,
      }));

      setDisputes(mapped);
    } catch (err) {
      console.error('[useAdminDisputes] error:', err);
      setDisputes([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const createDispute = async (sessionId: string, reason: string) => {
    // Fetch the session to get client_id and advisor_id
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('client_id, advisor_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error(sessionError?.message || 'Session not found');
    }

    const { error } = await supabase.from('disputes').insert({
      session_id: sessionId,
      client_id: session.client_id,
      advisor_id: session.advisor_id,
      reason,
      status: 'open',
    });

    if (error) throw error;
    await fetchDisputes();
  };

  const updateDisputeStatus = async (
    disputeId: string,
    newStatus: 'investigating' | 'resolved' | 'rejected',
    resolution?: string,
    refundAmountCents?: number
  ) => {
    const updates: Record<string, any> = { status: newStatus };

    if (resolution !== undefined) updates.resolution = resolution;
    if (refundAmountCents !== undefined) updates.refund_amount_cents = refundAmountCents;
    if (newStatus === 'resolved' || newStatus === 'rejected') {
      updates.resolved_at = new Date().toISOString();
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) updates.admin_id = user.id;

    const { error } = await supabase
      .from('disputes')
      .update(updates)
      .eq('id', disputeId);

    if (error) throw error;
    await fetchDisputes();
  };

  const issueRefund = async (sessionId: string, refundCredits: number, reason: string) => {
    const { data, error } = await supabase.functions.invoke('admin-refund', {
      body: { session_id: sessionId, refund_credits: refundCredits, reason },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Refund failed');

    return data as { success: boolean; credits_refunded: number; stripe_refunded: boolean };
  };

  return {
    disputes,
    isLoading,
    refetch: fetchDisputes,
    createDispute,
    updateDisputeStatus,
    issueRefund,
  };
}
