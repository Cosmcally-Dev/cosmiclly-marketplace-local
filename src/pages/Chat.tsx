import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Clock, Star, ArrowLeft, X, Check, CheckCheck } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useAdvisors } from '@/hooks/useAdvisors';
import { ReviewModal } from '@/components/modals/ReviewModal';
import { LowCreditWarning } from '@/components/session/LowCreditWarning';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSessionRealtime } from '@/hooks/useSessionRealtime';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useStripePayment } from '@/hooks/useStripePayment';
import { SessionHoldModal } from '@/components/modals/SessionHoldModal';
import type { ConnectionQuality } from '@/types/session';

const RINGING_TIMEOUT_MS = 60000; // 60 seconds

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, credits } = useAuth();
  const { toast } = useToast();
  const { advisors, getAdvisorById } = useAdvisors();

  const advisor = getAdvisorById(id) || advisors[0];
  const pricePerMinute = advisor.discountedPrice || advisor.pricePerMinute;

  const [chatStatus, setChatStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [inputValue, setInputValue] = useState('');
  const [sessionTime, setSessionTime] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [showLowCreditWarning, setShowLowCreditWarning] = useState(false);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [continueUntilEnd, setContinueUntilEnd] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);

  const { hasPaymentMethod, isCreatingHold, createSessionHold, captureSessionPayment } = useStripePayment();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const lastDeductionRef = useRef(0);
  const ringingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real-time chat messages hook
  const { messages, sendMessage, markAsRead } = useChatMessages(
    chatStatus === 'connected' ? sessionId : null
  );

  // Typing indicator
  const { isRemoteTyping, setLocalTyping } = useTypingIndicator(
    chatStatus === 'connected' ? sessionId : null,
    user?.id || null
  );

  // Past chat history between this client and advisor
  const advisorDbId = advisor?.dbId || advisor?.id || null;
  const { pastMessages } = useChatHistory(
    chatStatus === 'connected' ? user?.id || null : null,
    chatStatus === 'connected' ? advisorDbId : null,
    sessionId
  );

  // Handle session status changes via Supabase Realtime
  const handleStatusChange = useCallback((newStatus: string) => {
    if (newStatus === 'active') {
      // Advisor accepted the chat
      if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
        ringingTimeoutRef.current = null;
      }
      setChatStatus('connected');
      sessionStartRef.current = new Date();
      toast({
        title: "Chat Connected",
        description: `You're now chatting with ${advisor.name}`,
      });
    } else if (newStatus === 'cancelled') {
      // Advisor declined
      if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
        ringingTimeoutRef.current = null;
      }
      setChatStatus('ended');
      setIsSessionEnded(true);
      toast({
        variant: "destructive",
        title: "Chat Declined",
        description: `${advisor.name} is not available right now.`,
      });
      setTimeout(() => navigate(`/advisor/${id}`), 2000);
    } else if (newStatus === 'completed') {
      // Advisor ended the session
      setChatStatus('ended');
      setIsSessionEnded(true);
      setShowReview(true);
      toast({
        title: "Chat Ended",
        description: `${advisor.name} has ended the session.`,
      });
    }
  }, [advisor.name, id, navigate, toast]);

  useSessionRealtime({
    sessionId,
    onStatusChange: handleStatusChange,
    enabled: chatStatus === 'ringing' || chatStatus === 'connected',
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
      setChatStatus('ended');
      setIsSessionEnded(true);
    }
  }, [isAuthenticated, isLoading, navigate, id, hasMinimumCredits]);

  // Create session immediately (pending status) and start ringing
  useEffect(() => {
    if (chatStatus !== 'connecting' || !user?.id || !hasMinimumCredits) return;

    const createSession = async () => {
      try {
        const advisorDbId = advisor.dbId || advisor.id;
        const { data: newSessionId, error } = await supabase.rpc('start_rtc_session', {
          p_client_id: user.id,
          p_advisor_id: advisorDbId,
          p_type: 'chat',
          p_rate_per_minute: pricePerMinute,
          p_free_minutes: advisor.freeMinutes || 0
        });

        if (error) throw error;

        setSessionId(newSessionId);

        // If user has a Stripe payment method, show hold modal before ringing
        if (hasPaymentMethod) {
          setStripeSessionId(newSessionId);
          setShowHoldModal(true);
          return; // Don't start ringing yet — wait for hold confirmation
        }

        setChatStatus('ringing');

        // Start ringing timeout
        ringingTimeoutRef.current = setTimeout(async () => {
          try {
            await supabase.rpc('decline_session', { p_session_id: newSessionId });
          } catch (e) {
            console.warn('Failed to cancel timed-out session:', e);
          }
          setChatStatus('ended');
          setIsSessionEnded(true);
          toast({
            variant: "destructive",
            title: "No Response",
            description: `${advisor.name} is not available right now. Please try again later.`,
          });
          setTimeout(() => navigate(`/advisor/${id}`), 2000);
        }, RINGING_TIMEOUT_MS);
      } catch (error) {
        console.error('Failed to start session:', error);
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: "Failed to start the chat session. Please try again.",
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
  }, [chatStatus, advisor, pricePerMinute, user?.id, hasMinimumCredits, toast, navigate, id]);

  // Session timer and credit deduction (only when connected)
  useEffect(() => {
    if (chatStatus !== 'connected' || isSessionEnded || showInsufficientCredits) return;

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
            handleEndChat();
            toast({
              variant: "destructive",
              title: "Session Ended",
              description: "Your session has ended due to insufficient credits.",
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
  }, [chatStatus, isSessionEnded, showInsufficientCredits, advisor, credits, creditsUsed, hasShownWarning, continueUntilEnd, pricePerMinute, toast]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark incoming messages as read
  useEffect(() => {
    if (!user?.id || chatStatus !== 'connected') return;
    const unread = messages.filter(m => m.sender_id !== user.id && !m.read_at);
    if (unread.length > 0) {
      markAsRead(unread.map(m => m.id));
    }
  }, [messages, user?.id, chatStatus, markAsRead]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancelChat = async () => {
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
    setChatStatus('ended');
    setIsSessionEnded(true);
    navigate(`/advisor/${id}`);
  };

  const handleEndChat = async () => {
    if (!sessionId) {
      setIsSessionEnded(true);
      setShowReview(true);
      return;
    }

    try {
      setIsSessionEnded(true);

      const totalSeconds = sessionTime;
      const freeSeconds = (advisor.freeMinutes || 0) * 60;
      const billableSeconds = Math.max(0, totalSeconds - freeSeconds);
      const billableMinutes = Math.ceil(billableSeconds / 60);

      const quality: ConnectionQuality = 'good';

      const { error } = await supabase.rpc('end_rtc_session', {
        p_session_id: sessionId,
        p_billable_minutes: billableMinutes,
        p_connection_quality: quality
      });

      if (error) throw error;

      // Capture Stripe payment if session had a hold
      await captureSessionPayment(sessionId).catch(err => {
        console.warn('Stripe capture failed (will retry via webhook):', err);
      });

      setChatStatus('ended');
      setShowReview(true);
    } catch (error) {
      console.error('Failed to end session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end session properly. Please contact support.",
      });
      setIsSessionEnded(true);
      setChatStatus('ended');
      setShowReview(true);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isSessionEnded || !user?.id) return;

    const content = inputValue.trim();
    setInputValue('');
    setLocalTyping(false);

    try {
      await sendMessage(content, user.id);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        variant: "destructive",
        title: "Send Failed",
        description: "Failed to send message. Please try again.",
      });
      setInputValue(content); // Restore the message
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

  // Handle hold confirmation from SessionHoldModal
  const handleConfirmHold = async (maxMinutes: number) => {
    if (!stripeSessionId) return;
    setHoldError(null);

    const result = await createSessionHold(pricePerMinute, maxMinutes, stripeSessionId);
    if (!result.success) {
      setHoldError(result.error || 'Failed to authorize payment.');
      return;
    }

    // Hold succeeded — start ringing
    setShowHoldModal(false);
    setChatStatus('ringing');
    ringingTimeoutRef.current = setTimeout(async () => {
      try {
        await supabase.rpc('decline_session', { p_session_id: stripeSessionId });
      } catch (e) {
        console.warn('Failed to cancel timed-out session:', e);
      }
      setChatStatus('ended');
      setIsSessionEnded(true);
      toast({
        variant: "destructive",
        title: "No Response",
        description: `${advisor.name} is not available right now. Please try again later.`,
      });
      setTimeout(() => navigate(`/advisor/${id}`), 2000);
    }, RINGING_TIMEOUT_MS);
  };

  // Skip hold — use credits instead
  const handleSkipHold = () => {
    setShowHoldModal(false);
    setChatStatus('ringing');
    ringingTimeoutRef.current = setTimeout(async () => {
      try {
        if (sessionId) await supabase.rpc('decline_session', { p_session_id: sessionId });
      } catch (e) {
        console.warn('Failed to cancel timed-out session:', e);
      }
      setChatStatus('ended');
      setIsSessionEnded(true);
      toast({
        variant: "destructive",
        title: "No Response",
        description: `${advisor.name} is not available right now. Please try again later.`,
      });
      setTimeout(() => navigate(`/advisor/${id}`), 2000);
    }, RINGING_TIMEOUT_MS);
  };

  const handleReviewClose = () => {
    setShowReview(false);
    navigate(`/advisor/${advisor.id}`);
  };

  const freeMinutesRemaining = Math.max(0, (advisor.freeMinutes || 0) * 60 - sessionTime);
  const remainingCredits = credits - creditsUsed;
  const estimatedMinutesRemaining = Math.floor(remainingCredits / pricePerMinute);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20 flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (chatStatus === 'ringing') {
                  handleCancelChat();
                } else if (chatStatus === 'connected') {
                  handleEndChat();
                } else {
                  navigate(`/advisor/${advisor.id}`);
                }
              }}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <img
                src={advisor.avatar}
                alt={advisor.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
              />
              {chatStatus === 'connected' && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
              )}
              {chatStatus === 'ringing' && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-amber-500 border-2 border-card animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{advisor.name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3 text-accent fill-accent" />
                <span>{advisor.rating}</span>
                <span className="mx-1">•</span>
                {chatStatus === 'ringing' && (
                  <span className="text-amber-500 animate-pulse">Waiting for advisor...</span>
                )}
                {chatStatus === 'connected' && (
                  <span className="text-green-500">Online</span>
                )}
                {chatStatus === 'connecting' && (
                  <span className="text-amber-500">Connecting...</span>
                )}
                {chatStatus === 'ended' && (
                  <span className="text-muted-foreground">Session ended</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer - only when connected */}
            {chatStatus === 'connected' && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm font-mono">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{formatTime(sessionTime)}</span>
                </div>
                {freeMinutesRemaining > 0 ? (
                  <div className="text-xs text-accent">
                    {formatTime(freeMinutesRemaining)} free remaining
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    ${creditsUsed.toFixed(2)} • Balance: ${remainingCredits.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {chatStatus === 'connected' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndChat}
                disabled={isSessionEnded}
              >
                End Chat
              </Button>
            )}

            {chatStatus === 'ringing' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelChat}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Free Minutes Banner */}
        {chatStatus === 'connected' && freeMinutesRemaining > 0 && (
          <div className="px-4 py-2 bg-accent/10 border-b border-accent/20 text-center">
            <span className="text-sm text-accent font-medium">
              You have {formatTime(freeMinutesRemaining)} of free chat remaining!
            </span>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Ringing state */}
          {(chatStatus === 'connecting' || chatStatus === 'ringing') && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
              <div className="relative">
                <img
                  src={advisor.avatar}
                  alt={advisor.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-amber-500 animate-pulse"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{advisor.name}</h3>
                <p className="text-muted-foreground mt-1">
                  {chatStatus === 'connecting'
                    ? 'Connecting...'
                    : `Waiting for ${advisor.name} to accept your chat request...`}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Rate: ${pricePerMinute}/min
                  {advisor.freeMinutes ? ` • First ${advisor.freeMinutes} min free` : ''}
                </p>
              </div>
            </div>
          )}

          {/* Chat messages - only when connected or ended */}
          {(chatStatus === 'connected' || chatStatus === 'ended') && (
            <>
              {/* Previous conversations */}
              {pastMessages.length > 0 && (
                <>
                  {pastMessages.map((message) => {
                    const isUser = message.sender_id === user?.id;
                    const timestamp = new Date(message.created_at);
                    return (
                      <div
                        key={`past-${message.id}`}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'} opacity-50`}
                      >
                        {!isUser && (
                          <img
                            src={advisor.avatar}
                            alt={advisor.name}
                            className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
                          />
                        )}
                        <div
                          className={`max-w-[70%] p-4 rounded-2xl ${
                            isUser
                              ? 'bg-primary/60 text-primary-foreground rounded-br-md'
                              : 'bg-secondary/60 text-foreground rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <span className="text-xs mt-1 block text-muted-foreground">
                            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 border-t border-border" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Previous conversations</span>
                    <div className="flex-1 border-t border-border" />
                  </div>
                </>
              )}

              {messages.length === 0 && pastMessages.length === 0 && chatStatus === 'connected' && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  Chat session started. Say hello to {advisor.name}!
                </div>
              )}

              {messages.map((message) => {
                const isUser = message.sender_id === user?.id;
                const timestamp = new Date(message.created_at);
                return (
                  <div
                    key={message.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <img
                        src={advisor.avatar}
                        alt={advisor.name}
                        className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
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
                      <span className={`text-xs mt-1 flex items-center gap-1 ${
                        isUser ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground'
                      }`}>
                        {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isUser && (
                          message.read_at
                            ? <CheckCheck className="w-3.5 h-3.5 text-accent" />
                            : <Check className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Typing indicator */}
          {isRemoteTyping && chatStatus === 'connected' && (
            <div className="flex justify-start">
              <img
                src={advisor.avatar}
                alt={advisor.name}
                className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
              />
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

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <Input
                type="text"
                placeholder={
                  isSessionEnded || chatStatus === 'ended'
                    ? "Session ended"
                    : chatStatus !== 'connected'
                    ? "Waiting for advisor to accept..."
                    : "Type your message..."
                }
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); if (e.target.value.trim()) setLocalTyping(true); }}
                onKeyPress={handleKeyPress}
                className="flex-1 h-12 bg-background border-border"
                disabled={isSessionEnded || chatStatus !== 'connected'}
              />
              <Button
                variant="hero"
                size="icon"
                className="h-12 w-12"
                onClick={handleSend}
                disabled={!inputValue.trim() || isSessionEnded || chatStatus !== 'connected'}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Messages are encrypted. By chatting, you agree to our Terms of Service.
            </p>
          </div>
        </div>
      </main>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReview}
        onClose={handleReviewClose}
        advisor={advisor}
        sessionType="chat"
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
        onEndSession={handleEndChat}
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

      {/* Stripe Session Hold Modal */}
      <SessionHoldModal
        isOpen={showHoldModal}
        onClose={() => {
          setShowHoldModal(false);
          handleCancelChat();
        }}
        advisorName={advisor.name}
        advisorRate={pricePerMinute}
        freeMinutes={advisor.freeMinutes || 0}
        onConfirmHold={handleConfirmHold}
        onSkipHold={handleSkipHold}
        isProcessing={isCreatingHold}
        error={holdError}
      />
    </div>
  );
};

export default Chat;
