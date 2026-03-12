import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Clock, Star, ArrowLeft, X, Check, CheckCheck } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
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
import { useSessionBilling } from '@/hooks/useSessionBilling';
import type { ConnectionQuality } from '@/types/session';
import { formatMessageTime } from '@/utils/formatters';
import { RINGING_TIMEOUT_MS } from '@/utils/constants';

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, credits } = useAuth();
  const { toast } = useToast();
  const { advisors, getAdvisorById, isLoading: advisorsLoading } = useAdvisors();

  const advisor = getAdvisorById(id) || advisors[0];
  const pricePerMinute = advisor?.discountedPrice ?? advisor?.pricePerMinute ?? 0;

  const [chatStatus, setChatStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [inputValue, setInputValue] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const ringingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endChatRef = useRef<() => void>(() => {});

  // Billing hook — credits consumed first, free minutes as fallback
  const billing = useSessionBilling({
    isActive: chatStatus === 'connected' && !isSessionEnded && !showInsufficientCredits,
    credits,
    pricePerMinute,
    freeMinutes: advisor?.freeMinutes || 0,
    startedAt: sessionStartedAt,
    onSessionEnd: () => {
      endChatRef.current();
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
  const handleStatusChange = useCallback((newStatus: string, _oldStatus: string, startedAt?: string | null) => {
    if (newStatus === 'active') {
      // Advisor accepted the chat
      if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
        ringingTimeoutRef.current = null;
      }
      setChatStatus('connected');
      const ts = startedAt ? new Date(startedAt) : new Date();
      sessionStartRef.current = ts;
      setSessionStartedAt(ts);
      toast({
        title: "Chat Connected",
        description: `You're now chatting with ${advisor?.name}`,
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
        description: `${advisor?.name} is not available right now.`,
      });
      setTimeout(() => navigate(`/advisor/${id}`), 2000);
    } else if (newStatus === 'completed') {
      // Advisor ended the session
      setChatStatus('ended');
      setIsSessionEnded(true);
      setShowReview(true);
      toast({
        title: "Chat Ended",
        description: `${advisor?.name} has ended the session.`,
      });
    }
  }, [advisor?.name, id, navigate, toast]);

  useSessionRealtime({
    sessionId,
    onStatusChange: handleStatusChange,
    enabled: chatStatus === 'ringing' || chatStatus === 'connected',
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
      setChatStatus('ended');
      setIsSessionEnded(true);
    }
  }, [isAuthenticated, isLoading, navigate, id, hasMinimumCredits]);

  // Create session immediately (pending status) and start ringing
  useEffect(() => {
    if (chatStatus !== 'connecting' || !user?.id || !hasMinimumCredits || !advisor) return;

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

      const billableMinutes = billing.getBillableMinutes();
      const quality: ConnectionQuality = 'good';

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
              advisor_image: advisor.avatar,
              order_no: sessionId?.slice(0, 8).toUpperCase() || 'N/A',
              order_date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              session_type: 'Chat',
              duration_minutes: billableMinutes,
              total_cost: cost,
            },
          });
        }).catch(() => {});
      }

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
    billing.setShowLowCreditWarning(false);
    setShowInsufficientCredits(false);
    navigate('/add-credit');
  };

  const handleContinueUntilEnd = () => {
    billing.setShowLowCreditWarning(false);
    billing.setContinueUntilEnd(true);
  };

  // Keep endChatRef in sync so billing hook can call it
  endChatRef.current = handleEndChat;

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
                  <span className="text-foreground">{billing.formatTime(billing.sessionTime)}</span>
                </div>
                {billing.inFreePhase && billing.freeSecondsRemaining > 0 ? (
                  <div className="text-xs text-accent">
                    {billing.formatTime(billing.freeSecondsRemaining)} free remaining
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    ${billing.creditsUsed.toFixed(2)} • Balance: ${billing.remainingCredits.toFixed(2)}
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
        {chatStatus === 'connected' && billing.inFreePhase && billing.freeSecondsRemaining > 0 && (
          <div className="px-4 py-2 bg-accent/10 border-b border-accent/20 text-center">
            <span className="text-sm text-accent font-medium">
              You have {billing.formatTime(billing.freeSecondsRemaining)} of free chat remaining!
            </span>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-styled">
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
                  {advisor.freeMinutes ? ` • ${advisor.freeMinutes} free min included` : ''}
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
                            {formatMessageTime(message.created_at)}
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
                        {formatMessageTime(message.created_at)}
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

    </div>
  );
};

export default Chat;
