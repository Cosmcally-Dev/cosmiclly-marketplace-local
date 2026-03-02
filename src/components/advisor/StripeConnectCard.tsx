import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Banknote,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';

type ConnectStatus =
  | { state: 'loading' }
  | { state: 'not_connected' }
  | { state: 'pending' } // account created but onboarding incomplete
  | { state: 'active' } // charges_enabled + details_submitted
  | { state: 'error'; message: string };

export default function StripeConnectCard() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectStatus>({ state: 'loading' });
  const [isRedirecting, setIsRedirecting] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!user?.id) return;
    setStatus({ state: 'loading' });

    const { data, error } = await supabase.functions.invoke('check-connect-status');

    if (error) {
      setStatus({ state: 'error', message: error.message });
      return;
    }

    if (!data.connected) {
      setStatus({ state: 'not_connected' });
    } else if (data.onboarding_complete) {
      setStatus({ state: 'active' });
    } else {
      setStatus({ state: 'pending' });
    }
  }, [user?.id]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Re-check on return from Stripe onboarding
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe') === 'success' || params.get('stripe') === 'refresh') {
      // Clean up the query param
      const url = new URL(window.location.href);
      url.searchParams.delete('stripe');
      window.history.replaceState({}, '', url.pathname);
      checkStatus();
    }
  }, [checkStatus]);

  const handleSetupPayouts = async () => {
    setIsRedirecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { origin: window.location.origin },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No onboarding URL returned');

      window.location.href = data.url;
    } catch (err: any) {
      setStatus({ state: 'error', message: err.message || 'Failed to start onboarding' });
      setIsRedirecting(false);
    }
  };

  const renderBadge = () => {
    switch (status.state) {
      case 'active':
        return (
          <Badge variant="outline" className="border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10">
            <CheckCircle className="w-3 h-3 mr-1" /> Active
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-500/30 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/10">
            <AlertCircle className="w-3 h-3 mr-1" /> Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Not Set Up
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary" />
            Payouts
          </CardTitle>
          {status.state !== 'loading' && renderBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.state === 'loading' && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking payout status...
          </div>
        )}

        {status.state === 'not_connected' && (
          <>
            <p className="text-sm text-muted-foreground">
              Set up Stripe Connect to receive payouts from your sessions. You'll be redirected to Stripe to complete the process.
            </p>
            <Button onClick={handleSetupPayouts} disabled={isRedirecting} className="w-full sm:w-auto">
              {isRedirecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <Banknote className="w-4 h-4 mr-2" />
                  Set Up Payouts
                </>
              )}
            </Button>
          </>
        )}

        {status.state === 'pending' && (
          <>
            <p className="text-sm text-muted-foreground">
              Your Stripe account has been created but onboarding isn't complete yet. Please finish the setup to start receiving payouts.
            </p>
            <Button onClick={handleSetupPayouts} disabled={isRedirecting} variant="outline" className="w-full sm:w-auto">
              {isRedirecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Complete Stripe Setup
                </>
              )}
            </Button>
          </>
        )}

        {status.state === 'active' && (
          <>
            <p className="text-sm text-muted-foreground">
              Your payouts are set up and active. Earnings from sessions will be transferred to your connected bank account.
            </p>
            <Button
              variant="outline"
              onClick={() => window.open('https://connect.stripe.com/express_login', '_blank')}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Stripe Dashboard
            </Button>
          </>
        )}

        {status.state === 'error' && (
          <>
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{status.message}</span>
            </div>
            <Button variant="outline" onClick={checkStatus} className="w-full sm:w-auto">
              Retry
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
