import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Favorite {
  id: string;
  advisor_id: string;
  created_at: string;
}

export function useFavorites() {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch favorites on mount
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id, advisor_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setFavorites(data);
      }
      setIsLoading(false);
    };

    fetchFavorites();
  }, [user?.id, isAuthenticated]);

  const isFavorite = useCallback(
    (advisorId: string) => favorites.some((f) => f.advisor_id === advisorId),
    [favorites]
  );

  const toggle = useCallback(
    async (advisorId: string) => {
      if (!user?.id) return;

      const existing = favorites.find((f) => f.advisor_id === advisorId);

      if (existing) {
        // Optimistic remove
        setFavorites((prev) => prev.filter((f) => f.advisor_id !== advisorId));

        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('id', existing.id);

        if (error) {
          // Revert on failure
          setFavorites((prev) => [...prev, existing]);
        }
      } else {
        // Optimistic add
        const tempFavorite: Favorite = {
          id: crypto.randomUUID(),
          advisor_id: advisorId,
          created_at: new Date().toISOString(),
        };
        setFavorites((prev) => [tempFavorite, ...prev]);

        const { data, error } = await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, advisor_id: advisorId })
          .select('id, advisor_id, created_at')
          .single();

        if (error) {
          // Revert on failure
          setFavorites((prev) => prev.filter((f) => f.id !== tempFavorite.id));
        } else if (data) {
          // Replace temp with real DB record
          setFavorites((prev) =>
            prev.map((f) => (f.id === tempFavorite.id ? data : f))
          );
        }
      }
    },
    [user?.id, favorites]
  );

  const favoriteAdvisorIds = favorites.map((f) => f.advisor_id);

  return { favorites, favoriteAdvisorIds, isFavorite, toggle, isLoading };
}
