import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX,
  Clock, Star, ArrowLeft, MessageCircle, Wifi, WifiOff, X
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAdvisors } from '@/hooks/useAdvisors';
import { ReviewModal } from '@/components/modals/ReviewModal';
import { LowCreditWarning } from '@/components/session/LowCreditWarning';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useSessionRealtime } from '@/hooks/useSessionRealtime';
import { useSessionBilling } from '@/hooks/useSessionBilling';
import type { ConnectionQuality } from '@/types/session';

const RINGING_TIMEOUT_MS = 60000; // 60 seconds

const VoiceCall = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, credits } = useAuth();
  const { toast } = useToast();
  const { advisors, getAdvisorById } = useAdvisors();

  const advisor = getAdvisorById(id) || advisors[0];
  const pricePerMinute = advisor.discountedPrice || advisor.pricePerMinute;

  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [webrtcEnabled, setWebrtcEnabled] = useState(false);
  const [webrtcError, setWebrtcError] = useState<string | null>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const ringingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endCallRef = useRef<() => void>(() => {});

  // Billing hook — credits consumed first, free minutes as fallback
  const billing = useSessionBilling({
    isActive: callStatus === 'connected' && !showInsufficientCredits,
    credits,
    pricePerMinute,
    freeMinutes: advisor.freeMinutes || 0,
    onSessionEnd: () => {
      endCallRef.current();
      toast({
        variant: "destructive",
        title: "Session Ended",
        description: "Your credits and free minutes have been used up.",
      });
    },
    onLowCredits: () => {
      if (user?.email) {
        import('@/services/email').then(({ sendEmail }) => {
          sendEmail({
            toEmail: user.email!,
            toName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Client',
            emailType: 'low_credit_warning',
            templateParams: { remaining_credits: String(credits) },
          });
        }).catch(() => {});
      }
    },
  });

  // LiveKit WebRTC hook - initializes when webrtcEnabled is true
  const {
    state: webrtcState,
    remoteStream,
    connectionQuality: webrtcQuality,
    error: webrtcHookError,
    toggleAudio,
    isMuted: webrtcMuted,
  } = useWebRTC({
    sessionId: sessionId || '',
    userId: user?.id || '',
    sessionType: 'audio',
    enabled: webrtcEnabled,
  });

  // Handle session status changes via Supabase Realtime
  const handleStatusChange = useCallback((newStatus: string) => {
    if (newStatus === 'active') {
      // Advisor accepted the call
      if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
        ringingTimeoutRef.current = null;
      }
      setCallStatus('connected');
      sessionStartRef.current = new Date();
      setWebrtcEnabled(true);
      toast({
        title: "Call Connected",
        description: `You're now connected with ${advisor.name}`,
      });
    } else if (newStatus === 'cancelled') {
      // Advisor declined the call
      if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
        ringingTimeoutRef.current = null;
      }
      setCallStatus('ended');
      toast({
        variant: "destructive",
        title: "Call Declined",
        description: `${advisor.name} is not available right now.`,
      });
      setTimeout(() => navigate(`/advisor/${id}`), 2000);
    } else if (newStatus === 'completed') {
      // Advisor ended the session
      setWebrtcEnabled(false);
      setCallStatus('ended');
      setShowReview(true);
      toast({
        title: "Call Ended",
        description: `${advisor.name} has ended the session.`,
      });
    }
  }, [advisor.name, id, navigate, toast]);

  useSessionRealtime({
    sessionId,
    onStatusChange: handleStatusChange,
    enabled: callStatus === 'ringing' || callStatus === 'connected',
  });

  // Check if user has enough credits to start session
  const hasMinimumCredits = credits >= pricePerMinute || (advisor.freeMinutes && advisor.freeMinutes > 0);

  // Redirect to login if not authenticated or show insufficient credits
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate(`/advisor/${id}`);
      return;
    }
    if (!hasMinimumCredits) {
      setShowInsufficientCredits(true);
      setCallStatus('ended');
    }
  }, [isAuthenticated, isLoading, navigate, id, hasMinimumCredits]);

  // Create session immediately (pending status) and start ringing
  useEffect(() => {
    if (callStatus !== 'connecting' || !user?.id || !hasMinimumCredits) return;

    const createSession = async () => {
      try {
        const advisorDbId = advisor.dbId || advisor.id;
        console.log('[VoiceCall] Creating session:', {
          client_id: user.id,
          advisor_id: advisorDbId,
          type: 'audio',
          rate: pricePerMinute,
        });

        const { data: newSessionId, error } = await supabase.rpc('start_rtc_session', {
          p_client_id: user.id,
          p_advisor_id: advisorDbId,
          p_type: 'audio' as const,
          p_rate_per_minute: pricePerMinute,
          p_free_minutes: advisor.freeMinutes || 0
        });

        if (error) throw error;

        console.log('[VoiceCall] Session created with id:', newSessionId);
        setSessionId(newSessionId);
        setCallStatus('ringing');

        // Start ringing timeout
        ringingTimeoutRef.current = setTimeout(async () => {
          // Advisor didn't respond in time
          try {
            await supabase.rpc('decline_session', { p_session_id: newSessionId });
          } catch (e) {
            console.warn('Failed to cancel timed-out session:', e);
          }
          setCallStatus('ended');
          toast({
            variant: "destructive",
            title: "No Answer",
            description: `${advisor.name} is not available right now. Please try again later.`,
          });
          setTimeout(() => navigate(`/advisor/${id}`), 2000);
        }, RINGING_TIMEOUT_MS);
      } catch (error) {
        console.error('Failed to start session:', error);
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: "Failed to start the session. Please try again.",
        });
        navigate(`/advisor/${id}`);
      }
    };

    createSession();

    return () => {
      if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
      }
    };
  }, [callStatus, advisor, pricePerMinute, user?.id, hasMinimumCredits, toast, navigate, id]);

  // Attach remote audio stream to audio element
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Sync WebRTC mute state
  useEffect(() => {
    setIsMuted(webrtcMuted);
  }, [webrtcMuted]);

  // Handle WebRTC errors
  useEffect(() => {
    if (webrtcHookError) {
      setWebrtcError(webrtcHookError);
      if (webrtcHookError.startsWith('PERMISSION_DENIED')) {
        toast({
          variant: "destructive",
          title: "Microphone Access Denied",
          description: "Please allow microphone access in your browser settings to make calls.",
        });
      }
    }
  }, [webrtcHookError, toast]);

  const handleCancelCall = async () => {
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    if (sessionId) {
      try {
        await supabase.rpc('decline_session', { p_session_id: sessionId });
      } catch (e) {
        console.warn('Failed to cancel session:', e);
      }
    }
    setCallStatus('ended');
    navigate(`/advisor/${id}`);
  };

  const handleEndCall = async () => {
    if (!sessionId) {
      setCallStatus('ended');
      setShowReview(true);
      return;
    }

    try {
      const billableMinutes = billing.getBillableMinutes();
      const quality: ConnectionQuality = webrtcQuality || 'good';

      setWebrtcEnabled(false);

      const { error } = await supabase.rpc('end_rtc_session', {
        p_session_id: sessionId,
        p_billable_minutes: billableMinutes,
        p_connection_quality: quality
      });

      if (error) throw error;

      // Send session receipt email (fire-and-forget)
      if (user?.email) {
        const cost = (billableMinutes * pricePerMinute).toFixed(2);
        import('@/services/email').then(({ sendEmail }) => {
          sendEmail({
            toEmail: user.email!,
            toName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Client',
            emailType: 'session_receipt',
            templateParams: {
              advisor_name: advisor.name,
              session_type: 'Voice Call',
              duration_minutes: billableMinutes,
              total_cost: cost,
            },
          });
        }).catch(() => {});
      }

      setCallStatus('ended');
      setShowReview(true);
    } catch (error) {
      console.error('Failed to end session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end session properly. Please contact support.",
      });
      setCallStatus('ended');
      setShowReview(true);
    }
  };

  const handleAddCredits = () => {
    billing.setShowLowCreditWarning(false);
    setShowInsufficientCredits(false);
    navigate('/add-credit');
  };

  const handleContinueUntilEnd = () => {
    billing.setShowLowCreditWarning(false);
    billing.setContinueUntilEnd(true);
  };

  // Keep endCallRef in sync so billing hook can call it
  endCallRef.current = handleEndCall;

  const handleReviewClose = () => {
    setShowReview(false);
    navigate(`/advisor/${advisor.id}`);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Advisor Info */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <img
                src={advisor.avatar}
                alt={advisor.name}
                className={`w-32 h-32 rounded-full object-cover border-4 ${
                  callStatus === 'connected'
                    ? 'border-green-500 animate-pulse'
                    : callStatus === 'ringing'
                    ? 'border-amber-500 animate-pulse'
                    : callStatus === 'connecting'
                    ? 'border-amber-500'
                    : 'border-muted'
                }`}
              />
              {callStatus === 'connected' && (
                <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
              )}
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-1">{advisor.name}</h2>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-2">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span>{advisor.rating}</span>
              <span className="mx-1">•</span>
              <span>{advisor.title}</span>
            </div>

            {/* Call Status */}
            <div className="text-lg font-medium">
              {callStatus === 'connecting' && (
                <span className="text-amber-500 animate-pulse">Connecting...</span>
              )}
              {callStatus === 'ringing' && (
                <span className="text-amber-500 animate-pulse">
                  <Phone className="w-5 h-5 inline-block mr-2 animate-bounce" />
                  Ringing... Waiting for {advisor.name}
                </span>
              )}
              {callStatus === 'connected' && webrtcState === 'connecting' && (
                <span className="text-amber-500 animate-pulse">Establishing audio...</span>
              )}
              {callStatus === 'connected' && webrtcState === 'connected' && (
                <span className="text-green-500">Connected</span>
              )}
              {callStatus === 'connected' && webrtcState === 'reconnecting' && (
                <span className="text-amber-500 animate-pulse">Reconnecting...</span>
              )}
              {callStatus === 'connected' && webrtcState === 'failed' && (
                <span className="text-red-500">Connection Lost</span>
              )}
              {callStatus === 'connected' && !['connecting', 'connected', 'reconnecting', 'failed'].includes(webrtcState) && (
                <span className="text-green-500">Connected</span>
              )}
              {callStatus === 'ended' && (
                <span className="text-muted-foreground">Call Ended</span>
              )}
            </div>

            {/* Connection Quality Indicator */}
            {callStatus === 'connected' && webrtcState === 'connected' && (
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

          {/* Timer & Cost - only show when connected */}
          {callStatus === 'connected' && (
            <div className="bg-card border border-border rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center gap-2 text-3xl font-mono mb-4">
                <Clock className="w-6 h-6 text-primary" />
                <span className="text-foreground">{billing.formatTime(billing.sessionTime)}</span>
              </div>

              <div className="text-center space-y-1">
                {billing.inFreePhase && billing.freeSecondsRemaining > 0 ? (
                  <div className="text-accent font-medium">
                    Free minutes: {billing.formatTime(billing.freeSecondsRemaining)} remaining
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    Cost: <span className="text-foreground font-semibold">${billing.creditsUsed.toFixed(2)}</span>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Rate: ${pricePerMinute}/min - Balance: ${billing.remainingCredits.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Ringing info card */}
          {callStatus === 'ringing' && (
            <div className="bg-card border border-amber-500/30 rounded-xl p-6 mb-8 text-center">
              <p className="text-muted-foreground">
                Waiting for {advisor.name} to accept your call...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Rate: ${pricePerMinute}/min
                {advisor.freeMinutes ? ` - ${advisor.freeMinutes} free min included` : ''}
              </p>
            </div>
          )}

          {/* Cancel button during ringing */}
          {callStatus === 'ringing' && (
            <div className="flex justify-center mb-8">
              <button
                onClick={handleCancelCall}
                className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-7 h-7" />
              </button>
            </div>
          )}

          {/* Call Controls - only when connected */}
          {callStatus === 'connected' && (
            <div className="flex items-center justify-center gap-6 mb-8">
              <button
                onClick={async () => {
                  if (webrtcEnabled) {
                    await toggleAudio();
                  } else {
                    setIsMuted(!isMuted);
                  }
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
                onClick={handleEndCall}
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
          )}

          {/* Back Button (when ended) */}
          {callStatus === 'ended' && !showReview && (
            <div className="text-center">
              <Button onClick={() => navigate(`/advisor/${advisor.id}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Button>
            </div>
          )}

          {/* Switch to Chat Option */}
          {callStatus === 'connected' && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  handleEndCall();
                  navigate(`/chat/${advisor.id}`);
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Switch to Chat
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReview}
        onClose={handleReviewClose}
        advisor={advisor}
        sessionType="call"
        sessionDuration={billing.sessionTime}
        creditsUsed={billing.creditsUsed}
        sessionId={sessionId}
      />

      {/* Low Credit Warning */}
      <LowCreditWarning
        isOpen={billing.showLowCreditWarning}
        onClose={() => billing.setShowLowCreditWarning(false)}
        currentCredits={billing.remainingCredits}
        estimatedTimeRemaining={`${billing.estimatedMinutesRemaining} min`}
        onAddCredits={handleAddCredits}
        onEndSession={handleEndCall}
        onContinueUntilEnd={handleContinueUntilEnd}
      />

      {/* Insufficient Credits Modal */}
      <LowCreditWarning
        isOpen={showInsufficientCredits}
        onClose={() => {
          setShowInsufficientCredits(false);
          navigate(`/advisor/${advisor.id}`);
        }}
        currentCredits={credits}
        estimatedTimeRemaining="0 min"
        onAddCredits={handleAddCredits}
        onEndSession={() => navigate(`/advisor/${advisor.id}`)}
        isInsufficientCredits
      />

      {/* Hidden audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* WebRTC Error Display */}
      {webrtcError && callStatus === 'connected' && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
          <p className="font-medium">Audio Connection Issue</p>
          <p className="mt-1 text-xs opacity-80">
            {webrtcError.startsWith('PERMISSION_DENIED')
              ? 'Microphone access was denied. Please enable it in browser settings.'
              : webrtcError.startsWith('NO_DEVICE')
              ? 'No microphone found. Please connect one and try again.'
              : 'Audio connection could not be established. The session will continue but audio may not work.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceCall;
