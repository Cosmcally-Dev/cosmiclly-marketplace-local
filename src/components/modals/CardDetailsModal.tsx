import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock } from 'lucide-react';

interface CardDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cardDetails: CardDetails) => void;
}

interface CardDetails {
  cardholderName: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
  zipCode: string;
}

const CardDetailsModal = ({ isOpen, onClose, onSubmit }: CardDetailsModalProps) => {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardholderName: '',
    cardNumber: '',
    expirationDate: '',
    cvv: '',
    zipCode: '',
  });

  const handleInputChange = (field: keyof CardDetails, value: string) => {
    let formattedValue = value;

    // Format card number with spaces
    if (field === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
    }

    // Format expiration date
    if (field === 'expirationDate') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2);
      }
    }

    // Limit CVV to 4 digits
    if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    // Limit zip code to 5 digits
    if (field === 'zipCode') {
      formattedValue = value.replace(/\D/g, '').slice(0, 5);
    }

    setCardDetails((prev) => ({ ...prev, [field]: formattedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(cardDetails);
  };

  const isFormValid =
    cardDetails.cardholderName.trim() !== '' &&
    cardDetails.cardNumber.replace(/\s/g, '').length === 16 &&
    cardDetails.expirationDate.length === 5 &&
    cardDetails.cvv.length >= 3 &&
    cardDetails.zipCode.length === 5;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <CreditCard className="w-5 h-5" />
            Add Card Details
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Cardholder Name */}
          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              placeholder="John Doe"
              value={cardDetails.cardholderName}
              onChange={(e) => handleInputChange('cardholderName', e.target.value)}
              className="h-11"
            />
          </div>

          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                className="h-11 pr-10"
              />
              <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {/* Expiration and CVV Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                placeholder="MM/YY"
                value={cardDetails.expirationDate}
                onChange={(e) => handleInputChange('expirationDate', e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <div className="relative">
                <Input
                  id="cvv"
                  placeholder="123"
                  type="password"
                  value={cardDetails.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  className="h-11 pr-10"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Zip Code */}
          <div className="space-y-2">
            <Label htmlFor="zipCode">Zip Code</Label>
            <Input
              id="zipCode"
              placeholder="12345"
              value={cardDetails.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              className="h-11"
            />
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span>Your payment information is encrypted and secure. We never store your full card details.</span>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={!isFormValid}
          >
            Add Card & Continue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CardDetailsModal;
