import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  bonus: number;
  onAddCard: () => void;
  onPaymentMethod?: (method: 'google' | 'paypal') => void;
  onUseSavedCard?: (cardId: string) => void;
}

const PaymentMethodModal = ({ isOpen, onClose, amount, bonus, onAddCard, onPaymentMethod, onUseSavedCard }: PaymentMethodModalProps) => {
  const { savedCards } = useAuth();
  const totalCredits = amount + bonus;
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const handlePayWithSavedCard = () => {
    if (selectedCardId) {
      onUseSavedCard?.(selectedCardId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Purchase Credits</DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {/* Amount Display */}
          <div className="text-center mb-8">
            <div className="text-5xl font-bold text-primary mb-2">
              ${amount}
            </div>
            {bonus > 0 && (
              <div className="text-green-600 dark:text-green-400 font-medium">
                +${bonus} Bonus = ${totalCredits} Total Credits
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Select a payment method
            </p>

            {/* Saved Cards */}
            {savedCards.length > 0 && (
              <>
                <div className="space-y-2">
                  {savedCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        selectedCardId === card.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="w-10 h-7 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-foreground text-sm">•••• {card.lastFourDigits}</p>
                        <p className="text-xs text-muted-foreground">{card.cardholderName}</p>
                      </div>
                      {selectedCardId === card.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>

                {selectedCardId && (
                  <Button
                    className="w-full h-12 text-base font-medium"
                    onClick={handlePayWithSavedCard}
                  >
                    Pay ${amount} with Saved Card
                  </Button>
                )}

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or pay with</span>
                  </div>
                </div>
              </>
            )}

            {/* Google Pay */}
            <Button
              variant="outline"
              className="w-full h-12 justify-center gap-3 text-base font-medium"
              onClick={() => onPaymentMethod?.('google')}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google Pay
            </Button>

            {/* PayPal */}
            <Button
              variant="outline"
              className="w-full h-12 justify-center gap-3 text-base font-medium"
              onClick={() => onPaymentMethod?.('paypal')}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#003087" d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/>
                <path fill="#0070E0" d="M23.95 7.208c-.95 5.008-4.232 7.66-9.21 7.66h-2.323l-1.197 7.593H7.91l-.07.437a.476.476 0 0 0 .47.55h3.299c.459 0 .85-.334.922-.788l.038-.196.73-4.626.047-.255a.932.932 0 0 1 .921-.788h.58c3.764 0 6.71-1.53 7.572-5.955.36-1.85.173-3.395-.748-4.477a3.78 3.78 0 0 0-1.085-.825c.264.844.395 1.798.364 2.87z"/>
              </svg>
              Continue with PayPal
            </Button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Add Card */}
            <Button
              variant="outline"
              className="w-full h-12 justify-center gap-3 text-base font-medium"
              onClick={onAddCard}
            >
              <CreditCard className="w-5 h-5" />
              Add a New Credit or Debit Card
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodModal;
