import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Bot, CreditCard } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useAdvisors } from '@/hooks/useAdvisors';
import { useAiChat } from '@/hooks/useAiChat';
import { ReviewModal } from '@/components/modals/ReviewModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatMessageTime } from '@/utils/formatters';

const TwinChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, credits } = useAuth();
  const { toast } = useToast();
  const { getAdvisorById } = useAdvisors();

  const advisor = getAdvisorById(id);
  const advisorDbId = advisor?.dbId || advisor?.id;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [twinEnabled, setTwinEnabled] = useState<boolean | null>(null);
  const [textRate, setTextRate] = useState(0.5);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  const {
    messages,
    isSending,
    sendMessage,
    error: chatError,
    creditsUsedInSession,
  } = useAiChat(sessionActive ? sessionId : null, advisorDbId || null);

  // Fetch advisor Twin AI settings and create session
  useEffect(() => {
    if (authLoading || !isAuthenticated || !advisorDbId || !user?.id || initRef.current)
      return;
    initRef.current = true;

    const init = async () => {
      try {
        // Fetch twin settings
        const { data: details, error: detailsError } = await supabase
          .from('advisor_details')
          .select('twin_enabled, twin_text_rate_per_msg')
          .eq('id', advisorDbId)
          .single();

        if (detailsError || !details) {
          setTwinEnabled(false);
          setIsInitializing(false);
          return;
        }

        setTwinEnabled(details.twin_enabled ?? false);
        setTextRate(details.twin_text_rate_per_msg ?? 0.5);

        if (!details.twin_enabled) {
          setIsInitializing(false);
          return;
        }

        // Check credits
        if (credits < (details.twin_text_rate_per_msg || 0.5)) {
          toast({
            variant: 'destructive',
            title: 'Insufficient Credits',
            description: 'You need more credits to chat with this AI Twin.',
          });
          navigate('/add-credit');
          return;
        }

        // Create AI session (immediate — no ringing)
        const { data: newSessionId, error: sessionError } = await supabase.rpc(
          'start_ai_session',
          {
            p_client_id: user.id,
            p_advisor_id: advisorDbId,
            p_type: 'chat',
            p_rate: 0,
          }
        );

        if (sessionError) throw sessionError;

        setSessionId(newSessionId);
        setSessionActive(true);
      } catch (err: any) {
        console.error('[TwinChat] Init error:', err);
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: 'Failed to start AI chat session.',
        });
        navigate(`/advisor/${id}`);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [authLoading, isAuthenticated, advisorDbId, user?.id, credits, id, navigate, toast]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending || !user?.id || !sessionActive) return;

    const content = inputValue.trim();
    setInputValue('');

    try {
      await sendMessage(content, user.id);
    } catch {
      setInputValue(content);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndChat = async () => {
    if (!sessionId || isEnding) return;
    setIsEnding(true);

    try {
      await supabase.rpc('end_ai_session', {
        p_session_id: sessionId,
        p_total_credits_used: creditsUsedInSession,
      });
    } catch (err) {
      console.error('[TwinChat] End session error:', err);
    }

    setSessionActive(false);
    setShowReview(true);
  };

  const handleReviewClose = () => {
    setShowReview(false);
    navigate(`/advisor/${advisor?.id || id}`);
  };

  // Auth guard
  if (!authLoading && !isAuthenticated) {
    navigate(`/advisor/${id}`);
    return null;
  }

  // Loading state
  if (isInitializing || authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            <p className="text-sm text-muted-foreground">
              Connecting to AI Twin...
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
              AI Twin Not Available
            </h2>
            <p className="text-muted-foreground max-w-md">
              This advisor hasn't enabled their AI Twin yet. Try connecting with
              them directly instead.
            </p>
            <Button onClick={() => navigate(`/advisor/${id}`)}>
              Back to Advisor
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20 flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                sessionActive
                  ? handleEndChat()
                  : navigate(`/advisor/${advisor?.id || id}`)
              }
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Go back"
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
                  AI Twin
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Powered by AI — Available 24/7
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm">
                <CreditCard className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground font-mono">
                  ${(credits - creditsUsedInSession).toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                ${textRate.toFixed(2)}/msg
              </div>
            </div>

            {sessionActive && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndChat}
                disabled={isEnding}
              >
                End Chat
              </Button>
            )}
          </div>
        </div>

        {/* AI Disclosure Banner */}
        <div className="px-4 py-2 bg-purple-500/10 border-b border-purple-500/20 text-center">
          <span className="text-xs text-purple-400">
            You're chatting with {advisor?.name}'s AI Twin — Responses are
            AI-generated
          </span>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isSending && (
            <div className="text-center text-muted-foreground text-sm py-8">
              <Bot className="w-10 h-10 mx-auto mb-3 text-purple-400/60" />
              <p>Start chatting with {advisor?.name}'s AI Twin.</p>
              <p className="text-xs mt-1">
                Each message costs ${textRate.toFixed(2)} credits.
              </p>
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
                  <div className="relative mr-2 flex-shrink-0">
                    <img
                      src={advisor?.avatar}
                      alt={advisor?.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-purple-500 border border-card flex items-center justify-center">
                      <Bot className="w-2 h-2 text-white" />
                    </span>
                  </div>
                )}
                <div
                  className={`max-w-[70%] p-4 rounded-2xl ${
                    isUser
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-purple-500/10 border border-purple-500/20 text-foreground rounded-bl-md'
                  }`}
                >
                  {!isUser && message.is_ai_generated && (
                    <span className="text-[10px] text-purple-400 font-medium uppercase tracking-wide block mb-1">
                      AI
                    </span>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <span
                    className={`text-xs mt-1 block ${
                      isUser
                        ? 'text-primary-foreground/70 text-right'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* AI thinking indicator */}
          {isSending && (
            <div className="flex justify-start">
              <div className="relative mr-2 flex-shrink-0">
                <img
                  src={advisor?.avatar}
                  alt={advisor?.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-purple-500 border border-card flex items-center justify-center">
                  <Bot className="w-2 h-2 text-white" />
                </span>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-purple-400 font-medium uppercase tracking-wide mr-1">
                    AI
                  </span>
                  <span
                    className="w-2 h-2 rounded-full bg-purple-400/60 animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-purple-400/60 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-purple-400/60 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error banner */}
        {chatError && (
          <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 text-center">
            <span className="text-xs text-destructive">{chatError}</span>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <Input
                type="text"
                placeholder={
                  !sessionActive
                    ? 'Session ended'
                    : isSending
                      ? 'AI is thinking...'
                      : 'Type your message...'
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 h-12 bg-background border-border"
                disabled={!sessionActive || isSending || isEnding}
              />
              <Button
                variant="hero"
                size="icon"
                className="h-12 w-12"
                onClick={handleSend}
                disabled={
                  !inputValue.trim() || !sessionActive || isSending || isEnding
                }
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              AI-generated responses. Use your judgment and verify important
              information.
            </p>
          </div>
        </div>
      </main>

      {/* Review Modal */}
      {advisor && (
        <ReviewModal
          isOpen={showReview}
          onClose={handleReviewClose}
          advisor={advisor}
          sessionType="chat"
          sessionDuration={0}
          creditsUsed={creditsUsedInSession}
          sessionId={sessionId}
        />
      )}
    </div>
  );
};

export default TwinChat;
