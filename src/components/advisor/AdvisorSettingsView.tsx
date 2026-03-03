import { useEffect, useState } from "react";
import { DollarSign, Loader2, Save, RotateCcw, Sparkles, Wallet } from "lucide-react";
import StripeConnectCard from "@/components/advisor/StripeConnectCard";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Props {
  pricePerMinute: string;
  setPricePerMinute: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  selectedSpecialties: string[];
  allSpecialties: string[];
  toggleSpecialty: (s: string) => void;
  serviceChanged: boolean;
  setServiceChanged: (v: boolean) => void;
  handleSaveService: () => void | Promise<void>;
  handleDiscardService: () => void;
  isLoadingDetails: boolean;
}

const BIO_MAX = 500;

// ── Design tokens — matches AvailabilityScheduleCard palette ──────────────────
const T = {
  /* Palette */
  cyan:        "#06b6d4",
  cyanAlpha:   (a: number) => `rgba(6,182,212,${a})`,
  violet:      "#8b5cf6",
  violetAlpha: (a: number) => `rgba(139,92,246,${a})`,

  /* Card chrome */
  cardBg:      "linear-gradient(155deg, #120A2E 0%, #0C0418 55%, #09061A 100%)",
  cardBorder:  "linear-gradient(160deg, rgba(6,182,212,0.45) 0%, rgba(6,182,212,0.2) 50%, rgba(6,182,212,0.08) 100%)",
  cardShadow:  "0 0 0 0.5px rgba(6,182,212,0.08), 0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35)",

  /* Surfaces */
  obsidianBg:  "rgba(9,6,26,0.97)",

  /* Text */
  textPrimary: "rgba(255,255,255,0.92)",
  textSub:     "rgba(255,255,255,0.5)",
  textDim:     "rgba(255,255,255,0.28)",
  textDead:    "rgba(255,255,255,0.18)",

  /* Structure */
  divider:     "rgba(139,92,246,0.10)",
  ghostBorder: "rgba(255,255,255,0.08)",

  /* Typography */
  fontDisp:    "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif",
  fontMono:    "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
} as const;

// ── GlassCard: gradient border trick + deep card bg ──────────────────────────
function GlassCard({ children, noPad }: { children: React.ReactNode; noPad?: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        padding: "1.5px",
        background: T.cardBorder,
        boxShadow: T.cardShadow,
        marginBottom: "28px",
      }}
    >
      <div
        style={{
          borderRadius: "18.5px",
          background: T.cardBg,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          padding: noPad ? 0 : "24px",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── SectionLabel: small-caps with cyan icon + gradient rule ───────────────────
function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "13px" }}>
      <span style={{ color: T.cyan, display: "flex", alignItems: "center", opacity: 0.78 }}>
        {icon}
      </span>
      <span
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "1.8px",
          textTransform: "uppercase" as const,
          color: T.textDim,
          fontFamily: T.fontDisp,
          whiteSpace: "nowrap" as const,
        }}
      >
        {text}
      </span>
      <div
        style={{
          flex: 1,
          height: "1px",
          background: "linear-gradient(to right, rgba(139,92,246,0.25), transparent 80%)",
        }}
      />
    </div>
  );
}

// ── FieldRow ──────────────────────────────────────────────────────────────────
function FieldRow({
  label,
  right,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: T.textSub,
            letterSpacing: "0.1px",
            fontFamily: T.fontDisp,
          }}
        >
          {label}
        </span>
        {right}
      </div>
      {children}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height: "1px", background: T.divider, margin: "22px 0" }} />;
}

// ── PricePill: dark pill input with cyan/violet border gradient ───────────────
function PricePill({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      style={{
        borderRadius: 999,
        padding: "1.5px",
        background: focused
          ? "linear-gradient(135deg, rgba(6,182,212,0.7) 0%, rgba(139,92,246,0.4) 100%)"
          : "linear-gradient(135deg, rgba(6,182,212,0.28) 0%, rgba(139,92,246,0.15) 100%)",
        boxShadow: focused
          ? "0 0 0 3px rgba(6,182,212,0.12), 0 0 16px rgba(6,182,212,0.08)"
          : "none",
        display: "inline-flex",
        maxWidth: "196px",
        width: "100%",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div
        style={{
          position: "relative",
          borderRadius: 999,
          overflow: "hidden",
          background: "rgba(12,5,28,0.93)",
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        {/* $ icon */}
        <div
          style={{
            position: "absolute",
            left: "13px",
            zIndex: 3,
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: focused ? "rgba(6,182,212,0.16)" : "rgba(139,92,246,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.22s ease",
          }}
        >
          <DollarSign
            size={11}
            style={{
              color: focused ? T.cyan : T.violet,
              strokeWidth: 2.5,
              transition: "color 0.22s ease",
            }}
          />
        </div>

        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            paddingLeft: "46px",
            paddingRight: "18px",
            paddingTop: "10px",
            paddingBottom: "10px",
            borderRadius: "100px",
            background: "transparent",
            border: "none",
            outline: "none",
            color: T.textPrimary,
            fontFamily: T.fontDisp,
            fontSize: "15px",
            fontWeight: 600,
            letterSpacing: "0.2px",
          }}
        />
      </div>
    </div>
  );
}

// ── BioTextarea: obsidian field with cyan glow on focus ───────────────────────
function BioTextarea({
  value,
  onChange,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "12px",
          boxShadow: focused
            ? `0 0 0 1.5px ${T.cyan}, 0 0 22px rgba(6,182,212,0.09)`
            : "0 0 0 1px rgba(139,92,246,0.22)",
          transition: "box-shadow 0.25s ease",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={5}
        maxLength={maxLength}
        placeholder="Describe your gifts, experience, and approach to readings…"
        style={{
          width: "100%",
          padding: "13px 16px",
          borderRadius: "12px",
          background: T.obsidianBg,
          border: "none",
          outline: "none",
          color: "rgba(255,255,255,0.85)",
          fontFamily: T.fontDisp,
          fontSize: "13.5px",
          lineHeight: 1.75,
          resize: "vertical" as const,
          boxSizing: "border-box" as const,
          position: "relative",
          zIndex: 0,
        }}
      />
    </div>
  );
}

// ── SpecialtiesBadges: ghost pills, cyan/violet when selected ─────────────────
function SpecialtiesBadges({
  all,
  selected,
  onToggle,
}: {
  all: string[];
  selected: string[];
  onToggle: (s: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px" }}>
      {all.map((s) => {
        const active = selected.includes(s);
        return (
          <button
            key={s}
            onClick={() => onToggle(s)}
            style={{
              padding: "5px 13px",
              borderRadius: "100px",
              fontSize: "11.5px",
              fontWeight: active ? 700 : 500,
              fontFamily: T.fontDisp,
              letterSpacing: active ? "0.3px" : "0.1px",
              cursor: "pointer",
              border: active
                ? "1.5px solid rgba(6,182,212,0.75)"
                : `1px solid ${T.ghostBorder}`,
              background: active
                ? "linear-gradient(135deg, rgba(6,182,212,0.22) 0%, rgba(139,92,246,0.18) 100%)"
                : "transparent",
              color: active ? "rgba(6,182,212,0.95)" : "rgba(255,255,255,0.45)",
              boxShadow: active
                ? "0 0 12px rgba(6,182,212,0.28), inset 0 0 8px rgba(6,182,212,0.08)"
                : "none",
              transition: "all 0.18s ease",
              lineHeight: 1.5,
            }}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function AdvisorSettingsView({
  pricePerMinute,
  setPricePerMinute,
  bio,
  setBio,
  selectedSpecialties,
  allSpecialties,
  toggleSpecialty,
  serviceChanged,
  setServiceChanged,
  handleSaveService,
  handleDiscardService,
  isLoadingDetails,
}: Props) {
  // Inject Plus Jakarta Sans + Inter
  useEffect(() => {
    const id = "asv-gf";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const bioOverLimit = bio.length >= BIO_MAX;
  const bioNearLimit = bio.length > BIO_MAX * 0.85;

  return (
    <div style={{ fontFamily: T.fontDisp, paddingBottom: "24px" }}>

      {/* ── Page header ───────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 700,
            color: T.textPrimary,
            letterSpacing: "-0.4px",
            lineHeight: 1.2,
            fontFamily: T.fontDisp,
          }}
        >
          Advisor Settings
        </h1>
        <p
          style={{
            marginTop: "5px",
            fontSize: "12.5px",
            color: T.textSub,
            fontFamily: T.fontDisp,
          }}
        >
          Manage your service profile, specialties, and payouts
        </p>
      </div>

      {/* ── Service Management ────────────────────────────────────────────────── */}
      <SectionLabel icon={<Sparkles size={11} />} text="Service Management" />

      {isLoadingDetails ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "56px 0" }}>
          <Loader2 size={22} className="animate-spin" style={{ color: T.cyan }} />
        </div>
      ) : (
        <GlassCard>

          {/* Price per minute ───────────────────────────────────────────────── */}
          <FieldRow
            label="Price per minute"
            right={
              <span style={{ fontSize: "11px", color: T.textDim, fontFamily: T.fontMono }}>
                Billed per 60 sec
              </span>
            }
          >
            <PricePill
              value={pricePerMinute}
              onChange={(v) => {
                setPricePerMinute(v);
                setServiceChanged(true);
              }}
            />
          </FieldRow>

          <Divider />

          {/* Bio ────────────────────────────────────────────────────────────── */}
          <FieldRow
            label="Bio"
            right={
              <span
                style={{
                  fontFamily: T.fontMono,
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.3px",
                  color: bioOverLimit ? "#ff4d6d" : bioNearLimit ? "#f59e0b" : T.textDim,
                  transition: "color 0.2s ease",
                }}
              >
                {bio.length.toLocaleString()}
                <span style={{ color: T.textDim }}> / {BIO_MAX}</span>
              </span>
            }
          >
            <BioTextarea
              value={bio}
              onChange={(v) => {
                setBio(v);
                setServiceChanged(true);
              }}
              maxLength={BIO_MAX}
            />
          </FieldRow>

          <Divider />

          {/* Specialties ────────────────────────────────────────────────────── */}
          <FieldRow
            label="Specialties"
            right={
              <span style={{ fontSize: "11px", color: T.textDim, fontFamily: T.fontMono }}>
                {selectedSpecialties.length} selected
              </span>
            }
          >
            <SpecialtiesBadges
              all={allSpecialties}
              selected={selectedSpecialties}
              onToggle={toggleSpecialty}
            />
          </FieldRow>

          {/* Inline save / discard bar ─────────────────────────────────────── */}
          {serviceChanged && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
                paddingTop: "20px",
                marginTop: "20px",
                borderTop: `1px solid ${T.divider}`,
              }}
            >
              {/* Unsaved indicator */}
              <span
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  fontSize: "11.5px",
                  color: T.textSub,
                  fontFamily: T.fontDisp,
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#fbbf24",
                    display: "inline-block",
                    boxShadow: "0 0 7px rgba(251,191,36,0.9)",
                    flexShrink: 0,
                  }}
                />
                Unsaved changes
              </span>

              {/* Discard */}
              <button
                onClick={handleDiscardService}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.22)";
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.72)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.09)";
                  (e.currentTarget as HTMLButtonElement).style.color = T.textSub;
                }}
                style={{
                  padding: "7px 15px",
                  borderRadius: "9px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: T.textSub,
                  fontFamily: T.fontDisp,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "border-color 0.2s ease, color 0.2s ease",
                }}
              >
                <RotateCcw size={11} />
                Discard
              </button>

              {/* Save */}
              <button
                onClick={handleSaveService}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(6,182,212,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.filter = "none";
                  (e.currentTarget as HTMLButtonElement).style.transform = "none";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 22px rgba(6,182,212,0.35)";
                }}
                style={{
                  padding: "7px 18px",
                  borderRadius: "9px",
                  background: "linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(139,92,246,0.18) 100%)",
                  border: "1px solid rgba(6,182,212,0.42)",
                  color: "rgba(6,182,212,0.95)",
                  fontFamily: T.fontDisp,
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 0 22px rgba(6,182,212,0.35)",
                  letterSpacing: "0.02em",
                  transition: "box-shadow 0.3s cubic-bezier(0.16,1,0.3,1), filter 0.3s, transform 0.3s",
                }}
              >
                <Save size={12} />
                Save changes
              </button>
            </div>
          )}
        </GlassCard>
      )}

      {/* ── Payouts ──────────────────────────────────────────────────────────── */}
      <SectionLabel icon={<Wallet size={11} />} text="Payouts" />

      <GlassCard>
        <StripeConnectCard />
      </GlassCard>

    </div>
  );
}

export default AdvisorSettingsView;
