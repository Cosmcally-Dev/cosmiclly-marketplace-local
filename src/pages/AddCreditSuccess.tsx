import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';

const AddCreditSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshCredits, credits } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Refresh credits after successful Stripe checkout
    // Poll up to 3 times in case the webhook hasn't processed yet
    const refresh = async () => {
      const initialCredits = credits;
      for (let attempt = 0; attempt < 3; attempt++) {
        await new Promise(r => setTimeout(r, 2000));
        await refreshCredits();
        // If credits increased, webhook has processed
        if (credits > initialCredits) break;
      }
      setIsRefreshing(false);
    };
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-20 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 max-w-md text-center">
          <div className="bg-card rounded-xl border border-border p-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Payment Successful!
              </h1>
              <p className="text-muted-foreground">
                Your credits have been added to your account.
              </p>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
              {isRefreshing ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-lg text-muted-foreground">Updating...</span>
                </div>
              ) : (
                <p className="text-3xl font-bold text-primary">${credits.toFixed(2)}</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/advisors')} className="w-full">
                Browse Advisors
              </Button>
              <Button variant="outline" onClick={() => navigate('/add-credit')} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Buy More Credits
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AddCreditSuccess;