import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, VideoOff,
  Clock, ArrowLeft, Wifi, WifiOff, Users, MessageCircle, Video,
  Check, CheckCheck, X, Send
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useAdvisorIncomingCalls } from '@/hooks/useAdvisorIncomingCalls';
import { useSessionRealtime } from '@/hooks/useSessionRealtime';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useChatHistory } from '@/hooks/useChatHistory';
import type { ConnectionQuality } from '@/types/session';

// ============================================
// SESSION LIST VIEW — /advisor-call
// ============================================
const SessionListView = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const { incomingSessions, loading } = useAdvisorIncomingCalls(user?.id);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleAccept = async (sessionId: string) => {
    setAccepting(sessionId);
    try {
      const { error } = await supabase.rpc('accept_session', {
        p_session_id: sessionId,
      });
      if (error) throw error;
      navigate(`/advisor-call/${sessionId}`);
    } catch (err: any) {
      console.error('Failed to accept session:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to Accept',
        description: err.message || 'Could not accept the session.',
      });
      setAccepting(null);
    }
  };

  const handleDecline = async (sessionId: string) => {
    try {
      const { error } = await supabase.rpc('decline_session', {
        p_session_id: sessionId,
      });
      if (error) throw error;
      toast({ title: 'Session Declined' });
    } catch (err: any) {
      console.error('Failed to decline session:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'audio': return <Phone className="w-3.5 h-3.5" />;
      case 'video': return <Video className="w-3.5 h-3.5" />;
      case 'chat': return <MessageCircle className="w-3.5 h-3.5" />;
      default: return <Phone className="w-3.5 h-3.5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-16 md:pt-20 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-16 md:pt-20 p-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/advisor-portal')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Advisor Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Incoming Sessions</h1>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">
            Loading...
          </div>
        ) : incomingSessions.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Incoming Sessions</h3>
            <p className="text-muted-foreground">
              Waiting for clients to connect...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Sessions appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {incomingSessions.map((session) => (
              <div
                key={session.id}
                className="bg-card border border-amber-500/30 rounded-xl p-5 animate-pulse-slow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {session.client_name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        {getTypeIcon(session.type)}
                        <span className="capitalize">{session.type}</span>
                      </span>
                      <span>${session.rate_per_minute}/min</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                      onClick={() => handleDecline(session.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleAccept(session.id)}
                      disabled={accepting === session.id}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {accepting === session.id ? 'Accepting...' : 'Accept'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

/** Format timestamp: show date for past days, time-only for today */
const formatMessageTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
};

// ============================================
// CALL SESSION VIEW — /advisor-call/:sessionId
// ============================================
const CallSessionView = ({ sessionId }: { sessionId: string }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [clientName, setClientName] = useState('Client');
  const [clientId, setClientId] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<'audio' | 'video' | 'chat'>('audio');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat messages hook (for chat sessions)
  const { messages: chatMessages, sendMessage, markAsRead } = useChatMessages(
    sessionType === 'chat' ? sessionId : null
  );

  // Typing indicator (for chat sessions)
  const { isRemoteTyping, setLocalTyping } = useTypingIndicator(
    sessionType === 'chat' ? sessionId : null,
    user?.id || null
  );

  // Past chat history (for chat sessions)
  const { pastMessages } = useChatHistory(
    sessionType === 'chat' ? clientId : null,
    sessionType === 'chat' ? user?.id || null : null,
    sessionId
  );

  // LiveKit WebRTC — for audio/video sessions
  const {
    state: webrtcState,
    remoteStream,
    connectionQuality: webrtcQuality,
    error: webrtcError,
    toggleAudio,
    toggleVideo,
    isMuted,
    isCameraOff,
  } = useWebRTC({
    sessionId,
    userId: user?.id || '',
    sessionType: sessionType === 'chat' ? 'audio' : sessionType,
    enabled: sessionValid && sessionType !== 'chat',
  });

  // Listen for session ending (client ends the session)
  const handleSessionStatusChange = useCallback((newStatus: string) => {
    if (newStatus === 'completed' || newStatus === 'cancelled') {
      setSessionEnded(true);
      toast({
        title: 'Session Ended',
        description: 'The client has ended the session.',
      });
      setTimeout(() => navigate('/advisor-call'), 2000);
    }
  }, [navigate, toast]);

  useSessionRealtime({
    sessionId,
    onStatusChange: handleSessionStatusChange,
    enabled: sessionValid && !sessionEnded,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) navigate('/');
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
        toast({ variant: 'destructive', title: 'Session Not Found' });
        navigate('/advisor-call');
        return;
      }

      if (session.advisor_id !== user.id) {
        toast({ variant: 'destructive', title: 'Access Denied' });
        navigate('/advisor-call');
        return;
      }

      if (session.status !== 'active') {
        toast({ title: 'Session Not Active' });
        navigate('/advisor-call');
        return;
      }

      setClientName((session as any).profiles?.full_name || 'Client');
      setClientId(session.client_id);
      const type = session.type as 'audio' | 'video' | 'chat';
      setSessionType(type);
      setStartedAt(session.started_at ? new Date(session.started_at) : new Date());
      setSessionValid(true);
      setLoading(false);
    };

    fetchSession();
  }, [sessionId, user?.id, navigate, toast]);

  // Elapsed timer
  useEffect(() => {
    if (!startedAt) return;
    const updateElapsed = () => {
      setElapsedTime(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  // Attach remote audio/video stream
  useEffect(() => {
    if (!remoteStream) return;
    if (remoteAudioRef.current && sessionType === 'audio') {
      remoteAudioRef.current.srcObject = remoteStream;
    }
    if (remoteVideoRef.current && sessionType === 'video') {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, sessionType]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Mark client messages as read (advisor side)
  useEffect(() => {
    if (!user?.id || sessionType !== 'chat') return;
    const unread = chatMessages.filter(m => m.sender_id !== user.id && !m.read_at);
    if (unread.length > 0) {
      markAsRead(unread.map(m => m.id));
    }
  }, [chatMessages, user?.id, sessionType, markAsRead]);

  // Handle WebRTC errors
  useEffect(() => {
    if (webrtcError?.startsWith('PERMISSION_DENIED')) {
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description: 'Please allow microphone access in your browser settings.',
      });
    }
  }, [webrtcError, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLeaveCall = () => {
    navigate('/advisor-call');
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !user?.id) return;
    const content = chatInput.trim();
    setChatInput('');
    setLocalTyping(false);
    try {
      await sendMessage(content, user.id);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to send message' });
      setChatInput(content);
    }
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

  // ---- Chat UI for chat sessions ----
  if (sessionType === 'chat') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-16 md:pt-20 flex flex-col">
          {/* Chat header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
            <div className="flex items-center gap-3">
              <button onClick={handleLeaveCall} className="p-2 text-muted-foreground hover:text-foreground" aria-label="Leave session">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="font-semibold text-foreground">{clientName}</h3>
                <span className="text-xs text-muted-foreground">Chat Session</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-mono flex items-center gap-1">
                <Clock className="w-4 h-4 text-primary" />
                {formatTime(elapsedTime)}
              </div>
              <Button variant="outline" size="sm" onClick={handleLeaveCall}>
                Leave
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-styled">
            {/* Previous conversations */}
            {pastMessages.length > 0 && (
              <>
                {pastMessages.map((msg) => (
                  <div
                    key={`past-${msg.id}`}
                    className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} opacity-50`}
                  >
                    <div className={`max-w-[70%] p-4 rounded-2xl ${
                      msg.sender_id === user?.id
                        ? 'bg-primary/60 text-primary-foreground rounded-br-md'
                        : 'bg-secondary/60 text-foreground rounded-bl-md'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <span className="text-xs mt-1 block text-muted-foreground">
                        {formatMessageTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Previous conversations</span>
                  <div className="flex-1 border-t border-border" />
                </div>
              </>
            )}
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] p-4 rounded-2xl ${
                  msg.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-secondary text-foreground rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <span className={`text-xs mt-1 flex items-center gap-1 ${
                    msg.sender_id === user?.id ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground'
                  }`}>
                    {formatMessageTime(msg.created_at)}
                    {msg.sender_id === user?.id && (
                      msg.read_at
                        ? <CheckCheck className="w-3.5 h-3.5 text-accent" />
                        : <Check className="w-3.5 h-3.5" />
                    )}
                  </span>
                </div>
              </div>
            ))}
            {/* Typing indicator */}
            {isRemoteTyping && !sessionEnded && (
              <div className="flex justify-start">
                <div className="bg-secondary text-foreground rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-card/50">
            <div className="flex items-center gap-3">
              <Input
                placeholder={sessionEnded ? 'Session ended' : 'Type your message...'}
                value={chatInput}
                onChange={(e) => { setChatInput(e.target.value); if (e.target.value.trim()) setLocalTyping(true); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                disabled={sessionEnded}
                className="flex-1 h-12"
              />
              <Button size="icon" className="h-12 w-12" onClick={handleSendChat} disabled={!chatInput.trim() || sessionEnded} aria-label="Send message">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ---- Audio/Video call UI ----
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Client Info */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              {sessionType === 'video' && remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-64 h-48 rounded-xl object-cover border-4 border-green-500"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center border-4 border-green-500">
                  <span className="text-4xl font-bold text-primary">
                    {clientName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-1">{clientName}</h2>
            <p className="text-muted-foreground capitalize">{sessionType} Session</p>

            {/* Connection Status */}
            <div className="text-lg font-medium mt-2">
              {webrtcState === 'connecting' || webrtcState === 'requesting' ? (
                <span className="text-amber-500 animate-pulse">Establishing {sessionType}...</span>
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
              onClick={toggleAudio}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? 'bg-red-500/20 text-red-500' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {sessionType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  isCameraOff ? 'bg-red-500/20 text-red-500' : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
                aria-label={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            )}

            <button
              onClick={handleLeaveCall}
              className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              aria-label="End call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            <button
              onClick={() => {
                const newState = !isSpeakerOn;
                setIsSpeakerOn(newState);
                if (remoteAudioRef.current) remoteAudioRef.current.muted = !newState;
              }}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                !isSpeakerOn ? 'bg-red-500/20 text-red-500' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
              aria-label={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
            >
              {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </div>

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
          <p className="font-medium">Connection Issue</p>
          <p className="mt-1 text-xs opacity-80">
            {webrtcError.startsWith('PERMISSION_DENIED')
              ? 'Microphone access was denied.'
              : webrtcError.startsWith('NO_DEVICE')
              ? 'No microphone found.'
              : 'Connection could not be established.'}
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const AdvisorCall = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();

  if (sessionId) {
    return <CallSessionView sessionId={sessionId} />;
  }

  return <SessionListView />;
};

export default AdvisorCall;
