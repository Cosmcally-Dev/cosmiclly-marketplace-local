import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, MessageCircle, Users, Sparkles, ArrowRight } from "lucide-react";
import { advisors } from "@/data/advisors";
import { AdvisorCard } from "@/components/advisors/AdvisorCard";
import { zodiacSigns } from "@/data/zodiacSigns";
import AdvisorPrivateProfile from "@/components/profile/AdvisorPrivateProfile";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, credits } = useAuth();
  const [horoscopeTab, setHoroscopeTab] = useState("today");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-6xl mx-auto pt-24 pb-12 px-4 text-center">
          <p className="text-muted-foreground text-lg">Please log in to view your profile.</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Advisor view
  if (user?.isAdvisor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-7xl mx-auto pt-24 pb-12 px-4">
          <AdvisorPrivateProfile />
        </main>
        <Footer />
      </div>
    );
  }

  // Regular user view
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.username) return user.username[0].toUpperCase();
    return "?";
  };

  const zodiacProfile = {
    sunSign: "Capricorn",
    moonSign: "Aquarius",
    ascendant: "Libra",
    planet: "Saturn",
    element: "Earth",
    modality: "Cardinal",
    luckyNumbers: "6, 8, 15",
  };

  const zodiacSign = zodiacSigns.find(
    (s) => s.name.toLowerCase() === zodiacProfile.sunSign.toLowerCase()
  );

  const horoscopeReadings: Record<string, { dateRange: string; text: string }> = {
    today: {
      dateRange: "February 9, 2026",
      text: "Today brings a wave of clarity to your personal goals. Trust your instincts when making decisions, especially regarding financial matters. A conversation with someone close could reveal an unexpected opportunity. Stay grounded and focus on what truly matters to you.",
    },
    tomorrow: {
      dateRange: "February 10, 2026",
      text: "Tomorrow favors creative endeavors and self-expression. You may feel a surge of inspiration that leads to a breakthrough in a project you've been working on. Don't be afraid to share your ideas with others — collaboration could amplify your success.",
    },
    week: {
      dateRange: "February 9 - February 15, 2026",
      text: "This week challenges you to step outside your comfort zone. A professional opportunity may arise mid-week that tests your adaptability. Embrace change and remain open to new perspectives. By the weekend, you'll feel a renewed sense of purpose.",
    },
    month: {
      dateRange: "February 1 - February 28, 2026",
      text: "February is a month of transformation. Planetary alignments encourage deep reflection on your relationships and career path. Mid-month brings a pivotal moment that could reshape your long-term plans. Stay patient and let things unfold naturally.",
    },
    year: {
      dateRange: "January 1, 2026 - December 31, 2026",
      text: "In 2026, your ruling planet, Saturn, moves through Aries, bringing a noticeable shift in pace and attitude. You may feel faster, bolder, and more decisive than usual. There is a stronger desire for independence, initiative, and starting something new. This year pushes you out of long planning phases and into action. You are encouraged to take risks, rely on yourself, and actively reshape areas of life that no longer feel aligned.",
    },
  };

  const matchedAdvisors = advisors.slice(0, 6);
  const affirmation = "I am constantly growing and evolving into a better person.";
  const currentReading = horoscopeReadings[horoscopeTab];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-7xl mx-auto pt-24 pb-12 px-4 flex flex-col md:flex-row gap-6">
        {/* Left Sidebar - Sticky */}
        <aside className="w-full md:w-56 lg:w-60 shrink-0 md:sticky md:top-24 h-fit space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 text-center space-y-4">
            <Avatar className="w-20 h-20 mx-auto ring-4 ring-primary/30">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-base font-bold text-foreground font-heading">
                {user?.username || `${user?.firstName} ${user?.lastName}`}
              </h1>
            </div>

            <nav className="space-y-1 text-left">
              {[
                { label: "Profile", icon: Users, path: "/profile" },
                { label: "Chatroom", icon: MessageCircle, path: "/chat", dot: true },
                { label: "Psychics", icon: Sparkles, path: "/advisors" },
                { label: "Horoscope", icon: Sparkles, path: "/horoscope" },
                { label: "Settings", icon: Settings, path: "/settings" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.dot && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ml-auto" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Balance: <span className="text-foreground font-semibold">{credits} credits</span>
            </p>
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={() => navigate("/add-credit")}
            >
              Refill credits
            </Button>
          </div>
        </aside>

        {/* Right Content */}
        <section className="flex-1 min-w-0 space-y-6">
          {/* Affirmation */}
          <div className="bg-card border border-border rounded-2xl p-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground font-heading mb-1">
                Affirmation of the day ✨
              </h2>
              <p className="text-sm text-muted-foreground">{affirmation}</p>
            </div>
            <div className="text-right shrink-0 space-y-2">
              <p className="text-xs text-muted-foreground">
                Balance: <span className="text-foreground font-semibold">{credits} credits</span>
              </p>
              <Button variant="default" size="sm" onClick={() => navigate("/add-credit")}>
                Refill credits
              </Button>
            </div>
          </div>

          {/* Zodiac Profile */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground font-heading mb-5">Your zodiac profile</h2>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="space-y-3 text-sm flex-1">
                {[
                  { label: "Sun sign", value: zodiacProfile.sunSign, symbol: zodiacSign?.symbol },
                  { label: "Moon sign", value: zodiacProfile.moonSign, symbol: "♒" },
                  { label: "Ascendant", value: zodiacProfile.ascendant, symbol: "♎" },
                  { label: "Planet", value: zodiacProfile.planet, symbol: "♄" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <span className="text-muted-foreground w-24">{item.label}</span>
                    <span className="font-semibold text-foreground">{item.value}</span>
                    <span className="text-primary text-lg">{item.symbol}</span>
                  </div>
                ))}
              </div>
              {zodiacSign && (
                <div className="w-32 h-32 md:w-40 md:h-40 shrink-0">
                  <img
                    src={zodiacSign.image}
                    alt={zodiacSign.name}
                    className="w-full h-full object-contain drop-shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                  />
                </div>
              )}
              <div className="space-y-3 text-sm flex-1">
                {[
                  { label: "Element", value: zodiacProfile.element, symbol: "▽" },
                  { label: "Modality", value: zodiacProfile.modality, symbol: "∧" },
                  { label: "Lucky Numbers", value: zodiacProfile.luckyNumbers, symbol: "#" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <span className="text-muted-foreground w-28">{item.label}</span>
                    <span className="font-semibold text-foreground">{item.value}</span>
                    <span className="text-primary text-lg">{item.symbol}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Horoscope */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground font-heading mb-4">Your horoscope</h2>
            <Tabs value={horoscopeTab} onValueChange={setHoroscopeTab}>
              <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none p-0 h-auto gap-0">
                {["today", "tomorrow", "week", "month", "year"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="capitalize rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-5 flex flex-col md:flex-row gap-6">
                {zodiacSign && (
                  <div className="w-40 h-40 shrink-0 mx-auto md:mx-0">
                    <img
                      src={zodiacSign.image}
                      alt={zodiacSign.name}
                      className="w-full h-full object-contain opacity-80"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <p className="text-sm font-semibold text-foreground">{currentReading.dateRange}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentReading.text}
                  </p>
                  <button
                    onClick={() => navigate("/horoscope")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    Learn more <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Tabs>
          </div>

          {/* Matched Psychics */}
          <div>
            <h2 className="text-lg font-bold text-foreground font-heading mb-5">
              Psychics you match with
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchedAdvisors.map((advisor) => (
                <AdvisorCard key={advisor.id} advisor={advisor} />
              ))}
            </div>
            <div className="text-center mt-6">
              <Button variant="outline" onClick={() => navigate("/advisors")}>
                See all psychics <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
