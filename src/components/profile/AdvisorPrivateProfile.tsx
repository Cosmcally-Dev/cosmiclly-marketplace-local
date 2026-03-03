import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdvisorStats } from "@/hooks/useAdvisorStats";
import { supabase } from "@/integrations/supabase/client";
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
  Users,
  Star,
  TrendingUp,
  Clock,
  Camera,
  Loader2,
  Activity,
} from "lucide-react";
import StripeConnectCard from "@/components/advisor/StripeConnectCard";
import TwinSetupCard from "@/components/advisor/TwinSetupCard";
import VoiceRecordingCard from "@/components/advisor/VoiceRecordingCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

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

const AdvisorPrivateProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats, chartData, reviews: dbReviews, isLoading: statsLoading } = useAdvisorStats(user?.id);

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatarUrl);
  const [isUploading, setIsUploading] = useState(false);
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
    Record<string, { enabled: boolean; start: string; end: string }>
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
  };

  const handleDiscardSchedule = () => {
    setSchedule(savedScheduleRef.current);
    setScheduleChanged(false);
  };

  return (
    <div className="space-y-6">
      {/* Header / Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => !isUploading && fileInputRef.current?.click()}>
            <Avatar className="w-20 h-20 ring-4 ring-primary/30">
              <AvatarImage src={avatarUrl} alt={user?.firstName || user?.username || "Advisor"} className="object-cover" />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <>
                  <Camera className="w-4 h-4 text-white" />
                  <span className="text-white text-[10px] font-medium font-sans leading-none">Change</span>
                </>
              )}
            </div>

            {/* Always-visible camera badge */}
            <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary border-2 border-card flex items-center justify-center shadow-md">
              <Camera className="w-3 h-3 text-primary-foreground" />
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
            <h1 className="text-2xl font-bold text-foreground font-heading">
              Welcome back, {user?.firstName || user?.username || "Advisor"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your profile, services, and availability.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Status</span>
          <Switch checked={isOnline} onCheckedChange={handleStatusToggle} />
          <Badge
            variant={isOnline ? "default" : "secondary"}
            className={
              isOnline
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : ""
            }
          >
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Earnings",
            value: `$${stats.monthlyEarnings.toFixed(2)}`,
            subtitle: "This month",
            icon: DollarSign,
          },
          {
            label: "Pending Balance",
            value: `$${stats.pendingBalance.toFixed(2)}`,
            subtitle: "All time",
            icon: Clock,
          },
          {
            label: "Completed Readings",
            value: String(stats.completedReadings),
            subtitle: "",
            icon: Users,
          },
          {
            label: "Average Rating",
            value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A",
            subtitle: "",
            icon: Star,
          },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {statsLoading ? "..." : stat.value}
                </p>
                {stat.subtitle && (
                  <span className="text-xs text-muted-foreground mt-1">
                    {stat.subtitle}
                  </span>
                )}
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Activity Link */}
      <Button
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => navigate('/advisor-activity')}
      >
        <Activity className="w-4 h-4 mr-2" />
        View My Activity
      </Button>

      {/* Stripe Connect Payouts */}
      <StripeConnectCard />

      {/* Twin AI Setup */}
      <TwinSetupCard />

      {/* Voice Clone */}
      <VoiceRecordingCard />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">
              Weekly Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData.weeklyEarnings.length > 0 ? chartData.weeklyEarnings : [{ day: '-', earnings: 0 }]}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="day"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [`$${value}`, "Earnings"]}
                />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">
              Monthly Readings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData.monthlyReadings.length > 0 ? chartData.monthlyReadings : [{ week: '-', readings: 0 }]}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="week"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar
                  dataKey="readings"
                  fill="hsl(var(--secondary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Service Management */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-heading">
            Service Management
          </CardTitle>
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
            <label className="text-sm text-muted-foreground w-36 shrink-0">
              Price per minute
            </label>
            <div className="relative w-full max-w-xs">
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
            <label className="text-sm text-muted-foreground">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => { setBio(e.target.value); setServiceChanged(true); }}
              rows={3}
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
            <div className="flex items-center justify-end gap-2 pt-4 mt-1 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-sans text-muted-foreground hover:text-foreground"
                onClick={handleDiscardService}
              >
                Discard
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs font-sans"
                onClick={handleSaveService}
              >
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-heading">
            Availability Schedule
          </CardTitle>
          {scheduleChanged && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Unsaved changes
            </span>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {daysOfWeek.map((day) => {
              const s = schedule[day];
              return (
                <div
                  key={day}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2 border-b border-border last:border-0"
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
                      {day}
                    </span>
                  </div>
                  {s.enabled ? (
                    <div className="flex items-center gap-2 text-sm">
                      <TimePicker
                        value={s.start}
                        onChange={(v) => updateTime(day, "start", v)}
                      />
                      <span className="text-muted-foreground">to</span>
                      <TimePicker
                        value={s.end}
                        onChange={(v) => updateTime(day, "end", v)}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Unavailable
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {scheduleChanged && (
            <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-sans text-muted-foreground hover:text-foreground"
                onClick={handleDiscardSchedule}
              >
                Discard
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs font-sans"
                onClick={handleSaveSchedule}
              >
                Save Schedule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-heading">
            Recent Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dbReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No reviews yet. Complete sessions to receive client feedback.</p>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-styled">
              {dbReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 rounded-xl bg-secondary/10 border border-border/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {review.name}
                      </span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating
                                ? "fill-primary text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {review.date}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.text}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvisorPrivateProfile;
