import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff,
  Clock, Star, ArrowLeft, Wifi, WifiOff, X, Minimize2, Maximize2
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
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
import { RINGING_TIMEOUT_MS } from '@/utils/constants';

const VideoCall = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, credits } = useAuth();
  const { toast } = useToast();
  const { advisors, getAdvisorById, isLoading: advisorsLoading } = useAdvisors();

  const advisor = getAdvisorById(id) || advisors[0];
  const pricePerMinute = advisor?.discountedPrice ?? advisor?.pricePerMinute ?? 0;

  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);
  const [webrtcEnabled, setWebrtcEnabled] = useState(false);
  const [webrtcError, setWebrtcError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);

  const sessionStartRef = useRef<Date | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const ringingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endCallRef = useRef<() => void>(() => {});

  // Billing hook — credits consumed first, free minutes as fallback
  const billing = useSessionBilling({
    isActive: callStatus === 'connected' && !showInsufficientCredits,
    credits,
    pricePerMinute,
    freeMinutes: advisor?.freeMinutes || 0,
    startedAt: sessionStartedAt,
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

  // LiveKit WebRTC hook - video mode
  const {
    state: webrtcState,
    remoteStream,
    connectionQuality: webrtcQuality,
    error: webrtcHookError,
    toggleAudio,
    toggleVideo,
    isMuted: webrtcMuted,
    isCameraOff,
  } = useWebRTC({
    sessionId: sessionId || '',
    userId: user?.id || '',
    sessionType: 'video',
    enabled: webrtcEnabled,
  });

  // Handle session status changes via Supabase Realtime
  const handleStatusChange = useCallback((newStatus: string, _oldStatus: string, startedAt?: string | null) => {
    if (newStatus === 'active') {
      // Advisor accepted the call
      if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
        ringingTimeoutRef.current = null;
      }
      setCallStatus('connected');
      const ts = startedAt ? new Date(startedAt) : new Date();
      sessionStartRef.current = ts;
      setSessionStartedAt(ts);
      setWebrtcEnabled(true);
      toast({
        title: "Video Call Connected",
        description: `You're now connected with ${advisor?.name}`,
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
        description: `${advisor?.name} is not available right now.`,
      });
      setTimeout(() => navigate(`/advisor/${id}`), 2000);
    } else if (newStatus === 'completed') {
      // Advisor ended the session
      setWebrtcEnabled(false);
      setCallStatus('ended');
      setShowReview(true);
      toast({
        title: "Call Ended",
        description: `${advisor?.name} has ended the session.`,
      });
    }
  }, [advisor?.name, id, navigate, toast]);

  useSessionRealtime({
    sessionId,
    onStatusChange: handleStatusChange,
    enabled: callStatus === 'ringing' || callStatus === 'connected',
  });

  // Check if user has enough credits to start session
  const hasMinimumCredits = credits >= pricePerMinute || (advisor?.freeMinutes && advisor.freeMinutes > 0);

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
    if (callStatus !== 'connecting' || !user?.id || !hasMinimumCredits || !advisor) return;

    const createSession = async () => {
      try {
        const advisorDbId = advisor.dbId || advisor.id;
        const { data: newSessionId, error } = await supabase.rpc('start_rtc_session', {
          p_client_id: user.id,
          p_advisor_id: advisorDbId,
          p_type: 'video' as const,
          p_rate_per_minute: pricePerMinute,
          p_free_minutes: advisor.freeMinutes || 0
        });

        if (error) throw error;

        setSessionId(newSessionId);
        setCallStatus('ringing');

        // Start ringing timeout
        ringingTimeoutRef.current = setTimeout(async () => {
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

  // Attach remote video stream to video element
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
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
          title: "Camera/Microphone Access Denied",
          description: "Please allow camera and microphone access in your browser settings.",
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
              session_type: 'Video Call',
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

  if (advisorsLoading || !advisor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20 flex flex-col relative">
        {/* Video Container */}
        {callStatus === 'connected' && (
          <div className={isFullscreen
            ? 'flex-1 relative bg-black'
            : 'relative bg-black mx-auto mt-4 rounded-xl overflow-hidden shadow-2xl'
          } style={!isFullscreen ? { width: '640px', maxWidth: '90vw', aspectRatio: '16/9' } : undefined}>
            {/* Remote video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* No remote video fallback */}
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center text-white">
                  <img
                    src={advisor.avatar}
                    alt={advisor.name}
                    className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2 border-white/30"
                  />
                  <p className="text-white/70">
                    {webrtcState === 'connecting' ? 'Establishing video...' : 'Waiting for video...'}
                  </p>
                </div>
              </div>
            )}

            {/* Overlay: top bar with timer and info */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-semibold">{advisor.name}</h3>
                  {webrtcState === 'connected' && webrtcQuality && (
                    <span className={`flex items-center gap-1 text-xs ${
                      webrtcQuality === 'excellent' ? 'text-green-400' :
                      webrtcQuality === 'good' ? 'text-green-300' :
                      webrtcQuality === 'poor' ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {webrtcQuality === 'lost' ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                      <span className="capitalize">{webrtcQuality}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-white">
                  <div className="flex items-center gap-1 text-sm font-mono">
                    <Clock className="w-4 h-4" />
                    <span>{billing.formatTime(billing.sessionTime)}</span>
                  </div>
                  {billing.inFreePhase && billing.freeSecondsRemaining > 0 ? (
                    <span className="text-xs text-green-400">{billing.formatTime(billing.freeSecondsRemaining)} free</span>
                  ) : (
                    <span className="text-xs text-white/70">${billing.creditsUsed.toFixed(2)}</span>
                  )}
                  {/* Fullscreen toggle */}
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                    title={isFullscreen ? 'Minimize video' : 'Maximize video'}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <div className="flex items-center justify-center gap-6">
                {/* Mute */}
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
                      ? 'bg-red-500 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                {/* Camera toggle */}
                <button
                  onClick={async () => {
                    if (webrtcEnabled) {
                      await toggleVideo();
                    }
                  }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                    isCameraOff
                      ? 'bg-red-500 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>

                {/* End call */}
                <button
                  onClick={handleEndCall}
                  className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Non-fullscreen: show billing info below video */}
        {callStatus === 'connected' && !isFullscreen && (
          <div className="mx-auto mt-4 px-4 text-center">
            <div className="text-sm text-muted-foreground">
              Rate: ${pricePerMinute}/min • Balance: ${billing.remainingCredits.toFixed(2)}
            </div>
          </div>
        )}

        {/* Ringing state (full screen) */}
        {(callStatus === 'connecting' || callStatus === 'ringing') && (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
              <div className="relative inline-block mb-6">
                <img
                  src={advisor.avatar}
                  alt={advisor.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-amber-500 animate-pulse"
                />
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-1">{advisor.name}</h2>
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-4">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span>{advisor.rating}</span>
                <span className="mx-1">•</span>
                <span>{advisor.title}</span>
              </div>

              <div className="text-lg font-medium mb-6">
                {callStatus === 'connecting' && (
                  <span className="text-amber-500 animate-pulse">Connecting...</span>
                )}
                {callStatus === 'ringing' && (
                  <span className="text-amber-500 animate-pulse">
                    <Video className="w-5 h-5 inline-block mr-2 animate-bounce" />
                    Video call ringing... Waiting for {advisor.name}
                  </span>
                )}
              </div>

              <div className="bg-card border border-amber-500/30 rounded-xl p-4 mb-6">
                <p className="text-muted-foreground text-sm">
                  Rate: ${pricePerMinute}/min
                  {advisor.freeMinutes ? ` • ${advisor.freeMinutes} free min included` : ''}
                </p>
              </div>

              {callStatus === 'ringing' && (
                <button
                  onClick={handleCancelCall}
                  className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors mx-auto"
                >
                  <X className="w-7 h-7" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Ended state */}
        {callStatus === 'ended' && !showReview && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <img
                src={advisor.avatar}
                alt={advisor.name}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-muted"
              />
              <h2 className="text-xl font-bold text-foreground mb-2">{advisor.name}</h2>
              <p className="text-muted-foreground mb-4">Video call ended</p>
              <Button onClick={() => navigate(`/advisor/${advisor.id}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Button>
            </div>
          </div>
        )}
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

      {/* WebRTC Error Display */}
      {webrtcError && callStatus === 'connected' && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive z-50">
          <p className="font-medium">Video Connection Issue</p>
          <p className="mt-1 text-xs opacity-80">
            {webrtcError.startsWith('PERMISSION_DENIED')
              ? 'Camera/microphone access was denied. Please enable it in browser settings.'
              : webrtcError.startsWith('NO_DEVICE')
              ? 'No camera or microphone found. Please connect them and try again.'
              : 'Video connection could not be established. The session will continue but video may not work.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
