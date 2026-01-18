import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Star, Heart, MessageCircle, Phone, ArrowLeft, Share2, 
  ThumbsUp, ThumbsDown, Clock, Calendar, Shield, Award,
  ChevronRight, Play
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { advisors, type Advisor } from '@/data/advisors';
import { ChatModal } from '@/components/modals/ChatModal';

const StatusBadge = ({ status }: { status: Advisor['status'] }) => {
  const statusConfig = {
    online: { label: 'ONLINE', className: 'bg-green-500 shadow-[0_0_10px_hsl(142,70%,45%,0.6)]' },
    busy: { label: 'BUSY', className: 'bg-orange-500' },
    offline: { label: 'OFFLINE', className: 'bg-gray-500' },
  };
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${config.className}`}>
      {status === 'online' && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
      {config.label}
    </span>
  );
};

const reviews = [
  { id: 1, user: 'Sarah M.', date: '17 Jan 26', text: 'Absolutely incredible reading! She knew things I never told anyone. Highly recommend!' },
  { id: 2, user: 'Michael T.', date: '17 Jan 26', text: 'Very insightful and caring. Helped me understand my situation better.' },
  { id: 3, user: 'Emily R.', date: '17 Jan 26', text: 'Amazing accuracy! Will definitely come back for more guidance.' },
  { id: 4, user: 'David K.', date: '16 Jan 26', text: 'Wonderful experience. Very patient and detailed in explanations.' },
  { id: 5, user: 'Jessica L.', date: '16 Jan 26', text: 'Thank you so much for the clarity! Feeling much better about my path.' },
  { id: 6, user: 'Chris P.', date: '16 Jan 26', text: 'Great reader, always aligned with energetic fields.' },
  { id: 7, user: 'Amanda S.', date: '15 Jan 26', text: 'Such a sweetheart! Always a wonderful reading 👍' },
  { id: 8, user: 'Robert J.', date: '15 Jan 26', text: 'Incredible reader, thank you for your kindness and wisdom.' },
];

const AdvisorProfile = () => {
  const { id } = useParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Find advisor by id or use first one as default
  const advisor = advisors.find(a => a.id === id) || advisors[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Breadcrumb */}
        <div className="bg-secondary/30 border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                Psychic Readings
              </Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{advisor.name}</span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-hero-gradient py-8 md:py-12 relative overflow-hidden">
          {/* Stars */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-accent rounded-full animate-twinkle"
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
                    <img 
                      src={advisor.avatar} 
                      alt={advisor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <StatusBadge status={advisor.status} />
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(advisor.rating)
                            ? 'text-accent fill-accent'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-bold text-foreground">{advisor.rating}</span>
                </div>

                {/* Name & Title */}
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-1">
                  {advisor.name}
                </h1>
                <p className="text-muted-foreground mb-4">{advisor.title}</p>

                {/* Action Icons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`p-2 rounded-full border transition-all ${
                      isFavorite 
                        ? 'bg-pink-500/20 border-pink-500 text-pink-500' 
                        : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button className="p-2 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Right: Action Cards & Stats */}
              <div className="flex-1 space-y-6">
                {/* Service Cards */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Chat Card */}
                  <button
                    onClick={() => setIsChatOpen(true)}
                    disabled={advisor.status !== 'online'}
                    className="group relative p-6 rounded-xl bg-card/80 backdrop-blur-sm border border-border hover:border-primary transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {advisor.freeMinutes && (
                      <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
                        {advisor.freeMinutes} free min
                      </Badge>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Live Chat</div>
                        <div className="text-sm text-muted-foreground">Instant messaging</div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      {advisor.discountedPrice ? (
                        <>
                          <span className="text-muted-foreground line-through text-sm">
                            ${advisor.pricePerMinute}/min
                          </span>
                          <span className="text-2xl font-bold text-primary">
                            ${advisor.discountedPrice}/min
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-primary">
                          ${advisor.pricePerMinute}/min
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Voice Call Card */}
                  <button
                    disabled={advisor.status !== 'online'}
                    className="group relative p-6 rounded-xl bg-card/80 backdrop-blur-sm border border-border hover:border-primary transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground">
                      Coming soon
                    </Badge>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-mystic-purple/20 flex items-center justify-center">
                        <Phone className="w-6 h-6 text-mystic-purple" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Voice Call</div>
                        <div className="text-sm text-muted-foreground">Live conversation</div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-muted-foreground line-through text-sm">$39.99/min</span>
                      <span className="text-2xl font-bold text-muted-foreground">$19.99/min</span>
                    </div>
                  </button>
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
                      <div className="text-lg font-bold text-foreground">10,000+</div>
                      <div className="text-xs text-muted-foreground">positive reviews</div>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-border hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-lg font-bold text-foreground">195</div>
                      <div className="text-xs text-muted-foreground">negative</div>
                    </div>
                  </div>
                </div>

                {/* Promo Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/30">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-foreground">🎉 Special Offer!</div>
                      <div className="text-sm text-muted-foreground">Get 50% off your first reading + 3 free minutes</div>
                    </div>
                    <Button variant="gold" size="sm">
                      Claim Now
                    </Button>
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
                {/* AI Summary */}
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent" />
                    What clients are saying
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Clients praise the advisor's insightful, detailed, and caring approach, noting their clarity, accuracy, and ability to bring comfort during difficult times. Many highlight their genuine connection and warm personality.
                  </p>
                </div>

                {/* About Services */}
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-4">About my services</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {advisor.description}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    I can tell you about your love life - present, past and future. I will tell you what is coming for you and what's good for you. Together we can talk and walk into the light to correct your stumbling blocks and issues.
                  </p>
                  {!showFullBio && (
                    <button
                      onClick={() => setShowFullBio(true)}
                      className="mt-4 text-primary hover:underline text-sm font-medium"
                    >
                      Show more
                    </button>
                  )}
                  {showFullBio && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="font-semibold text-foreground mb-2">About me</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Renowned Psychic reader, Spiritualist, Love advisor. Inherited gifts from ancestors and served people for over two decades. I share my esoteric knowledge in the field of clairvoyance. I give you clear, effective and personalized service to meet all your requirements.
                      </p>
                    </div>
                  )}
                </div>

                {/* Specialties */}
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-4">Specialties</h3>
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
                    <h3 className="font-serif text-xl font-semibold text-foreground">Reviews</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-green-500">
                        <ThumbsUp className="w-4 h-4" />
                        10,000+
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <ThumbsDown className="w-4 h-4" />
                        195
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {reviews.map((review) => (
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
                            <Star key={i} className="w-3 h-3 text-accent fill-accent" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">{review.text}</p>
                      </div>
                    ))}
                  </div>

                  <button className="mt-6 w-full py-3 text-center text-primary hover:underline font-medium">
                    + See more reviews
                  </button>
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
                    {advisor.freeMinutes && (
                      <div className="text-sm text-accent font-medium mt-1">
                        + {advisor.freeMinutes} free minutes
                      </div>
                    )}
                  </div>

                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="w-full mb-3"
                    onClick={() => setIsChatOpen(true)}
                    disabled={advisor.status !== 'online'}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Start Chat Now
                  </Button>

                  <Button variant="outline" size="lg" className="w-full" disabled>
                    <Phone className="w-5 h-5 mr-2" />
                    Voice Call
                  </Button>

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
                      <Calendar className="w-4 h-4 text-accent" />
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
      
      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        advisor={advisor}
      />
    </div>
  );
};

export default AdvisorProfile;
