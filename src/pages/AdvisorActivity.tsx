import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MessageCircle, Phone, Video, Clock,
  DollarSign, Hash,
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

interface SessionWithClient extends Session {
  client: { full_name: string | null } | null;
}

type TypeFilter = 'all' | 'chat' | 'audio' | 'video';
type StatusFilter = 'all' | 'completed' | 'cancelled';

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

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'chat': return <MessageCircle className="w-5 h-5" />;
    case 'audio': return <Phone className="w-5 h-5" />;
    case 'video': return <Video className="w-5 h-5" />;
    default: return <MessageCircle className="w-5 h-5" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'chat': return 'bg-primary/20 text-primary';
    case 'audio': return 'bg-mystic-purple/20 text-mystic-purple';
    case 'video': return 'bg-green-500/20 text-green-500';
    default: return 'bg-primary/20 text-primary';
  }
};

const AdvisorActivity = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [contractTerms, setContractTerms] = useState({ advisorShare: 50, adminFee: 5 });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch sessions
        const { data, error } = await supabase
          .from('sessions')
          .select(`*, client:profiles!client_id(full_name)`)
          .eq('advisor_id', user.id)
          .in('status', ['completed', 'cancelled'])
          .order('started_at', { ascending: false })
          .limit(200);

        if (error) throw error;
        setSessions(data || []);

        // Fetch contract terms
        const { data: contractData } = await supabase
          .from('advisor_details')
          .select('advisor_share_percent, admin_fee_percent')
          .eq('id', user.id)
          .single();

        if (contractData) {
          const c = contractData as unknown as { advisor_share_percent: number; admin_fee_percent: number };
          setContractTerms({
            advisorShare: c.advisor_share_percent ?? 50,
            adminFee: c.admin_fee_percent ?? 5,
          });
        }
      } catch (error) {
        console.error('Failed to fetch advisor activity:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (typeFilter !== 'all') {
      result = result.filter(s => s.type === typeFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }
    return result;
  }, [sessions, typeFilter, statusFilter]);

  const calculateIncome = (costTotal: number) => {
    const afterFee = costTotal - (costTotal * contractTerms.adminFee / 100);
    return afterFee * contractTerms.advisorShare / 100;
  };

  const totalIncome = useMemo(
    () => filteredSessions
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + calculateIncome(s.cost_total || 0), 0),
    [filteredSessions, contractTerms]
  );

  const completedCount = useMemo(
    () => filteredSessions.filter(s => s.status === 'completed').length,
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
            <p className="text-muted-foreground">View your session history and income</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-foreground">${totalIncome.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Hash className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed Readings</p>
                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
              </div>
            </div>
          </div>

          {/* Filters bar */}
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-xl bg-card border border-border">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
              <SelectTrigger className="w-[140px] bg-secondary border-border">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="audio">Voice Call</SelectItem>
                <SelectItem value="video">Video Call</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[150px] bg-secondary border-border">
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
                  ? 'Your session history will appear here once you complete readings.'
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
                const income = isCancelled ? 0 : calculateIncome(session.cost_total || 0);

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(session.type)}`}>
                        {getTypeIcon(session.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {session.client?.full_name || 'Unknown Client'}
                          </p>
                          <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded-full bg-secondary">
                            {session.type}
                          </span>
                          {isCancelled && (
                            <Badge variant="destructive" className="text-xs">
                              Cancelled
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {session.started_at ? formatDate(session.started_at) : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-foreground">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {isCancelled ? 'N/A' : formatDuration(durationSeconds)}
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium text-emerald-500">
                        <DollarSign className="w-3.5 h-3.5" />
                        {isCancelled ? 'N/A' : `$${income.toFixed(2)}`}
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

export default AdvisorActivity;
