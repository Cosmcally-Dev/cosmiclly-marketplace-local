import { useState, useRef, useEffect } from 'react';
import { X, Send, Clock, Star, Sparkles, Phone, MoreVertical } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Advisor } from '@/data/advisors';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  advisor: Advisor;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'advisor';
  timestamp: Date;
}

export const ChatModal = ({ isOpen, onClose, advisor }: ChatModalProps) => {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Session timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

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

  const freeMinutesRemaining = Math.max(0, (advisor.freeMinutes || 0) * 60 - sessionTime);
  const costSoFar = freeMinutesRemaining > 0 
    ? 0 
    : ((sessionTime - (advisor.freeMinutes || 0) * 60) / 60 * (advisor.discountedPrice || advisor.pricePerMinute)).toFixed(2);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[85vh] max-h-[700px] p-0 bg-card border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
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
                  ${costSoFar} charged
                </div>
              )}
            </div>

            <button 
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
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
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
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
              <div className="bg-secondary text-foreground p-3 rounded-2xl rounded-bl-md">
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
        <div className="p-4 border-t border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <Input
              type="text"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 h-12 bg-card border-border"
            />
            <Button
              variant="hero"
              size="icon"
              className="h-12 w-12"
              onClick={handleSend}
              disabled={!inputValue.trim()}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Messages are encrypted. By chatting, you agree to our Terms of Service.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
