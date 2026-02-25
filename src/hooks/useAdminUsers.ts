import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string;
  role: string;
  credits: number;
  created_at: string;
}

export function useAdminUsers(roleFilter?: string, searchQuery?: string) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, username, email, role, credits, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (roleFilter && roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      if (searchQuery && searchQuery.trim()) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsers((data || []) as AdminUser[]);
    } catch (err) {
      console.error('[useAdminUsers] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, isLoading, refetch: fetchUsers };
}
