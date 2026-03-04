import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, MessageCircle, Users, Sparkles, ArrowRight, Clock, Mail, XCircle, Phone, Loader2 } from "lucide-react";
import { useAdvisors } from "@/hooks/useAdvisors";
import { AdvisorCard } from "@/components/advisors/AdvisorCard";
import { getZodiacFromBirthday } from "@/data/zodiacSigns";
import { useHoroscope, type HoroscopePeriod } from "@/hooks/useHoroscope";
import { useAdvisorApplication } from "@/hooks/useAdvisorApplication";
import { AdvisorApplicationModal } from "@/components/modals/AdvisorApplicationModal";
import AdvisorPrivateProfile from "@/components/profile/AdvisorPrivateProfile";
import AdvisorSetupWizard from "@/components/advisor/AdvisorSetupWizard";

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, credits, isLoading: authLoading } = useAuth();
  const { advisors } = useAdvisors();
  const [horoscopeTab, setHoroscopeTab] = useState("today");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const { application, hasAdvisorDetails, isProfileComplete, isLoading: appLoading, refetch } = useAdvisorApplication();

  // Dynamic zodiac based on user's date of birth
  const zodiacSign = user?.dateOfBirth ? getZodiacFromBirthday(user.dateOfBirth) : undefined;

  const tabToPeriod: Record<string, HoroscopePeriod> = {
    today: "daily",
    tomorrow: "daily",
    week: "weekly",
    month: "monthly",
    year: "yearly",
  };

  const tomorrowDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const mappedPeriod = tabToPeriod[horoscopeTab] ?? "daily";
  const targetDate = horoscopeTab === "tomorrow" ? tomorrowDate : undefined;

  const { data: horoscope, isLoading: horoscopeLoading } = useHoroscope(
    zodiacSign?.name ?? null,
    mappedPeriod,
    targetDate
  );

  const horoscopeDateLabel = useMemo(() => {
    if (horoscope?.date) {
      const d = new Date(horoscope.date + "T00:00:00");
      return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    }
    const now = new Date();
    if (horoscopeTab === "tomorrow") {
      const t = new Date(now);
      t.setDate(t.getDate() + 1);
      return t.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    }
    return now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }, [horoscope?.date, horoscopeTab]);

  // ── Advisor portal state ──────────────────────────────────────────────────
  const isAdvisorPortalLoading = authLoading || appLoading;

  const getPortalState = () => {
    if ((hasAdvisorDetails || user?.isAdvisor) && !isProfileComplete) return "wizard";
    if (hasAdvisorDetails && isProfileComplete) return "approved";
    if (!application) return "no-application";
    if (application.status === "approved") return "wizard";
    if (application.status === "rejected") return "rejected";
    return "pending";
  };

  const portalState = isAdvisorPortalLoading ? "loading" : getPortalState();

  useEffect(() => {
    if (
      !isAdvisorPortalLoading &&
      portalState === "no-application" &&
      searchParams.get("apply") === "true"
    ) {
      setShowApplyModal(true);
    }
  }, [isAdvisorPortalLoading, portalState, searchParams]);

  // ── Not authenticated ─────────────────────────────────────────────────────
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

  // ── Advisor view ──────────────────────────────────────────────────────────
  if (user?.isAdvisor || hasAdvisorDetails || application) {
    return (
      <div className="min-h-screen bg-background flex flex-col scrollbar-hide">
        <Header />

        <main className={`flex-1 ${portalState !== "approved" ? "pt-14 md:pt-16" : ""}`}>
          {portalState === "loading" && (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {portalState === "no-application" && (
            <div className="flex flex-col items-center justify-center px-4 py-20">
              <div className="max-w-lg text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                  Become an Advisor
                </h1>

                <p className="text-lg text-muted-foreground">
                  Share your spiritual gifts with thousands of seekers. Apply today and start earning.
                </p>

                <div className="bg-card border border-border rounded-xl p-6 space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                    <p className="text-sm text-foreground/80">
                      Offer chat, voice, and video readings to clients worldwide
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                    <p className="text-sm text-foreground/80">
                      Set your own rates and availability schedule
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                    <p className="text-sm text-foreground/80">
                      Get reviewed and approved within 24-48 hours
                    </p>
                  </div>
                </div>

                <Button variant="hero" size="lg" onClick={() => setShowApplyModal(true)}>
                  Apply Now
                </Button>
              </div>
            </div>
          )}

          {portalState === "pending" && (
            <div className="flex flex-col items-center justify-center px-4 py-20">
              <div className="max-w-lg text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-10 h-10 text-primary" />
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                  Application Under Review
                </h1>

                <p className="text-lg text-muted-foreground">
                  Your application is being reviewed. We'll contact you shortly.
                </p>

                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-3 text-left">
                    <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                    <p className="text-sm text-foreground/80">
                      You'll receive an email confirmation with next steps within 24-48 hours.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-left">
                    <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                    <p className="text-sm text-foreground/80">
                      Once approved, you'll gain access to your advisor dashboard to manage readings
                      and connect with clients.
                    </p>
                  </div>
                </div>

                {application && (
                  <div className="bg-secondary/50 border border-border rounded-xl p-4 text-left text-sm">
                    <p className="text-muted-foreground mb-2 font-medium">Application Details</p>
                    <div className="space-y-1 text-foreground/80">
                      <p>
                        <span className="text-muted-foreground">Name:</span> {application.full_name}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Email:</span> {application.email}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Specialties:</span>{" "}
                        {application.specialty}
                      </p>
                      {application.submitted_at && (
                        <p>
                          <span className="text-muted-foreground">Submitted:</span>{" "}
                          {new Date(application.submitted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Link to="/">
                  <Button variant="outline" className="mt-4">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {portalState === "rejected" && (
            <div className="flex flex-col items-center justify-center px-4 py-20">
              <div className="max-w-lg text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-destructive" />
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                  Application Not Approved
                </h1>

                <p className="text-lg text-muted-foreground">
                  Unfortunately, your application was not approved at this time.
                </p>

                {application?.notes && (
                  <div className="bg-card border border-border rounded-xl p-4 text-left">
                    <p className="text-sm text-muted-foreground mb-1 font-medium">Reviewer Notes</p>
                    <p className="text-sm text-foreground/80">{application.notes}</p>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <Button variant="hero" onClick={() => setShowApplyModal(true)}>
                    Re-Apply
                  </Button>
                  <Link to="/">
                    <Button variant="outline">Back to Home</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {portalState === "wizard" && (
            <div className="container mx-auto px-4 py-8">
              <AdvisorSetupWizard onComplete={() => refetch()} />
            </div>
          )}

          {portalState === "approved" && <AdvisorPrivateProfile />}
        </main>

        <Footer />

        <AdvisorApplicationModal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
        />
      </div>
    );
  }

  // ── Regular client view ───────────────────────────────────────────────────
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.username) return user.username[0].toUpperCase();
    return "?";
  };

  const matchedAdvisors = advisors.slice(0, 6);
  const affirmation = "I am constantly growing and evolving into a better person.";

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
                { label: "Chatroom", icon: MessageCircle, path: "/advisors", dot: true },
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
                  {item.dot && <span className="w-2 h-2 rounded-full bg-emerald-500 ml-auto" />}
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
            {zodiacSign ? (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="space-y-3 text-sm flex-1">
                  {[
                    { label: "Sun sign", value: zodiacSign.name, symbol: zodiacSign.symbol },
                    { label: "Planet", value: zodiacSign.ruling, symbol: "" },
                    { label: "Dates", value: zodiacSign.dates, symbol: "" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4">
                      <span className="text-muted-foreground w-24">{item.label}</span>
                      <span className="font-semibold text-foreground">{item.value}</span>
                      {item.symbol && <span className="text-primary text-lg">{item.symbol}</span>}
                    </div>
                  ))}
                </div>
                <div className="w-32 h-32 md:w-40 md:h-40 shrink-0">
                  <img
                    src={zodiacSign.image}
                    alt={zodiacSign.name}
                    className="w-full h-full object-contain drop-shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                  />
                </div>
                <div className="space-y-3 text-sm flex-1">
                  {[
                    { label: "Element", value: zodiacSign.element, symbol: "▽" },
                    { label: "Modality", value: zodiacSign.modality, symbol: "∧" },
                    { label: "Lucky Numbers", value: horoscope?.lucky?.numbers?.join(', ') || '—', symbol: "#" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4">
                      <span className="text-muted-foreground w-28">{item.label}</span>
                      <span className="font-semibold text-foreground">{item.value}</span>
                      <span className="text-primary text-lg">{item.symbol}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-3">Add your date of birth to see your zodiac profile and personalized horoscopes.</p>
                <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                  <Settings className="w-4 h-4 mr-2" /> Go to Settings
                </Button>
              </div>
            )}
          </div>

          {/* Horoscope */}
          {zodiacSign && (
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
                  <div className="w-40 h-40 shrink-0 mx-auto md:mx-0">
                    <img
                      src={zodiacSign.image}
                      alt={zodiacSign.name}
                      className="w-full h-full object-contain opacity-80"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm font-semibold text-foreground">{horoscopeDateLabel}</p>
                    {horoscopeLoading && !horoscope ? (
                      <Skeleton className="h-16 w-full" />
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {horoscope?.content.daily}
                      </p>
                    )}
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
          )}

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
