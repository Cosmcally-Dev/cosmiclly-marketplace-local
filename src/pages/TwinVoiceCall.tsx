import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  CreditCard,
  Mic,
  MicOff,
  PhoneOff,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useAdvisors } from '@/hooks/useAdvisors';
import { ReviewModal } from '@/components/modals/ReviewModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const TwinVoiceCall = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, credits } = useAuth();
  const { toast } = useToast();
  const { getAdvisorById } = useAdvisors();

  const advisor = getAdvisorById(id);
  const advisorDbId = advisor?.dbId || advisor?.id;

  const [callStatus, setCallStatus] = useState<
    'initializing' | 'connecting' | 'active' | 'ended'
  >('initializing');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [vapiAgentId, setVapiAgentId] = useState<string | null>(null);
  const [voiceRate, setVoiceRate] = useState(2.0);
  const [twinEnabled, setTwinEnabled] = useState<boolean | null>(null);

  const vapiRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initRef = useRef(false);

  const creditsUsed = (Math.ceil(callDuration / 60) * voiceRate);

  // Initialize: fetch twin settings, create session, start Vapi call
  useEffect(() => {
    if (authLoading || !isAuthenticated || !advisorDbId || !user?.id || initRef.current)
      return;
    initRef.current = true;

    const init = async () => {
      try {
        // Fetch advisor twin settings
        const { data: details, error: detailsError } = await supabase
          .from('advisor_details')
          .select(
            'twin_enabled, vapi_agent_id, twin_voice_rate_per_min'
          )
          .eq('id', advisorDbId)
          .single();

        if (detailsError || !details) {
          setTwinEnabled(false);
          return;
        }

        setTwinEnabled(details.twin_enabled ?? false);
        setVoiceRate(details.twin_voice_rate_per_min ?? 2.0);

        if (!details.twin_enabled || !details.vapi_agent_id) {
          setTwinEnabled(false);
          return;
        }

        setVapiAgentId(details.vapi_agent_id);

        // Check credits (at least 1 minute)
        if (credits < (details.twin_voice_rate_per_min || 2.0)) {
          toast({
            variant: 'destructive',
            title: 'Insufficient Credits',
            description: 'You need more credits for an AI voice call.',
          });
          navigate('/add-credit');
          return;
        }

        // Create AI session
        const { data: newSessionId, error: sessionError } =
          await supabase.rpc('start_ai_session', {
            p_client_id: user.id,
            p_advisor_id: advisorDbId,
            p_type: 'audio',
            p_rate: details.twin_voice_rate_per_min || 2.0,
          });

        if (sessionError) throw sessionError;
        setSessionId(newSessionId);
        setCallStatus('connecting');

        // Dynamically import Vapi Web SDK
        const vapiPublicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
        if (!vapiPublicKey) {
          throw new Error(
            'VITE_VAPI_PUBLIC_KEY is not set in environment variables'
          );
        }

        const { default: Vapi } = await import('@vapi-ai/web');
        const vapi = new Vapi(vapiPublicKey);
        vapiRef.current = vapi;

        // Set up event handlers
        vapi.on('call-start', () => {
          setCallStatus('active');
          timerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
          toast({
            title: 'Call Connected',
            description: `You're talking with ${advisor?.name}'s AI Twin`,
          });
        });

        vapi.on('call-end', () => {
          if (timerRef.current) clearInterval(timerRef.current);
          setCallStatus('ended');
          setShowReview(true);
        });

        vapi.on('error', (error: any) => {
          console.error('[TwinVoiceCall] Vapi error:', error);
          if (timerRef.current) clearInterval(timerRef.current);
          setCallStatus('ended');
          toast({
            variant: 'destructive',
            title: 'Call Error',
            description: 'The voice call encountered an error.',
          });
        });

        // Start the Vapi call with metadata for the webhook
        await vapi.start(details.vapi_agent_id, {
          metadata: {
            session_id: newSessionId,
            client_id: user.id,
            advisor_id: advisorDbId,
          },
        });
      } catch (err: any) {
        console.error('[TwinVoiceCall] Init error:', err);
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description:
            err.message || 'Failed to start AI voice call.',
        });
        navigate(`/advisor/${id}`);
      }
    };

    init();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    authLoading,
    isAuthenticated,
    advisorDbId,
    user?.id,
    credits,
    id,
    navigate,
    toast,
    advisor?.name,
  ]);

  const handleEndCall = useCallback(() => {
    if (vapiRef.current) {
      try {
        vapiRef.current.stop();
      } catch (err) {
        console.error('[TwinVoiceCall] Stop error:', err);
      }
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setCallStatus('ended');
    setShowReview(true);
  }, []);

  const handleToggleMute = useCallback(() => {
    if (!vapiRef.current) return;
    const newMuted = !isMuted;
    vapiRef.current.setMuted(newMuted);
    setIsMuted(newMuted);
  }, [isMuted]);

  const handleReviewClose = () => {
    setShowReview(false);
    navigate(`/advisor/${advisor?.id || id}`);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Auth guard
  if (!authLoading && !isAuthenticated) {
    navigate(`/advisor/${id}`);
    return null;
  }

  // Loading
  if (callStatus === 'initializing' || authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            <p className="text-sm text-muted-foreground">
              Connecting to AI Voice...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Twin not available
  if (twinEnabled === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Bot className="w-16 h-16 text-muted-foreground/40 mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">
              AI Voice Not Available
            </h2>
            <p className="text-muted-foreground max-w-md">
              This advisor hasn't set up their AI voice clone yet. Try the AI
              text chat or connect with them directly.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate(`/advisor/${id}/ai`)}
              >
                Try AI Chat
              </Button>
              <Button onClick={() => navigate(`/advisor/${id}`)}>
                Back to Advisor
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20 flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                callStatus === 'active'
                  ? handleEndCall()
                  : navigate(`/advisor/${advisor?.id || id}`)
              }
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <img
                src={advisor?.avatar}
                alt={advisor?.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/30"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-purple-500 border-2 border-card flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  {advisor?.name}
                </h3>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                  AI Voice
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {callStatus === 'connecting'
                  ? 'Connecting...'
                  : callStatus === 'active'
                    ? 'In call'
                    : 'Call ended'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm">
                <CreditCard className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground font-mono">
                  ${(credits - creditsUsed).toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                ${voiceRate.toFixed(2)}/min
              </div>
            </div>
          </div>
        </div>

        {/* AI Disclosure Banner */}
        <div className="px-4 py-2 bg-purple-500/10 border-b border-purple-500/20 text-center">
          <span className="text-xs text-purple-400">
            You're talking with {advisor?.name}'s AI Twin — Responses are
            AI-generated
          </span>
        </div>

        {/* Call Area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
          {/* Avatar */}
          <div className="relative">
            <div
              className={`w-40 h-40 rounded-full overflow-hidden border-4 ${
                callStatus === 'active'
                  ? 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.4)]'
                  : callStatus === 'connecting'
                    ? 'border-amber-500 animate-pulse'
                    : 'border-border'
              }`}
            >
              <img
                src={advisor?.avatar}
                alt={advisor?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-purple-500 border-3 border-card flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </span>
          </div>

          {/* Name & Status */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">
              {advisor?.name}
            </h2>
            <p className="text-muted-foreground mt-1">
              {callStatus === 'connecting'
                ? 'Connecting to AI Twin...'
                : callStatus === 'active'
                  ? 'AI Voice Call Active'
                  : 'Call Ended'}
            </p>
          </div>

          {/* Timer */}
          {(callStatus === 'active' || callStatus === 'ended') && (
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-foreground">
                {formatTime(callDuration)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                ${creditsUsed.toFixed(2)} credits used
              </div>
            </div>
          )}

          {/* Connecting animation */}
          {callStatus === 'connecting' && (
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full bg-purple-400 animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-3 h-3 rounded-full bg-purple-400 animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-3 h-3 rounded-full bg-purple-400 animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          )}

          {/* Call controls */}
          {callStatus === 'active' && (
            <div className="flex items-center gap-6">
              <button
                onClick={handleToggleMute}
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isMuted
                    ? 'bg-red-500/20 text-red-500 border-2 border-red-500/30'
                    : 'bg-secondary text-foreground border-2 border-border hover:border-primary'
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>

              <button
                onClick={handleEndCall}
                aria-label="End call"
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg shadow-red-500/30"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            </div>
          )}

          {/* Ended state */}
          {callStatus === 'ended' && (
            <Button onClick={() => navigate(`/advisor/${advisor?.id || id}`)}>
              Back to Advisor
            </Button>
          )}
        </div>
      </main>

      {/* Review Modal */}
      {advisor && (
        <ReviewModal
          isOpen={showReview}
          onClose={handleReviewClose}
          advisor={advisor}
          sessionType="audio"
          sessionDuration={callDuration}
          creditsUsed={creditsUsed}
          sessionId={sessionId}
        />
      )}
    </div>
  );
};

export default TwinVoiceCall;
