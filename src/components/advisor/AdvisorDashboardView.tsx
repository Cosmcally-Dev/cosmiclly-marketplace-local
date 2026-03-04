import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdvisorStats } from "@/hooks/useAdvisorStats";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Users,
  Star,
  Calendar,
  Settings,
  Bell,
  Search,
  Monitor,
  MoreHorizontal,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Activity,
  SlidersHorizontal,
  Phone,
  Video,
  Loader2,
  Radio,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Color Tokens ─────────────────────────────────────────────────────────────
const C = {
  pageBg:     "#09061A",
  surfBg:     "#0C0418",
  cardBg:     "linear-gradient(155deg, #120A2E 0%, #0C0418 55%, #09061A 100%)",
  cardBorder: "linear-gradient(160deg, rgba(139,92,246,0.4) 0%, rgba(6,182,212,0.15) 50%, rgba(139,92,246,0.05) 100%)",
  elevBg:     "#120A2E",

  border:    "rgba(255,255,255,0.08)",
  borderSub: "rgba(255,255,255,0.04)",

  cyan:         "#06b6d4",
  cyanBg:       "rgba(6,182,212,0.1)",
  cyanBgHov:    "rgba(6,182,212,0.16)",
  cyanBorder:   "rgba(6,182,212,0.28)",
  cyanText:     "rgba(6,182,212,0.92)",
  cyanGlow:     "0 0 20px rgba(6,182,212,0.15)",

  violet:       "#8b5cf6",
  violetBg:     "rgba(139,92,246,0.1)",
  violetBorder: "rgba(139,92,246,0.28)",
  violetText:   "rgba(139,92,246,0.92)",

  amber:        "#f59e0b",
  amberBg:      "rgba(245,158,11,0.1)",
  amberBorder:  "rgba(245,158,11,0.25)",
  amberText:    "rgba(245,158,11,0.92)",

  green:        "#4ade80",
  greenBg:      "rgba(74,222,128,0.1)",
  greenBorder:  "rgba(74,222,128,0.2)",

  red:          "#f87171",
  redBg:        "rgba(248,113,113,0.1)",
  redBorder:    "rgba(248,113,113,0.2)",

  textPrimary: "rgba(255,255,255,0.92)",
  textSub:     "rgba(255,255,255,0.6)",
  textMuted:   "rgba(255,255,255,0.42)",
  textDead:    "rgba(255,255,255,0.24)",
  textLabel:   "rgba(255,255,255,0.35)",

  font:     "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif",
  fontMono: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
};

// ─── Nav config (id → route) ──────────────────────────────────────────────────
const navGroups = [
  {
    label: "Main Menu",
    items: [
      { id: "overview",  label: "Overview",   icon: LayoutDashboard, route: "/advisor-portal"   },
      { id: "analytics", label: "Analytics",  icon: TrendingUp,      route: "/advisor-insights" },
      { id: "earnings",  label: "Earnings",   icon: DollarSign,      route: "/advisor-activity" },
    ],
  },
  {
    label: "Clients",
    items: [
      { id: "clients",  label: "My Clients", icon: Users,          route: "/advisor-clients" },
      { id: "reviews",  label: "Reviews",    icon: Star,           route: null              },
      { id: "messages", label: "Messages",   icon: MessageSquare,  route: null              },
    ],
  },
  {
    label: "Tools",
    items: [
      { id: "schedule", label: "Schedule", icon: Calendar,  route: null        },
      { id: "ai-twin",  label: "AI Twin",  icon: Sparkles,  route: null        },
      { id: "settings", label: "Settings", icon: Settings,  route: "/settings" },
    ],
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────
type BadgeStatus = "Completed" | "Pending" | "Refunded";
type Period = "7d" | "30d" | "3m";

interface TxRow {
  id: string;
  client: string;
  product: string;
  status: BadgeStatus;
  qty: number;
  rate: string;
  total: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sessionTypeLabel(type: string) {
  if (type === "audio") return "Audio Call";
  if (type === "video") return "Video Reading";
  return "Chat Session";
}

function sessionTypeIcon(type: string) {
  if (type === "audio") return <Phone size={12} style={{ color: C.violet }} />;
  if (type === "video") return <Video size={12} style={{ color: C.amber }} />;
  return <MessageSquare size={12} style={{ color: C.cyan }} />;
}

// ─── SparklineBars ────────────────────────────────────────────────────────────
function SparklineBars({ bars, color = C.cyan }: { bars: number[]; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 36, flexShrink: 0 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: 5,
            height: `${h}%`,
            borderRadius: "2px 2px 0 0",
            background: i < 2 ? `${color}55` : color,
          }}
        />
      ))}
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: BadgeStatus }) {
  const map: Record<BadgeStatus, { bg: string; text: string; border: string }> = {
    Completed: { bg: C.greenBg,  text: C.green, border: C.greenBorder },
    Pending:   { bg: C.amberBg,  text: C.amber, border: C.amberBorder },
    Refunded:  { bg: C.redBg,    text: C.red,   border: C.redBorder   },
  };
  const s = map[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, background: s.bg, border: `1px solid ${s.border}` }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.text, flexShrink: 0, display: "inline-block" }} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: s.text, textTransform: "uppercase", fontFamily: C.fontMono }}>
        {status}
      </span>
    </span>
  );
}

// ─── AIInsightBar ─────────────────────────────────────────────────────────────
function AIInsightBar() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(6,182,212,0.04)", border: `1px solid rgba(6,182,212,0.15)`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, cursor: "pointer", backdropFilter: "blur(8px)" }}>
      <Sparkles size={15} style={{ color: C.cyan, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: C.textSub, fontFamily: C.font, flex: 1, lineHeight: 1.5 }}>
        AI insight: Your peak booking times are{" "}
        <strong style={{ color: C.textPrimary }}>Tue–Thu 7–9pm</strong>. Consider extending availability.
      </span>
      <SlidersHorizontal size={14} style={{ color: C.textDead, flexShrink: 0 }} />
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ activeId, onNavigate }: { activeId: string; onNavigate: (route: string | null, id: string) => void }) {
  const { user } = useAuth();
  const displayName = (user?.firstName && user?.lastName)
    ? `${user.firstName} ${user.lastName}`
    : user?.username || user?.email?.split("@")[0] || "Advisor";
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <div style={{ width: 224, flexShrink: 0, height: "100vh", display: "flex", flexDirection: "column", background: C.surfBg, borderRight: `1px solid ${C.border}`, overflowY: "auto" }}>
      {/* Logo */}
      <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${C.violet} 0%, ${C.cyan} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(6,182,212,0.22)" }}>
            <Sparkles size={16} style={{ color: "white" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: C.textPrimary, fontFamily: C.font }}>Cosmiclly</div>
            <div style={{ fontSize: 9.5, color: C.textDead, fontFamily: C.fontMono, letterSpacing: "0.08em", textTransform: "uppercase" }}>Advisor Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
        {navGroups.map((group) => (
          <div key={group.label}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textLabel, padding: "8px 8px 4px", fontFamily: C.fontMono }}>
              {group.label}
            </div>
            {group.items.map(({ id, label, icon: Icon, route }) => {
              const isActive = activeId === id;
              const isDisabled = route === null;
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(route, id)}
                  title={isDisabled ? "Coming soon" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 9,
                    background: isActive ? C.cyanBg : "transparent",
                    border: "none",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    color: isActive ? C.cyanText : isDisabled ? C.textDead : C.textMuted,
                    fontSize: 13.5,
                    fontWeight: isActive ? 600 : 500,
                    fontFamily: C.font,
                    textAlign: "left",
                    letterSpacing: "-0.01em",
                    transition: "all 0.18s ease",
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive && !isDisabled) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.color = C.textSub;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive && !isDisabled) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = C.textMuted;
                    }
                  }}
                >
                  <Icon size={15} />
                  {label}
                  {isDisabled && (
                    <span style={{ marginLeft: "auto", fontSize: 9, fontFamily: C.fontMono, color: C.textDead, letterSpacing: "0.06em" }}>SOON</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* User card */}
      <div style={{ padding: "12px 10px", borderTop: `1px solid ${C.borderSub}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: 10, borderRadius: 10, background: C.cardBg, border: `1px solid ${C.border}`, cursor: "pointer", backdropFilter: "blur(12px)" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.violet} 0%, ${C.cyan} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0, fontFamily: C.font }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.textPrimary, fontFamily: C.font, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {displayName}
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 2, padding: "1px 7px", borderRadius: 4, background: C.cyanBg, border: `1px solid ${C.cyanBorder}` }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.cyan, boxShadow: `0 0 6px ${C.cyan}` }} />
              <span style={{ fontSize: 9.5, fontWeight: 700, color: C.cyanText, fontFamily: C.fontMono, letterSpacing: "0.07em", textTransform: "uppercase" }}>Pro Plan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function DashHeader({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const { user } = useAuth();
  const initials = (user?.firstName || user?.username || user?.email || "A").slice(0, 1).toUpperCase();
  return (
    <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: C.surfBg, borderBottom: `1px solid ${C.border}`, flexShrink: 0, position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, fontFamily: C.font }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ color: C.textMuted, cursor: "pointer" }} onClick={() => navigate("/advisor-portal")}>Dashboard</span>
          <ChevronRight size={13} style={{ color: C.textDead }} />
          <span style={{ color: C.cyanText, fontWeight: 600 }}>Overview</span>
        </div>
        {/* Pulsing Live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 9px", borderRadius: 999, background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)" }}>
          <span className="adv-pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,0.8)", display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(74,222,128,0.85)", fontFamily: C.fontMono, letterSpacing: "0.07em" }}>LIVE</span>
          <Radio size={10} style={{ color: "rgba(74,222,128,0.7)" }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, width: 224, padding: "0 12px", height: 34, borderRadius: 9, background: C.elevBg, border: `1px solid ${C.border}` }}>
          <Search size={13} style={{ color: C.textDead, flexShrink: 0 }} />
          <input placeholder="Search..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: C.textSub, fontFamily: C.font }} />
          <div style={{ display: "flex", alignItems: "center", gap: 1, padding: "2px 5px", borderRadius: 4, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.borderSub}`, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: C.textDead, fontFamily: C.fontMono }}>⌘</span>
            <span style={{ fontSize: 10, color: C.textDead, fontFamily: C.fontMono }}>K</span>
          </div>
        </div>
        {[Bell, Monitor].map((Icon, i) => (
          <div key={i} style={{ width: 32, height: 32, borderRadius: 9, background: C.elevBg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <Icon size={15} style={{ color: C.textMuted }} />
          </div>
        ))}
        <div
          onClick={() => navigate("/settings")}
          style={{ width: 36, height: 36, borderRadius: "50%", padding: "1.5px", background: `linear-gradient(135deg, ${C.violet} 0%, ${C.cyan} 100%)`, cursor: "pointer", flexShrink: 0 }}
        >
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: `linear-gradient(135deg, rgba(139,92,246,0.45) 0%, rgba(6,182,212,0.45) 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", fontFamily: C.font }}>
            {initials}
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom recharts tooltip
function CustomAreaTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { sessions?: number } }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.cyanBorder}`, borderRadius: 10, padding: "10px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.55)", backdropFilter: "blur(16px)" }}>
      <div style={{ fontSize: 10, color: C.textDead, fontFamily: C.fontMono, marginBottom: 5, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.textPrimary, fontFamily: C.font, letterSpacing: "-0.02em" }}>${payload[0].value.toLocaleString()}</div>
      {payload[0].payload.sessions !== undefined && (
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: C.font, marginTop: 2 }}>{payload[0].payload.sessions} sessions</div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdvisorDashboardView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Real stats from Supabase
  const { stats, chartData, isLoading: statsLoading } = useAdvisorStats(user?.id);

  // Active nav derived from current path
  const activeId = (() => {
    const p = location.pathname;
    if (p === "/advisor-insights") return "analytics";
    if (p === "/advisor-activity")  return "earnings";
    if (p === "/advisor-clients")   return "clients";
    if (p === "/settings")          return "settings";
    return "overview";
  })();

  // Recent sessions as transaction rows
  const [txRows, setTxRows]     = useState<TxRow[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txSearch, setTxSearch]   = useState("");

  useEffect(() => {
    if (!user?.id) return;
    setTxLoading(true);

    supabase
      .from("sessions")
      .select("id, type, status, billable_minutes, rate_per_minute, cost_total, client:profiles!sessions_client_id_fkey(full_name)")
      .eq("advisor_id", user.id)
      .in("status", ["completed", "cancelled"])
      .order("started_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) {
          const rows: TxRow[] = data.map((s) => {
            const billingStatus: BadgeStatus =
              s.status === "completed" ? "Completed" : "Refunded";
            const client = Array.isArray(s.client) ? s.client[0] : s.client;
            return {
              id: `#${s.id.slice(-6).toUpperCase()}`,
              client: (client as { full_name: string | null } | null)?.full_name || "Client",
              product: sessionTypeLabel(s.type),
              status: billingStatus,
              qty: s.billable_minutes ?? 0,
              rate: s.rate_per_minute ? `$${Number(s.rate_per_minute).toFixed(2)}/min` : "—",
              total: s.cost_total ? `$${Number(s.cost_total).toFixed(2)}` : "—",
            };
          });
          setTxRows(rows);
        }
        setTxLoading(false);
      });
  }, [user?.id]);

  // Chart data — use real weekly earnings for 7d, fallback monthly mock for 3m
  const [period, setPeriod] = useState<Period>("3m");

  const monthlyMock = [
    { month: "Aug", value: 1240, sessions: 18 },
    { month: "Sep", value: 1860, sessions: 24 },
    { month: "Oct", value: 1520, sessions: 21 },
    { month: "Nov", value: 2180, sessions: 30 },
    { month: "Dec", value: 1980, sessions: 28 },
    { month: "Jan", value: 2640, sessions: 37 },
    { month: "Feb", value: 2320, sessions: 33 },
    { month: "Mar", value: stats.monthlyEarnings > 0 ? stats.monthlyEarnings * 100 : 3150 },
  ];

  const chartRows = period === "7d" && chartData.weeklyEarnings.length > 0
    ? chartData.weeklyEarnings.map((d) => ({ month: d.day, value: d.earnings, sessions: undefined }))
    : monthlyMock;

  // Session breakdown data with revenue estimates
  const sessionTypeData = [
    { type: "Chat",     count: 52, revenue: 1248, color: C.cyan    },
    { type: "Audio",    count: 28, revenue: 896,  color: C.violet  },
    { type: "Video",    count: 16, revenue: 720,  color: C.amber   },
    { type: "AI Twin",  count: 34, revenue: 408,  color: "#ec4899" },
    { type: "AI Voice", count: 11, revenue: 220,  color: "#34d399" },
  ];

  // Metric cards (real data where available)
  const metricCards = [
    {
      label: "Total Earnings",
      value: stats.monthlyEarnings > 0 ? `$${stats.monthlyEarnings.toLocaleString()}` : "$3,150",
      change: "+18.2% vs last month",
      icon: DollarSign,
      iconColor: C.cyan,
      bars: [30, 52, 38, 72, 95],
    },
    {
      label: "Active Clients",
      value: "38",
      change: "+6 new this month",
      icon: Users,
      iconColor: C.cyan,
      bars: [42, 28, 60, 50, 82],
    },
    {
      label: "Sessions (Mar)",
      value: stats.completedReadings > 0 ? `${stats.completedReadings}` : "44",
      change: "+33.3% vs last month",
      icon: Activity,
      iconColor: C.violet,
      bars: [48, 62, 44, 68, 90],
    },
    {
      label: "Avg. Rating",
      value: stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)} ★` : "4.9 ★",
      change: "+0.2 pts this quarter",
      icon: Star,
      iconColor: C.amber,
      bars: [55, 68, 58, 82, 95],
    },
  ];

  const handleNav = (route: string | null, _id: string) => {
    if (route) navigate(route);
  };

  const filteredTx = txRows.filter(
    (t) =>
      t.client.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.product.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(txSearch.toLowerCase()),
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .adv-dash-scroll::-webkit-scrollbar { width: 5px; }
        .adv-dash-scroll::-webkit-scrollbar-track { background: transparent; }
        .adv-dash-scroll::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.32); border-radius: 100px; }
        .adv-dash-scroll::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.58); }
        .adv-dash-scroll { scrollbar-width: thin; scrollbar-color: rgba(6,182,212,0.32) transparent; }
        input::placeholder { color: rgba(255,255,255,0.26) !important; }

        @keyframes adv-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 8px rgba(74,222,128,0.8); }
          50%       { opacity: 0.55; transform: scale(0.72); box-shadow: 0 0 4px rgba(74,222,128,0.4); }
        }
        .adv-pulse-dot {
          animation: adv-pulse-dot 2s ease-in-out infinite;
        }

        @keyframes adv-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .adv-spin { animation: adv-spin 1s linear infinite; }

        .adv-kpi-card {
          transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease;
        }
        .adv-kpi-card:hover {
          transform: scale(1.02);
          box-shadow: 0 0 20px rgba(6,182,212,0.15) !important;
        }

        .adv-chart-card {
          transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease;
        }
        .adv-chart-card:hover {
          transform: scale(1.005);
          box-shadow: 0 0 20px rgba(6,182,212,0.12) !important;
        }
      `}</style>

      <div style={{ display: "flex", height: "100vh", width: "100%", background: C.pageBg, fontFamily: C.font, overflow: "hidden" }}>
        {/* ── Sidebar ── */}
        <Sidebar activeId={activeId} onNavigate={handleNav} />

        {/* ── Main column ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <DashHeader navigate={navigate} />

          <main className="adv-dash-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

            {/* ── Metric KPI cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {metricCards.map(({ label, value, change, icon: Icon, iconColor, bars }) => (
                <div
                  key={label}
                  className="adv-kpi-card"
                  style={{
                    borderRadius: 16,
                    padding: "1.5px",
                    background: C.cardBorder,
                    boxShadow: "0 0 0 0.5px rgba(139,92,246,0.08), 0 8px 32px rgba(0,0,0,0.5)",
                  }}
                >
                  <div
                    style={{
                      borderRadius: "14.5px",
                      background: C.cardBg,
                      backdropFilter: "blur(24px)",
                      padding: 16,
                      cursor: "default",
                      height: "100%",
                    }}
                  >
                    {/* Top: label + plain icon */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textLabel, fontFamily: C.fontMono }}>
                        {label}
                      </span>
                      <Icon size={18} style={{ color: iconColor, flexShrink: 0 }} />
                    </div>

                    {/* Middle: value + sparkline */}
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
                      {statsLoading ? (
                        <Loader2 size={20} className="adv-spin" style={{ color: C.cyan }} />
                      ) : (
                        <span style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, fontFamily: C.font, letterSpacing: "-0.03em", lineHeight: 1 }}>
                          {value}
                        </span>
                      )}
                      <SparklineBars bars={bars} color={C.cyan} />
                    </div>

                    {/* Bottom: separator + change */}
                    <div style={{ borderTop: `1px solid ${C.borderSub}`, paddingTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
                      <TrendingUp size={11} style={{ color: C.green, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: C.green, fontFamily: C.font, fontWeight: 600 }}>{change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Charts ── */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>

              {/* ─ AreaChart: Earnings Trend ─ */}
              <div
                className="adv-chart-card"
                style={{
                  borderRadius: 16,
                  padding: "1.5px",
                  background: C.cardBorder,
                  boxShadow: "0 0 0 0.5px rgba(139,92,246,0.08), 0 16px 48px rgba(0,0,0,0.5)",
                }}
              >
              <div
                style={{
                  borderRadius: "14.5px",
                  background: C.cardBg,
                  backdropFilter: "blur(24px)",
                  padding: 20,
                  height: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary, fontFamily: C.font, letterSpacing: "-0.01em" }}>Earnings Trend</h3>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: C.textMuted, fontFamily: C.font }}>Monthly revenue · hover for details</p>
                  </div>
                  {/* Legend + period switcher — top right */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    {/* Legend chip */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 22, height: 3, borderRadius: 2, background: `linear-gradient(90deg, rgba(6,182,212,0.5), ${C.cyan})`, boxShadow: "0 0 6px rgba(6,182,212,0.5)" }} />
                      <span style={{ fontSize: 10, color: C.textMuted, fontFamily: C.font }}>Revenue</span>
                    </div>
                    {/* Period switcher */}
                    <div style={{ display: "flex", gap: 4 }}>
                      {(["7d", "30d", "3m"] as Period[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriod(p)}
                          style={{ padding: "4px 10px", borderRadius: 7, background: period === p ? C.cyanBg : "transparent", border: `1px solid ${period === p ? C.cyanBorder : "rgba(255,255,255,0.08)"}`, color: period === p ? C.cyanText : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: C.font, transition: "all 0.18s ease" }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartRows} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                      <defs>
                        <linearGradient id="earningsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={C.cyan} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={C.cyan} stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: C.font }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 10, fontFamily: C.font }}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <RechartTooltip
                        content={<CustomAreaTooltip />}
                        cursor={{ stroke: "rgba(6,182,212,0.3)", strokeWidth: 1 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={C.cyan}
                        strokeWidth={3}
                        fill="url(#earningsAreaGradient)"
                        dot={false}
                        activeDot={{ r: 5, fill: C.cyan, stroke: "rgba(6,182,212,0.3)", strokeWidth: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              </div>

              {/* ─ Session Breakdown ─ */}
              <div
                className="adv-chart-card"
                style={{
                  borderRadius: 16,
                  padding: "1.5px",
                  background: C.cardBorder,
                  boxShadow: "0 0 0 0.5px rgba(139,92,246,0.08), 0 16px 48px rgba(0,0,0,0.5)",
                }}
              >
              <div
                style={{
                  borderRadius: "14.5px",
                  background: C.cardBg,
                  backdropFilter: "blur(24px)",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary, fontFamily: C.font, letterSpacing: "-0.01em" }}>Session Breakdown</h3>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: C.textMuted, fontFamily: C.font }}>This month by type</p>
                </div>
                <AIInsightBar />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 13 }}>
                  {sessionTypeData.map(({ type, count, revenue, color }) => {
                    const max = Math.max(...sessionTypeData.map((d) => d.count));
                    return (
                      <div key={type}>
                        {/* Swapped hierarchy: revenue prominent, count muted */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, fontFamily: C.font, letterSpacing: "-0.02em" }}>
                              ${revenue.toLocaleString()}
                            </span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: 11, color: C.textSub, fontFamily: C.font, fontWeight: 500 }}>{type}</span>
                            <span style={{ fontSize: 9.5, color: C.textDead, fontFamily: C.fontMono, marginLeft: 5 }}>{count}×</span>
                          </div>
                        </div>
                        {/* h-1 equivalent: 4px bar */}
                        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${(count / max) * 100}%`,
                            background: color,
                            borderRadius: 3,
                            opacity: 0.9,
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              </div>
            </div>

            {/* ── Transactions table ── */}
            <div
              style={{
                borderRadius: 16,
                padding: "1.5px",
                background: C.cardBorder,
                boxShadow: "0 0 0 0.5px rgba(139,92,246,0.08), 0 16px 48px rgba(0,0,0,0.5)",
              }}
            >
            <div
              style={{
                borderRadius: "14.5px",
                background: C.cardBg,
                backdropFilter: "blur(24px)",
                overflow: "hidden",
              }}
            >
              {/* Table header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary, fontFamily: C.font, letterSpacing: "-0.01em" }}>Recent Sessions</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 12px", height: 32, borderRadius: 8, background: C.elevBg, border: `1px solid ${C.border}` }}>
                    <Search size={12} style={{ color: C.textDead, flexShrink: 0 }} />
                    <input
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                      placeholder="Search sessions..."
                      style={{ background: "transparent", border: "none", outline: "none", fontSize: 12, color: C.textSub, fontFamily: C.font, width: 160 }}
                    />
                  </div>
                  <button
                    onClick={() => navigate("/advisor-activity")}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 32, borderRadius: 8, background: `linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(139,92,246,0.16) 100%)`, border: `1px solid ${C.cyanBorder}`, color: C.cyanText, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: C.font, letterSpacing: "0.01em", transition: "all 0.18s ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = C.cyanGlow; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                  >
                    View All →
                  </button>
                </div>
              </div>

              {/* Table body */}
              {txLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px", gap: 10, color: C.textMuted, fontFamily: C.font, fontSize: 13 }}>
                  <Loader2 size={16} className="adv-spin" style={{ color: C.cyan }} />
                  Loading sessions…
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["", "ID", "Client", "Product", "Status", "Minutes", "Rate", "Total", ""].map((h, i) => (
                          <th key={i} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textLabel, fontFamily: C.fontMono, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTx.length === 0 && !txLoading && (
                        <tr>
                          <td colSpan={9} style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: C.textDead, fontFamily: C.font }}>
                            {txRows.length === 0 ? "No completed sessions yet." : "No sessions match your search."}
                          </td>
                        </tr>
                      )}
                      {filteredTx.map((tx, i) => (
                        <tr
                          key={tx.id}
                          style={{ borderBottom: i < filteredTx.length - 1 ? `1px solid ${C.borderSub}` : "none", transition: "background 0.14s ease", cursor: "pointer" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(6,182,212,0.03)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "12px 16px" }}>
                            <input type="checkbox" style={{ accentColor: C.cyan, cursor: "pointer", width: 14, height: 14 }} />
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontSize: 11.5, color: C.textDead, fontFamily: C.fontMono, letterSpacing: "0.04em" }}>{tx.id}</span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, fontFamily: C.font }}>{tx.client}</span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {sessionTypeIcon(tx.product.toLowerCase().includes("audio") ? "audio" : tx.product.toLowerCase().includes("video") ? "video" : "chat")}
                              <span style={{ fontSize: 12.5, color: C.textSub, fontFamily: C.font }}>{tx.product}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}><StatusBadge status={tx.status} /></td>
                          <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 12, color: C.textMuted, fontFamily: C.fontMono }}>{tx.qty}m</span></td>
                          <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 12.5, color: C.textMuted, fontFamily: C.font }}>{tx.rate}</span></td>
                          <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, fontFamily: C.font }}>{tx.total}</span></td>
                          <td style={{ padding: "12px 16px" }}>
                            <button
                              style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textDead, padding: 4, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s ease" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = C.textSub)}
                              onMouseLeave={(e) => (e.currentTarget.style.color = C.textDead)}
                            >
                              <MoreHorizontal size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            </div>
            {/* bottom padding */}
            <div style={{ height: 24 }} />
          </main>
        </div>
      </div>
    </>
  );
}

export default AdvisorDashboardView;
