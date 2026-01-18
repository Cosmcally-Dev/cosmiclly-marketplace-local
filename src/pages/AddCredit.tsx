import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import PaymentMethodModal from '@/components/modals/PaymentMethodModal';
import CardDetailsModal from '@/components/modals/CardDetailsModal';

const creditPackages = [
  { amount: 10, bonus: 0, popular: false },
  { amount: 25, bonus: 5, popular: false },
  { amount: 50, bonus: 10, popular: true },
  { amount: 100, bonus: 25, popular: false },
  { amount: 150, bonus: 40, popular: false },
  { amount: 200, bonus: 60, popular: false },
];

const AddCredit = () => {
  const navigate = useNavigate();
  const { addCredits, addCard } = useAuth();
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  const handlePackageClick = (amount: number) => {
    setSelectedAmount(amount);
    setIsPaymentModalOpen(true);
  };

  const handleAddCard = () => {
    setIsPaymentModalOpen(false);
    setIsCardModalOpen(true);
  };

  const handleCardSubmit = (cardDetails: { cardholderName: string; cardNumber: string; expirationDate: string }) => {
    const selectedPackage = creditPackages.find(p => p.amount === selectedAmount);
    const totalCredits = (selectedAmount || 0) + (selectedPackage?.bonus || 0);
    
    // Save card (only last 4 digits)
    addCard({
      cardholderName: cardDetails.cardholderName,
      lastFourDigits: cardDetails.cardNumber.replace(/\s/g, '').slice(-4),
      expirationDate: cardDetails.expirationDate,
    });
    
    // Add credits
    addCredits(totalCredits);
    
    setIsCardModalOpen(false);
    setSelectedAmount(null);
    
    toast({
      title: "Payment Successful!",
      description: `$${totalCredits} credits have been added to your account.`,
    });
  };

  const handlePaymentMethod = (method: 'google' | 'paypal') => {
    const selectedPackage = creditPackages.find(p => p.amount === selectedAmount);
    const totalCredits = (selectedAmount || 0) + (selectedPackage?.bonus || 0);
    
    // Add credits
    addCredits(totalCredits);
    
    setIsPaymentModalOpen(false);
    setSelectedAmount(null);
    
    toast({
      title: "Payment Successful!",
      description: `$${totalCredits} credits have been added to your account via ${method === 'google' ? 'Google Pay' : 'PayPal'}.`,
    });
  };

  const handleUseSavedCard = (cardId: string) => {
    const selectedPackage = creditPackages.find(p => p.amount === selectedAmount);
    const totalCredits = (selectedAmount || 0) + (selectedPackage?.bonus || 0);
    
    // Add credits
    addCredits(totalCredits);
    
    setIsPaymentModalOpen(false);
    setSelectedAmount(null);
    
    toast({
      title: "Payment Successful!",
      description: `$${totalCredits} credits have been added to your account.`,
    });
  };

  const selectedPackage = creditPackages.find(p => p.amount === selectedAmount);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Add Credits to Your Account
            </h1>
            <p className="text-muted-foreground text-lg">
              Choose a package and get bonus credits on larger purchases
            </p>
          </div>

          {/* Credit Packages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {creditPackages.map((pkg) => (
              <button
                key={pkg.amount}
                onClick={() => handlePackageClick(pkg.amount)}
                className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg text-left ${
                  pkg.popular
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Most Popular
                  </div>
                )}

                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground mb-2">
                    ${pkg.amount}
                  </div>
                  
                  {pkg.bonus > 0 && (
                    <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 font-medium">
                      <Gift className="w-4 h-4" />
                      +${pkg.bonus} Bonus
                    </div>
                  )}

                  <div className="mt-4 text-sm text-muted-foreground">
                    {pkg.bonus > 0 ? (
                      <span>Get <span className="font-semibold text-foreground">${pkg.amount + pkg.bonus}</span> in credits</span>
                    ) : (
                      <span>Get ${pkg.amount} in credits</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="mt-12 text-center">
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span>256-bit SSL Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span>Money-Back Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={selectedAmount || 0}
        bonus={selectedPackage?.bonus || 0}
        onAddCard={handleAddCard}
        onPaymentMethod={handlePaymentMethod}
        onUseSavedCard={handleUseSavedCard}
      />

      {/* Card Details Modal */}
      <CardDetailsModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        onSubmit={handleCardSubmit}
      />
    </div>
  );
};

export default AddCredit;
