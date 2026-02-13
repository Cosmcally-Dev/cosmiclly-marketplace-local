import { useState, useEffect } from 'react';
import { MessageCircle, Phone, Clock, CreditCard, Video } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@/types/session';

interface SessionWithAdvisor extends Session {
  advisor: {
    full_name: string | null;
  } | null;
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const SessionHistory = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithAdvisor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('sessions')
          .select(`
            *,
            advisor:profiles!advisor_id(full_name)
          `)
          .eq('client_id', user.id)
          .eq('status', 'completed')
          .order('started_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        setSessions(data || []);
      } catch (error) {
        console.error('Failed to fetch session history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-sm text-muted-foreground mt-4">Loading session history...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium text-foreground mb-2">No session history</h3>
        <p className="text-sm text-muted-foreground">
          Your chat and call history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        // Calculate duration from timestamps
        const startedAt = session.started_at ? new Date(session.started_at) : null;
        const endedAt = session.ended_at ? new Date(session.ended_at) : null;
        const durationSeconds = startedAt && endedAt
          ? Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
          : 0;

        // Get session type icon
        const getTypeIcon = () => {
          switch (session.type) {
            case 'chat':
              return <MessageCircle className="w-5 h-5" />;
            case 'audio':
              return <Phone className="w-5 h-5" />;
            case 'video':
              return <Video className="w-5 h-5" />;
            default:
              return <MessageCircle className="w-5 h-5" />;
          }
        };

        // Get type color
        const getTypeColor = () => {
          switch (session.type) {
            case 'chat':
              return 'bg-primary/20 text-primary';
            case 'audio':
              return 'bg-mystic-purple/20 text-mystic-purple';
            case 'video':
              return 'bg-green-500/20 text-green-500';
            default:
              return 'bg-primary/20 text-primary';
          }
        };

        return (
          <div
            key={session.id}
            className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor()}`}>
                {getTypeIcon()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">
                    {session.advisor?.full_name || 'Unknown Advisor'}
                  </p>
                  <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded-full bg-secondary">
                    {session.type}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {session.started_at ? formatDate(session.started_at) : 'Unknown date'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-foreground">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                {formatDuration(durationSeconds)}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CreditCard className="w-3.5 h-3.5" />
                ${(session.cost_total || 0).toFixed(2)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
