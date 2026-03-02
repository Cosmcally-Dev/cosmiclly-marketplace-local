// DORMANT: Auth & Capture flow disabled. Credits-only billing is active.
// This file is kept for potential future use but is not imported anywhere.
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Shield, Clock, Loader2, AlertCircle } from 'lucide-react';

interface SessionHoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  advisorName: string;
  advisorRate: number;
  freeMinutes: number;
  onConfirmHold: (maxMinutes: number) => Promise<void>;
  onSkipHold: () => void;
  isProcessing: boolean;
  error?: string | null;
}

const DURATION_OPTIONS = [
  { minutes: 10, label: '10 min' },
  { minutes: 20, label: '20 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '60 min' },
];

export function SessionHoldModal({
  isOpen,
  onClose,
  advisorName,
  advisorRate,
  freeMinutes,
  onConfirmHold,
  onSkipHold,
  isProcessing,
  error,
}: SessionHoldModalProps) {
  const [selectedMinutes, setSelectedMinutes] = useState(20);

  const billableMinutes = Math.max(0, selectedMinutes - freeMinutes);
  const maxCharge = billableMinutes * advisorRate;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Authorize Session Payment</DialogTitle>
          <DialogDescription className="text-center">
            A temporary hold will be placed on your card. You'll only be charged for the actual session time.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-5">
          {/* Duration selector */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Maximum session duration</p>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.minutes}
                  onClick={() => setSelectedMinutes(opt.minutes)}
                  disabled={isProcessing}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border-2 ${
                    selectedMinutes === opt.minutes
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/50 text-foreground hover:border-primary/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Rate
              </span>
              <span className="text-foreground font-medium">${advisorRate}/min</span>
            </div>
            {freeMinutes > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Free minutes</span>
                <span className="text-green-600 dark:text-green-400 font-medium">{freeMinutes} min</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Max hold amount
              </span>
              <span className="text-foreground font-bold">${maxCharge.toFixed(2)}</span>
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/10 rounded-lg p-3">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
            <span>
              This is a temporary authorization, not a charge. You'll only pay for the exact minutes used.
              If the session is free, the hold will be released automatically.
            </span>
          </div>

          {/* Error display */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => onConfirmHold(selectedMinutes)}
              disabled={isProcessing}
              className="w-full h-11"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authorizing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Authorize ${maxCharge.toFixed(2)} Hold
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={onSkipHold}
              disabled={isProcessing}
              className="w-full text-muted-foreground"
            >
              Use credits instead
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}