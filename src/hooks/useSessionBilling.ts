import { useState, useRef, useEffect, useCallback } from 'react';

interface UseSessionBillingOptions {
  isActive: boolean;
  credits: number;
  pricePerMinute: number;
  freeMinutes: number;
  onSessionEnd: () => void;
  onLowCredits: () => void;
  startedAt?: Date | null;
}

interface UseSessionBillingReturn {
  sessionTime: number;
  creditsUsed: number;
  remainingCredits: number;
  inFreePhase: boolean;
  freeSecondsRemaining: number;
  estimatedMinutesRemaining: number;
  getBillableMinutes: () => number;
  continueUntilEnd: boolean;
  setContinueUntilEnd: (v: boolean) => void;
  showLowCreditWarning: boolean;
  setShowLowCreditWarning: (v: boolean) => void;
  formatTime: (seconds: number) => string;
}

/**
 * Shared session billing hook.
 *
 * Billing order: credits are consumed FIRST. Free minutes only kick in
 * after the user's credit balance is exhausted. When both credits AND
 * free minutes run out the session is ended automatically.
 */
export function useSessionBilling({
  isActive,
  credits,
  pricePerMinute,
  freeMinutes,
  onSessionEnd,
  onLowCredits,
  startedAt,
}: UseSessionBillingOptions): UseSessionBillingReturn {
  const [sessionTime, setSessionTime] = useState(0);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [showLowCreditWarning, setShowLowCreditWarning] = useState(false);
  const [continueUntilEnd, setContinueUntilEnd] = useState(false);

  const lastDeductionRef = useRef(0);
  const hasShownWarningRef = useRef(false);
  const hasEndedRef = useRef(false);

  // How many full minutes the user can afford with credits
  const creditMinutesCapacity = pricePerMinute > 0
    ? Math.floor(credits / pricePerMinute)
    : Infinity;
  const creditSecondsCapacity = creditMinutesCapacity * 60;
  const freeSecondsTotal = freeMinutes * 60;

  // Timer tick — runs every second while session is active
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSessionTime((prev) => {
        const newTime = startedAt
          ? Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000))
          : prev + 1;

        // --- Phase 1: credits being consumed ---
        if (newTime <= creditSecondsCapacity) {
          const minutesElapsed = Math.floor(newTime / 60);

          if (minutesElapsed > lastDeductionRef.current && minutesElapsed > 0) {
            const totalDeducted = minutesElapsed * pricePerMinute;
            const remainingAfterDeduction = credits - totalDeducted;

            if (remainingAfterDeduction < 0 && freeSecondsTotal === 0) {
              // No credits left and no free minutes — end session
              if (!hasEndedRef.current) {
                hasEndedRef.current = true;
                onSessionEnd();
              }
            } else {
              setCreditsUsed(totalDeducted);
              lastDeductionRef.current = minutesElapsed;

              // Low-credit warning when ~2 paid minutes remain
              const paidMinutesLeft = Math.floor(remainingAfterDeduction / pricePerMinute);
              if (
                paidMinutesLeft <= 2 &&
                paidMinutesLeft >= 0 &&
                !hasShownWarningRef.current &&
                !continueUntilEnd
              ) {
                hasShownWarningRef.current = true;
                setShowLowCreditWarning(true);
                onLowCredits();
              }
            }
          }
        }
        // --- Phase 2: free minutes being consumed ---
        else {
          // Cap creditsUsed at the maximum the user could spend
          setCreditsUsed(creditMinutesCapacity * pricePerMinute);

          const freeSecondsUsed = newTime - creditSecondsCapacity;

          if (freeSecondsUsed >= freeSecondsTotal) {
            // Both credits AND free minutes exhausted
            if (!hasEndedRef.current) {
              hasEndedRef.current = true;
              onSessionEnd();
            }
          }

          // Warn when approaching end of free minutes (30s left)
          const freeSecondsRemaining = freeSecondsTotal - freeSecondsUsed;
          if (
            freeSecondsRemaining <= 30 &&
            freeSecondsRemaining > 0 &&
            !hasShownWarningRef.current &&
            !continueUntilEnd
          ) {
            hasShownWarningRef.current = true;
            setShowLowCreditWarning(true);
            onLowCredits();
          }
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isActive,
    credits,
    pricePerMinute,
    creditSecondsCapacity,
    creditMinutesCapacity,
    freeSecondsTotal,
    continueUntilEnd,
    onSessionEnd,
    onLowCredits,
    startedAt,
  ]);

  const inFreePhase = sessionTime > creditSecondsCapacity;

  const freeSecondsRemaining = inFreePhase
    ? Math.max(0, freeSecondsTotal - (sessionTime - creditSecondsCapacity))
    : freeSecondsTotal;

  const remainingCredits = Math.max(0, credits - creditsUsed);

  const estimatedMinutesRemaining = pricePerMinute > 0
    ? Math.floor(remainingCredits / pricePerMinute)
    : 0;

  /**
   * Returns the number of billable (paid) minutes to send to end_rtc_session.
   * Only counts the credit-phase minutes — free-phase minutes are excluded.
   */
  const getBillableMinutes = useCallback(() => {
    const paidSeconds = Math.min(sessionTime, creditSecondsCapacity);
    return Math.ceil(paidSeconds / 60);
  }, [sessionTime, creditSecondsCapacity]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    sessionTime,
    creditsUsed,
    remainingCredits,
    inFreePhase,
    freeSecondsRemaining,
    estimatedMinutesRemaining,
    getBillableMinutes,
    continueUntilEnd,
    setContinueUntilEnd,
    showLowCreditWarning,
    setShowLowCreditWarning,
    formatTime,
  };
}
