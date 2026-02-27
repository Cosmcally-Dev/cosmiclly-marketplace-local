import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import {
  DollarSign,
  Star,
  Camera,
  Loader2,
  MessageSquare,
  Mic,
  Video,
  Users,
  BarChart2,
  ChevronRight,
  ChevronLeft,
  Clock,
  TrendingUp,
  Phone,
  Sparkles,
  HelpCircle,
  LayoutDashboard,
  Settings,
  Calendar,
  Menu,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";
import type { Session } from "@/types/session";

// ─── Types ────────────────────────────────────────────────────────────────────
type Period = "7d" | "30d" | "90d";
type ActiveTab = "overview" | "settings" | "schedule" | "reviews" | "clients" | "insights";

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
  "Tarot", "Astrology", "Numerology", "Dream Analysis", "Love Advice",
  "Career Guidance", "Energy Readings", "Mediumship", "Aura Reading", "Past Lives",
];

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayLabels: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
  Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

const pageTitles: Record<ActiveTab, string> = {
  overview: "Overview",
  settings: "Settings",
  schedule: "Schedule",
  reviews:  "Reviews",
  clients:  "My Clients",
  insights: "Insights",
};

// ─── Component ────────────────────────────────────────────────────────────────
const AdvisorPrivateProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // UI state
  const [activeTab, setActiveTab]           = useState<ActiveTab>("overview");
  const [activePeriod, setActivePeriod]     = useState<Period>("30d");
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

  // Status + service
  const [isOnline, setIsOnline]             = useState(false);
  const [pricePerMinute, setPricePerMinute] = useState("3.50");
  const [bio, setBio] = useState(
    "Intuitive tarot reader and astrologer with over 8 years of experience guiding seekers on their spiritual journey."
  );
  const [selectedSpecialties, setSelectedSpecialties] = useState(["Tarot", "Astrology", "Love Advice"]);

  // Schedule
  const [schedule, setSchedule] = useState<
    Record<string, { enabled: boolean; start: string; end: string }>
  >({
    Mon: { enabled: true,  start: "09:00", end: "17:00" },
    Tue: { enabled: true,  start: "09:00", end: "17:00" },
    Wed: { enabled: true,  start: "10:00", end: "18:00" },
    Thu: { enabled: true,  start: "09:00", end: "17:00" },
    Fri: { enabled: true,  start: "09:00", end: "15:00" },
    Sat: { enabled: false, start: "10:00", end: "14:00" },
    Sun: { enabled: false, start: "10:00", end: "14:00" },
  });
  const [scheduleChanged, setScheduleChanged] = useState(false);
  const savedScheduleRef = useRef(schedule);
  const [serviceChanged, setServiceChanged]   = useState(false);
  const savedServiceRef = useRef({
    pricePerMinute, bio, selectedSpecialties: [...selectedSpecialties],
  });

  useEffect(() => {
    if (!user?.id) return;
    const lsKey = `advisor_schedule_${user.id}`;
    const fetchDetails = async () => {
      setIsLoadingDetails(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase
        .from("advisor_details")
        .select("status, price_per_minute, bio_long, specialties, schedule")
        .eq("id", user.id)
        .single() as Promise<{ data: any; error: any }>);
      if (!error && data) {
        setIsOnline(data.status === "online");
        const dbPrice       = data.price_per_minute != null ? String(data.price_per_minute) : "3.50";
        const dbBio         = data.bio_long ?? bio;
        const dbSpecialties = data.specialties?.length ? data.specialties : selectedSpecialties;
        let resolvedSchedule = (data.schedule as typeof schedule) ?? null;
        if (!resolvedSchedule) {
          const ls = localStorage.getItem(lsKey);
          if (ls) resolvedSchedule = JSON.parse(ls) as typeof schedule;
        }
        resolvedSchedule ??= schedule;
        setPricePerMinute(dbPrice);
        setBio(dbBio);
        setSelectedSpecialties(dbSpecialties);
        setSchedule(resolvedSchedule);
        savedServiceRef.current  = { pricePerMinute: dbPrice, bio: dbBio, selectedSpecialties: [...dbSpecialties] };
        savedScheduleRef.current = resolvedSchedule;
      }
      setIsLoadingDetails(false);
    };
    fetchDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (activeTab !== "clients" || !user?.id || clientSessions.length > 0) return;
    const fetchClients = async () => {
      setIsLoadingClients(true);
      const { data, error } = await supabase
        .from("sessions")
        .select("*, client:profiles!client_id(full_name, avatar_url)")
        .eq("advisor_id", user.id)
        .eq("status", "completed")
        .order("started_at", { ascending: false })
        .limit(200);
      if (!error && data) setClientSessions(data as SessionWithClient[]);
      setIsLoadingClients(false);
    };
    fetchClients();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (activeTab !== "insights" || !user?.id || insightSessions.length > 0) return;
    const fetchInsights = async () => {
      setIsLoadingInsights(true);
      const { data, error } = await supabase
        .from("sessions")
        .select("id, type, billable_minutes, cost_total, started_at, client_id")
        .eq("advisor_id", user.id)
        .eq("status", "completed");
      if (!error && data) setInsightSessions(data as Session[]);
      setIsLoadingInsights(false);
    };
    fetchInsights();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.id]);

  const handleStatusToggle = async (checked: boolean) => {
    setIsOnline(checked);
    if (!user?.id) return;
    const { error } = await supabase
      .from("advisor_details")
      .update({ status: checked ? "online" : "offline" })
      .eq("id", user.id);
    if (error) {
      console.error("[AdvisorPrivateProfile] Status update error:", error);
      setIsOnline(!checked);
    }
  };

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
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      setIsUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);
    if (!updateError) setAvatarUrl(publicUrl);
    setIsUploading(false);
    e.target.value = "";
  };

  const toggleSpecialty = (s: string) => {
    setSelectedSpecialties((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
    setServiceChanged(true);
  };

  const handleSaveService = async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from("advisor_details")
      .update({ price_per_minute: parseFloat(pricePerMinute) || 0, bio_long: bio, specialties: selectedSpecialties })
      .eq("id", user.id);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
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
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
    setScheduleChanged(true);
  };

  const updateTime = (day: string, field: "start" | "end", value: string) => {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    setScheduleChanged(true);
  };

  const handleSaveSchedule = async () => {
    if (!user?.id) return;
    localStorage.setItem(`advisor_schedule_${user.id}`, JSON.stringify(schedule));
    const { error } = await supabase
      .from("advisor_details")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ schedule } as any)
      .eq("id", user.id);
    if (error) console.error("[AdvisorPrivateProfile] Schedule DB save error:", error);
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
    <div className="relative flex h-[calc(100vh-56px)] md:h-[calc(100vh-64px)] overflow-hidden">

      {/* ── Mobile backdrop ─────────────────────────────────────────────────── */}
      <div
        className={`absolute inset-0 z-20 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDEBAR
          ═══════════════════════════════════════════════════════════════════════ */}
      <aside
        className={`
          absolute top-0 left-0 z-30 h-full
          lg:relative lg:translate-x-0
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
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-background">

        {/* Mobile top bar */}
        <div className="shrink-0 flex items-center gap-3 px-4 h-14 bg-background/95 backdrop-blur-md border-b border-border/50 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-border/60 bg-card/60 hover:bg-card transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4 text-foreground" />
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

        {/* Scrollable page content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5 sm:space-y-6">

            {/* ────────────────────────────────────────────────────
                OVERVIEW
            ──────────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="space-y-5 sm:space-y-6">

                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Overview</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-semibold text-foreground">{totalSess}</span> sessions in {periodLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 self-start sm:self-auto">
                    {(["7d", "30d", "90d"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setActivePeriod(p)}
                        className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                          activePeriod === p
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview banner */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/[0.07] border border-primary/20 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Stats preview — your real earnings and sessions will appear here after your first reading.</span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  {[
                    { label: "Total Earnings",  value: stats.earnings,         icon: DollarSign, color: "text-cyan-400",    bg: "bg-cyan-400/12",    change: "+12%" },
                    { label: "Sessions",        value: String(stats.sessions), icon: Users,      color: "text-primary",     bg: "bg-primary/12",     change: "+8%"  },
                    { label: "Avg Rating",      value: String(stats.rating),   icon: Star,       color: "text-amber-400",   bg: "bg-amber-400/12",   change: ""     },
                    { label: "Pending Balance", value: stats.pending,          icon: Clock,      color: "text-violet-400",  bg: "bg-violet-400/12",  change: ""     },
                  ].map((stat) => (
                    <Card key={stat.label} className="bg-card border-border hover:border-border/80 transition-colors">
                      <CardContent className="p-3 sm:p-4 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-muted-foreground leading-tight">{stat.label}</p>
                          <p className="text-xl sm:text-2xl font-bold text-foreground mt-1 leading-none">{stat.value}</p>
                          {stat.change && (
                            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1.5">
                              <TrendingUp className="w-3 h-3 flex-shrink-0" />
                              {stat.change}
                            </span>
                          )}
                        </div>
                        <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${stat.bg}`}>
                          <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} style={{ width: "18px", height: "18px" }} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Session Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Session Breakdown</h3>
                    <span className="text-xs text-muted-foreground bg-muted/60 border border-border/60 px-2.5 py-1 rounded-full">
                      {totalSess} total
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    {breakdown.map((t) => {
                      const cfg = {
                        chat:  { iconBg: "bg-primary/10",             iconColor: "text-primary",   barColor: "bg-primary",   gradFrom: "from-primary/[0.05]",            border: "border-primary/20",            accent: "text-primary",   badgeBg: "bg-primary/10",            icon: MessageSquare },
                        voice: { iconBg: "bg-[rgba(162,60,222,0.1)]", iconColor: "text-[#A23CDE]", barColor: "bg-[#A23CDE]", gradFrom: "from-[rgba(162,60,222,0.05)]",   border: "border-[rgba(162,60,222,0.2)]", accent: "text-[#A23CDE]", badgeBg: "bg-[rgba(162,60,222,0.1)]", icon: Mic           },
                        video: { iconBg: "bg-[rgba(104,66,239,0.1)]", iconColor: "text-[#6842EF]", barColor: "bg-[#6842EF]", gradFrom: "from-[rgba(104,66,239,0.05)]",   border: "border-[rgba(104,66,239,0.2)]", accent: "text-[#6842EF]", badgeBg: "bg-[rgba(104,66,239,0.1)]", icon: Video         },
                      }[t.key as "chat" | "voice" | "video"];
                      const TypeIcon = cfg.icon;

                      return (
                        <div
                          key={t.key}
                          className={`relative overflow-hidden rounded-2xl border ${cfg.border} bg-gradient-to-br ${cfg.gradFrom} via-card to-card p-4 sm:p-5`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${cfg.iconBg}`}>
                              <TypeIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${cfg.iconColor}`} />
                            </div>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.accent}`}>
                              {t.pct}%
                            </span>
                          </div>
                          <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase tracking-wider">{t.label}</p>
                          <p className="text-3xl sm:text-[2rem] font-bold text-foreground tracking-tight leading-none mb-0.5">{t.sessions}</p>
                          <p className="text-xs text-muted-foreground mb-3">sessions</p>
                          <p className={`text-sm font-semibold ${cfg.accent}`}>{t.earnings}</p>
                          <p className="text-[10px] text-muted-foreground mb-3">revenue earned</p>
                          <div className="h-1 rounded-full bg-border/40 overflow-hidden">
                            <div className={`h-full rounded-full ${cfg.barColor} transition-all duration-700`} style={{ width: `${t.pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Earnings Chart */}
                <Card className="bg-card border-border overflow-hidden">
                  <CardHeader className="pb-2 px-4 sm:px-5 pt-4 sm:pt-5">
                    <CardTitle className="text-sm sm:text-base font-heading">Earnings Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="px-1 sm:px-2 pb-3">
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="chatGrad"  x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="voiceGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#A23CDE" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#A23CDE" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="videoGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#6842EF" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6842EF" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} width={45} />
                        <ChartTooltip
                          cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "4 4" }}
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))", fontSize: "12px" }}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          formatter={(value: any, name: string) => [`$${value}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                        />
                        <Area type="monotone" dataKey="chat"  stackId="1" stroke="hsl(var(--primary))" fill="url(#chatGrad)"  strokeWidth={2} />
                        <Area type="monotone" dataKey="voice" stackId="1" stroke="#A23CDE"              fill="url(#voiceGrad)" strokeWidth={2} />
                        <Area type="monotone" dataKey="video" stackId="1" stroke="#6842EF"              fill="url(#videoGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-5 mt-1.5 pb-1">
                      {[
                        { label: "Chat",  color: "hsl(var(--primary))" },
                        { label: "Voice", color: "#A23CDE"              },
                        { label: "Video", color: "#6842EF"              },
                      ].map((l) => (
                        <div key={l.label} className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                          <span className="text-xs text-muted-foreground">{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}

            {/* ────────────────────────────────────────────────────
                SETTINGS
            ──────────────────────────────────────────────────── */}
            {activeTab === "settings" && (
              <div className="space-y-5 sm:space-y-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Settings</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage your service details and profile</p>
                </div>

                {isLoadingDetails ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 gap-2">
                      <CardTitle className="text-base font-heading">Service Management</CardTitle>
                      {serviceChanged && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Unsaved changes
                        </span>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="text-sm text-muted-foreground sm:w-36 shrink-0">Price per minute</label>
                        <div className="relative w-full sm:max-w-xs">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={pricePerMinute}
                            onChange={(e) => { setPricePerMinute(e.target.value); setServiceChanged(true); }}
                            className="pl-8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-muted-foreground">Bio</label>
                          <span className={`text-xs ${bio.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>{bio.length}/500</span>
                        </div>
                        <Textarea
                          value={bio}
                          onChange={(e) => { setBio(e.target.value); setServiceChanged(true); }}
                          rows={4}
                          maxLength={500}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Specialties</label>
                        <div className="flex flex-wrap gap-2">
                          {allSpecialties.map((s) => (
                            <Badge
                              key={s}
                              variant={selectedSpecialties.includes(s) ? "default" : "outline"}
                              className="cursor-pointer select-none"
                              onClick={() => toggleSpecialty(s)}
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {serviceChanged && (
                        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground" onClick={handleDiscardService}>
                            Discard
                          </Button>
                          <Button size="sm" className="h-8 text-xs" onClick={handleSaveService}>
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ────────────────────────────────────────────────────
                SCHEDULE
            ──────────────────────────────────────────────────── */}
            {activeTab === "schedule" && (
              <div className="space-y-5 sm:space-y-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Schedule</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">Set your weekly availability</p>
                </div>

                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between pb-3 gap-2">
                    <CardTitle className="text-base font-heading">Availability Schedule</CardTitle>
                    {scheduleChanged && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Unsaved changes
                      </span>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-0.5">
                      {daysOfWeek.map((day) => {
                        const s = schedule[day];
                        return (
                          <div
                            key={day}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 border-b border-border/50 last:border-0"
                          >
                            <div className="flex items-center gap-3 min-w-[120px] shrink-0">
                              <Switch checked={s.enabled} onCheckedChange={() => toggleDay(day)} />
                              <span className={`text-sm font-medium transition-colors ${s.enabled ? "text-foreground" : "text-muted-foreground"}`}>
                                {dayLabels[day]}
                              </span>
                            </div>
                            {s.enabled ? (
                              <div className="flex items-center gap-2 text-sm flex-wrap pl-10 sm:pl-0">
                                <TimePicker value={s.start} onChange={(v) => updateTime(day, "start", v)} />
                                <span className="text-xs text-muted-foreground">to</span>
                                <TimePicker value={s.end} onChange={(v) => updateTime(day, "end", v)} />
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/60 pl-10 sm:pl-0">Unavailable</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {scheduleChanged && (
                      <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-border">
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground" onClick={handleDiscardSchedule}>
                          Discard
                        </Button>
                        <Button size="sm" className="h-8 text-xs" onClick={handleSaveSchedule}>
                          Save Schedule
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ────────────────────────────────────────────────────
                REVIEWS
            ──────────────────────────────────────────────────── */}
            {activeTab === "reviews" && (
              <div className="space-y-5 sm:space-y-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Reviews</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">What clients say about you</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(104,66,239,0.10)] border border-[rgba(104,66,239,0.25)] shrink-0">
                    <Star className="w-3.5 h-3.5 fill-[#6842EF] text-[#6842EF]" />
                    <span className="text-xs font-bold text-[#6842EF]">4.8</span>
                    <span className="text-xs text-muted-foreground">· {mockReviews.length}</span>
                  </div>
                </div>

                {mockReviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center mb-3">
                      <Star className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No reviews yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Reviews will appear here after completed sessions.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {mockReviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-xl bg-card border border-border hover:border-border/80 transition-colors">
                        <div className="flex items-start gap-3 mb-2.5">
                          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
                            <span className="text-sm font-bold text-primary">{review.name[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-tight">{review.name}</p>
                            <p className="text-xs text-muted-foreground/70">{review.date}</p>
                          </div>
                          <div className="flex gap-0.5 flex-shrink-0">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-[#6842EF] text-[#6842EF]" : "text-border"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ────────────────────────────────────────────────────
                MY CLIENTS
            ──────────────────────────────────────────────────── */}
            {activeTab === "clients" && (
              <div className="space-y-5 sm:space-y-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Clients</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Your complete client history</p>
                  </div>
                  {clientGroups.length > 0 && (
                    <span className="text-xs font-semibold text-primary/80 bg-primary/10 px-3 py-1 rounded-full shrink-0 self-start mt-1">
                      {clientGroups.length} client{clientGroups.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {isLoadingClients ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : clientGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-primary/40" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No clients yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Your clients will appear here after completed sessions.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientGroups.map((client) => (
                      <div
                        key={client.clientId}
                        className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-[0_0_18px_hsl(var(--primary)/0.08)] transition-all duration-200"
                      >
                        <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden ring-1 ring-primary/25 bg-primary/15 flex items-center justify-center">
                          {client.avatarUrl
                            ? <img src={client.avatarUrl} alt={client.name} className="w-full h-full object-cover" />
                            : <span className="text-sm font-bold text-primary">{client.name[0]?.toUpperCase()}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {client.typeCounts.chat > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/12 text-primary font-semibold">{client.typeCounts.chat} chat</span>
                            )}
                            {client.typeCounts.audio > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(162,60,222,0.12)] text-[#A23CDE] font-semibold">{client.typeCounts.audio} voice</span>
                            )}
                            {client.typeCounts.video > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(104,66,239,0.12)] text-[#6842EF] font-semibold">{client.typeCounts.video} video</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">${client.totalEarnings.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {client.sessions.length} session{client.sessions.length !== 1 ? "s" : ""}
                          </p>
                          {client.lastSessionAt && (
                            <p className="text-[10px] text-muted-foreground/55 mt-0.5">
                              {new Date(client.lastSessionAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                          )}
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
              <div className="space-y-5 sm:space-y-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Performance Insights</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">Analytics from your completed sessions</p>
                </div>

                {isLoadingInsights ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : totalInsightSessions === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center mb-3">
                      <BarChart2 className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No data yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Complete your first session to see insights here.</p>
                  </div>
                ) : (
                  <>
                    {/* 3 metric cards */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {[
                        { label: "Unique Clients", value: String(uniqueClientCount), icon: Users      },
                        { label: "Avg Session",    value: `${avgDurationMin}m`,      icon: Clock      },
                        { label: "Total Hours",    value: `${totalHours}h`,          icon: TrendingUp },
                      ].map((m) => (
                        <Card key={m.label} className="bg-card border-border border-t-2 border-t-cyan-400/35">
                          <CardContent className="p-3 sm:p-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">{m.label}</p>
                              <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5">{m.value}</p>
                            </div>
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-cyan-400/12">
                              <m.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Return rate + Avg duration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Card className="bg-gradient-to-br from-cyan-400/[0.04] to-card border-border border-t-2 border-t-cyan-400/30">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-xs font-semibold text-foreground">Return clients</p>
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5">(last 30 days)</p>
                            </div>
                            <button title="Clients who had more than one session with you in the last 30 days" className="w-6 h-6 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400/60 hover:text-cyan-400 transition-colors">
                              <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center">
                            <div className="flex-1 flex flex-col items-center gap-0.5">
                              <p className="text-3xl font-bold text-foreground">{returningClients30d}</p>
                              <p className="text-[10px] text-muted-foreground">clients</p>
                            </div>
                            <div className="w-px h-10 bg-border/50 mx-3 flex-shrink-0" />
                            <div className="flex-1 flex flex-col items-center gap-0.5">
                              <p className="text-3xl font-bold text-cyan-400">{returningClientsPct}%</p>
                              <p className="text-[10px] text-muted-foreground">return rate</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-cyan-400/[0.04] to-card border-border border-t-2 border-t-cyan-400/30">
                        <CardContent className="p-4 sm:p-5 flex flex-col items-center justify-center h-full gap-1">
                          <p className="text-[10px] text-muted-foreground mb-1">Avg session duration</p>
                          <p className="text-3xl font-bold text-foreground">{avgDurationFormatted}</p>
                          <div className="relative w-full mt-3">
                            <div className="h-1 rounded-full bg-border/50 w-full" />
                            <div
                              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-400 border-2 border-card shadow-[0_0_6px_rgba(34,211,238,0.5)] transition-all"
                              style={{ left: `calc(${avgDurTrackPct}% - 6px)` }}
                            />
                          </div>
                          <div className="flex justify-between w-full mt-1">
                            <span className="text-[9px] text-muted-foreground/50">0m</span>
                            <span className="text-[9px] text-muted-foreground/50">60m</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Session distribution */}
                    <Card className="bg-card border-border">
                      <CardHeader className="pb-2 px-4 sm:px-5 pt-4 sm:pt-5">
                        <CardTitle className="text-sm sm:text-base font-heading flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          Session Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-2 pb-4">
                        <ResponsiveContainer width="100%" height={150}>
                          <BarChart data={typeDistributionData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                            <ChartTooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))", fontSize: "12px" }}
                              cursor={{ fill: "hsl(var(--border)/0.3)" }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {typeDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* All-time summary */}
                    <Card className="bg-gradient-to-r from-cyan-400/[0.06] via-card to-card border-border border-t-2 border-t-cyan-400/30 overflow-hidden relative">
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <BarChart2 className="w-16 h-16 text-cyan-400/[0.06]" />
                      </div>
                      <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4 relative">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">All-time earnings</p>
                          <p className="text-2xl font-bold text-cyan-400">${totalInsightEarnings.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Total sessions</p>
                          <p className="text-2xl font-bold text-foreground">{totalInsightSessions}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
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
