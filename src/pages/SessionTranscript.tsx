import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useChatMessages } from '@/hooks/useChatMessages';
import { supabase } from '@/integrations/supabase/client';
import { formatMessageTime } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, MessageSquare } from 'lucide-react';

interface SessionInfo {
  id: string;
  client_id: string;
  advisor_id: string;
  type: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  billable_minutes: number | null;
  cost_total: number | null;
  advisor_name: string;
  advisor_avatar: string;
  client_name: string;
}

const SessionTranscript = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading: messagesLoading } = useChatMessages(
    session ? sessionId! : null
  );

  // Fetch session details
  useEffect(() => {
    if (!sessionId || authLoading || !user) return;

    const fetchSession = async () => {
      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select(`
          id, client_id, advisor_id, type, status, started_at, ended_at,
          billable_minutes, cost_total,
          advisor:profiles!sessions_advisor_id_fkey(full_name, avatar_url),
          client:profiles!sessions_client_id_fkey(full_name)
        `)
        .eq('id', sessionId)
        .single();

      if (fetchError || !data) {
        setError('Session not found.');
        setIsLoadingSession(false);
        return;
      }

      // Auth guard: only participants can view
      if (data.client_id !== user.id && data.advisor_id !== user.id) {
        setError('You do not have access to this transcript.');
        setIsLoadingSession(false);
        return;
      }

      const d = data as any;
      setSession({
        id: d.id,
        client_id: d.client_id,
        advisor_id: d.advisor_id,
        type: d.type,
        status: d.status,
        started_at: d.started_at,
        ended_at: d.ended_at,
        billable_minutes: d.billable_minutes,
        cost_total: d.cost_total,
        advisor_name: d.advisor?.full_name || 'Advisor',
        advisor_avatar: d.advisor?.avatar_url || `https://ui-avatars.com/api/?background=1a1a2e&color=06b6d4&bold=true&size=400&name=A`,
        client_name: d.client?.full_name || 'Client',
      });
      setIsLoadingSession(false);
    };

    fetchSession();
  }, [sessionId, user, authLoading]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (!messagesLoading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesLoading, messages.length]);

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please log in to view this transcript.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  // Loading session
  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error
  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error || 'Session not found.'}</p>
          <Button variant="outline" onClick={() => navigate('/activity')}>
            Back to Activity
          </Button>
        </div>
      </div>
    );
  }

  const isClient = user.id === session.client_id;
  const sessionDate = session.started_at
    ? new Date(session.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Unknown date';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/activity')}
            aria-label="Back to activity"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img
            src={session.advisor_avatar}
            alt={session.advisor_name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">
              Chat with {session.advisor_name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {sessionDate}
              {session.billable_minutes != null && ` · ${session.billable_minutes} min`}
              {session.cost_total != null && ` · $${session.cost_total.toFixed(2)}`}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messagesLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No Messages</h3>
              <p className="text-muted-foreground text-sm">
                {session.type !== 'chat'
                  ? 'This was a voice/video session — no chat transcript available.'
                  : 'No messages were sent during this session.'}
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isUser = message.sender_id === (isClient ? session.client_id : session.advisor_id);
                const isFromClient = message.sender_id === session.client_id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <img
                        src={isFromClient ? undefined : session.advisor_avatar}
                        alt={isFromClient ? session.client_name : session.advisor_name}
                        className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0 bg-muted"
                      />
                    )}
                    <div
                      className={`max-w-[70%] p-4 rounded-2xl ${
                        isUser
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-secondary text-foreground rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <span className={`text-xs mt-1 block ${
                        isUser ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'
                      }`}>
                        {formatMessageTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SessionTranscript;
