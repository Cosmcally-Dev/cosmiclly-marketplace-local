import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MessageCircle, Phone, Video, Clock,
  CreditCard, Hash, Bot,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@/types/session';
import { formatDuration, formatDate } from '@/utils/formatters';

interface SessionWithAdvisor extends Session {
  advisor: { full_name: string | null } | null;
}

type TypeFilter = 'all' | 'chat' | 'ai_chat' | 'audio' | 'video';
type StatusFilter = 'all' | 'completed' | 'cancelled';

const getTypeIcon = (type: string, isAi: boolean) => {
  if (isAi) return <Bot className="w-5 h-5" />;
  switch (type) {
    case 'chat': return <MessageCircle className="w-5 h-5" />;
    case 'audio': return <Phone className="w-5 h-5" />;
    case 'video': return <Video className="w-5 h-5" />;
    default: return <MessageCircle className="w-5 h-5" />;
  }
};

const getTypeColor = (type: string, isAi: boolean) => {
  if (isAi) return 'bg-purple-500/20 text-purple-500';
  switch (type) {
    case 'chat': return 'bg-primary/20 text-primary';
    case 'audio': return 'bg-mystic-purple/20 text-mystic-purple';
    case 'video': return 'bg-green-500/20 text-green-500';
    default: return 'bg-primary/20 text-primary';
  }
};

const getTypeLabel = (type: string, isAi: boolean) => {
  if (isAi) return 'AI Chat';
  switch (type) {
    case 'chat': return 'Chat';
    case 'audio': return 'Voice Call';
    case 'video': return 'Video Call';
    default: return type;
  }
};

const Activity = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithAdvisor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('sessions')
          .select(`*, advisor:profiles!advisor_id(full_name)`)
          .eq('client_id', user.id)
          .in('status', ['completed', 'cancelled'])
          .order('created_at', { ascending: false })
          .limit(200);

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

  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (typeFilter === 'ai_chat') {
      result = result.filter(s => (s.session_metadata as any)?.ai === true);
    } else if (typeFilter !== 'all') {
      result = result.filter(s => s.type === typeFilter && !(s.session_metadata as any)?.ai);
    }
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }
    return result;
  }, [sessions, typeFilter, statusFilter]);

  const totalSpend = useMemo(
    () => filteredSessions.reduce((sum, s) => sum + (s.cost_total || 0), 0),
    [filteredSessions]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">My Activity</h1>
            <p className="text-muted-foreground">View your session history and spending</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Hash className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold text-foreground">{filteredSessions.length}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold text-foreground">${totalSpend.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Filters bar */}
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-xl bg-card border border-border">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
              <SelectTrigger className="w-[120px] sm:w-[140px] bg-secondary border-border">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="ai_chat">AI Chat</SelectItem>
                <SelectItem value="audio">Voice Call</SelectItem>
                <SelectItem value="video">Video Call</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[120px] sm:w-[150px] bg-secondary border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <p className="text-sm text-muted-foreground ml-auto">
              Showing <span className="text-foreground font-medium">{filteredSessions.length}</span> sessions
            </p>
          </div>

          {/* Session list */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
              <p className="text-sm text-muted-foreground mt-4">Loading session history...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading font-medium text-foreground mb-2">No sessions found</h3>
              <p className="text-sm text-muted-foreground">
                {sessions.length === 0
                  ? 'Your chat and call history will appear here.'
                  : 'No sessions match your current filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => {
                const startedAt = session.started_at ? new Date(session.started_at) : null;
                const endedAt = session.ended_at ? new Date(session.ended_at) : null;
                const durationSeconds = startedAt && endedAt
                  ? Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
                  : 0;
                const isCancelled = session.status === 'cancelled';
                const isAi = (session.session_metadata as any)?.ai === true;
                const displayDate = session.started_at || session.created_at;

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(session.type, isAi)}`}>
                        {getTypeIcon(session.type, isAi)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {session.advisor?.full_name || 'Unknown Advisor'}
                          </p>
                          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                            {getTypeLabel(session.type, isAi)}
                          </span>
                          {isCancelled && (
                            <Badge variant="destructive" className="text-xs">
                              Cancelled
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {displayDate ? formatDate(displayDate) : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-foreground">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {isCancelled ? 'N/A' : formatDuration(durationSeconds)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <CreditCard className="w-3.5 h-3.5" />
                        {isCancelled ? 'N/A' : `$${(session.cost_total || 0).toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Activity;
