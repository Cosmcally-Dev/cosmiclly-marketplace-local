import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff,
  Clock, Star, ArrowLeft, Wifi, WifiOff, X
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
import type { ConnectionQuality } from '@/types/session';

const RINGING_TIMEOUT_MS = 60000; // 60 seconds

const VideoCall = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, credits } = useAuth();
  const { toast } = useToast();
  const { advisors, getAdvisorById } = useAdvisors();

  const advisor = getAdvisorById(id) || advisors[0];
  const pricePerMinute = advisor.discountedPrice || advisor.pricePerMinute;

  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [sessionTime, setSessionTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showLowCreditWarning, setShowLowCreditWarning] = useState(false);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [continueUntilEnd, setContinueUntilEnd] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [webrtcEnabled, setWebrtcEnabled] = useState(false);
  const [webrtcError, setWebrtcError] = useState<string | null>(null);

  const sessionStartRef = useRef<Date | null>(null);
  const lastDeductionRef = useRef(0);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const ringingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        title: "Video Call Connected",
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
    }
  }, [advisor.name, id, navigate, toast]);

  useSessionRealtime({
    sessionId,
    onStatusChange: handleStatusChange,
    enabled: callStatus === 'ringing',
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

  // Session timer and credit deduction
  useEffect(() => {
    if (callStatus !== 'connected' || showInsufficientCredits) return;

    const interval = setInterval(() => {
      setSessionTime((prev) => {
        const newTime = prev + 1;

        const freeSeconds = (advisor.freeMinutes || 0) * 60;
        const billableSeconds = Math.max(0, newTime - freeSeconds);
        const minutesBilled = Math.floor(billableSeconds / 60);

        if (minutesBilled > lastDeductionRef.current && billableSeconds > 0) {
          const deduction = pricePerMinute;
          const remainingAfterDeduction = credits - creditsUsed - deduction;

          if (remainingAfterDeduction < 0) {
            handleEndCall();
            toast({
              variant: "destructive",
              title: "Session Ended",
              description: "Your call has ended due to insufficient credits.",
            });
          } else {
            setCreditsUsed(prev => prev + deduction);
            lastDeductionRef.current = minutesBilled;

            const newRemainingCredits = credits - creditsUsed - deduction;
            const minutesLeft = newRemainingCredits / pricePerMinute;

            if (minutesLeft <= 2 && minutesLeft > 0 && !hasShownWarning && !continueUntilEnd) {
              setShowLowCreditWarning(true);
              setHasShownWarning(true);
            }
          }
        } else if (billableSeconds === 0) {
          const remainingCredits = credits - creditsUsed;
          const minutesRemaining = remainingCredits / pricePerMinute;
          const secondsUntilBilling = freeSeconds - newTime;

          if (secondsUntilBilling <= 30 && secondsUntilBilling > 0 && minutesRemaining < 2 && !hasShownWarning && !continueUntilEnd) {
            setShowLowCreditWarning(true);
            setHasShownWarning(true);
          }
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [callStatus, showInsufficientCredits, advisor, credits, creditsUsed, hasShownWarning, continueUntilEnd, pricePerMinute, toast]);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
      const totalSeconds = sessionTime;
      const freeSeconds = (advisor.freeMinutes || 0) * 60;
      const billableSeconds = Math.max(0, totalSeconds - freeSeconds);
      const billableMinutes = Math.ceil(billableSeconds / 60);

      const quality: ConnectionQuality = webrtcQuality || 'good';

      setWebrtcEnabled(false);

      const { error } = await supabase.rpc('end_rtc_session', {
        p_session_id: sessionId,
        p_billable_minutes: billableMinutes,
        p_connection_quality: quality
      });

      if (error) throw error;

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
    setShowLowCreditWarning(false);
    setShowInsufficientCredits(false);
    navigate('/add-credit');
  };

  const handleContinueUntilEnd = () => {
    setShowLowCreditWarning(false);
    setContinueUntilEnd(true);
  };

  const handleReviewClose = () => {
    setShowReview(false);
    navigate(`/advisor/${advisor.id}`);
  };

  const freeSecondsRemaining = Math.max(0, (advisor.freeMinutes || 0) * 60 - sessionTime);
  const remainingCredits = credits - creditsUsed;
  const estimatedMinutesRemaining = Math.floor(remainingCredits / pricePerMinute);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20 flex flex-col relative">
        {/* Video Container */}
        {callStatus === 'connected' && (
          <div className="flex-1 relative bg-black">
            {/* Remote video (full size) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* No remote video fallback */}
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center">
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
                    <span>{formatTime(sessionTime)}</span>
                  </div>
                  {freeSecondsRemaining > 0 ? (
                    <span className="text-xs text-green-400">{formatTime(freeSecondsRemaining)} free</span>
                  ) : (
                    <span className="text-xs text-white/70">${creditsUsed.toFixed(2)}</span>
                  )}
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
                  {advisor.freeMinutes ? ` • First ${advisor.freeMinutes} min free` : ''}
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
        sessionDuration={sessionTime}
        creditsUsed={creditsUsed}
      />

      {/* Low Credit Warning */}
      <LowCreditWarning
        isOpen={showLowCreditWarning}
        onClose={() => setShowLowCreditWarning(false)}
        currentCredits={remainingCredits}
        estimatedTimeRemaining={`${estimatedMinutesRemaining} min`}
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
