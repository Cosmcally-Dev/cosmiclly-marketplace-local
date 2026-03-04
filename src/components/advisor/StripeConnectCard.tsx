import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Banknote,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';

type ConnectStatus =
  | { state: 'loading' }
  | { state: 'not_connected' }
  | { state: 'pending' }
  | { state: 'active' }
  | { state: 'error'; message: string };

// ── Design tokens — matches AvailabilityScheduleCard / AdvisorSettingsView ────
const T = {
  cyan:      "#06b6d4",
  violet:    "#8b5cf6",
  textPrimary: "rgba(255,255,255,0.92)",
  textSub:   "rgba(255,255,255,0.5)",
  textDim:   "rgba(255,255,255,0.28)",
  divider:   "rgba(139,92,246,0.10)",
  fontDisp:  "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif",
  fontMono:  "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
} as const;

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ state }: { state: ConnectStatus['state'] }) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 10px",
    borderRadius: 8,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: T.fontMono,
    letterSpacing: "0.08em",
  };

  if (state === 'active') return (
    <div style={{ ...base, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.28)", color: "rgba(134,239,172,0.9)" }}>
      <CheckCircle size={11} /> ACTIVE
    </div>
  );
  if (state === 'pending') return (
    <div style={{ ...base, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24" }}>
      <Clock size={11} /> PENDING
    </div>
  );
  if (state === 'error') return (
    <div style={{ ...base, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.28)", color: "rgba(252,165,165,0.9)" }}>
      <AlertCircle size={11} /> ERROR
    </div>
  );
  return (
    <div style={{ ...base, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.35)" }}>
      NOT SET UP
    </div>
  );
}

// ── Action button styles ──────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "8px 18px",
  borderRadius: 9,
  fontSize: 12,
  fontWeight: 700,
  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  letterSpacing: "0.02em",
  cursor: "pointer",
  border: "1px solid rgba(6,182,212,0.42)",
  background: "linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(139,92,246,0.18) 100%)",
  color: "rgba(6,182,212,0.95)",
  boxShadow: "0 0 22px rgba(6,182,212,0.25)",
  transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
};

const btnOutline: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "8px 18px",
  borderRadius: 9,
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  letterSpacing: "0.01em",
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "transparent",
  color: "rgba(255,255,255,0.6)",
  boxShadow: "none",
  transition: "all 0.2s ease",
};

// ── Main component ────────────────────────────────────────────────────────────
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

    if (!data.connected) setStatus({ state: 'not_connected' });
    else if (data.onboarding_complete) setStatus({ state: 'active' });
    else setStatus({ state: 'pending' });
  }, [user?.id]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  // Re-check on return from Stripe onboarding
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe') === 'success' || params.get('stripe') === 'refresh') {
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
      const msg = err.message || 'Failed to start onboarding';
      const friendlyMsg = msg.includes('signed up for Connect')
        ? 'Payout setup is not available yet. Please contact support.'
        : msg;
      setStatus({ state: 'error', message: friendlyMsg });
      setIsRedirecting(false);
    }
  };

  return (
    <>
      {/* ── Header: icon tile + title + status badge ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          {/* Icon tile — mirrors schedule card's Clock tile */}
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              background: "linear-gradient(135deg, rgba(6,182,212,0.14) 0%, rgba(139,92,246,0.14) 100%)",
              border: "1px solid rgba(6,182,212,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 18px rgba(6,182,212,0.09)",
              flexShrink: 0,
            }}
          >
            <Banknote size={18} style={{ color: "rgba(6,182,212,0.85)" }} />
          </div>

          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: T.textPrimary,
                letterSpacing: "-0.02em",
                fontFamily: T.fontDisp,
              }}
            >
              Payouts
            </h3>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: 12,
                color: T.textSub,
                fontFamily: T.fontDisp,
              }}
            >
              Receive earnings from your sessions
            </p>
          </div>
        </div>

        {status.state !== 'loading' && <StatusBadge state={status.state} />}
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: T.divider, marginBottom: 18 }} />

      {/* ── Content states ── */}
      {status.state === 'loading' && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: T.textSub,
            fontSize: 13,
            fontFamily: T.fontDisp,
          }}
        >
          <Loader2 size={16} className="animate-spin" style={{ color: T.cyan }} />
          Checking payout status…
        </div>
      )}

      {status.state === 'not_connected' && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: T.textSub, lineHeight: 1.7, fontFamily: T.fontDisp }}>
            Set up Stripe Connect to receive payouts from your sessions. You'll be redirected to Stripe to complete the process.
          </p>
          <button
            onClick={handleSetupPayouts}
            disabled={isRedirecting}
            style={{ ...btnPrimary, opacity: isRedirecting ? 0.7 : 1 }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(6,182,212,0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.filter = "none";
              (e.currentTarget as HTMLButtonElement).style.transform = "none";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 22px rgba(6,182,212,0.25)";
            }}
          >
            {isRedirecting ? (
              <><Loader2 size={14} className="animate-spin" />Redirecting…</>
            ) : (
              <><Banknote size={14} />Set Up Payouts</>
            )}
          </button>
        </div>
      )}

      {status.state === 'pending' && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: T.textSub, lineHeight: 1.7, fontFamily: T.fontDisp }}>
            Your Stripe account has been created but onboarding isn't complete yet. Please finish the setup to start receiving payouts.
          </p>
          <button
            onClick={handleSetupPayouts}
            disabled={isRedirecting}
            style={{ ...btnOutline, opacity: isRedirecting ? 0.7 : 1 }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.22)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.72)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
            }}
          >
            {isRedirecting ? (
              <><Loader2 size={14} className="animate-spin" />Redirecting…</>
            ) : (
              <><ExternalLink size={14} />Complete Stripe Setup</>
            )}
          </button>
        </div>
      )}

      {status.state === 'active' && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: T.textSub, lineHeight: 1.7, fontFamily: T.fontDisp }}>
            Your payouts are set up and active. Earnings from sessions will be transferred to your connected bank account.
          </p>
          <button
            onClick={() => window.open('https://connect.stripe.com/express_login', '_blank')}
            style={btnOutline}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.22)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.72)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
            }}
          >
            <ExternalLink size={14} />
            View Stripe Dashboard
          </button>
        </div>
      )}

      {status.state === 'error' && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 9,
              padding: "11px 14px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.22)",
              fontSize: 13,
              color: "rgba(252,165,165,0.9)",
              fontFamily: T.fontDisp,
              lineHeight: 1.6,
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            {(status as { state: 'error'; message: string }).message}
          </div>
          <button
            onClick={checkStatus}
            style={btnOutline}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.22)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.72)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
            }}
          >
            <RotateCcw size={13} />
            Retry
          </button>
        </div>
      )}
    </>
  );
}
