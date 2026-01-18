import { AlertTriangle, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LowCreditWarningProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
  estimatedTimeRemaining: string;
  onAddCredits: () => void;
  onEndSession: () => void;
}

export const LowCreditWarning = ({
  isOpen,
  onClose,
  currentCredits,
  estimatedTimeRemaining,
  onAddCredits,
  onEndSession,
}: LowCreditWarningProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="w-5 h-5" />
            Low Credits Warning
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">
              Your credits are running low!
            </p>
            <p className="text-muted-foreground">
              Current balance: <span className="text-amber-500 font-bold">${currentCredits.toFixed(2)}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Estimated time remaining: ~{estimatedTimeRemaining}
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground mb-6">
            Add more credits to continue your session, or the session will end when credits run out.
          </p>

          <div className="flex flex-col gap-3">
            <Button variant="hero" className="w-full" onClick={onAddCredits}>
              <CreditCard className="w-4 h-4 mr-2" />
              Add Credits Now
            </Button>
            <Button variant="outline" className="w-full" onClick={onEndSession}>
              End Session
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
              Continue (Remind me later)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
