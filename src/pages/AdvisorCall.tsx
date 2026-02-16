import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX,
  Clock, ArrowLeft, Wifi, WifiOff, Users
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWebRTC } from '@/hooks/useWebRTC';
import type { ConnectionQuality } from '@/types/session';

interface ActiveSessionRow {
  id: string;
  client_id: string;
  type: string;
  started_at: string;
  client_name: string | null;
}

// ============================================
// SESSION LIST VIEW — /advisor-call
// ============================================
const SessionListView = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<ActiveSessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Poll for active sessions every 5 seconds
  useEffect(() => {
    if (!user?.id) return;

    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, client_id, type, started_at, profiles!sessions_client_id_fkey(full_name)')
        .eq('advisor_id', user.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false });

      if (error) {
        console.warn('[AdvisorCall] Failed to fetch sessions:', error.message);
        setLoading(false);
        return;
      }

      const mapped: ActiveSessionRow[] = (data || []).map((s: any) => ({
        id: s.id,
        client_id: s.client_id,
        type: s.type,
        started_at: s.started_at,
        client_name: s.profiles?.full_name || 'Unknown Client',
      }));

      setSessions(mapped);
      setLoading(false);
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const formatElapsed = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const seconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-16 md:pt-20 p-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Home
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Active Sessions</h1>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Active Sessions</h3>
            <p className="text-muted-foreground">
              Waiting for clients to start a call...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This page auto-refreshes every 5 seconds.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-card border border-border rounded-xl p-5 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {session.client_name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      {session.type === 'audio' ? (
                        <Phone className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span className="capitalize">{session.type}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatElapsed(session.started_at)}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(`/advisor-call/${session.id}`)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Join Call
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// ============================================
// CALL SESSION VIEW — /advisor-call/:sessionId
// ============================================
const CallSessionView = ({ sessionId }: { sessionId: string }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [clientName, setClientName] = useState('Client');
  const [sessionType, setSessionType] = useState<'audio' | 'chat'>('audio');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [loading, setLoading] = useState(true);

  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // LiveKit WebRTC — same hook as VoiceCall.tsx
  const {
    state: webrtcState,
    remoteStream,
    connectionQuality: webrtcQuality,
    error: webrtcError,
    toggleAudio,
    isMuted,
  } = useWebRTC({
    sessionId,
    userId: user?.id || '',
    sessionType: 'audio',
    enabled: sessionValid,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Fetch session details and verify advisor ownership
  useEffect(() => {
    if (!user?.id) return;

    const fetchSession = async () => {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('*, profiles!sessions_client_id_fkey(full_name)')
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        toast({
          variant: 'destructive',
          title: 'Session Not Found',
          description: 'This session does not exist or has ended.',
        });
        navigate('/advisor-call');
        return;
      }

      // Verify this advisor owns the session
      if (session.advisor_id !== user.id) {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You are not the advisor for this session.',
        });
        navigate('/advisor-call');
        return;
      }

      // Check session is still active
      if (session.status !== 'active') {
        toast({
          title: 'Session Ended',
          description: 'This session has already ended.',
        });
        navigate('/advisor-call');
        return;
      }

      setClientName((session as any).profiles?.full_name || 'Client');
      setSessionType(session.type === 'chat' ? 'chat' : 'audio');
      setStartedAt(new Date(session.started_at!));
      setSessionValid(true);
      setLoading(false);
    };

    fetchSession();
  }, [sessionId, user?.id, navigate, toast]);

  // Elapsed timer
  useEffect(() => {
    if (!startedAt) return;

    const updateElapsed = () => {
      const now = new Date();
      setElapsedTime(Math.floor((now.getTime() - startedAt.getTime()) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  // Attach remote audio stream
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle WebRTC errors
  useEffect(() => {
    if (webrtcError) {
      if (webrtcError.startsWith('PERMISSION_DENIED')) {
        toast({
          variant: 'destructive',
          title: 'Microphone Access Denied',
          description: 'Please allow microphone access in your browser settings.',
        });
      }
    }
  }, [webrtcError, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLeaveCall = () => {
    // Advisor leaves — no billing logic, client handles end_rtc_session
    navigate('/advisor-call');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-16 md:pt-20 flex items-center justify-center">
          <p className="text-muted-foreground">Loading session...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Client Info */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center border-4 border-green-500">
                <span className="text-4xl font-bold text-primary">
                  {clientName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-1">{clientName}</h2>
            <p className="text-muted-foreground capitalize">{sessionType} Session</p>

            {/* Connection Status */}
            <div className="text-lg font-medium mt-2">
              {webrtcState === 'connecting' || webrtcState === 'requesting' ? (
                <span className="text-amber-500 animate-pulse">Establishing audio...</span>
              ) : webrtcState === 'connected' ? (
                <span className="text-green-500">Connected</span>
              ) : webrtcState === 'reconnecting' ? (
                <span className="text-amber-500 animate-pulse">Reconnecting...</span>
              ) : webrtcState === 'failed' ? (
                <span className="text-red-500">Connection Lost</span>
              ) : (
                <span className="text-amber-500 animate-pulse">Joining...</span>
              )}
            </div>

            {/* Connection Quality */}
            {webrtcState === 'connected' && (
              <div className={`flex items-center justify-center gap-1 text-sm mt-1 ${
                webrtcQuality === 'excellent' ? 'text-green-500' :
                webrtcQuality === 'good' ? 'text-green-400' :
                webrtcQuality === 'poor' ? 'text-amber-500' :
                'text-red-500'
              }`}>
                {webrtcQuality === 'lost' ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                <span className="capitalize">{webrtcQuality}</span>
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-2 text-3xl font-mono">
              <Clock className="w-6 h-6 text-primary" />
              <span className="text-foreground">{formatTime(elapsedTime)}</span>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Billing is managed on the client side
            </p>
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <button
              onClick={async () => {
                await toggleAudio();
              }}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isMuted
                  ? 'bg-red-500/20 text-red-500'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={handleLeaveCall}
              className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            <button
              onClick={() => {
                const newState = !isSpeakerOn;
                setIsSpeakerOn(newState);
                if (remoteAudioRef.current) {
                  remoteAudioRef.current.muted = !newState;
                }
              }}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                !isSpeakerOn
                  ? 'bg-red-500/20 text-red-500'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </div>

          {/* Back button */}
          <div className="text-center">
            <Button variant="outline" onClick={handleLeaveCall}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Leave Call
            </Button>
          </div>
        </div>
      </main>

      {/* Hidden audio element */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* WebRTC Error Display */}
      {webrtcError && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
          <p className="font-medium">Audio Connection Issue</p>
          <p className="mt-1 text-xs opacity-80">
            {webrtcError.startsWith('PERMISSION_DENIED')
              ? 'Microphone access was denied. Please enable it in browser settings.'
              : webrtcError.startsWith('NO_DEVICE')
              ? 'No microphone found. Please connect one and try again.'
              : 'Audio connection could not be established.'}
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT — routes between list/call
// ============================================
const AdvisorCall = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();

  if (sessionId) {
    return <CallSessionView sessionId={sessionId} />;
  }

  return <SessionListView />;
};

export default AdvisorCall;
