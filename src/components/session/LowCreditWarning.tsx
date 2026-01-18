import { AlertTriangle, CreditCard, XCircle } from 'lucide-react';
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
  onContinueUntilEnd?: () => void;
  isInsufficientCredits?: boolean;
}

export const LowCreditWarning = ({
  isOpen,
  onClose,
  currentCredits,
  estimatedTimeRemaining,
  onAddCredits,
  onEndSession,
  onContinueUntilEnd,
  isInsufficientCredits = false,
}: LowCreditWarningProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isInsufficientCredits ? 'text-destructive' : 'text-amber-500'}`}>
            {isInsufficientCredits ? (
              <>
                <XCircle className="w-5 h-5" />
                Insufficient Credits
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5" />
                Low Credits Warning
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isInsufficientCredits ? 'bg-destructive/20' : 'bg-amber-500/20'
            }`}>
              {isInsufficientCredits ? (
                <XCircle className="w-8 h-8 text-destructive" />
              ) : (
                <CreditCard className="w-8 h-8 text-amber-500" />
              )}
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">
              {isInsufficientCredits 
                ? "You don't have enough credits!" 
                : "Your credits are running low!"}
            </p>
            <p className="text-muted-foreground">
              Current balance: <span className={`font-bold ${isInsufficientCredits ? 'text-destructive' : 'text-amber-500'}`}>
                ${currentCredits.toFixed(2)}
              </span>
            </p>
            {!isInsufficientCredits && (
              <p className="text-sm text-muted-foreground mt-1">
                Estimated time remaining: ~{estimatedTimeRemaining}
              </p>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground mb-6">
            {isInsufficientCredits
              ? "Add credits to start your session with this advisor."
              : "Add more credits to continue your session, or it will end when credits run out."}
          </p>

          <div className="flex flex-col gap-3">
            <Button variant="hero" className="w-full" onClick={onAddCredits}>
              <CreditCard className="w-4 h-4 mr-2" />
              Add Credits Now
            </Button>
            
            {isInsufficientCredits ? (
              <Button variant="outline" className="w-full" onClick={onEndSession}>
                Go Back
              </Button>
            ) : (
              <>
                {onContinueUntilEnd && (
                  <Button variant="outline" className="w-full" onClick={onContinueUntilEnd}>
                    Continue Until Credits Run Out
                  </Button>
                )}
                <Button variant="ghost" className="w-full text-muted-foreground" onClick={onEndSession}>
                  End Session Now
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
