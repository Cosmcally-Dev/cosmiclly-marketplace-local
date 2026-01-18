import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, Clock, Star, ArrowLeft, Phone, MoreVertical } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { advisors, type Advisor } from '@/data/advisors';
import { useAuth } from '@/hooks/useAuth';
import { ReviewModal } from '@/components/modals/ReviewModal';
import { LowCreditWarning } from '@/components/session/LowCreditWarning';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'advisor';
  timestamp: Date;
}

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, credits, addCredits, addSessionLog } = useAuth();
  const { toast } = useToast();
  
  const advisor = advisors.find(a => a.id === id) || advisors[0];
  const pricePerMinute = advisor.discountedPrice || advisor.pricePerMinute;
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! Welcome to your reading with ${advisor.name}. I'm here to help guide you on your journey. What brings you here today?`,
      sender: 'advisor',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [showLowCreditWarning, setShowLowCreditWarning] = useState(false);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [continueUntilEnd, setContinueUntilEnd] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionStartRef = useRef<Date>(new Date());
  const lastDeductionRef = useRef(0);

  // Check if user has enough credits to start session
  const hasMinimumCredits = credits >= pricePerMinute || (advisor.freeMinutes && advisor.freeMinutes > 0);

  // Redirect to login if not authenticated or show insufficient credits
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/advisor/${id}`);
      return;
    }
    
    // Check if user has enough credits (unless there are free minutes)
    if (!hasMinimumCredits) {
      setShowInsufficientCredits(true);
    }
  }, [isAuthenticated, navigate, id, hasMinimumCredits]);

  // Session timer and credit deduction
  useEffect(() => {
    if (isSessionEnded || showInsufficientCredits) return;
    
    const interval = setInterval(() => {
      setSessionTime((prev) => {
        const newTime = prev + 1;
        
        // Check for credit deduction every 60 seconds after free minutes
        const freeSeconds = (advisor.freeMinutes || 0) * 60;
        const billableSeconds = Math.max(0, newTime - freeSeconds);
        const minutesBilled = Math.floor(billableSeconds / 60);
        
        if (minutesBilled > lastDeductionRef.current && billableSeconds > 0) {
          const deduction = pricePerMinute;
          const remainingAfterDeduction = credits - creditsUsed - deduction;
          
          // Check if enough credits
          if (remainingAfterDeduction < 0) {
            // End session due to insufficient credits
            handleEndChat();
            toast({
              variant: "destructive",
              title: "Session Ended",
              description: "Your session has ended due to insufficient credits.",
            });
          } else {
            setCreditsUsed(prev => prev + deduction);
            lastDeductionRef.current = minutesBilled;
            
            // Check remaining credits after this deduction
            const newRemainingCredits = credits - creditsUsed - deduction;
            const minutesLeft = newRemainingCredits / pricePerMinute;
            
            // Show low credit warning at 2 minutes remaining (if not already shown and not continuing until end)
            if (minutesLeft <= 2 && minutesLeft > 0 && !hasShownWarning && !continueUntilEnd) {
              setShowLowCreditWarning(true);
              setHasShownWarning(true);
            }
          }
        } else if (billableSeconds === 0) {
          // Still in free minutes - check upcoming credit requirement
          const remainingCredits = credits - creditsUsed;
          const minutesRemaining = remainingCredits / pricePerMinute;
          const secondsUntilBilling = freeSeconds - newTime;
          
          // Warn 30 seconds before free minutes end if credits are low
          if (secondsUntilBilling <= 30 && secondsUntilBilling > 0 && minutesRemaining < 2 && !hasShownWarning && !continueUntilEnd) {
            setShowLowCreditWarning(true);
            setHasShownWarning(true);
          }
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isSessionEnded, showInsufficientCredits, advisor, credits, creditsUsed, hasShownWarning, continueUntilEnd, pricePerMinute, toast]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndChat = () => {
    setIsSessionEnded(true);
    
    // Log the session
    if (addSessionLog) {
      addSessionLog({
        type: 'chat',
        advisorId: advisor.id,
        advisorName: advisor.name,
        duration: sessionTime,
        creditsUsed: creditsUsed,
        timestamp: sessionStartRef.current,
      });
    }
    
    // Deduct credits
    if (creditsUsed > 0) {
      addCredits(-creditsUsed);
    }
    
    setShowReview(true);
  };

  const handleSend = () => {
    if (!inputValue.trim() || isSessionEnded) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate advisor response
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        "I sense there's something weighing on your heart. Let me tune into your energy...",
        "The cards are revealing an interesting pattern. There's a significant change coming your way.",
        "I'm picking up on strong emotions around this situation. Trust your intuition here.",
        "The universe is aligning to bring you what you need. Stay patient and open.",
        "I see a connection forming that will bring you great joy. Keep your heart open.",
      ];
      const advisorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'advisor',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, advisorMessage]);
    }, 2000 + Math.random() * 2000);
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
              onClick={() => navigate(`/advisor/${advisor.id}`)}
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
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{advisor.name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3 text-accent fill-accent" />
                <span>{advisor.rating}</span>
                <span className="mx-1">•</span>
                <span>{advisor.title}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
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

            <Button 
              variant="destructive"
              size="sm"
              onClick={handleEndChat}
              disabled={isSessionEnded}
            >
              End Chat
            </Button>
          </div>
        </div>

        {/* Free Minutes Banner */}
        {freeMinutesRemaining > 0 && (
          <div className="px-4 py-2 bg-accent/10 border-b border-accent/20 text-center">
            <span className="text-sm text-accent font-medium">
              🎁 You have {formatTime(freeMinutesRemaining)} of free chat remaining!
            </span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'advisor' && (
                <img 
                  src={advisor.avatar} 
                  alt={advisor.name}
                  className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
                />
              )}
              <div
                className={`max-w-[70%] p-4 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-secondary text-foreground rounded-bl-md'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <span className={`text-xs mt-1 block ${
                  message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <img 
                src={advisor.avatar} 
                alt={advisor.name}
                className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
              />
              <div className="bg-secondary text-foreground p-4 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
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
                placeholder={isSessionEnded ? "Session ended" : "Type your message..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 h-12 bg-background border-border"
                disabled={isSessionEnded}
              />
              <Button
                variant="hero"
                size="icon"
                className="h-12 w-12"
                onClick={handleSend}
                disabled={!inputValue.trim() || isSessionEnded}
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
    </div>
  );
};

export default Chat;
