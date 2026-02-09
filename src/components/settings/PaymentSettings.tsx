import { useNavigate } from 'react-router-dom';
import { CreditCard, Plus, Star, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const PaymentSettings = () => {
  const navigate = useNavigate();
  const { savedCards, deleteCard, setDefaultCard } = useAuth();
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Payment Methods</h2>
        <Button variant="outline" size="sm" onClick={() => navigate('/add-credit')}>
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </Button>
      </div>

      <Separator />

      {savedCards.length > 0 ? (
        <div className="space-y-4">
          {savedCards.map((card) => (
            <div
              key={card.id}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                card.isDefault
                  ? 'bg-primary/5 border-primary'
                  : 'bg-muted/50 border-border'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gradient-to-r from-primary/80 to-primary rounded flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">•••• •••• •••• {card.lastFourDigits}</p>
                    {card.isDefault && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{card.cardholderName} · Expires {card.expirationDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!card.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setDefaultCard(card.id);
                      toast({
                        title: "Default card updated",
                        description: `Card ending in ${card.lastFourDigits} is now your default payment method.`,
                      });
                    }}
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Set Default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    deleteCard(card.id);
                    toast({
                      title: "Card removed",
                      description: `Card ending in ${card.lastFourDigits} has been removed.`,
                    });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-foreground mb-2">No payment methods</h3>
          <p className="text-sm text-muted-foreground mb-4">Add a payment method to purchase credits</p>
          <Button onClick={() => navigate('/add-credit')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      )}

      <Separator />

      <div>
        <h3 className="font-medium text-foreground mb-4">Transaction History</h3>
        <p className="text-muted-foreground text-sm">View your recent transactions and purchase history.</p>
        <Button variant="link" className="px-0 mt-2">
          View Transaction History
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default PaymentSettings;
