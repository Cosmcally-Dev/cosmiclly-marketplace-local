import { useState, useCallback } from "react";
import { Clock, Plus, Check, Zap } from "lucide-react";
import { TimePicker } from "@/components/ui/time-picker";

// ─── Types ──────────────────────────────────────────────────────────────────

type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

interface DaySlot {
  enabled: boolean;
  start: string;
  end: string;
  breaks?: Array<{ start: string; end: string }>;
}

type Schedule = Record<DayKey, DaySlot>;

interface AvailabilityScheduleCardProps {
  schedule: Schedule;
  scheduleChanged?: boolean;
  onToggleDay: (day: string) => void;
  onUpdateTime: (day: string, field: "start" | "end", value: string) => void;
  onSave: () => void;
  onDiscard: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DAY_LABELS: Record<DayKey, { full: string; abbr: string }> = {
  Mon: { full: "Monday",    abbr: "MON" },
  Tue: { full: "Tuesday",   abbr: "TUE" },
  Wed: { full: "Wednesday", abbr: "WED" },
  Thu: { full: "Thursday",  abbr: "THU" },
  Fri: { full: "Friday",    abbr: "FRI" },
  Sat: { full: "Saturday",  abbr: "SAT" },
  Sun: { full: "Sunday",    abbr: "SUN" },
};

// ─── Design tokens ───────────────────────────────────────────────────────────

const T = {
  /* Backgrounds */
  cardBg:         "linear-gradient(155deg, #120A2E 0%, #0C0418 55%, #09061A 100%)",
  rowActiveBg:    "linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(139,92,246,0.04) 100%)",
  rowInactiveBg:  "linear-gradient(135deg, rgba(10,4,24,0.75) 0%, rgba(8,3,20,0.70) 100%)",

  /* Borders */
  cardBorder:     "linear-gradient(160deg, rgba(139,92,246,0.4) 0%, rgba(6,182,212,0.15) 50%, rgba(139,92,246,0.05) 100%)",
  rowActiveBorder:"rgba(6,182,212,0.3)",
  rowInactBorder: "rgba(255,255,255,0.04)",
  pillBorder:     "rgba(6,182,212,0.22)",
  pillBorderHov:  "rgba(6,182,212,0.55)",

  /* Glows */
  rowActiveGlow:  "0 0 0 0.5px rgba(6,182,212,0.18), 0 6px 28px rgba(6,182,212,0.09), 0 2px 8px rgba(0,0,0,0.4)",
  pillGlow:       "0 0 0 3px rgba(6,182,212,0.12), 0 0 16px rgba(6,182,212,0.08)",
  saveGlow:       "0 0 22px rgba(6,182,212,0.35)",
  leftBarGlow:    "0 0 14px rgba(6,182,212,0.7)",

  /* Text */
  textPrimary:    "rgba(255,255,255,0.92)",
  textSub:        "rgba(255,255,255,0.5)",
  textMuted:      "rgba(255,255,255,0.3)",
  textDead:       "rgba(255,255,255,0.18)",
  textCyan:       "rgba(6,182,212,0.9)",
  textViolet:     "rgba(139,92,246,0.85)",

  /* Font */
  fontDisp:       "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif",
  fontMono:       "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
};

// ─── Utilities ───────────────────────────────────────────────────────────────

function hourSpan(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── Pill-wrapped TimePicker ─────────────────────────────────────────────────

function PillTimePicker({
  value,
  onChange,
  disabled,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      aria-label={label}
      style={{
        borderRadius: 999,
        padding: "1.5px",
        background: open && !disabled
          ? `linear-gradient(135deg, rgba(6,182,212,0.7) 0%, rgba(139,92,246,0.4) 100%)`
          : disabled
          ? "rgba(255,255,255,0.04)"
          : `linear-gradient(135deg, rgba(6,182,212,0.28) 0%, rgba(139,92,246,0.15) 100%)`,
        boxShadow: open && !disabled ? T.pillGlow : "none",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        flexShrink: 0,
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <div
        style={{
          borderRadius: 999,
          overflow: "hidden",
          background: open
            ? "rgba(10,4,24,0.97)"
            : "rgba(12,5,28,0.93)",
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <TimePicker
          value={value}
          onChange={onChange}
          className={[
            "border-0 bg-transparent text-[rgba(255,255,255,0.85)]",
            "focus:ring-0 focus:outline-none",
            "rounded-full px-3 min-w-[7rem] h-8",
            disabled ? "pointer-events-none" : "",
          ].join(" ")}
        />
      </div>
    </div>
  );
}

// ─── Day Row ─────────────────────────────────────────────────────────────────

interface DayRowProps {
  day: DayKey;
  slot: DaySlot;
  onToggle: () => void;
  onUpdateTime: (field: "start" | "end", value: string) => void;
}

function DayRow({ day, slot, onToggle, onUpdateTime }: DayRowProps) {
  const [hovered, setHovered] = useState(false);
  const [breakHint, setBreakHint] = useState(false);
  const span = slot.enabled ? hourSpan(slot.start, slot.end) : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setBreakHint(false); }}
      style={{
        position: "relative",
        borderRadius: 14,
        padding: "1px",
        background: slot.enabled
          ? hovered
            ? "linear-gradient(135deg, rgba(6,182,212,0.55) 0%, rgba(139,92,246,0.28) 50%, rgba(6,182,212,0.12) 100%)"
            : "linear-gradient(135deg, rgba(6,182,212,0.32) 0%, rgba(139,92,246,0.16) 50%, transparent 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.055) 0%, transparent 100%)",
        boxShadow: slot.enabled
          ? hovered ? T.rowActiveGlow : "0 0 0 0.5px rgba(6,182,212,0.1), 0 4px 16px rgba(6,182,212,0.05), 0 2px 8px rgba(0,0,0,0.35)"
          : "0 0 0 0.5px rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.25)",
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
        opacity: slot.enabled ? 1 : 0.48,
        marginBottom: 7,
      }}
    >
      {/* Diagonal hatch for unavailable rows */}
      {!slot.enabled && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 1,
            borderRadius: 13,
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.016) 5px, rgba(255,255,255,0.016) 10px)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* Cyan left accent bar */}
      {slot.enabled && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 1,
            top: "18%",
            bottom: "18%",
            width: 3,
            borderRadius: "0 3px 3px 0",
            background: "linear-gradient(180deg, #06b6d4 0%, rgba(139,92,246,0.6) 100%)",
            boxShadow: T.leftBarGlow,
            zIndex: 2,
          }}
        />
      )}

      {/* Row content */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "13px 16px 13px 20px",
          borderRadius: 13,
          background: slot.enabled ? T.rowActiveBg : T.rowInactiveBg,
          backdropFilter: "blur(12px)",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Custom toggle */}
        <button
          onClick={onToggle}
          role="switch"
          aria-checked={slot.enabled}
          aria-label={`Toggle ${DAY_LABELS[day].full}`}
          style={{
            position: "relative",
            width: 40,
            height: 22,
            borderRadius: 11,
            border: "1.5px solid",
            borderColor: slot.enabled ? "rgba(6,182,212,0.75)" : "rgba(255,255,255,0.14)",
            background: slot.enabled
              ? "linear-gradient(135deg, rgba(6,182,212,0.22) 0%, rgba(139,92,246,0.18) 100%)"
              : "rgba(255,255,255,0.04)",
            cursor: "pointer",
            flexShrink: 0,
            boxShadow: slot.enabled
              ? "0 0 12px rgba(6,182,212,0.28), inset 0 0 8px rgba(6,182,212,0.1)"
              : "none",
            transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
            padding: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: slot.enabled ? "calc(100% - 18px)" : 2,
              transform: "translateY(-50%)",
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: slot.enabled
                ? "linear-gradient(135deg, #06b6d4 0%, #818cf8 100%)"
                : "rgba(255,255,255,0.22)",
              boxShadow: slot.enabled ? "0 0 10px rgba(6,182,212,0.9)" : "none",
              transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </button>

        {/* Day label */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minWidth: 88,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: slot.enabled ? "rgba(6,182,212,0.65)" : T.textDead,
              fontFamily: T.fontMono,
              transition: "color 0.3s",
            }}
          >
            {DAY_LABELS[day].abbr}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: slot.enabled ? T.textPrimary : T.textDead,
              fontFamily: T.fontDisp,
              letterSpacing: "-0.01em",
              transition: "color 0.3s",
            }}
          >
            {DAY_LABELS[day].full}
          </span>
        </div>

        {/* Time pickers OR unavailable label */}
        {slot.enabled ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" }}>
            <PillTimePicker
              label={`${DAY_LABELS[day].full} start`}
              value={slot.start}
              onChange={(v) => onUpdateTime("start", v)}
            />

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                color: "rgba(139,92,246,0.5)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 1,
                  background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.4))",
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  fontFamily: T.fontMono,
                }}
              >
                TO
              </span>
              <div
                style={{
                  width: 10,
                  height: 1,
                  background: "linear-gradient(90deg, rgba(139,92,246,0.4), transparent)",
                }}
              />
            </div>

            <PillTimePicker
              label={`${DAY_LABELS[day].full} end`}
              value={slot.end}
              onChange={(v) => onUpdateTime("end", v)}
            />

            {/* Duration badge */}
            {span && (
              <div
                style={{
                  padding: "3px 9px",
                  borderRadius: 6,
                  background: "rgba(6,182,212,0.07)",
                  border: "1px solid rgba(6,182,212,0.18)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(6,182,212,0.7)",
                  fontFamily: T.fontMono,
                  letterSpacing: "0.04em",
                  flexShrink: 0,
                }}
              >
                {span}
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <span
              style={{
                fontSize: 12,
                color: T.textDead,
                fontStyle: "italic",
                letterSpacing: "0.02em",
                fontFamily: T.fontDisp,
              }}
            >
              Unavailable
            </span>
          </div>
        )}

        {/* Hover-reveal: + Break */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginLeft: "auto",
            flexShrink: 0,
            opacity: hovered && slot.enabled ? 1 : 0,
            transition: "opacity 0.2s ease",
            pointerEvents: hovered && slot.enabled ? "auto" : "none",
          }}
        >
          <button
            onClick={() => setBreakHint((p) => !p)}
            title="Add break / split shift"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 9px",
              borderRadius: 8,
              background: breakHint ? "rgba(139,92,246,0.14)" : "rgba(255,255,255,0.04)",
              border: "1px solid",
              borderColor: breakHint ? "rgba(139,92,246,0.38)" : "rgba(255,255,255,0.09)",
              cursor: "pointer",
              color: breakHint ? T.textViolet : T.textSub,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: T.fontDisp,
              letterSpacing: "0.01em",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(139,92,246,0.38)";
              e.currentTarget.style.color = T.textViolet;
            }}
            onMouseLeave={(e) => {
              if (!breakHint) {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
                e.currentTarget.style.color = T.textSub;
              }
            }}
          >
            <Plus size={11} />
            <span>Break</span>
          </button>
        </div>
      </div>

      {/* Break tooltip */}
      {breakHint && slot.enabled && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 7px)",
            right: 16,
            zIndex: 50,
            borderRadius: 10,
            padding: "10px 14px",
            background: "rgba(18,6,40,0.97)",
            border: "1px solid rgba(139,92,246,0.28)",
            boxShadow: "0 10px 36px rgba(0,0,0,0.65), 0 0 0 0.5px rgba(139,92,246,0.12)",
            backdropFilter: "blur(16px)",
            fontSize: 12,
            color: T.textSub,
            whiteSpace: "nowrap",
            fontFamily: T.fontDisp,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <Zap size={12} style={{ color: T.textViolet }} />
            <span
              style={{
                fontWeight: 700,
                color: T.textPrimary,
                fontFamily: T.fontDisp,
              }}
            >
              Split shifts coming soon
            </span>
          </div>
          <span>Add lunch breaks & mid-day availability gaps</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AvailabilityScheduleCard({
  schedule,
  scheduleChanged,
  onToggleDay,
  onUpdateTime,
  onSave,
  onDiscard,
}: AvailabilityScheduleCardProps) {
  const [savePressed, setSavePressed] = useState(false);

  const enabledDays = DAYS.filter((d) => schedule[d]?.enabled ?? false);
  const enabledCount = enabledDays.length;

  /* Total weekly hours */
  const totalHours = enabledDays.reduce((sum, d) => {
    const slot = schedule[d];
    const [sh, sm] = slot.start.split(":").map(Number);
    const [eh, em] = slot.end.split(":").map(Number);
    return sum + Math.max(0, eh * 60 + em - (sh * 60 + sm)) / 60;
  }, 0);

  /* Apply first enabled day's times to all other enabled days */
  const handleApplyAll = useCallback(() => {
    const ref = enabledDays[0];
    if (!ref) return;
    const { start, end } = schedule[ref];
    enabledDays.slice(1).forEach((d) => {
      onUpdateTime(d, "start", start);
      onUpdateTime(d, "end", end);
    });
  }, [enabledDays, schedule, onUpdateTime]);

  const handleSave = () => {
    setSavePressed(true);
    onSave();
    setTimeout(() => setSavePressed(false), 2200);
  };

  return (
    <>
      {/* Google Font + keyframes injection */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        @keyframes _asc_pulse {
          0%, 100% { opacity: 1; transform: scale(1);   }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }

        @keyframes _asc_fadein {
          from { opacity: 0; transform: translateY(-5px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        @keyframes _asc_shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        ._asc_save:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
          box-shadow: 0 0 28px rgba(6,182,212,0.45) !important;
        }
        ._asc_discard:hover {
          border-color: rgba(255,255,255,0.22) !important;
          color: rgba(255,255,255,0.72) !important;
        }
        ._asc_applyall:hover {
          background: rgba(6,182,212,0.14) !important;
          color: rgba(6,182,212,1) !important;
        }
      `}</style>

      {/* ── Outer wrapper with gradient border trick ── */}
      <div
        style={{
          position: "relative",
          borderRadius: 20,
          padding: "1.5px",
          background: T.cardBorder,
          boxShadow:
            "0 0 0 0.5px rgba(139,92,246,0.08), 0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35)",
        }}
      >
        {/* ── Card body ── */}
        <div
          style={{
            borderRadius: "18.5px",
            background: T.cardBg,
            backdropFilter: "blur(24px)",
            overflow: "hidden",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              {/* Icon tile */}
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  background:
                    "linear-gradient(135deg, rgba(6,182,212,0.14) 0%, rgba(139,92,246,0.14) 100%)",
                  border: "1px solid rgba(6,182,212,0.22)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 18px rgba(6,182,212,0.09)",
                  flexShrink: 0,
                }}
              >
                <Clock size={18} style={{ color: "rgba(6,182,212,0.85)" }} />
              </div>

              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: T.textPrimary,
                    letterSpacing: "-0.02em",
                    fontFamily: T.fontDisp,
                  }}
                >
                  Availability Schedule
                </h2>
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: 12,
                    color: T.textSub,
                    fontFamily: T.fontDisp,
                  }}
                >
                  {enabledCount > 0
                    ? `${enabledCount} day${enabledCount !== 1 ? "s" : ""} · ${
                        totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)
                      } hrs / week`
                    : "No active days"}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Apply to all days */}
              {enabledCount > 1 && (
                <button
                  className="_asc_applyall"
                  onClick={handleApplyAll}
                  style={{
                    background: "rgba(6,182,212,0.07)",
                    border: "none",
                    borderRadius: 999,
                    color: "rgba(6,182,212,0.8)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    fontFamily: T.fontDisp,
                    letterSpacing: "0.02em",
                    padding: "6px 14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Apply to all days
                </button>
              )}

              {/* Status pill */}
              {scheduleChanged ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px",
                    borderRadius: 8,
                    background: "rgba(251,191,36,0.07)",
                    border: "1px solid rgba(251,191,36,0.22)",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#fbbf24",
                      boxShadow: "0 0 7px rgba(251,191,36,0.9)",
                      animation: "_asc_pulse 2s ease-in-out infinite",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "#fbbf24",
                      letterSpacing: "0.06em",
                      fontFamily: T.fontMono,
                    }}
                  >
                    UNSAVED
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px",
                    borderRadius: 8,
                    background: "rgba(6,182,212,0.05)",
                    border: "1px solid rgba(6,182,212,0.1)",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "rgba(6,182,212,0.8)",
                      boxShadow: "0 0 7px rgba(6,182,212,0.65)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "rgba(6,182,212,0.7)",
                      letterSpacing: "0.06em",
                      fontFamily: T.fontMono,
                    }}
                  >
                    SYNCED
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Week at-a-glance bar ── */}
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: "11px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.035)",
            }}
          >
            {DAYS.map((day) => (
              <div
                key={day}
                role="button"
                tabIndex={0}
                title={DAY_LABELS[day].full}
                onClick={() => onToggleDay(day)}
                onKeyDown={(e) => e.key === "Enter" && onToggleDay(day)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: schedule[day]?.enabled
                      ? "rgba(6,182,212,0.6)"
                      : T.textDead,
                    fontFamily: T.fontMono,
                    transition: "color 0.3s",
                  }}
                >
                  {DAY_LABELS[day].abbr.slice(0, 1)}
                </span>
                <div
                  style={{
                    width: "100%",
                    height: 4,
                    borderRadius: 3,
                    background: schedule[day]?.enabled
                      ? "linear-gradient(90deg, rgba(6,182,212,0.9) 0%, rgba(139,92,246,0.65) 100%)"
                      : "rgba(255,255,255,0.07)",
                    boxShadow: schedule[day]?.enabled
                      ? "0 0 8px rgba(6,182,212,0.45)"
                      : "none",
                    transition: "all 0.3s ease",
                  }}
                />
              </div>
            ))}
          </div>

          {/* ── Day rows ── */}
          <div style={{ padding: "14px 16px 10px" }}>
            {DAYS.map((day) => (
              <DayRow
                key={day}
                day={day}
                slot={
                  schedule[day] ?? { enabled: false, start: "09:00", end: "17:00" }
                }
                onToggle={() => onToggleDay(day)}
                onUpdateTime={(field, value) => onUpdateTime(day, field, value)}
              />
            ))}
          </div>

          {/* ── Footer ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 24px 18px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: T.textDead,
                fontFamily: T.fontDisp,
                margin: 0,
              }}
            >
              Hover a row to add breaks · click a day dot to toggle
            </p>

            {scheduleChanged && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  animation: "_asc_fadein 0.22s ease forwards",
                }}
              >
                <button
                  className="_asc_discard"
                  onClick={onDiscard}
                  style={{
                    padding: "7px 15px",
                    borderRadius: 9,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.09)",
                    color: T.textSub,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: T.fontDisp,
                    transition: "all 0.2s ease",
                  }}
                >
                  Discard
                </button>

                <button
                  className="_asc_save"
                  onClick={handleSave}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 18px",
                    borderRadius: 9,
                    background: savePressed
                      ? "linear-gradient(135deg, rgba(34,197,94,0.22) 0%, rgba(6,182,212,0.18) 100%)"
                      : "linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(139,92,246,0.18) 100%)",
                    border: "1px solid",
                    borderColor: savePressed
                      ? "rgba(34,197,94,0.55)"
                      : "rgba(6,182,212,0.42)",
                    color: savePressed
                      ? "rgba(134,239,172,0.95)"
                      : "rgba(6,182,212,0.95)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: T.fontDisp,
                    letterSpacing: "0.02em",
                    boxShadow: savePressed
                      ? "0 0 18px rgba(34,197,94,0.22)"
                      : T.saveGlow,
                    transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
                  }}
                >
                  {savePressed ? (
                    <>
                      <Check size={13} />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Clock size={13} />
                      Save Schedule
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default AvailabilityScheduleCard;
