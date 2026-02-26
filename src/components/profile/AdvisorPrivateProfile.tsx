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
  Clock,
  TrendingUp,
  Phone,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

// ─── Component ────────────────────────────────────────────────────────────────
const AdvisorPrivateProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // UI state
  const [activeTab, setActiveTab]       = useState<ActiveTab>("overview");
  const [activePeriod, setActivePeriod] = useState<Period>("30d");

  // Avatar
  const [avatarUrl, setAvatarUrl]               = useState<string | undefined>(user?.avatarUrl);
  const [isUploading, setIsUploading]           = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  // Clients + insights data
  const [clientSessions, setClientSessions]         = useState<SessionWithClient[]>([]);
  const [isLoadingClients, setIsLoadingClients]     = useState(false);
  const [insightSessions, setInsightSessions]       = useState<Session[]>([]);
  const [isLoadingInsights, setIsLoadingInsights]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status + service
  const [isOnline, setIsOnline]               = useState(false);
  const [pricePerMinute, setPricePerMinute]   = useState("3.50");
  const [bio, setBio] = useState(
    "Intuitive tarot reader and astrologer with over 8 years of experience guiding seekers on their spiritual journey."
  );
  const [selectedSpecialties, setSelectedSpecialties] = useState([
    "Tarot", "Astrology", "Love Advice",
  ]);

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

  // Fetch advisor details on mount
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

  // Fetch clients (lazy — only when tab first opened)
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

  // Fetch insights (lazy — only when tab first opened)
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
    setSelectedSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
    setServiceChanged(true);
  };

  const handleSaveService = async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from("advisor_details")
      .update({
        price_per_minute: parseFloat(pricePerMinute) || 0,
        bio_long: bio,
        specialties: selectedSpecialties,
      })
      .eq("id", user.id);
    if (error) {
      console.error("[AdvisorPrivateProfile] Service save error:", error);
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
    localStorage.setItem(`advisor_schedule_${user.id}`, JSON.stringify(schedule));
    const { error } = await supabase
      .from("advisor_details")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ schedule } as any)
      .eq("id", user.id);
    if (error) {
      console.error("[AdvisorPrivateProfile] Schedule DB save error (localStorage used as fallback):", error);
    }
    savedScheduleRef.current = schedule;
    setScheduleChanged(false);
    toast({ title: "Schedule saved" });
  };

  const handleDiscardSchedule = () => {
    setSchedule(savedScheduleRef.current);
    setScheduleChanged(false);
  };

  // Derived data
  const stats       = statsByPeriod[activePeriod];
  const breakdown   = sessionBreakdownByPeriod[activePeriod];
  const chartData   = earningsByPeriod[activePeriod];
  const totalSess   = breakdown.reduce((s, t) => s + t.sessions, 0);
  const periodLabel = activePeriod === "7d" ? "last 7 days" : activePeriod === "30d" ? "last 30 days" : "last 90 days";

  // Clients tab — group sessions by client
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
      if (!acc[s.client_id].lastSessionAt || (s.started_at && s.started_at > (acc[s.client_id].lastSessionAt ?? ""))) {
        acc[s.client_id].lastSessionAt = s.started_at;
      }
      const t = s.type as keyof ClientGroup["typeCounts"];
      if (t in acc[s.client_id].typeCounts) acc[s.client_id].typeCounts[t]++;
      return acc;
    }, {} as Record<string, ClientGroup>)
  ).sort((a, b) => b.sessions.length - a.sessions.length);

  // Insights tab — aggregate metrics from real session data
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

  // Returning clients (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sessions30d = insightSessions.filter(s => s.started_at && new Date(s.started_at) >= thirtyDaysAgo);
  const clientFreq30d = sessions30d.reduce((acc, s) => {
    acc[s.client_id] = (acc[s.client_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const uniqueClients30d    = Object.keys(clientFreq30d).length;
  const returningClients30d = Object.values(clientFreq30d).filter(c => c > 1).length;
  const returningClientsPct = uniqueClients30d > 0 ? Math.round((returningClients30d / uniqueClients30d) * 100) : 0;

  // Formatted average session duration
  const avgRawMins        = totalInsightSessions > 0 ? totalMinutes / totalInsightSessions : 0;
  const avgDurHours       = Math.floor(avgRawMins / 60);
  const avgDurMins        = Math.round(avgRawMins % 60);
  const avgDurationFormatted = avgDurHours > 0 ? `${avgDurHours}h ${avgDurMins}m` : `${avgDurMins}m`;
  // Track position (0–100) for the indicator dot — caps at 60 min = 100%
  const avgDurTrackPct = Math.min(Math.round((avgRawMins / 60) * 100), 100);

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ═══════════════════════════════════════════════════════
          A · HERO STRIP
          ═══════════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-card via-card to-card/80 border border-border p-4 sm:p-6">
        {/* Ambient glow blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary/12 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-secondary/18 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className="relative group cursor-pointer flex-shrink-0"
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <Avatar className="w-14 h-14 sm:w-20 sm:h-20 ring-4 ring-primary/25">
                <AvatarImage
                  src={avatarUrl}
                  alt={user?.firstName || user?.username || "Advisor"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/20 text-primary text-lg sm:text-2xl font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-white" />
                    <span className="text-white text-[9px] font-medium leading-none">Change</span>
                  </>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary border-2 border-card flex items-center justify-center shadow-md">
                <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-foreground" />
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground font-heading leading-tight">
                Welcome back,{" "}
                <span className="text-primary">
                  {user?.firstName || user?.username || "Advisor"}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {isOnline ? "You're live — clients can book you now." : "You're offline — toggle status to go live."}
              </p>
              <button
                onClick={() => navigate(`/advisor/${user?.id}`)}
                className="text-xs text-primary/70 hover:text-primary transition-colors mt-1 underline-offset-2 hover:underline"
              >
                View public profile →
              </button>
            </div>
          </div>

          {/* Status toggle + Live Sessions — pushes to right on mobile too */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0 self-start sm:self-auto flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => navigate("/advisor-call")}
            >
              <Phone className="w-3.5 h-3.5" />
              Live Sessions
            </Button>
            <span className="text-xs sm:text-sm text-muted-foreground">Status</span>
            <Switch checked={isOnline} onCheckedChange={handleStatusToggle} />
            <Badge
              variant={isOnline ? "default" : "secondary"}
              className={isOnline ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}
            >
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          B · TAB NAV  (Overview / Settings / Schedule)
          ═══════════════════════════════════════════════════════ */}
      {activeTab !== "clients" && activeTab !== "insights" && (
      <div className="flex border-b border-border overflow-x-auto gap-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {(["overview", "settings", "schedule", "reviews"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 sm:px-6 py-2.5 text-sm font-medium capitalize whitespace-nowrap transition-colors border-b-2 -mb-px flex-shrink-0 ${
              activeTab === tab
                ? "text-foreground border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {tab === "overview" ? "Overview"
              : tab === "settings" ? "Settings"
              : tab === "schedule" ? "Schedule"
              : "Reviews"}
          </button>
        ))}
      </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          OVERVIEW TAB
          ═══════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-5 sm:space-y-6">

          {/* C · PERIOD SELECTOR */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{totalSess}</span> sessions in {periodLabel}
            </p>
            <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 w-full sm:w-auto">
              {(["7d", "30d", "90d"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePeriod(p)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
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

          {/* D · MOCK DATA BANNER */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/8 border border-primary/20 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
            <span>Stats preview — your real earnings and sessions will appear here after your first reading.</span>
          </div>

          {/* E · STATS ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Total Earnings",  value: stats.earnings,         icon: DollarSign, iconColor: "text-cyan-400", iconBg: "bg-cyan-400/15", change: "+12%" },
              { label: "Sessions",        value: String(stats.sessions), icon: Users,      iconColor: "text-cyan-400", iconBg: "bg-cyan-400/15",    change: "+8%"  },
              { label: "Avg Rating",      value: String(stats.rating),   icon: Star,       iconColor: "text-cyan-400", iconBg: "bg-cyan-400/15",   change: ""     },
              { label: "Pending Balance", value: stats.pending,          icon: Clock,      iconColor: "text-cyan-400", iconBg: "bg-cyan-400/15",  change: ""     },
            ].map((stat) => (
              <Card key={stat.label} className="bg-card border-border">
                <CardContent className="p-3.5 sm:p-5 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">{stat.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    {stat.change && (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3 flex-shrink-0" />
                        {stat.change}
                      </span>
                    )}
                  </div>
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${stat.iconBg}`}>
                    <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* F · SESSION BREAKDOWN */}
          <div className="flex-1 h-px bg-border" />
          <div className="space-y-4">
            {/* Header + total badge */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Session Breakdown</h3>
              <span className="text-xs text-muted-foreground bg-muted/60 border border-border px-2.5 py-1 rounded-full">
                {breakdown.reduce((a, b) => a + b.sessions, 0)} total sessions
              </span>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {breakdown.map((t) => {
                const cfg = {
                  chat:  { iconBg: "bg-primary/10",              iconColor: "text-primary",   barColor: "bg-primary",    gradFrom: "from-primary/[0.06]",             border: "border-primary/20",            accent: "text-primary",    badgeBg: "bg-primary/10" },
                  voice: { iconBg: "bg-[rgba(162,60,222,0.1)]",  iconColor: "text-[#A23CDE]", barColor: "bg-[#A23CDE]",  gradFrom: "from-[rgba(162,60,222,0.06)]",    border: "border-[rgba(162,60,222,0.2)]", accent: "text-[#A23CDE]", badgeBg: "bg-[rgba(162,60,222,0.1)]" },
                  video: { iconBg: "bg-[rgba(104,66,239,0.1)]",  iconColor: "text-[#6842EF]", barColor: "bg-[#6842EF]",  gradFrom: "from-[rgba(104,66,239,0.06)]",    border: "border-[rgba(104,66,239,0.2)]", accent: "text-[#6842EF]", badgeBg: "bg-[rgba(104,66,239,0.1)]" },
                }[t.key as "chat" | "voice" | "video"];

                return (
                  <div
                    key={t.key}
                    className={`relative overflow-hidden rounded-2xl border ${cfg.border} bg-gradient-to-br ${cfg.gradFrom} via-card to-card p-5 hover:scale-[1.01] transition-all duration-200 group`}
                  >
                    {/* Top row: icon + percentage badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.iconBg}`}>
                        {t.key === "chat" ? (
                          <MessageSquare className={`w-4 h-4 ${cfg.iconColor}`} />
                        ) : t.key === "voice" ? (
                          <Mic className={`w-4 h-4 ${cfg.iconColor}`} />
                        ) : (
                          <Video className={`w-4 h-4 ${cfg.iconColor}`} />
                        )}
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.accent}`}>
                        {t.pct}%
                      </span>
                    </div>

                    {/* Label */}
                    <p className="text-[11px] font-medium text-muted-foreground mb-0.5 uppercase tracking-wide">{t.label}</p>

                    {/* Session count — hero metric */}
                    <p className="text-[2rem] font-bold text-foreground tracking-tight leading-none mb-0.5">{t.sessions}</p>
                    <p className="text-xs text-muted-foreground mb-3">sessions</p>

                    {/* Revenue */}
                    <p className={`text-sm font-semibold ${cfg.accent}`}>{t.earnings}</p>
                    <p className="text-[10px] text-muted-foreground mb-4">revenue earned</p>

                    {/* Progress bar */}
                    <div className="h-1 rounded-full bg-border/40 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cfg.barColor} transition-all duration-700`}
                        style={{ width: `${t.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* F · EARNINGS AREA CHART */}
          <Card className="bg-card border-border shadow-[0_0_32px_hsl(var(--primary)/0.07)] overflow-hidden">
            <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-5">
              <CardTitle className="text-sm sm:text-base font-heading">Earnings Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="px-1 sm:px-3 pb-4">
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={chartData} margin={{ top: 5, right: 8, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chatGrad" x1="0" y1="0" x2="0" y2="1">
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
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                    width={45}
                  />
                  <Tooltip
                    cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "4 4" }}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                      fontSize: "12px",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: string) => [
                      `$${value}`,
                      name.charAt(0).toUpperCase() + name.slice(1),
                    ]}
                  />
                  <Area type="monotone" dataKey="chat"  stackId="1" stroke="hsl(var(--primary))" fill="url(#chatGrad)"  strokeWidth={2} />
                  <Area type="monotone" dataKey="voice" stackId="1" stroke="#A23CDE"              fill="url(#voiceGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="video" stackId="1" stroke="#6842EF"              fill="url(#videoGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>

              {/* Chart legend */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 mt-1 pb-1">
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

          {/* G · NAV CARDS — My Clients & Insights */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">

            {/* My Clients card */}
            <button
              onClick={() => setActiveTab("clients")}
              className="flex flex-col gap-3 p-4 sm:p-5 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-[0_0_16px_hsl(var(--primary)/0.08)] transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">My Clients</p>
                <p className="text-xs text-muted-foreground mt-0.5">View &amp; manage your client history</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-primary">
                View <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Insights card */}
            <button
              onClick={() => setActiveTab("insights")}
              className="flex flex-col gap-3 p-4 sm:p-5 rounded-xl bg-card border border-border hover:border-[#6842EF]/40 hover:shadow-[0_0_16px_rgba(104,66,239,0.08)] transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-[rgba(104,66,239,0.15)] flex items-center justify-center group-hover:bg-[rgba(104,66,239,0.25)] transition-colors">
                <BarChart2 className="w-5 h-5 text-[#6842EF]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Insights</p>
                <p className="text-xs text-muted-foreground mt-0.5">Performance metrics &amp; analytics</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-[#6842EF]">
                View <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SETTINGS TAB
          ═══════════════════════════════════════════════════════ */}
      {activeTab === "settings" && isLoadingDetails && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {activeTab === "settings" && !isLoadingDetails && (
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-heading">Service Management</CardTitle>
            {serviceChanged && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Unsaved changes
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Price */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-sm text-muted-foreground sm:w-36 shrink-0">
                Price per minute
              </label>
              <div className="relative w-full sm:max-w-xs">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={pricePerMinute}
                  onChange={(e) => { setPricePerMinute(e.target.value); setServiceChanged(true); }}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Bio</label>
                <span className={`text-xs ${bio.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>
                  {bio.length}/500
                </span>
              </div>
              <Textarea
                value={bio}
                onChange={(e) => { setBio(e.target.value); setServiceChanged(true); }}
                rows={3}
                maxLength={500}
              />
            </div>

            {/* Specialties */}
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
              <div className="flex items-center justify-end gap-2 pt-4 mt-1 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-sans text-muted-foreground hover:text-foreground"
                  onClick={handleDiscardService}
                >
                  Discard
                </Button>
                <Button size="sm" className="h-8 text-xs font-sans" onClick={handleSaveService}>
                  Save Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCHEDULE TAB
          ═══════════════════════════════════════════════════════ */}
      {activeTab === "schedule" && (
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-heading">Availability Schedule</CardTitle>
            {scheduleChanged && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Unsaved changes
              </span>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {daysOfWeek.map((day) => {
                const s = schedule[day];
                return (
                  <div
                    key={day}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3 w-28 shrink-0">
                      <Switch
                        checked={s.enabled}
                        onCheckedChange={() => toggleDay(day)}
                      />
                      <span
                        className={`text-sm font-medium ${
                          s.enabled ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {dayLabels[day]}
                      </span>
                    </div>
                    {s.enabled ? (
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        <TimePicker
                          value={s.start}
                          onChange={(v) => updateTime(day, "start", v)}
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <TimePicker
                          value={s.end}
                          onChange={(v) => updateTime(day, "end", v)}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unavailable</span>
                    )}
                  </div>
                );
              })}
            </div>

            {scheduleChanged && (
              <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-sans text-muted-foreground hover:text-foreground"
                  onClick={handleDiscardSchedule}
                >
                  Discard
                </Button>
                <Button size="sm" className="h-8 text-xs font-sans" onClick={handleSaveSchedule}>
                  Save Schedule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════
          REVIEWS TAB
          ═══════════════════════════════════════════════════════ */}
      {activeTab === "reviews" && (
        <div className="space-y-4">

          {/* Header row */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">My Reviews</h2>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(104,66,239,0.10)] border border-[rgba(104,66,239,0.25)]">
              <Star className="w-3.5 h-3.5 fill-[#6842EF] text-[#6842EF]" />
              <span className="text-xs font-semibold text-[#6842EF]">4.8</span>
              <span className="text-xs text-muted-foreground">· {mockReviews.length} reviews</span>
            </div>
          </div>

          {/* Review cards */}
          {mockReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center mb-3">
                <Star className="w-5 h-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-foreground">No reviews yet</p>
              <p className="text-xs text-muted-foreground mt-1">Reviews will appear here after completed sessions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mockReviews.map((review) => (
                <div key={review.id} className="p-4 rounded-xl bg-card border border-border">
                  {/* Top row: avatar + name/date */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{review.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </div>
                    {/* Stars */}
                    <div className="flex gap-0.5 flex-shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating
                              ? "fill-[#6842EF] text-[#6842EF]"
                              : "text-border"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Review text */}
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          CLIENTS TAB
          ═══════════════════════════════════════════════════════ */}
      {activeTab === "clients" && (
        <div className="space-y-5">
          {/* Header — matches insights style */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("overview")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                Overview
              </button>
              <div className="flex items-center gap-2 border-l-2 border-primary/60 pl-3">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground tracking-wide">My Clients</h2>
              </div>
            </div>
            {clientGroups.length > 0 && (
              <span className="text-[11px] font-medium text-primary/80 bg-primary/10 px-2.5 py-0.5 rounded-full">
                {clientGroups.length} client{clientGroups.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Loading */}
          {isLoadingClients && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {/* Empty state */}
          {!isLoadingClients && clientGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-primary/40" />
              </div>
              <p className="text-sm font-medium text-foreground">No clients yet</p>
              <p className="text-xs text-muted-foreground mt-1">Your clients will appear here after completed sessions.</p>
            </div>
          )}

          {/* Client list */}
          {!isLoadingClients && clientGroups.length > 0 && (
            <div className="space-y-2.5">
              {clientGroups.map((client) => (
                <div
                  key={client.clientId}
                  className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/[0.04] to-card border border-border border-t-2 border-t-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.10)] transition-shadow"
                >
                  {/* Avatar with ring accent */}
                  <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden ring-1 ring-primary/30 bg-primary/20 flex items-center justify-center">
                    {client.avatarUrl ? (
                      <img src={client.avatarUrl} alt={client.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary">{client.name[0]?.toUpperCase()}</span>
                    )}
                  </div>

                  {/* Name + type badges */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {client.typeCounts.chat > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                          {client.typeCounts.chat} chat
                        </span>
                      )}
                      {client.typeCounts.audio > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(162,60,222,0.15)] text-[#A23CDE] font-medium">
                          {client.typeCounts.audio} voice
                        </span>
                      )}
                      {client.typeCounts.video > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(104,66,239,0.15)] text-[#6842EF] font-medium">
                          {client.typeCounts.video} video
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right stats */}
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-sm font-bold text-foreground">${client.totalEarnings.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.sessions.length} session{client.sessions.length !== 1 ? "s" : ""}
                    </p>
                    {client.lastSessionAt && (
                      <p className="text-[10px] text-muted-foreground/60">
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

      {/* ═══════════════════════════════════════════════════════
          INSIGHTS TAB
          ═══════════════════════════════════════════════════════ */}
      {activeTab === "insights" && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("overview")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-cyan-400 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              Overview
            </button>
            <div className="flex items-center gap-2 border-l-2 border-cyan-400/60 pl-3">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-foreground tracking-wide">Performance Insights</h2>
            </div>
          </div>

          {/* Loading */}
          {isLoadingInsights && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {!isLoadingInsights && (
            <>
              {/* Empty state for new advisors */}
              {totalInsightSessions === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center mb-3">
                    <BarChart2 className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No data yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Complete your first session to see insights here.</p>
                </div>
              )}

              {totalInsightSessions > 0 && (
                <>
                  {/* 3 metric cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Unique Clients", value: String(uniqueClientCount), icon: Users      },
                      { label: "Avg Session",    value: `${avgDurationMin}m`,      icon: Clock      },
                      { label: "Total Hours",    value: `${totalHours}h`,          icon: TrendingUp },
                    ].map((m) => (
                      <Card
                        key={m.label}
                        className="bg-card border-border border-t-2 border-t-cyan-400/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.10)] transition-shadow"
                      >
                        <CardContent className="p-3.5 sm:p-4 flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-muted-foreground leading-tight">{m.label}</p>
                            <p className="text-lg sm:text-xl font-bold text-foreground mt-1">{m.value}</p>
                          </div>
                          <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-cyan-400/15">
                            <m.icon className="w-4 h-4 text-cyan-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Returning clients + Avg session duration */}
                  <div className="grid grid-cols-2 gap-3">

                    {/* Return clients card */}
                    <Card className="bg-gradient-to-br from-cyan-400/[0.04] to-card border-border border-t-2 border-t-cyan-400/30">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-xs font-medium text-foreground leading-tight">Return clients</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">(last 30 days)</p>
                          </div>
                          <button
                            title="Clients who had more than one session with you in the last 30 days"
                            className="flex-shrink-0 w-6 h-6 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400/60 hover:text-cyan-400 transition-colors"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center">
                          <div className="flex-1 flex flex-col items-center gap-0.5">
                            <p className="text-3xl font-bold text-foreground">{returningClients30d}</p>
                            <p className="text-[10px] text-muted-foreground">clients</p>
                          </div>
                          <div className="w-px h-10 bg-border/50 mx-2 flex-shrink-0" />
                          <div className="flex-1 flex flex-col items-center gap-0.5">
                            <p className="text-3xl font-bold text-cyan-400">{returningClientsPct}%</p>
                            <p className="text-[10px] text-muted-foreground">return rate</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Avg session duration card */}
                    <Card className="bg-gradient-to-br from-cyan-400/[0.04] to-card border-border border-t-2 border-t-cyan-400/30">
                      <CardContent className="p-4 sm:p-5 flex flex-col items-center justify-center h-full gap-1">
                        <p className="text-[10px] text-muted-foreground mb-1">Avg session duration</p>
                        <p className="text-3xl font-bold text-foreground">{avgDurationFormatted}</p>
                        {/* Track indicator */}
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

                  {/* Session type distribution bar chart */}
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-5">
                      <CardTitle className="text-sm sm:text-base font-heading flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        Session Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 pb-4">
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={typeDistributionData} margin={{ top: 5, right: 8, left: -15, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{
                              background: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              color: "hsl(var(--foreground))",
                              fontSize: "12px",
                            }}
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

                  {/* All-time earnings summary */}
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
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default AdvisorPrivateProfile;
