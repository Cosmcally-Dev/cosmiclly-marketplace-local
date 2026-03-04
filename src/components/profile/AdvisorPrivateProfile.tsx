import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DollarSign,
  Users,
  Star,
  TrendingUp,
  Clock,
  Camera,
  Loader2,
  MessageSquare,
  Mic,
  Video,
  BarChart2,
  ChevronRight,
  ChevronLeft,
  Phone,
  Sparkles,
  HelpCircle,
  LayoutDashboard,
  Settings,
  Calendar,
  Menu,
  X,
  Activity,
  Download,
  ChevronDown,
} from "lucide-react";
import StripeConnectCard from "@/components/advisor/StripeConnectCard";
import { AdvisorSettingsView } from "@/components/advisor/AdvisorSettingsView";
import TwinSetupCard from "@/components/advisor/TwinSetupCard";
import VoiceRecordingCard from "@/components/advisor/VoiceRecordingCard";
import { AvailabilityScheduleCard } from "@/components/advisor/AvailabilityScheduleCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import type { Session } from "@/types/session";

// ─── Types ────────────────────────────────────────────────────────────────────
type Period = "7d" | "30d" | "90d";
type ActiveTab = "overview" | "settings" | "schedule" | "reviews" | "clients" | "insights" | "ai-payouts";

interface SessionWithClient extends Session {
  client: { full_name: string | null; avatar_url: string | null } | null;
}
interface ClientGroup {
  clientId: string;
  name: string;
  avatarUrl: string | null;
  sessions: SessionWithClient[];
  totalEarnings: number;
  lastSessionAt: string | null;
  typeCounts: { chat: number; audio: number; video: number };
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const earningsByPeriod: Record<
  Period,
  Array<{ label: string; chat: number; voice: number; video: number }>
> = {
  "7d": [
    { label: "Mon", chat: 85,   voice: 40,  video: 55  },
    { label: "Tue", chat: 60,   voice: 55,  video: 35  },
    { label: "Wed", chat: 110,  voice: 70,  video: 65  },
    { label: "Thu", chat: 90,   voice: 45,  video: 80  },
    { label: "Fri", chat: 130,  voice: 85,  video: 95  },
    { label: "Sat", chat: 160,  voice: 100, video: 120 },
    { label: "Sun", chat: 115,  voice: 75,  video: 90  },
  ],
  "30d": [
    { label: "W1", chat: 520, voice: 280, video: 340 },
    { label: "W2", chat: 680, voice: 360, video: 420 },
    { label: "W3", chat: 590, voice: 310, video: 380 },
    { label: "W4", chat: 810, voice: 430, video: 510 },
  ],
  "90d": [
    { label: "Jan", chat: 1850, voice: 980,  video: 1140 },
    { label: "Feb", chat: 2100, voice: 1120, video: 1320 },
    { label: "Mar", chat: 1960, voice: 1050, video: 1280 },
  ],
};

const statsByPeriod: Record<
  Period,
  { earnings: string; sessions: number; rating: number; pending: string }
> = {
  "7d":  { earnings: "$750",    sessions: 42,  rating: 4.8, pending: "$95"  },
  "30d": { earnings: "$4,280",  sessions: 186, rating: 4.8, pending: "$320" },
  "90d": { earnings: "$12,540", sessions: 548, rating: 4.9, pending: "$680" },
};

const sessionBreakdownByPeriod: Record<
  Period,
  Array<{ key: string; label: string; sessions: number; earnings: string; pct: number }>
> = {
  "7d": [
    { key: "chat",  label: "Chat",  sessions: 22,  earnings: "$550",   pct: 52 },
    { key: "voice", label: "Voice", sessions: 12,  earnings: "$300",   pct: 29 },
    { key: "video", label: "Video", sessions: 8,   earnings: "$200",   pct: 19 },
  ],
  "30d": [
    { key: "chat",  label: "Chat",  sessions: 98,  earnings: "$2,450", pct: 53 },
    { key: "voice", label: "Voice", sessions: 52,  earnings: "$1,300", pct: 28 },
    { key: "video", label: "Video", sessions: 36,  earnings: "$900",   pct: 19 },
  ],
  "90d": [
    { key: "chat",  label: "Chat",  sessions: 288, earnings: "$7,200", pct: 52 },
    { key: "voice", label: "Voice", sessions: 155, earnings: "$3,875", pct: 28 },
    { key: "video", label: "Video", sessions: 105, earnings: "$2,625", pct: 19 },
  ],
};

const mockReviews = [
  { id: "1", name: "Sarah M.", rating: 5, date: "Feb 8, 2026",  text: "Incredible reading! Everything resonated deeply. Will definitely come back." },
  { id: "2", name: "James K.", rating: 4, date: "Feb 7, 2026",  text: "Very insightful session. The tarot spread was spot on with my current situation." },
  { id: "3", name: "Luna R.",  rating: 5, date: "Feb 5, 2026",  text: "Best advisor on the platform. So kind and accurate. 10/10 recommend." },
  { id: "4", name: "David P.", rating: 4, date: "Feb 3, 2026",  text: "Great energy reading. Helped me understand blockages in my career path." },
  { id: "5", name: "Mia W.",   rating: 5, date: "Feb 1, 2026",  text: "Absolutely phenomenal. She knew things I hadn't even mentioned. Truly gifted." },
];
const allSpecialties = [
  "Tarot",
  "Astrology",
  "Numerology",
  "Dream Analysis",
  "Love Advice",
  "Career Guidance",
  "Energy Readings",
  "Mediumship",
  "Aura Reading",
  "Past Lives",
];

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayLabels: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
  Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

const pageTitles: Record<ActiveTab, string> = {
  overview:    "Overview",
  settings:    "Settings",
  schedule:    "Schedule",
  reviews:     "Reviews",
  clients:     "My Clients",
  insights:    "Insights",
  "ai-payouts": "AI Twin",
};

// ─── Component ────────────────────────────────────────────────────────────────
const AdvisorPrivateProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // UI state
  const [activeTab, setActiveTab]           = useState<ActiveTab>("overview");
  const [activePeriod, setActivePeriod]     = useState<Period>("30d");
  const [reportGranularity, setReportGranularity] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Avatar
  const [avatarUrl, setAvatarUrl]               = useState<string | undefined>(user?.avatarUrl);
  const [isUploading, setIsUploading]           = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  // Clients + insights data
  const [clientSessions, setClientSessions]       = useState<SessionWithClient[]>([]);
  const [isLoadingClients, setIsLoadingClients]   = useState(false);
  const [insightSessions, setInsightSessions]     = useState<Session[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOnline, setIsOnline] = useState(false);
  const [pricePerMinute, setPricePerMinute] = useState("3.50");

  // Fetch advisor details from DB on mount
  useEffect(() => {
    if (!user?.id) return;
    const fetchDetails = async () => {
      const { data, error } = await supabase
        .from('advisor_details')
        .select('status, bio_short, bio_long, specialties, price_per_minute, free_minutes, schedule')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setIsOnline(data.status === 'online');
        if (data.bio_short || data.bio_long) setBio(data.bio_short || data.bio_long || '');
        if (data.specialties && data.specialties.length > 0) setSelectedSpecialties(data.specialties);
        if (data.price_per_minute) setPricePerMinute(data.price_per_minute.toString());
        if (data.schedule && typeof data.schedule === 'object' && Object.keys(data.schedule).length > 0) {
          setSchedule(data.schedule as typeof schedule);
          savedScheduleRef.current = data.schedule as typeof schedule;
        }
        savedServiceRef.current = {
          pricePerMinute: data.price_per_minute?.toString() || '3.50',
          bio: data.bio_short || data.bio_long || '',
          selectedSpecialties: data.specialties && data.specialties.length > 0 ? [...data.specialties] : ['Tarot', 'Astrology', 'Love Advice'],
        };
      }
      setIsLoadingDetails(false);
    };
    fetchDetails();
  }, [user?.id]);

  // Persist status toggle to DB
  const handleStatusToggle = async (checked: boolean) => {
    setIsOnline(checked); // Optimistic update
    if (!user?.id) return;
    const { error } = await supabase
      .from('advisor_details')
      .update({ status: checked ? 'online' : 'offline' })
      .eq('id', user.id);
    if (error) {
      console.error('[AdvisorPrivateProfile] Status update error:', error);
      setIsOnline(!checked); // Revert on failure
    }
  };
  const [bio, setBio] = useState(
    "Intuitive tarot reader and astrologer with over 8 years of experience guiding seekers on their spiritual journey."
  );
  const [selectedSpecialties, setSelectedSpecialties] = useState([
    "Tarot",
    "Astrology",
    "Love Advice",
  ]);
  const [schedule, setSchedule] = useState<
    Record<"Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun", { enabled: boolean; start: string; end: string }>
  >({
    Mon: { enabled: true, start: "09:00", end: "17:00" },
    Tue: { enabled: true, start: "09:00", end: "17:00" },
    Wed: { enabled: true, start: "10:00", end: "18:00" },
    Thu: { enabled: true, start: "09:00", end: "17:00" },
    Fri: { enabled: true, start: "09:00", end: "15:00" },
    Sat: { enabled: false, start: "10:00", end: "14:00" },
    Sun: { enabled: false, start: "10:00", end: "14:00" },
  });
  const [scheduleChanged, setScheduleChanged] = useState(false);
  const savedScheduleRef = useRef(schedule);
  const [serviceChanged, setServiceChanged] = useState(false);
  const savedServiceRef = useRef({ pricePerMinute, bio, selectedSpecialties: [...selectedSpecialties] });

  const getInitials = () => {
    if (user?.firstName && user?.lastName)
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    if (user?.username) return user.username[0].toUpperCase();
    return "?";
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      setIsUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);
    if (!updateError) setAvatarUrl(publicUrl);
    setIsUploading(false);
    e.target.value = '';
  };

  const toggleSpecialty = (s: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
    setServiceChanged(true);
  };

  const handleSaveService = async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('advisor_details')
      .update({
        price_per_minute: parseFloat(pricePerMinute),
        bio_short: bio,
        specialties: selectedSpecialties,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    if (error) {
      console.error('[AdvisorPrivateProfile] Save service error:', error);
      return;
    }
    savedServiceRef.current = { pricePerMinute, bio, selectedSpecialties: [...selectedSpecialties] };
    setServiceChanged(false);
    toast({ title: "Service settings saved" });
  };

  const handleDiscardService = () => {
    setPricePerMinute(savedServiceRef.current.pricePerMinute);
    setBio(savedServiceRef.current.bio);
    setSelectedSpecialties(savedServiceRef.current.selectedSpecialties);
    setServiceChanged(false);
  };

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
    setScheduleChanged(true);
  };

  const updateTime = (day: string, field: "start" | "end", value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
    setScheduleChanged(true);
  };

  const handleSaveSchedule = async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('advisor_details')
      .update({
        schedule: schedule,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    if (error) {
      console.error('[AdvisorPrivateProfile] Save schedule error:', error);
      return;
    }
    savedScheduleRef.current = schedule;
    setScheduleChanged(false);
    toast({ title: "Schedule saved" });
  };

  const handleDiscardSchedule = () => {
    setSchedule(savedScheduleRef.current);
    setScheduleChanged(false);
  };

  const navigate_ = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Type", "Duration (min)", "Earnings ($)"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (insightSessions as any[]).map((s) => [
      s.started_at ? new Date(s.started_at).toLocaleDateString() : "—",
      s.type ?? "—",
      String(s.billable_minutes ?? 0),
      s.cost_total != null ? (s.cost_total / 100).toFixed(2) : "0.00",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sessions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Derived data
  const stats       = statsByPeriod[activePeriod];
  const breakdown   = sessionBreakdownByPeriod[activePeriod];
  const chartData   = earningsByPeriod[activePeriod];
  const totalSess   = breakdown.reduce((s, t) => s + t.sessions, 0);
  const periodLabel = activePeriod === "7d" ? "last 7 days" : activePeriod === "30d" ? "last 30 days" : "last 90 days";

  const clientGroups: ClientGroup[] = Object.values(
    clientSessions.reduce((acc, s) => {
      if (!acc[s.client_id]) {
        acc[s.client_id] = {
          clientId: s.client_id,
          name: s.client?.full_name || "Unknown Client",
          avatarUrl: s.client?.avatar_url ?? null,
          sessions: [],
          totalEarnings: 0,
          lastSessionAt: null,
          typeCounts: { chat: 0, audio: 0, video: 0 },
        };
      }
      acc[s.client_id].sessions.push(s);
      acc[s.client_id].totalEarnings += s.cost_total ?? 0;
      if (!acc[s.client_id].lastSessionAt || (s.started_at && s.started_at > (acc[s.client_id].lastSessionAt ?? "")))
        acc[s.client_id].lastSessionAt = s.started_at;
      const t = s.type as keyof ClientGroup["typeCounts"];
      if (t in acc[s.client_id].typeCounts) acc[s.client_id].typeCounts[t]++;
      return acc;
    }, {} as Record<string, ClientGroup>)
  ).sort((a, b) => b.sessions.length - a.sessions.length);

  const totalInsightSessions = insightSessions.length;
  const totalInsightEarnings = insightSessions.reduce((s, r) => s + (r.cost_total ?? 0), 0);
  const uniqueClientCount    = new Set(insightSessions.map(s => s.client_id)).size;
  const totalMinutes         = insightSessions.reduce((s, r) => s + r.billable_minutes, 0);
  const avgDurationMin       = totalInsightSessions > 0 ? (totalMinutes / totalInsightSessions).toFixed(1) : "0";
  const totalHours           = (totalMinutes / 60).toFixed(1);
  const typeDistributionData = [
    { label: "Chat",  count: insightSessions.filter(s => s.type === "chat").length,  fill: "hsl(var(--primary))" },
    { label: "Voice", count: insightSessions.filter(s => s.type === "audio").length, fill: "#A23CDE" },
    { label: "Video", count: insightSessions.filter(s => s.type === "video").length, fill: "#6842EF" },
  ];

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sessions30d = insightSessions.filter(s => s.started_at && new Date(s.started_at) >= thirtyDaysAgo);
  const clientFreq30d = sessions30d.reduce((acc, s) => {
    acc[s.client_id] = (acc[s.client_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const uniqueClients30d    = Object.keys(clientFreq30d).length;
  const returningClients30d = Object.values(clientFreq30d).filter(c => c > 1).length;
  const returningClientsPct = uniqueClients30d > 0 ? Math.round((returningClients30d / uniqueClients30d) * 100) : 0;

  const avgRawMins           = totalInsightSessions > 0 ? totalMinutes / totalInsightSessions : 0;
  const avgDurHours          = Math.floor(avgRawMins / 60);
  const avgDurMins           = Math.round(avgRawMins % 60);
  const avgDurationFormatted = avgDurHours > 0 ? `${avgDurHours}h ${avgDurMins}m` : `${avgDurMins}m`;
  const avgDurTrackPct       = Math.min(Math.round((avgRawMins / 60) * 100), 100);

  // ─── Sidebar nav config ────────────────────────────────────────────────────
  const mainNav = [
    { id: "overview"  as ActiveTab, label: "Overview",  icon: LayoutDashboard },
    { id: "settings"  as ActiveTab, label: "Settings",  icon: Settings        },
    { id: "schedule"  as ActiveTab, label: "Schedule",  icon: Calendar        },
    { id: "reviews"   as ActiveTab, label: "Reviews",   icon: Star            },
  ];
  const analyticsNav = [
    { id: "clients"  as ActiveTab, label: "My Clients", icon: Users    },
    { id: "insights" as ActiveTab, label: "Insights",   icon: BarChart2 },
  ];
  const toolsNav = [
    { id: "ai-payouts" as ActiveTab, label: "AI Twin", icon: Sparkles },
  ];

  const NavBtn = ({ id, label, icon: Icon }: { id: ActiveTab; label: string; icon: React.ElementType }) => {
    const btn = (
      <button
        onClick={() => navigate_(id)}
        className={`w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200 text-left group ${
          sidebarCollapsed ? "justify-center px-0 py-2.5 h-10" : "gap-3 px-3 py-2.5"
        } ${
          activeTab === id
            ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]"
            : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
        }`}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${activeTab === id ? "text-primary" : "group-hover:text-foreground"}`} />
        {!sidebarCollapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            {activeTab === id && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            )}
          </>
        )}
      </button>
    );
    if (sidebarCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8} className="font-medium">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return btn;
  };

  return (
    <TooltipProvider delayDuration={100}>
    <div className="relative flex min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-64px)]">

      {/* ── Mobile backdrop ─────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[59] bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDEBAR
          ═══════════════════════════════════════════════════════════════════════ */}
      <aside
        className={`
          fixed top-0 left-0 z-[60] h-full
          lg:sticky lg:top-16 lg:translate-x-0 lg:self-start lg:h-[calc(100vh-4rem)]
          w-64 shrink-0 flex flex-col
          border-r border-border/50
          transition-[width,transform] duration-300 ease-in-out
          ${sidebarCollapsed ? "lg:w-[72px]" : "lg:w-64"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card)/0.97) 100%)",
        }}
      >
        {/* Close btn — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-3.5 right-3.5 z-10 w-7 h-7 rounded-lg flex items-center justify-center bg-muted/50 border border-border/60 hover:bg-muted transition-colors lg:hidden"
          aria-label="Close menu"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        {/* ── Collapse toggle — desktop only ── */}
        <button
          onClick={() => setSidebarCollapsed((c) => !c)}
          className="hidden lg:flex absolute -right-3.5 top-5 z-40 w-7 h-7 items-center justify-center rounded-full bg-card border border-border/70 shadow-md hover:bg-muted hover:border-primary/40 hover:text-primary transition-all duration-200 text-muted-foreground"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft className="w-3.5 h-3.5" />
          }
        </button>

        {/* ── Profile block ── */}
        <div className={`relative overflow-hidden transition-all duration-300 ${sidebarCollapsed ? "px-2 pt-5 pb-3" : "px-4 pt-6 pb-4"}`}>
          {/* Ambient glow */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-primary/8 blur-3xl pointer-events-none" />

          <div className={`relative flex flex-col items-center gap-3 ${sidebarCollapsed ? "gap-2" : ""}`}>
            {/* Avatar */}
            <div
              className="relative group cursor-pointer"
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <div
                className={`absolute -inset-[3px] rounded-full transition-all duration-700 ${
                  isOnline
                    ? "bg-gradient-to-br from-emerald-400 via-cyan-400 to-emerald-500"
                    : "bg-gradient-to-br from-border/60 to-muted/40"
                }`}
                style={isOnline ? { boxShadow: "0 0 18px rgba(16,185,129,0.4)" } : {}}
              />
              <Avatar className={`relative z-10 ring-[3px] ring-card transition-all duration-300 ${sidebarCollapsed ? "w-10 h-10" : "w-[68px] h-[68px]"}`}>
                <AvatarImage src={avatarUrl} alt={user?.firstName || user?.username || "Advisor"} className="object-cover" />
                <AvatarFallback className={`bg-primary/20 text-primary font-bold ${sidebarCollapsed ? "text-sm" : "text-xl"}`}>{getInitials()}</AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="absolute inset-0 rounded-full bg-black/55 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  {isUploading
                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                    : <><Camera className="w-4 h-4 text-white" /><span className="text-white text-[9px] font-medium">Change</span></>
                  }
                </div>
              )}
              {!sidebarCollapsed && (
                <span className="absolute bottom-0.5 right-0.5 z-30 w-[18px] h-[18px] rounded-full bg-primary border-2 border-card flex items-center justify-center shadow">
                  <Camera className="w-2 h-2 text-primary-foreground" />
                </span>
              )}
              {/* Status dot when collapsed */}
              {sidebarCollapsed && (
                <span className={`absolute bottom-0 right-0 z-30 w-3 h-3 rounded-full border-2 border-card transition-all duration-500 ${
                  isOnline ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-muted-foreground/40"
                }`} />
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            {/* Name + link — hidden when collapsed */}
            {!sidebarCollapsed && (
              <div className="text-center w-full">
                <p className="text-sm font-semibold text-foreground truncate px-2 leading-tight">
                  {user?.firstName
                    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
                    : user?.username || "Advisor"}
                </p>
                <p className="text-[10px] text-muted-foreground/50 font-medium tracking-wide uppercase mt-0.5">Advisor</p>
                <button
                  onClick={() => navigate(`/advisor/${user?.id}`)}
                  className="inline-flex items-center gap-0.5 text-[11px] text-primary/55 hover:text-primary transition-colors mt-1.5 group/link"
                >
                  View public profile
                  <ChevronRight className="w-3 h-3 transition-transform group-hover/link:translate-x-0.5" />
                </button>
              </div>
            )}

            {/* Status toggle pill — full when expanded, icon-only when collapsed */}
            {!sidebarCollapsed ? (
              <div className="w-full flex items-center justify-between bg-background/60 border border-border/50 rounded-xl px-3.5 py-2.5 mt-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-500 ${
                      isOnline
                        ? "bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.8)] animate-pulse"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                  <span className={`text-xs font-semibold tracking-wide transition-colors ${isOnline ? "text-emerald-400" : "text-muted-foreground"}`}>
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <Switch checked={isOnline} onCheckedChange={handleStatusToggle} className="scale-[0.8] origin-right" />
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleStatusToggle(!isOnline)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                      isOnline
                        ? "bg-emerald-400/10 border-emerald-400/30 hover:bg-emerald-400/20"
                        : "bg-muted/40 border-border/50 hover:bg-muted"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      isOnline ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" : "bg-muted-foreground/40"
                    }`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="font-medium">
                  {isOnline ? "Online — click to go offline" : "Offline — click to go online"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Divider */}
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />
        </div>

        {/* ── Navigation ── */}
        <nav className={`flex-1 py-3 space-y-0.5 overflow-y-auto scrollbar-hide transition-all duration-300 ${sidebarCollapsed ? "px-2" : "px-3"}`}>
          {!sidebarCollapsed && (
            <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground/40 px-3 mb-2">
              Main
            </p>
          )}
          {mainNav.map((item) => <NavBtn key={item.id} {...item} />)}

          <div className="my-3 h-px bg-border/40 mx-2" />

          {!sidebarCollapsed && (
            <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground/40 px-3 mb-2">
              Analytics
            </p>
          )}
          {analyticsNav.map((item) => <NavBtn key={item.id} {...item} />)}

          <div className="my-3 h-px bg-border/40 mx-2" />

          {!sidebarCollapsed && (
            <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground/40 px-3 mb-2">
              Tools
            </p>
          )}
          {toolsNav.map((item) => <NavBtn key={item.id} {...item} />)}

          <div className="my-3 h-px bg-border/40 mx-2" />

          {/* My Activity — direct link to /advisor-activity */}
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { navigate("/advisor-activity"); setSidebarOpen(false); }}
                  className="w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 px-0 py-2.5 h-10 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                >
                  <Activity className="w-4 h-4 flex-shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8} className="font-medium">My Activity</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => { navigate("/advisor-activity"); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 text-left group px-3 py-2.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
            >
              <Activity className="w-4 h-4 flex-shrink-0 group-hover:text-foreground" />
              <span className="flex-1 truncate">My Activity</span>
            </button>
          )}
        </nav>

        {/* ── Live Sessions CTA ── */}
        <div className="p-3 border-t border-border/40">
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-full h-10 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 rounded-lg transition-all"
                  onClick={() => { navigate("/advisor-call"); setSidebarOpen(false); }}
                >
                  <Phone className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8} className="font-medium">Live Sessions</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 h-9 rounded-lg font-semibold transition-all"
              onClick={() => { navigate("/advisor-call"); setSidebarOpen(false); }}
            >
              <Phone className="w-3.5 h-3.5" />
              Live Sessions
            </Button>
          )}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 min-w-0 flex flex-col bg-background">

        {/* Mobile top bar */}
        <div className="shrink-0 flex items-center gap-3 px-4 h-14 bg-background/95 backdrop-blur-md border-b border-border/50 lg:hidden">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-border/60 bg-card/60 hover:bg-card transition-colors flex-shrink-0"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          >
            {sidebarOpen ? <X className="w-4 h-4 text-foreground" /> : <Menu className="w-4 h-4 text-foreground" />}
          </button>
          <h2 className="text-sm font-semibold text-foreground flex-1 truncate">
            {pageTitles[activeTab]}
          </h2>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                isOnline ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.7)]" : "bg-muted-foreground/30"
              }`}
            />
            <span className={`text-xs font-semibold ${isOnline ? "text-emerald-400" : "text-muted-foreground"}`}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1">
          <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5 sm:space-y-6">

            {/* ────────────────────────────────────────────────────
                OVERVIEW
            ──────────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif" }}>

                {/* ── Page header + toolbar ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  {/* Left: title + subtitle */}
                  <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em" }}>Overview</h1>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                      <strong style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>{totalSess}</strong> sessions in {periodLabel}
                    </p>
                  </div>

                  {/* Right: granularity selector + export */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {/* Granularity selector — segmented pill */}
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(6,182,212,0.18)",
                      borderRadius: 12,
                      padding: 3,
                      gap: 2,
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 2px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
                    }}>
                      {(["daily", "weekly", "monthly"] as const).map((opt) => {
                        const active = reportGranularity === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => {
                              setReportGranularity(opt);
                              setActivePeriod(opt === "daily" ? "7d" : opt === "weekly" ? "30d" : "90d");
                            }}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 9,
                              border: active ? "1px solid rgba(6,182,212,0.45)" : "1px solid transparent",
                              background: active
                                ? "linear-gradient(135deg, rgba(6,182,212,0.22) 0%, rgba(6,182,212,0.10) 100%)"
                                : "transparent",
                              color: active ? "#06b6d4" : "rgba(255,255,255,0.38)",
                              fontSize: 11,
                              fontWeight: active ? 700 : 500,
                              cursor: "pointer",
                              fontFamily: "'Plus Jakarta Sans', ui-sans-serif, sans-serif",
                              letterSpacing: "0.04em",
                              textTransform: "capitalize",
                              transition: "all 0.18s ease",
                              boxShadow: active ? "0 1px 8px rgba(6,182,212,0.2), inset 0 1px 0 rgba(6,182,212,0.15)" : "none",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </button>
                        );
                      })}
                    </div>

                    {/* Export CSV */}
                    <button
                      onClick={handleExportCSV}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 14px",
                        borderRadius: 10,
                        background: "rgba(6,182,212,0.15)",
                        border: "1px solid rgba(6,182,212,0.35)",
                        color: "#06b6d4",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "'Plus Jakarta Sans', ui-sans-serif, sans-serif",
                        boxShadow: "0 2px 12px rgba(6,182,212,0.15)",
                        transition: "all 0.15s ease",
                        whiteSpace: "nowrap",
                      }}
                      onMouseOver={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "rgba(6,182,212,0.25)"; b.style.borderColor = "rgba(6,182,212,0.55)"; }}
                      onMouseOut={(e)  => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "rgba(6,182,212,0.15)"; b.style.borderColor = "rgba(6,182,212,0.35)"; }}
                    >
                      <Download size={13} />
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Preview banner */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.15)", borderRadius: 12, padding: "10px 14px", backdropFilter: "blur(8px)" }}>
                  <Sparkles size={15} style={{ color: "rgba(6,182,212,0.85)", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                    Stats preview — your real earnings and sessions will appear here after your first reading.
                  </span>
                </div>

                {/* KPI stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Total Earnings",  value: stats.earnings,         accentRgb: "6,182,212",   change: "+12%", bars: [30, 50, 40, 65, 55, 80, 70] },
                    { label: "Sessions",        value: String(stats.sessions), accentRgb: "139,92,246",  change: "+8%",  bars: [45, 60, 35, 70, 50, 85, 65] },
                    { label: "Avg Rating",      value: String(stats.rating),   accentRgb: "245,158,11",  change: "",     bars: [60, 45, 75, 55, 80, 65, 90] },
                    { label: "Pending Balance", value: stats.pending,          accentRgb: "167,139,250", change: "",     bars: [40, 70, 50, 80, 45, 85, 60] },
                  ].map(({ label, value, accentRgb, change, bars }) => (
                    <div key={label} style={{ borderRadius: 18, padding: "1.5px", background: `linear-gradient(160deg, rgba(6,182,212,0.35) 0%, rgba(6,182,212,0.12) 50%, rgba(6,182,212,0.04) 100%)`, boxShadow: "0 0 0 0.5px rgba(6,182,212,0.08), 0 8px 32px rgba(0,0,0,0.45)" }}>
                      <div style={{ borderRadius: 16.5, background: "linear-gradient(155deg, #120A2E 0%, #0C0418 55%, #09061A 100%)", backdropFilter: "blur(24px)", padding: "16px 16px 14px", height: "100%", display: "flex", flexDirection: "column" }}>
                        {/* Top row: label + mini bar chart */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", fontFamily: "'SF Mono','Fira Code',monospace", lineHeight: 1.4 }}>{label}</span>
                          {/* Mini bar chart */}
                          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 26, flexShrink: 0 }}>
                            {bars.map((h, i) => (
                              <div key={i} style={{ width: 3, borderRadius: 2, height: `${h}%`, background: i >= bars.length - 2 ? `rgba(6,182,212,1)` : `rgba(6,182,212,${0.18 + i * 0.09})` }} />
                            ))}
                          </div>
                        </div>
                        {/* Value */}
                        <p style={{ margin: "0 0 0", fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.93)", letterSpacing: "-0.03em", lineHeight: 1, flexGrow: 1 }}>{value}</p>
                        {/* Bottom trend */}
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 14, paddingTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${change ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: change ? "#4ade80" : "rgba(255,255,255,0.15)" }} />
                          </div>
                          <span style={{ fontSize: 11, color: change ? "#4ade80" : "rgba(255,255,255,0.22)", fontWeight: 600 }}>
                            {change ? `${change} last ${activePeriod === "7d" ? "week" : activePeriod === "30d" ? "month" : "quarter"}` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Session Breakdown */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}>Session Breakdown</h3>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.38)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "3px 10px", borderRadius: 999, fontFamily: "'SF Mono',monospace" }}>{totalSess} total</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {breakdown.map((t) => {
                      const colors = {
                        chat:  { hex: "#06b6d4", rgb: "6,182,212",  icon: MessageSquare },
                        voice: { hex: "#8b5cf6", rgb: "139,92,246", icon: Mic           },
                        video: { hex: "#6842EF", rgb: "104,66,239", icon: Video         },
                      }[t.key as "chat" | "voice" | "video"];
                      const TypeIcon = colors.icon;
                      return (
                        <div key={t.key} style={{ borderRadius: 20, padding: "1.5px", background: `linear-gradient(160deg, rgba(${colors.rgb},0.45) 0%, rgba(139,92,246,0.1) 50%, rgba(${colors.rgb},0.04) 100%)`, boxShadow: "0 0 0 0.5px rgba(139,92,246,0.07), 0 8px 32px rgba(0,0,0,0.4)" }}>
                          <div style={{ borderRadius: 18.5, background: "linear-gradient(155deg, #120A2E 0%, #0C0418 55%, #09061A 100%)", backdropFilter: "blur(24px)", padding: "18px 18px 16px", position: "relative", overflow: "hidden" }}>
                            {/* ambient glow */}
                            <div style={{ position: "absolute", top: -28, right: -28, width: 90, height: 90, borderRadius: "50%", background: `rgba(${colors.rgb},0.12)`, filter: "blur(28px)", pointerEvents: "none" }} />
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 11, background: `rgba(${colors.rgb},0.12)`, border: `1px solid rgba(${colors.rgb},0.25)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 14px rgba(${colors.rgb},0.08)` }}>
                                <TypeIcon size={16} style={{ color: colors.hex }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: `rgba(${colors.rgb},0.12)`, border: `1px solid rgba(${colors.rgb},0.28)`, color: colors.hex, fontFamily: "'SF Mono',monospace", letterSpacing: "0.04em" }}>{t.pct}%</span>
                            </div>
                            <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: `rgba(${colors.rgb},0.65)`, fontFamily: "'SF Mono',monospace" }}>{t.label}</p>
                            <p style={{ margin: "0 0 2px", fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.03em", lineHeight: 1 }}>{t.sessions}</p>
                            <p style={{ margin: "0 0 10px", fontSize: 11, color: "rgba(255,255,255,0.38)" }}>sessions</p>
                            <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: colors.hex }}>{t.earnings}</p>
                            <p style={{ margin: "0 0 12px", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>revenue earned</p>
                            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${t.pct}%`, background: `linear-gradient(90deg, rgba(${colors.rgb},0.65), ${colors.hex})`, borderRadius: 3, transition: "width 0.7s ease", boxShadow: `0 0 8px rgba(${colors.rgb},0.5)` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Earnings Chart */}
                <div style={{ borderRadius: 20, padding: "1.5px", background: "linear-gradient(160deg, rgba(6,182,212,0.4) 0%, rgba(6,182,212,0.15) 50%, rgba(6,182,212,0.05) 100%)", boxShadow: "0 0 0 0.5px rgba(6,182,212,0.08), 0 16px 48px rgba(0,0,0,0.5)" }}>
                  <div style={{ borderRadius: 18.5, background: "linear-gradient(155deg, #120A2E 0%, #0C0418 55%, #09061A 100%)", backdropFilter: "blur(24px)", overflow: "hidden" }}>
                    <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}>Earnings Breakdown</h3>
                    </div>
                    <div style={{ padding: "16px 8px 4px 4px" }}>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                          <defs>
                            <linearGradient id="ovChatGrad"  x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.4}  />
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="ovVoiceGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="ovVideoGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#6842EF" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#6842EF" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans',ui-sans-serif,sans-serif" }} />
                          <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} width={45} tick={{ fill: "rgba(255,255,255,0.28)", fontFamily: "'Plus Jakarta Sans',ui-sans-serif,sans-serif" }} />
                          <ChartTooltip
                            cursor={{ stroke: "rgba(6,182,212,0.25)", strokeWidth: 1, strokeDasharray: "4 4" }}
                            contentStyle={{ background: "linear-gradient(155deg,#1a0d38,#0f0620)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: "10px", color: "rgba(255,255,255,0.88)", fontSize: "12px", fontFamily: "'Plus Jakarta Sans',sans-serif", boxShadow: "0 8px 32px rgba(0,0,0,0.55)" }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any, name: string) => [`$${value}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                          />
                          <Area type="monotone" dataKey="chat"  stackId="1" stroke="#06b6d4" fill="url(#ovChatGrad)"  strokeWidth={2} />
                          <Area type="monotone" dataKey="voice" stackId="1" stroke="#8b5cf6" fill="url(#ovVoiceGrad)" strokeWidth={2} />
                          <Area type="monotone" dataKey="video" stackId="1" stroke="#6842EF" fill="url(#ovVideoGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, padding: "0 16px 16px" }}>
                      {[
                        { label: "Chat",  color: "#06b6d4" },
                        { label: "Voice", color: "#8b5cf6" },
                        { label: "Video", color: "#6842EF" },
                      ].map((l) => (
                        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, display: "inline-block", boxShadow: `0 0 6px ${l.color}` }} />
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ────────────────────────────────────────────────────
                SETTINGS
            ──────────────────────────────────────────────────── */}
            {activeTab === "settings" && (
              <AdvisorSettingsView
                pricePerMinute={pricePerMinute}
                setPricePerMinute={setPricePerMinute}
                bio={bio}
                setBio={setBio}
                selectedSpecialties={selectedSpecialties}
                allSpecialties={allSpecialties}
                toggleSpecialty={toggleSpecialty}
                serviceChanged={serviceChanged}
                setServiceChanged={setServiceChanged}
                handleSaveService={handleSaveService}
                handleDiscardService={handleDiscardService}
                isLoadingDetails={isLoadingDetails}
              />
            )}

            {/* ────────────────────────────────────────────────────
                SCHEDULE
            ──────────────────────────────────────────────────── */}
            {activeTab === "schedule" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif" }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em" }}>Schedule</h1>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Set your weekly availability</p>
                </div>

                <AvailabilityScheduleCard
                  schedule={schedule}
                  scheduleChanged={scheduleChanged}
                  onToggleDay={toggleDay}
                  onUpdateTime={updateTime}
                  onSave={handleSaveSchedule}
                  onDiscard={handleDiscardSchedule}
                />
              </div>
            )}

            {/* ────────────────────────────────────────────────────
                REVIEWS
            ──────────────────────────────────────────────────── */}
            {activeTab === "reviews" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif" }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em" }}>Reviews</h1>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>What clients say about you</p>
                </div>

                <div style={{ borderRadius: 20, padding: "1.5px", background: "linear-gradient(160deg, rgba(6,182,212,0.4) 0%, rgba(6,182,212,0.15) 50%, rgba(6,182,212,0.05) 100%)", boxShadow: "0 0 0 0.5px rgba(6,182,212,0.08), 0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35)" }}>
                  <div style={{ borderRadius: "18.5px", background: "linear-gradient(155deg, #120A2E 0%, #0C0418 55%, #09061A 100%)", backdropFilter: "blur(24px)", overflow: "hidden" }}>

                    {/* Card header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg, rgba(6,182,212,0.14) 0%, rgba(139,92,246,0.14) 100%)", border: "1px solid rgba(6,182,212,0.22)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 18px rgba(6,182,212,0.09)", flexShrink: 0 }}>
                          <Star size={18} style={{ color: "rgba(6,182,212,0.85)", fill: "rgba(6,182,212,0.25)" }} />
                        </div>
                        <div>
                          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em", fontFamily: "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif" }}>Client Reviews</h2>
                          <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif" }}>
                            {mockReviews.length > 0 ? `${mockReviews.length} review${mockReviews.length !== 1 ? "s" : ""} from your clients` : "No reviews yet"}
                          </p>
                        </div>
                      </div>
                      {mockReviews.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.2)" }}>
                          <Star size={13} style={{ color: "rgba(6,182,212,0.9)", fill: "rgba(6,182,212,0.5)" }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(6,182,212,0.9)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>4.8</span>
                        </div>
                      )}
                    </div>

                    {/* Review rows */}
                    <div style={{ padding: "14px 16px 16px" }}>
                      {mockReviews.length === 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center" }}>
                          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                            <Star size={20} style={{ color: "rgba(255,255,255,0.18)" }} />
                          </div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>No reviews yet</p>
                          <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.28)" }}>Reviews will appear here after completed sessions.</p>
                        </div>
                      ) : (
                        mockReviews.map((review) => (
                          <div key={review.id} style={{ position: "relative", borderRadius: 14, padding: "1px", background: "linear-gradient(135deg, rgba(6,182,212,0.32) 0%, rgba(139,92,246,0.16) 50%, transparent 100%)", boxShadow: "0 0 0 0.5px rgba(6,182,212,0.1), 0 4px 16px rgba(6,182,212,0.05), 0 2px 8px rgba(0,0,0,0.35)", marginBottom: 7 }}>
                            <div aria-hidden="true" style={{ position: "absolute", left: 1, top: "18%", bottom: "18%", width: 3, borderRadius: "0 3px 3px 0", background: "linear-gradient(180deg, #06b6d4 0%, rgba(139,92,246,0.6) 100%)", boxShadow: "0 0 14px rgba(6,182,212,0.7)", zIndex: 2 }} />
                            <div style={{ borderRadius: 13, padding: "14px 16px 14px 20px", background: "linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(139,92,246,0.04) 100%)", backdropFilter: "blur(12px)", position: "relative", zIndex: 2 }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                                <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(139,92,246,0.15) 100%)", border: "1px solid rgba(6,182,212,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(6,182,212,0.9)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{review.name[0]}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{review.name}</p>
                                    <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} size={12} style={i < review.rating ? { color: "rgba(6,182,212,0.9)", fill: "rgba(6,182,212,0.7)" } : { color: "rgba(255,255,255,0.15)", fill: "transparent" }} />
                                      ))}
                                    </div>
                                  </div>
                                  <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "rgba(255,255,255,0.3)", fontFamily: "'SF Mono', 'Fira Code', monospace", letterSpacing: "0.04em" }}>{review.date}</p>
                                </div>
                              </div>
                              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{review.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────────────
                MY CLIENTS
            ──────────────────────────────────────────────────── */}
            {activeTab === "clients" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em" }}>My Clients</h1>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Your complete client history</p>
                  </div>
                  {clientGroups.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 999, background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", color: "rgba(6,182,212,0.9)", flexShrink: 0, marginTop: 4, fontFamily: "'SF Mono', monospace", letterSpacing: "0.04em" }}>
                      {clientGroups.length} client{clientGroups.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {isLoadingClients ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px 0" }}>
                    <Loader2 size={22} className="animate-spin" style={{ color: "#06b6d4" }} />
                  </div>
                ) : clientGroups.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", textAlign: "center" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <Users size={22} style={{ color: "rgba(6,182,212,0.4)" }} />
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>No clients yet</p>
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Your clients will appear here after completed sessions.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {clientGroups.map((client) => (
                      <div
                        key={client.clientId}
                        style={{ position: "relative", borderRadius: 16, padding: "1.5px", background: "linear-gradient(135deg, rgba(6,182,212,0.32) 0%, rgba(139,92,246,0.16) 50%, transparent 100%)", boxShadow: "0 0 0 0.5px rgba(6,182,212,0.08), 0 4px 16px rgba(0,0,0,0.35)" }}
                      >
                        <div style={{ borderRadius: 14.5, background: "linear-gradient(155deg, #120A2E 0%, #0C0418 55%, #09061A 100%)", backdropFilter: "blur(24px)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                          {/* Avatar */}
                          <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(139,92,246,0.15) 100%)", border: "1px solid rgba(6,182,212,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {client.avatarUrl
                              ? <img src={client.avatarUrl} alt={client.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(6,182,212,0.9)" }}>{client.name[0]?.toUpperCase()}</span>
                            }
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                              {client.typeCounts.chat > 0 && (
                                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.22)", color: "rgba(6,182,212,0.9)", fontWeight: 700 }}>{client.typeCounts.chat} chat</span>
                              )}
                              {client.typeCounts.audio > 0 && (
                                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.22)", color: "rgba(139,92,246,0.9)", fontWeight: 700 }}>{client.typeCounts.audio} voice</span>
                              )}
                              {client.typeCounts.video > 0 && (
                                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "rgba(104,66,239,0.1)", border: "1px solid rgba(104,66,239,0.22)", color: "rgba(104,66,239,0.9)", fontWeight: 700 }}>{client.typeCounts.video} video</span>
                              )}
                            </div>
                          </div>
                          {/* Earnings */}
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>${client.totalEarnings.toFixed(2)}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
                              {client.sessions.length} session{client.sessions.length !== 1 ? "s" : ""}
                            </p>
                            {client.lastSessionAt && (
                              <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                                {new Date(client.lastSessionAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ────────────────────────────────────────────────────
                INSIGHTS
            ──────────────────────────────────────────────────── */}
            {activeTab === "insights" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif" }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em" }}>Performance Insights</h1>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Analytics from your completed sessions</p>
                </div>

                {isLoadingInsights ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px 0" }}>
                    <Loader2 size={22} className="animate-spin" style={{ color: "#06b6d4" }} />
                  </div>
                ) : totalInsightSessions === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", textAlign: "center" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <BarChart2 size={22} style={{ color: "rgba(255,255,255,0.18)" }} />
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>No data yet</p>
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Complete your first session to see insights here.</p>
                  </div>
                ) : (
                  <>
                    {/* 3 metric cards */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {[
                        { label: "Unique Clients", value: String(uniqueClientCount), icon: Users,      rgb: "6,182,212"   },
                        { label: "Avg Session",    value: `${avgDurationMin}m`,      icon: Clock,      rgb: "139,92,246"  },
                        { label: "Total Hours",    value: `${totalHours}h`,          icon: TrendingUp, rgb: "6,182,212"   },
                      ].map((m) => (
                        <div key={m.label} style={{ borderRadius: 18, padding: "1.5px", background: `linear-gradient(160deg, rgba(${m.rgb},0.38) 0%, rgba(${m.rgb},0.12) 50%, rgba(${m.rgb},0.04) 100%)`, boxShadow: `0 0 0 0.5px rgba(${m.rgb},0.08), 0 8px 28px rgba(0,0,0,0.45)` }}>
                          <div style={{ borderRadius: 16.5, background: "linear-gradient(155deg, #120A2E 0%, #0C0418 55%, #09061A 100%)", backdropFilter: "blur(24px)", padding: "14px", display: "flex", flexDirection: "column", gap: 8, justifyContent: "space-between", height: "100%" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", fontFamily: "'SF Mono',monospace", lineHeight: 1.4 }}>{m.label}</span>
                              <div style={{ width: 30, height: 30, borderRadius: 9, background: `rgba(${m.rgb},0.1)`, border: `1px solid rgba(${m.rgb},0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <m.icon size={14} style={{ color: `rgb(${m.rgb})` }} />
                              </div>
                            </div>
                            <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.93)", letterSpacing: "-0.03em", lineHeight: 1 }}>{m.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Return rate + Avg duration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Return rate */}
                      <div style={{ borderRadius: 20, padding: "1.5px", background: "linear-gradient(160deg, rgba(6,182,212,0.38) 0%, rgba(6,182,212,0.12) 50%, rgba(6,182,212,0.04) 100%)", boxShadow: "0 0 0 0.5px rgba(6,182,212,0.08), 0 8px 32px rgba(0,0,0,0.45)" }}>
                        <div style={{ borderRadius: 18.5, background: "linear-gradient(155deg, #120A2E 0%, #0C0418 55%, #09061A 100%)", backdropFilter: "blur(24px)", padding: "20px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                            <div>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Return clients</p>
                              <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>(last 30 days)</p>
                            </div>
                            <button title="Clients who had more than one session with you in the last 30 days" style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(6,182,212,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <HelpCircle size={13} style={{ color: "rgba(6,182,212,0.6)" }} />
                            </button>
                          </div>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                              <p style={{ margin: 0, fontSize: 30, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.03em" }}>{returningClients30d}</p>
                              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>clients</p>
                            </div>
                            <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.07)", margin: "0 12px", flexShrink: 0 }} />
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                              <p style={{ margin: 0, fontSize: 30, fontWeight: 700, color: "#06b6d4", letterSpacing: "-0.03em" }}>{returningClientsPct}%</p>
                              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>return rate</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Avg duration */}
                      <div style={{ borderRadius: 20, padding: "1.5px", background: "linear-gradient(160deg, rgba(6,182,212,0.38) 0%, rgba(6,182,212,0.12) 50%, rgba(6,182,212,0.04) 100%)", boxShadow: "0 0 0 0.5px rgba(6,182,212,0.08), 0 8px 32px rgba(0,0,0,0.45)" }}>
                        <div style={{ borderRadius: 18.5, background: "linear-gradient(155deg, #120A2E 0%, #0C0418 55%, #09061A 100%)", backdropFilter: "blur(24px)", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          <p style={{ margin: "0 0 4px", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Avg session duration</p>
                          <p style={{ margin: 0, fontSize: 30, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.03em" }}>{avgDurationFormatted}</p>
                          <div style={{ position: "relative", width: "100%", marginTop: 12 }}>
                            <div style={{ height: 4, borderRadius: 3, background: "rgba(255,255,255,0.07)", width: "100%" }} />
                            <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `calc(${avgDurTrackPct}% - 6px)`, width: 12, height: 12, borderRadius: "50%", background: "#06b6d4", border: "2px solid #0C0418", boxShadow: "0 0 8px rgba(6,182,212,0.6)", transition: "left 0.4s ease" }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: 4 }}>
                            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>0m</span>
                            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>60m</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Session distribution */}
                    <div style={{ borderRadius: 20, padding: "1.5px", background: "linear-gradient(160deg, rgba(6,182,212,0.38) 0%, rgba(6,182,212,0.12) 50%, rgba(6,182,212,0.04) 100%)", boxShadow: "0 0 0 0.5px rgba(6,182,212,0.08), 0 16px 48px rgba(0,0,0,0.5)" }}>
                      <div style={{ borderRadius: 18.5, background: "linear-gradient(155deg, #120A2E 0%, #0C0418 55%, #09061A 100%)", backdropFilter: "blur(24px)", overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <BarChart2 size={16} style={{ color: "rgba(6,182,212,0.85)", flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}>Session Distribution</span>
                        </div>
                        <div style={{ padding: "4px 8px 16px 4px" }}>
                          <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={typeDistributionData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans',sans-serif" }} />
                              <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.28)", fontFamily: "'Plus Jakarta Sans',sans-serif" }} />
                              <ChartTooltip
                                contentStyle={{ background: "linear-gradient(155deg,#1a0d38,#0f0620)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: "10px", color: "rgba(255,255,255,0.88)", fontSize: "12px", fontFamily: "'Plus Jakarta Sans',sans-serif", boxShadow: "0 8px 32px rgba(0,0,0,0.55)" }}
                                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                              />
                              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {typeDistributionData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* All-time summary */}
                    <div style={{ borderRadius: 20, padding: "1.5px", background: "linear-gradient(160deg, rgba(6,182,212,0.4) 0%, rgba(6,182,212,0.15) 50%, rgba(6,182,212,0.05) 100%)", boxShadow: "0 0 0 0.5px rgba(6,182,212,0.08), 0 8px 32px rgba(0,0,0,0.45)" }}>
                      <div style={{ borderRadius: 18.5, background: "linear-gradient(155deg, #120A2E 0%, #0C0418 55%, #09061A 100%)", backdropFilter: "blur(24px)", padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.04 }}>
                          <BarChart2 size={64} style={{ color: "#06b6d4" }} />
                        </div>
                        <div style={{ position: "relative" }}>
                          <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>All-time earnings</p>
                          <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#06b6d4", letterSpacing: "-0.03em" }}>${totalInsightEarnings.toFixed(2)}</p>
                        </div>
                        <div style={{ textAlign: "right", position: "relative" }}>
                          <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Total sessions</p>
                          <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.03em" }}>{totalInsightSessions}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ────────────────────────────────────────────────────
                AI TWIN & PAYOUTS
            ──────────────────────────────────────────────────── */}
            {activeTab === "ai-payouts" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif" }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em" }}>AI Twin</h1>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Configure your AI clone and voice model</p>
                </div>

                {/* Gradient border wrappers for sub-cards */}
                <div style={{ borderRadius: 20, padding: "1.5px", background: "linear-gradient(160deg, rgba(6,182,212,0.45) 0%, rgba(6,182,212,0.2) 50%, rgba(6,182,212,0.08) 100%)", boxShadow: "0 0 0 0.5px rgba(6,182,212,0.08), 0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35)" }}>
                  <TwinSetupCard />
                </div>
                <div style={{ borderRadius: 20, padding: "1.5px", background: "linear-gradient(160deg, rgba(6,182,212,0.45) 0%, rgba(6,182,212,0.2) 50%, rgba(6,182,212,0.08) 100%)", boxShadow: "0 0 0 0.5px rgba(6,182,212,0.08), 0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35)" }}>
                  <VoiceRecordingCard />
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

    </div>
    </TooltipProvider>
  );
};

export default AdvisorPrivateProfile;
