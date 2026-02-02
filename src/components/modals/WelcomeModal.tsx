import { Sparkles, PartyPopper } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const WelcomeModal = ({ isOpen, onClose, userName }: WelcomeModalProps) => {
  const navigate = useNavigate();

  const handleLetsGo = () => {
    onClose();
    navigate('/');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden">
        {/* Celebratory Header */}
        <div className="bg-hero-gradient p-8 text-center relative">
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-4 left-8 w-2 h-2 bg-primary rounded-full animate-twinkle" />
            <div className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary rounded-full animate-twinkle" style={{ animationDelay: '0.3s' }} />
            <div className="absolute bottom-8 left-1/4 w-1 h-1 bg-primary/70 rounded-full animate-twinkle" style={{ animationDelay: '0.6s' }} />
            <div className="absolute top-6 right-1/4 w-1.5 h-1.5 bg-primary/80 rounded-full animate-twinkle" style={{ animationDelay: '0.9s' }} />
            <div className="absolute bottom-12 right-8 w-2 h-2 bg-primary rounded-full animate-twinkle" style={{ animationDelay: '1.2s' }} />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-center gap-3 mb-4">
              <PartyPopper className="w-10 h-10 text-primary animate-bounce" style={{ animationDelay: '0.1s' }} />
              <Sparkles className="w-12 h-12 text-primary" />
              <PartyPopper className="w-10 h-10 text-primary animate-bounce" style={{ animationDelay: '0.2s', transform: 'scaleX(-1)' }} />
            </div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
              Welcome to the Community!
            </h2>
            {userName && (
              <p className="text-lg text-primary font-medium">
                Hello, {userName}! ✨
              </p>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 text-center space-y-6">
          <div className="space-y-3">
            <p className="text-foreground text-lg">
              Your account has been successfully created.
            </p>
            <p className="text-muted-foreground text-sm">
              You're now ready to connect with our gifted advisors and begin your spiritual journey.
            </p>
          </div>

          <Button 
            variant="hero" 
            size="lg" 
            className="w-full text-base font-semibold"
            onClick={handleLetsGo}
          >
            Let's Go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
