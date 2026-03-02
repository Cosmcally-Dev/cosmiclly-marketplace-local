// DORMANT: Auth & Capture flow disabled. Credits-only billing is active.
// This file is kept for potential future use but is not imported anywhere.
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SessionHoldResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  errorCode?: 'no_payment_method' | 'card_declined' | 'unknown';
}

interface CaptureResult {
  success: boolean;
  amountCaptured?: number;
  error?: string;
}

export function useStripePayment() {
  const { user, refreshCredits } = useAuth();
  const [isCreatingHold, setIsCreatingHold] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const hasPaymentMethod = !!user?.stripeCustomerId;

  /**
   * Create a hold (auth) on the user's payment method for a session.
   * Returns the PaymentIntent ID if successful, or an error if no payment method
   * or card was declined.
   */
  const createSessionHold = useCallback(async (
    advisorRate: number,
    maxMinutes: number,
    sessionId: string,
  ): Promise<SessionHoldResult> => {
    setIsCreatingHold(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-session-hold', {
        body: { advisorRate, maxMinutes, sessionId },
      });

      if (error) throw error;

      if (data?.error === 'no_payment_method') {
        return { success: false, error: 'No payment method on file.', errorCode: 'no_payment_method' };
      }

      if (data?.error === 'card_declined') {
        return { success: false, error: data.message || 'Card was declined.', errorCode: 'card_declined' };
      }

      if (data?.error) {
        return { success: false, error: data.message || data.error, errorCode: 'unknown' };
      }

      return { success: true, paymentIntentId: data.paymentIntentId };
    } catch (err: any) {
      console.error('[useStripePayment] createSessionHold error:', err);
      return { success: false, error: err.message || 'Failed to create payment hold.', errorCode: 'unknown' };
    } finally {
      setIsCreatingHold(false);
    }
  }, []);

  /**
   * Capture the exact session cost from a previously authorized hold.
   * Called after end_rtc_session has calculated cost_total.
   */
  const captureSessionPayment = useCallback(async (
    sessionId: string,
  ): Promise<CaptureResult> => {
    setIsCapturing(true);
    try {
      const { data, error } = await supabase.functions.invoke('capture-session-payment', {
        body: { sessionId },
      });

      if (error) throw error;

      if (data?.error) {
        return { success: false, error: data.message || data.error };
      }

      // Refresh credits after capture (balance may have changed)
      await refreshCredits();

      return { success: true, amountCaptured: data.amountCaptured };
    } catch (err: any) {
      console.error('[useStripePayment] captureSessionPayment error:', err);
      return { success: false, error: err.message || 'Failed to capture payment.' };
    } finally {
      setIsCapturing(false);
    }
  }, [refreshCredits]);

  return {
    hasPaymentMethod,
    isCreatingHold,
    isCapturing,
    createSessionHold,
    captureSessionPayment,
  };
}