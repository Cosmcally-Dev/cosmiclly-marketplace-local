import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronRight, Calendar, Sparkles, ArrowRight, Sun, Moon, Heart, Briefcase, DollarSign, Users } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const zodiacSigns = [
  { 
    name: 'Aries', 
    symbol: '♈', 
    dates: 'Mar 21 - Apr 19',
    element: 'Fire',
    ruling: 'Mars',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&h=200&fit=crop'
  },
  { 
    name: 'Taurus', 
    symbol: '♉', 
    dates: 'Apr 20 - May 20',
    element: 'Earth',
    ruling: 'Venus',
    image: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=200&h=200&fit=crop'
  },
  { 
    name: 'Gemini', 
    symbol: '♊', 
    dates: 'May 21 - Jun 20',
    element: 'Air',
    ruling: 'Mercury',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop'
  },
  { 
    name: 'Cancer', 
    symbol: '♋', 
    dates: 'Jun 21 - Jul 22',
    element: 'Water',
    ruling: 'Moon',
    image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=200&h=200&fit=crop'
  },
  { 
    name: 'Leo', 
    symbol: '♌', 
    dates: 'Jul 23 - Aug 22',
    element: 'Fire',
    ruling: 'Sun',
    image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=200&h=200&fit=crop'
  },
  { 
    name: 'Virgo', 
    symbol: '♍', 
    dates: 'Aug 23 - Sep 22',
    element: 'Earth',
    ruling: 'Mercury',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop'
  },
  { 
    name: 'Libra', 
    symbol: '♎', 
    dates: 'Sep 23 - Oct 22',
    element: 'Air',
    ruling: 'Venus',
    image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=200&h=200&fit=crop'
  },
  { 
    name: 'Scorpio', 
    symbol: '♏', 
    dates: 'Oct 23 - Nov 21',
    element: 'Water',
    ruling: 'Pluto',
    image: 'https://images.unsplash.com/photo-1475274047050-1d0c55b91796?w=200&h=200&fit=crop'
  },
  { 
    name: 'Sagittarius', 
    symbol: '♐', 
    dates: 'Nov 22 - Dec 21',
    element: 'Fire',
    ruling: 'Jupiter',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200&h=200&fit=crop'
  },
  { 
    name: 'Capricorn', 
    symbol: '♑', 
    dates: 'Dec 22 - Jan 19',
    element: 'Earth',
    ruling: 'Saturn',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=200&fit=crop'
  },
  { 
    name: 'Aquarius', 
    symbol: '♒', 
    dates: 'Jan 20 - Feb 18',
    element: 'Air',
    ruling: 'Uranus',
    image: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=200&h=200&fit=crop'
  },
  { 
    name: 'Pisces', 
    symbol: '♓', 
    dates: 'Feb 19 - Mar 20',
    element: 'Water',
    ruling: 'Neptune',
    image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=200&h=200&fit=crop'
  },
];

const horoscopeContent = {
  Aries: {
    daily: "Today brings exciting opportunities for personal growth. Your natural leadership qualities shine bright, attracting positive attention from colleagues and friends alike. Trust your instincts when making important decisions.",
    love: "Romance is in the air! Singles may encounter an intriguing connection through mutual friends. Couples should plan a spontaneous adventure together.",
    career: "A bold move at work could lead to unexpected rewards. Don't hesitate to voice your innovative ideas in meetings.",
    money: "Financial prospects look favorable. Consider investing in personal development or a passion project.",
    health: "Your energy levels are high. Channel this vitality into physical activities that challenge you.",
    lucky: { numbers: [7, 14, 21], color: 'Red', time: '2:00 PM' }
  },
  Taurus: {
    daily: "Stability is your theme today. Focus on nurturing your relationships and home environment. A practical approach to challenges will serve you well.",
    love: "Deep conversations strengthen emotional bonds. Express your feelings openly to your partner or someone special.",
    career: "Your persistence pays off with recognition from superiors. Stay committed to your current projects.",
    money: "A wise investment opportunity may present itself. Trust your natural ability to assess value.",
    health: "Take time to relax and recharge. A spa day or nature walk would do wonders for your wellbeing.",
    lucky: { numbers: [4, 11, 29], color: 'Green', time: '6:00 PM' }
  },
  Gemini: {
    daily: "Your communication skills are heightened today. Use this gift to bridge gaps and create new connections. Multiple opportunities may present themselves simultaneously.",
    love: "Playful banter leads to deeper understanding. Let your wit charm someone special today.",
    career: "Networking events favor you strongly. Make meaningful connections that could benefit your career path.",
    money: "Multiple income streams may become available. Stay adaptable to capitalize on opportunities.",
    health: "Mental stimulation is key. Engage in puzzles, reading, or learning something new.",
    lucky: { numbers: [3, 17, 25], color: 'Yellow', time: '11:00 AM' }
  },
  Cancer: {
    daily: "Emotional intuition guides you today. Trust your feelings when navigating complex situations. Home and family matters take priority.",
    love: "Nurturing gestures speak louder than words. Show your love through thoughtful acts of care.",
    career: "Your empathetic nature helps resolve workplace conflicts. Colleagues seek your counsel.",
    money: "Focus on building security. Small, consistent savings will grow substantially over time.",
    health: "Emotional wellness is paramount. Practice self-care rituals that soothe your sensitive soul.",
    lucky: { numbers: [2, 16, 28], color: 'Silver', time: '9:00 PM' }
  },
  Leo: {
    daily: "The spotlight finds you naturally today. Your charisma attracts admirers and opportunities. Express your creative talents boldly.",
    love: "Romance flourishes under your warm attention. Plan a grand gesture to impress your love interest.",
    career: "Leadership opportunities arise. Step into roles that showcase your natural command presence.",
    money: "Generosity brings unexpected returns. Share your abundance and watch it multiply.",
    health: "Heart health deserves attention. Cardio exercises and joyful activities boost your vitality.",
    lucky: { numbers: [1, 10, 19], color: 'Gold', time: '12:00 PM' }
  },
  Virgo: {
    daily: "Attention to detail serves you exceptionally well today. Your analytical mind solves problems others overlook. Organization brings peace.",
    love: "Quality time matters more than grand gestures. Appreciate the small moments of connection.",
    career: "Your expertise is recognized and valued. Take pride in the excellence you consistently deliver.",
    money: "Budget reviews reveal opportunities for savings. Your practical nature guides wise financial decisions.",
    health: "Routine health practices pay dividends. Maintain your wellness regimen with dedication.",
    lucky: { numbers: [5, 14, 23], color: 'Navy Blue', time: '3:00 PM' }
  },
  Libra: {
    daily: "Balance and harmony are your allies today. Diplomatic skills help navigate tricky social waters. Beauty and art inspire your soul.",
    love: "Partnership dynamics improve through honest communication. Seek fairness in all relationship matters.",
    career: "Collaborative projects thrive under your guidance. Bring people together for shared success.",
    money: "Joint ventures look promising. Consider partnerships that align with your values.",
    health: "Mental equilibrium supports physical health. Meditation and peaceful environments restore you.",
    lucky: { numbers: [6, 15, 24], color: 'Pink', time: '7:00 PM' }
  },
  Scorpio: {
    daily: "Transformation energy surrounds you. Deep insights surface, revealing hidden truths. Trust your powerful intuition today.",
    love: "Intensity deepens romantic connections. Vulnerability creates lasting bonds with your partner.",
    career: "Research and investigation yield important discoveries. Your persistence uncovers valuable information.",
    money: "Investments in yourself bring the highest returns. Consider education or skill development.",
    health: "Emotional release promotes physical healing. Allow yourself to process and let go.",
    lucky: { numbers: [8, 13, 22], color: 'Black', time: '10:00 PM' }
  },
  Sagittarius: {
    daily: "Adventure calls to your free spirit today. Expand your horizons through travel, learning, or new experiences. Optimism attracts good fortune.",
    love: "Shared adventures strengthen romantic bonds. Plan an exciting journey with someone special.",
    career: "International opportunities or higher education paths open up. Think big and aim high.",
    money: "Lucky breaks in financial matters favor the bold. Take calculated risks with confidence.",
    health: "Outdoor activities invigorate your spirit. Hiking, sports, or travel rejuvenate you completely.",
    lucky: { numbers: [9, 18, 27], color: 'Purple', time: '4:00 PM' }
  },
  Capricorn: {
    daily: "Discipline and determination propel you forward. Long-term goals come into sharper focus. Your patience and persistence are rewarded.",
    love: "Commitment and loyalty define your romantic approach. Stable, mature relationships thrive now.",
    career: "Authority figures recognize your dedication. Promotions or increased responsibilities are possible.",
    money: "Conservative financial strategies prove wise. Build wealth through steady, reliable methods.",
    health: "Bone and joint health deserve attention. Weight-bearing exercises strengthen your foundation.",
    lucky: { numbers: [10, 20, 30], color: 'Brown', time: '8:00 AM' }
  },
  Aquarius: {
    daily: "Innovation and originality mark your day. Unique ideas set you apart from the crowd. Humanitarian concerns inspire meaningful action.",
    love: "Intellectual connection sparks romantic interest. Find someone who appreciates your unique perspective.",
    career: "Technology and progressive approaches favor your work. Embrace unconventional methods.",
    money: "Investments in innovation and technology show promise. Think ahead of current trends.",
    health: "Circulation and nervous system wellness matter. Social connections boost your overall health.",
    lucky: { numbers: [11, 22, 29], color: 'Electric Blue', time: '1:00 PM' }
  },
  Pisces: {
    daily: "Intuition and creativity flow abundantly. Artistic pursuits bring deep satisfaction. Dreams hold meaningful messages today.",
    love: "Soulmate energy surrounds you. Trust the universe to guide romantic matters perfectly.",
    career: "Creative projects gain momentum. Your imaginative approach solves problems innovatively.",
    money: "Intuitive financial decisions prove accurate. Trust your gut feelings about investments.",
    health: "Water-related activities heal and restore. Swimming, baths, or time near water benefits you.",
    lucky: { numbers: [12, 21, 30], color: 'Sea Green', time: '5:00 PM' }
  }
};

const Horoscope = () => {
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const selectedHoroscope = selectedSign ? horoscopeContent[selectedSign as keyof typeof horoscopeContent] : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-hero-gradient">
        {/* Animated Stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-accent rounded-full animate-twinkle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: 0.3 + Math.random() * 0.7,
              }}
            />
          ))}
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blood-vibrant/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blood-dark/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Breadcrumb */}
            <nav className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">Horoscopes</span>
            </nav>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-6">
              <Calendar className="w-4 h-4 text-accent" />
              <span className="text-sm text-foreground/80">{formattedDate}</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              <span className="text-foreground">Free Daily</span>
              <br />
              <span className="text-gradient-gold">Horoscopes</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Discover what the stars have in store for you. Select your zodiac sign below for personalized cosmic guidance.
            </p>

            {/* Time Frame Selector */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {(['daily', 'weekly', 'monthly'] as const).map((frame) => (
                <button
                  key={frame}
                  onClick={() => setTimeFrame(frame)}
                  className={`px-6 py-2 rounded-full font-heading text-sm font-medium transition-all ${
                    timeFrame === frame
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-foreground/70 hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {frame.charAt(0).toUpperCase() + frame.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Zodiac Signs Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-8">
            Select Your <span className="text-gradient-gold">Zodiac Sign</span>
          </h2>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {zodiacSigns.map((sign) => (
              <button
                key={sign.name}
                onClick={() => setSelectedSign(sign.name)}
                className={`group relative p-4 rounded-xl transition-all duration-300 ${
                  selectedSign === sign.name
                    ? 'bg-accent text-accent-foreground glow-blood scale-105'
                    : 'bg-card hover:bg-secondary border border-border hover:border-accent/50'
                }`}
              >
                <div className="text-center">
                  <span className="text-3xl md:text-4xl block mb-2">{sign.symbol}</span>
                  <span className="font-heading text-sm font-medium block">{sign.name}</span>
                  <span className="text-xs text-muted-foreground mt-1 block group-hover:text-foreground/70 transition-colors">
                    {sign.dates.split(' - ')[0]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Selected Horoscope Content */}
      {selectedSign && selectedHoroscope && (
        <section className="py-12 md:py-16 bg-card/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Sign Header */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-3 mb-4">
                  <span className="text-5xl">{zodiacSigns.find(s => s.name === selectedSign)?.symbol}</span>
                  <div className="text-left">
                    <h2 className="font-heading text-3xl md:text-4xl font-bold text-gradient-gold">{selectedSign}</h2>
                    <p className="text-muted-foreground">{zodiacSigns.find(s => s.name === selectedSign)?.dates}</p>
                  </div>
                </div>
              </div>

              {/* Horoscope Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-2 bg-transparent h-auto p-0 mb-8">
                  {[
                    { value: 'overview', icon: Sun, label: 'Overview' },
                    { value: 'love', icon: Heart, label: 'Love' },
                    { value: 'career', icon: Briefcase, label: 'Career' },
                    { value: 'money', icon: DollarSign, label: 'Money' },
                    { value: 'health', icon: Sparkles, label: 'Health' },
                    { value: 'lucky', icon: Star, label: 'Lucky' },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg bg-secondary/50 border border-border data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:border-accent transition-all"
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                  <TabsContent value="overview" className="mt-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Sun className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-heading text-xl font-semibold mb-3">Today's Overview</h3>
                        <p className="text-foreground/90 leading-relaxed text-lg">{selectedHoroscope.daily}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="love" className="mt-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-heading text-xl font-semibold mb-3">Love & Relationships</h3>
                        <p className="text-foreground/90 leading-relaxed text-lg">{selectedHoroscope.love}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="career" className="mt-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-heading text-xl font-semibold mb-3">Career & Work</h3>
                        <p className="text-foreground/90 leading-relaxed text-lg">{selectedHoroscope.career}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="money" className="mt-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-heading text-xl font-semibold mb-3">Money & Finance</h3>
                        <p className="text-foreground/90 leading-relaxed text-lg">{selectedHoroscope.money}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="health" className="mt-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-heading text-xl font-semibold mb-3">Health & Wellness</h3>
                        <p className="text-foreground/90 leading-relaxed text-lg">{selectedHoroscope.health}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="lucky" className="mt-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Star className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-heading text-xl font-semibold mb-3">Lucky Elements</h3>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="bg-secondary/50 rounded-xl p-4 text-center">
                            <span className="text-sm text-muted-foreground block mb-1">Lucky Numbers</span>
                            <span className="font-heading font-bold text-lg text-accent">
                              {selectedHoroscope.lucky.numbers.join(', ')}
                            </span>
                          </div>
                          <div className="bg-secondary/50 rounded-xl p-4 text-center">
                            <span className="text-sm text-muted-foreground block mb-1">Lucky Color</span>
                            <span className="font-heading font-bold text-lg text-accent">
                              {selectedHoroscope.lucky.color}
                            </span>
                          </div>
                          <div className="bg-secondary/50 rounded-xl p-4 text-center">
                            <span className="text-sm text-muted-foreground block mb-1">Lucky Time</span>
                            <span className="font-heading font-bold text-lg text-accent">
                              {selectedHoroscope.lucky.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

              {/* CTA */}
              <div className="mt-8 text-center">
                <p className="text-muted-foreground mb-4">Want a more personalized reading?</p>
                <Link to="/advisors?category=astrology">
                  <Button variant="hero" size="lg" className="gap-2">
                    Talk to an Astrologer
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Compatibility Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
              <span className="text-gradient">Love Compatibility</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover how your zodiac sign matches with others. Find your perfect cosmic match.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: 'Fire Signs', signs: 'Aries, Leo, Sagittarius', emoji: '🔥' },
                { title: 'Earth Signs', signs: 'Taurus, Virgo, Capricorn', emoji: '🌍' },
                { title: 'Air Signs', signs: 'Gemini, Libra, Aquarius', emoji: '💨' },
                { title: 'Water Signs', signs: 'Cancer, Scorpio, Pisces', emoji: '💧' },
              ].map((element) => (
                <div key={element.title} className="bg-card rounded-xl border border-border p-5 hover:border-accent/50 transition-all group">
                  <span className="text-3xl block mb-3">{element.emoji}</span>
                  <h3 className="font-heading font-semibold text-lg mb-2 group-hover:text-accent transition-colors">{element.title}</h3>
                  <p className="text-sm text-muted-foreground">{element.signs}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-12 md:py-16 bg-blood-gradient">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Sparkles className="w-12 h-12 text-accent mx-auto mb-4" />
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
              Get Your Personalized Birth Chart Reading
            </h2>
            <p className="text-foreground/80 mb-6 max-w-xl mx-auto">
              Connect with our expert astrologers for an in-depth analysis of your natal chart, planetary transits, and cosmic destiny.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/advisors?category=astrology">
                <Button variant="hero" size="lg">
                  Find an Astrologer
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-foreground/30 hover:bg-foreground/10">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Horoscope;