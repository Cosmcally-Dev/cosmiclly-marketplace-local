import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  DollarSign,
  Users,
  Star,
  TrendingUp,
  Clock,
  Camera,
  Edit,
} from "lucide-react";
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

// Mock data
const weeklyEarnings = [
  { day: "Mon", earnings: 120 },
  { day: "Tue", earnings: 95 },
  { day: "Wed", earnings: 180 },
  { day: "Thu", earnings: 140 },
  { day: "Fri", earnings: 210 },
  { day: "Sat", earnings: 260 },
  { day: "Sun", earnings: 190 },
];

const monthlyReadings = [
  { week: "W1", readings: 18 },
  { week: "W2", readings: 24 },
  { week: "W3", readings: 20 },
  { week: "W4", readings: 30 },
];

const mockReviews = [
  {
    id: "1",
    name: "Sarah M.",
    rating: 5,
    date: "Feb 8, 2026",
    text: "Incredible reading! Everything resonated deeply. Will definitely come back.",
  },
  {
    id: "2",
    name: "James K.",
    rating: 4,
    date: "Feb 7, 2026",
    text: "Very insightful session. The tarot spread was spot on with my current situation.",
  },
  {
    id: "3",
    name: "Luna R.",
    rating: 5,
    date: "Feb 5, 2026",
    text: "Best advisor on the platform. So kind and accurate. 10/10 recommend.",
  },
  {
    id: "4",
    name: "David P.",
    rating: 4,
    date: "Feb 3, 2026",
    text: "Great energy reading. Helped me understand blockages in my career path.",
  },
  {
    id: "5",
    name: "Mia W.",
    rating: 5,
    date: "Feb 1, 2026",
    text: "Absolutely phenomenal. She knew things I hadn't even mentioned. Truly gifted.",
  },
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

const AdvisorPrivateProfile = () => {
  const { user } = useAuth();

  const [isOnline, setIsOnline] = useState(true);
  const [pricePerMinute, setPricePerMinute] = useState("3.50");
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
  const [isEditingBio, setIsEditingBio] = useState(false);

  const getInitials = () => {
    if (user?.firstName && user?.lastName)
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    if (user?.username) return user.username[0].toUpperCase();
    return "?";
  };

  const toggleSpecialty = (s: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const updateTime = (day: string, field: "start" | "end", value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header / Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="w-20 h-20 ring-4 ring-primary/30">
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <button className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </button>
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
          <Switch checked={isOnline} onCheckedChange={setIsOnline} />
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
            value: "$4,280",
            change: "+12%",
            icon: DollarSign,
          },
          {
            label: "Pending Balance",
            value: "$320",
            change: "",
            icon: Clock,
          },
          {
            label: "Completed Readings",
            value: "186",
            change: "+8%",
            icon: Users,
          },
          {
            label: "Average Rating",
            value: "4.8",
            change: "",
            icon: Star,
          },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stat.value}
                </p>
                {stat.change && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change} this month
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
              <LineChart data={weeklyEarnings}>
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
              <BarChart data={monthlyReadings}>
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
        <CardHeader>
          <CardTitle className="text-base font-heading">
            Service Management
          </CardTitle>
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
                onChange={(e) => setPricePerMinute(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Bio</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingBio(!isEditingBio)}
              >
                <Edit className="w-3 h-3 mr-1" />
                {isEditingBio ? "Done" : "Edit"}
              </Button>
            </div>
            {isEditingBio ? (
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            ) : (
              <p className="text-sm text-foreground leading-relaxed">{bio}</p>
            )}
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
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-heading">
            Availability Schedule
          </CardTitle>
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
                      <Input
                        type="time"
                        value={s.start}
                        onChange={(e) => updateTime(day, "start", e.target.value)}
                        className="w-32 h-8 text-xs"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={s.end}
                        onChange={(e) => updateTime(day, "end", e.target.value)}
                        className="w-32 h-8 text-xs"
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
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {mockReviews.map((review) => (
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvisorPrivateProfile;
