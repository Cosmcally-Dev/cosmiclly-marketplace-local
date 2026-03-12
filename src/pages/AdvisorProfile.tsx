import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  Heart,
  MessageCircle,
  Phone,
  ArrowLeft,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Calendar,
  Shield,
  Award,
  ChevronRight,
  Video,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { type Advisor } from "@/data/advisors";
import { AuthModal } from "@/components/modals/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useAdvisors } from "@/hooks/useAdvisors";
import { supabase } from "@/integrations/supabase/client";
import aiTwinIcon from "@/assets/ai-twin-icon.png";

const StatusBadge = ({ status }: { status: Advisor["status"] }) => {
  const statusConfig = {
    online: { label: "ONLINE", className: "bg-emerald-500 shadow-[0_0_10px_hsl(142,70%,45%,0.6)]" },
    busy: { label: "BUSY", className: "bg-rose-500" },
    offline: { label: "OFFLINE", className: "bg-muted-foreground" },
  };
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${config.className}`}
    >
      {status === "online" && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
      {config.label}
    </span>
  );
};

interface ReviewData {
  id: string;
  user: string;
  date: string;
  text: string;
  rating: number;
}

const AdvisorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"chat" | "call" | null>(null);

  const [reviews, setReviews] = useState<ReviewData[]>([]);

  const { isAuthenticated } = useAuth();
  const { advisors, isLoading, getAdvisorById } = useAdvisors();

  const advisor = getAdvisorById(id);

  // Fetch real reviews from database
  useEffect(() => {
    const advisorDbId = advisor?.dbId || advisor?.id;
    if (!advisorDbId) return;

    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, review_text, created_at, client:profiles!client_id(full_name)')
        .eq('advisor_id', advisorDbId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setReviews(data.map((r: any) => ({
          id: r.id,
          user: r.client?.full_name
            ? `${r.client.full_name.split(' ')[0]} ${(r.client.full_name.split(' ')[1] || '')[0] || ''}.`.trim()
            : 'Anonymous',
          date: new Date(r.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' }),
          text: r.review_text || '',
          rating: r.rating,
        })));
      }
    };

    fetchReviews();
  }, [advisor?.dbId, advisor?.id]);

  const handleChatClick = () => {
    if (isAuthenticated) {
      navigate(`/chat/${advisor.id}`);
    } else {
      setPendingAction("chat");
      setIsAuthOpen(true);
    }
  };

  const handleCallClick = () => {
    if (isAuthenticated) {
      navigate(`/call/${advisor.id}`);
    } else {
      setPendingAction("call");
      setIsAuthOpen(true);
    }
  };

  const handleVideoClick = () => {
    if (isAuthenticated) {
      navigate(`/video/${advisor.id}`);
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleTwinChatClick = () => {
    navigate(`/advisor/${advisor.id}/ai`);
  };

  const handleTwinCallClick = () => {
    navigate(`/advisor/${advisor.id}/ai-voice`);
  };

  const handleAuthClose = () => {
    setIsAuthOpen(false);
    setPendingAction(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-24">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-32 h-32 rounded-full bg-secondary animate-pulse" />
              <div className="h-6 w-48 bg-secondary animate-pulse rounded" />
              <div className="h-4 w-32 bg-secondary animate-pulse rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!advisor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-24 text-center">
            <h1 className="font-heading text-3xl font-bold text-foreground mb-4">Advisor Not Found</h1>
            <p className="text-muted-foreground mb-6">The advisor you're looking for doesn't exist or has been removed.</p>
            <Link to="/advisors">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse Advisors
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        {/* Breadcrumb */}
        <div className="bg-secondary/30 border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <Breadcrumb>
              <BreadcrumbItem href="/">Home</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem href="/advisors">Psychic Readings</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem active>{advisor.name}</BreadcrumbItem>
            </Breadcrumb>
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-hero-gradient py-8 md:py-12 relative overflow-hidden">
          {/* Stars */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-primary rounded-full animate-twinkle"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
            ))}
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              {/* Left: Avatar & Basic Info */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                {/* Avatar */}
                <div className="relative mb-4">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary/30 shadow-xl">
                    <img src={advisor.avatar} alt={advisor.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <StatusBadge status={advisor.status} />
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-2">
                  {advisor.rating > 0 ? (
                    <>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(advisor.rating) ? "text-primary fill-primary" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-bold text-foreground">{advisor.rating}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">No reviews yet</span>
                  )}
                </div>

                {/* Name & Title */}
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-1">{advisor.name}</h1>
                <p className="text-muted-foreground mb-4">{advisor.title}</p>

                {/* Action Icons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`p-2 rounded-full border transition-all ${
                      isFavorite
                        ? "bg-pink-500/20 border-pink-500 text-pink-500"
                        : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                  </button>
                  <button className="p-2 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Right: Action Cards & Stats */}
              <div className="flex-1 space-y-6">
                {/* Action Buttons Glass Card */}
                <div className="bg-card/30 backdrop-blur-md border border-border/50 rounded-2xl p-4 shadow-xl w-full md:w-auto md:min-w-[320px]">
                  {/* Pricing Header */}
                  <div className="mb-4 text-center">
                    {advisor.freeMinutes != null && advisor.freeMinutes > 0 && (
                      <Badge className="mb-2 bg-primary text-primary-foreground">{advisor.freeMinutes} free min</Badge>
                    )}
                    <div className="flex items-center justify-center gap-2">
                      {advisor.discountedPrice ? (
                        <>
                          <span className="text-muted-foreground line-through text-sm">
                            ${advisor.pricePerMinute}/min
                          </span>
                          <span className="text-xl font-bold text-primary">${advisor.discountedPrice}/min</span>
                        </>
                      ) : (
                        <span className="text-xl font-bold text-primary">${advisor.pricePerMinute}/min</span>
                      )}
                    </div>
                  </div>

                  {/* 2x2 Action Buttons Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Live Chat */}
                    <button
                      onClick={handleChatClick}
                      disabled={advisor.status !== "online"}
                      className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/20 hover:bg-primary/20 hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MessageCircle className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium text-foreground">Live Chat</span>
                    </button>

                    {/* Voice Call */}
                    <button
                      onClick={handleCallClick}
                      disabled={advisor.status !== "online"}
                      className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/20 hover:bg-primary/20 hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Phone className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium text-foreground">Voice Call</span>
                    </button>

                    {/* Video Call */}
                    <button
                      onClick={handleVideoClick}
                      disabled={advisor.status !== "online"}
                      className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/20 hover:bg-primary/20 hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Video className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium text-foreground">Video Call</span>
                    </button>

                    {/* Twin Chat */}
                    <button
                      onClick={handleTwinChatClick}
                      className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/20 hover:bg-secondary/20 hover:border-secondary/50 transition-all"
                    >
                      <img src={aiTwinIcon} alt="AI Twin" className="w-6 h-6 object-contain" />
                      <span className="text-sm font-medium text-foreground">Twin Chat</span>
                    </button>

                    {/* Twin Call */}
                    <button
                      onClick={handleTwinCallClick}
                      disabled={!advisor.vapiAgentId}
                      className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/20 hover:bg-secondary/20 hover:border-secondary/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background/20 disabled:hover:border-border/50"
                    >
                      <Phone className="w-6 h-6 text-secondary" />
                      <span className="text-sm font-medium text-foreground">Twin Call</span>
                    </button>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 p-4 rounded-xl bg-card/50 border border-border">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-lg font-bold text-foreground">{advisor.readingsCount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">readings since {advisor.yearStarted}</div>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-border hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="text-lg font-bold text-foreground">{(advisor.positiveReviews ?? 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">positive reviews</div>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-border hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-lg font-bold text-foreground">{(advisor.negativeReviews ?? 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">negative</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Client Summary */}
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    What clients are saying
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {advisor.reviewCount > 0
                      ? `Clients have shared ${advisor.reviewCount.toLocaleString()} review${advisor.reviewCount !== 1 ? 's' : ''} about ${advisor.name}. Average rating: ${advisor.rating}/5.`
                      : `${advisor.name} is a new advisor. Be the first to leave a review!`
                    }
                  </p>
                </div>

                {/* About Services */}
                {(advisor.description || advisor.descriptionLong) && (
                  <div className="p-6 rounded-xl bg-card border border-border">
                    <h3 className="font-heading text-xl font-semibold text-foreground mb-4">About my services</h3>
                    {advisor.description && (
                      <p className="text-muted-foreground leading-relaxed">{advisor.description}</p>
                    )}
                    {advisor.descriptionLong && !showFullBio && (
                      <button
                        onClick={() => setShowFullBio(true)}
                        className="mt-4 text-primary hover:underline text-sm font-medium"
                      >
                        Show more
                      </button>
                    )}
                    {advisor.descriptionLong && showFullBio && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="font-semibold text-foreground mb-2">About me</h4>
                        <p className="text-muted-foreground leading-relaxed">{advisor.descriptionLong}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Specialties */}
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-4">Specialties</h3>
                  <div className="flex flex-wrap gap-3">
                    {advisor.specialties.map((specialty) => (
                      <a
                        key={specialty}
                        href="#"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <span className="text-sm font-medium">{specialty}</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Reviews */}
                <div className="p-6 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-heading text-xl font-semibold text-foreground">Reviews</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-green-500">
                        <ThumbsUp className="w-4 h-4" />
                        {(advisor.positiveReviews ?? 0).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <ThumbsDown className="w-4 h-4" />
                        {(advisor.negativeReviews ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No reviews yet. Be the first to leave a review!
                      </p>
                    ) : reviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-lg bg-secondary/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                              {review.user.charAt(0)}
                            </div>
                            <span className="font-medium text-foreground">{review.user}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{review.date}</span>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                          ))}
                        </div>
                        {review.text && <p className="text-sm text-muted-foreground">{review.text}</p>}
                      </div>
                    ))}
                  </div>

                  {reviews.length > 0 && (
                    <button className="mt-6 w-full py-3 text-center text-primary hover:underline font-medium">
                      + See more reviews
                    </button>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Chat CTA */}
                <div className="sticky top-24 p-6 rounded-xl bg-card border border-border">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-primary/30 mb-3">
                      <img src={advisor.avatar} alt={advisor.name} className="w-full h-full object-cover" />
                    </div>
                    <StatusBadge status={advisor.status} />
                  </div>

                  <div className="text-center mb-4">
                    <div className="text-sm text-muted-foreground mb-1">Starting at</div>
                    <div className="text-3xl font-bold text-primary">
                      ${advisor.discountedPrice || advisor.pricePerMinute}/min
                    </div>
                    {advisor.freeMinutes != null && advisor.freeMinutes > 0 && (
                      <div className="text-sm text-primary font-medium mt-1">+ {advisor.freeMinutes} free minutes</div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full"
                      onClick={handleChatClick}
                      disabled={advisor.status !== "online"}
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Start Chat Now
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      disabled={advisor.status !== "online"}
                      onClick={handleCallClick}
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Voice Call
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      disabled={advisor.status !== "online"}
                      onClick={handleVideoClick}
                    >
                      <Video className="w-5 h-5 mr-2" />
                      Video Call
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={handleTwinChatClick}
                    >
                      <img src={aiTwinIcon} alt="AI Twin" className="w-5 h-5 mr-2 object-contain" />
                      Twin Chat
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      disabled={!advisor.vapiAgentId}
                      onClick={handleTwinCallClick}
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Twin Call
                    </Button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border space-y-3">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span>100% Satisfaction Guarantee</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>Pay only for time used</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 text-secondary" />
                      <span>Member since {advisor.yearStarted}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <AuthModal isOpen={isAuthOpen} onClose={handleAuthClose} mode="signin" />
    </div>
  );
};

export default AdvisorProfile;
