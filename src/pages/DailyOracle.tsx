import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Star, Heart, Briefcase, Sun, Moon, 
  ChevronRight, Shuffle, RotateCcw, Eye, Calendar,
  ArrowRight
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Tarot cards data
const tarotCards = [
  { name: 'The Fool', meaning: 'New beginnings, innocence, spontaneity, a free spirit', image: '🃏', advice: 'Take a leap of faith and trust in new beginnings. The universe supports your journey into the unknown.' },
  { name: 'The Magician', meaning: 'Manifestation, resourcefulness, power, inspired action', image: '🎩', advice: 'You have all the tools you need to succeed. Channel your energy and make things happen.' },
  { name: 'The High Priestess', meaning: 'Intuition, sacred knowledge, divine feminine, the subconscious', image: '🌙', advice: 'Trust your inner voice. The answers you seek lie within your intuition.' },
  { name: 'The Empress', meaning: 'Femininity, beauty, nature, nurturing, abundance', image: '👑', advice: 'Embrace creativity and nurturing energy. Abundance flows to you naturally.' },
  { name: 'The Emperor', meaning: 'Authority, structure, control, fatherhood', image: '🏛️', advice: 'Take charge of your situation with confidence. Structure and discipline will serve you well.' },
  { name: 'The Hierophant', meaning: 'Spiritual wisdom, religious beliefs, conformity, tradition', image: '📿', advice: 'Seek guidance from trusted mentors. Traditional wisdom holds valuable lessons.' },
  { name: 'The Lovers', meaning: 'Love, harmony, relationships, values alignment, choices', image: '💕', advice: 'Follow your heart in matters of love. Important choices about relationships await.' },
  { name: 'The Chariot', meaning: 'Control, willpower, success, action, determination', image: '⚔️', advice: 'Victory is within reach through determination. Stay focused on your goals.' },
  { name: 'Strength', meaning: 'Strength, courage, persuasion, influence, compassion', image: '🦁', advice: 'Your inner strength will see you through. Lead with courage and compassion.' },
  { name: 'The Hermit', meaning: 'Soul-searching, introspection, being alone, inner guidance', image: '🏔️', advice: 'Take time for reflection and solitude. Inner wisdom awaits in quiet moments.' },
  { name: 'Wheel of Fortune', meaning: 'Good luck, karma, life cycles, destiny, turning point', image: '🎡', advice: 'Change is coming. Embrace the cycles of life and trust in divine timing.' },
  { name: 'Justice', meaning: 'Justice, fairness, truth, cause and effect, law', image: '⚖️', advice: 'Truth and fairness will prevail. Make decisions with integrity.' },
  { name: 'The Hanged Man', meaning: 'Pause, surrender, letting go, new perspectives', image: '🙃', advice: 'Sometimes we must pause to gain new perspectives. Surrender to the process.' },
  { name: 'Death', meaning: 'Endings, change, transformation, transition', image: '🦋', advice: 'Transformation is at hand. Let go of the old to make way for the new.' },
  { name: 'Temperance', meaning: 'Balance, moderation, patience, purpose', image: '☯️', advice: 'Find balance in all things. Patience and moderation bring harmony.' },
  { name: 'The Devil', meaning: 'Shadow self, attachment, addiction, restriction', image: '⛓️', advice: 'Examine what binds you. Freedom comes from releasing unhealthy attachments.' },
  { name: 'The Tower', meaning: 'Sudden change, upheaval, chaos, revelation, awakening', image: '⚡', advice: 'Sudden change clears the way for truth. From destruction comes renewal.' },
  { name: 'The Star', meaning: 'Hope, faith, purpose, renewal, spirituality', image: '⭐', advice: 'Have faith in the future. Hope and healing are on the horizon.' },
  { name: 'The Moon', meaning: 'Illusion, fear, anxiety, subconscious, intuition', image: '🌕', advice: 'Trust your intuition through uncertainty. Not all is as it seems.' },
  { name: 'The Sun', meaning: 'Positivity, fun, warmth, success, vitality', image: '☀️', advice: 'Joy and success shine upon you. Embrace the warmth of positive energy.' },
  { name: 'Judgement', meaning: 'Judgement, rebirth, inner calling, absolution', image: '📯', advice: 'Answer your higher calling. A time of reckoning and renewal approaches.' },
  { name: 'The World', meaning: 'Completion, integration, accomplishment, travel', image: '🌍', advice: 'A cycle completes successfully. Celebrate your achievements and prepare for new journeys.' },
];

const oracleFeatures = [
  {
    id: 'daily-card',
    title: 'Your Daily Card',
    description: 'Pull your free daily tarot card and receive guidance for the day ahead.',
    image: 'https://images.unsplash.com/photo-1633467067670-e7c6758a6d73?w=600&h=400&fit=crop',
    color: 'from-purple-600 to-violet-700',
    icon: Sun,
    isNew: false,
  },
  {
    id: 'ask-question',
    title: 'Ask Your Question',
    description: 'Focus on a question, pick a card, and discover the answer the universe has for you.',
    image: 'https://images.unsplash.com/photo-1545987796-200677ee1011?w=600&h=400&fit=crop',
    color: 'from-indigo-600 to-blue-700',
    icon: Eye,
    isNew: true,
  },
  {
    id: 'love-spread',
    title: '3-Card Love Spread',
    description: 'Reveal your past, present, and future in matters of the heart with this romantic reading.',
    image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&h=400&fit=crop',
    color: 'from-pink-600 to-rose-700',
    icon: Heart,
    isNew: false,
  },
  {
    id: 'career-spread',
    title: '3-Card Career Spread',
    description: 'Gain clarity on your professional path with insights into challenges, actions, and outcomes.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop',
    color: 'from-emerald-600 to-teal-700',
    icon: Briefcase,
    isNew: false,
  },
  {
    id: 'yearly-forecast',
    title: 'Yearly Love Forecast',
    description: 'Discover what the stars have in store for your love life throughout the coming year.',
    image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&h=400&fit=crop',
    color: 'from-amber-600 to-orange-700',
    icon: Calendar,
    isNew: true,
  },
  {
    id: 'moon-reading',
    title: 'Moon Phase Reading',
    description: 'Align with lunar energy and discover how the current moon phase influences your path.',
    image: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=600&h=400&fit=crop',
    color: 'from-slate-600 to-slate-800',
    icon: Moon,
    isNew: false,
  },
];

const DailyOracle = () => {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [drawnCards, setDrawnCards] = useState<typeof tarotCards>([]);
  const [question, setQuestion] = useState('');
  const [spreadType, setSpreadType] = useState<'single' | 'three'>('single');
  const [revealedCards, setRevealedCards] = useState<number[]>([]);

  const shuffleAndDraw = (count: number) => {
    setIsShuffling(true);
    setRevealedCards([]);
    
    setTimeout(() => {
      const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
      setDrawnCards(shuffled.slice(0, count));
      setIsShuffling(false);
    }, 1500);
  };

  const revealCard = (index: number) => {
    if (!revealedCards.includes(index)) {
      setRevealedCards([...revealedCards, index]);
    }
  };

  const resetReading = () => {
    setDrawnCards([]);
    setRevealedCards([]);
    setQuestion('');
    setSelectedFeature(null);
  };

  const handleFeatureClick = (featureId: string) => {
    setSelectedFeature(featureId);
    setDrawnCards([]);
    setRevealedCards([]);
    
    if (featureId === 'daily-card' || featureId === 'ask-question' || featureId === 'moon-reading') {
      setSpreadType('single');
    } else {
      setSpreadType('three');
    }
  };

  const renderReadingArea = () => {
    if (!selectedFeature) return null;

    const feature = oracleFeatures.find(f => f.id === selectedFeature);
    if (!feature) return null;

    return (
      <div className="mt-12 animate-fade-in">
        <div className="text-center mb-8">
          <Button variant="ghost" onClick={resetReading} className="mb-4">
            <RotateCcw className="w-4 h-4 mr-2" />
            Choose Different Reading
          </Button>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
            {feature.title}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {feature.description}
          </p>
        </div>

        {/* Question Input for Ask Question feature */}
        {selectedFeature === 'ask-question' && drawnCards.length === 0 && (
          <div className="max-w-md mx-auto mb-8">
            <label className="block text-sm font-medium text-foreground mb-2">
              Focus on your question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like guidance on?"
              className="w-full p-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>
        )}

        {/* Shuffle Button */}
        {drawnCards.length === 0 && (
          <div className="text-center">
            <Button
              variant="hero"
              size="lg"
              onClick={() => shuffleAndDraw(spreadType === 'single' ? 1 : 3)}
              disabled={isShuffling || (selectedFeature === 'ask-question' && !question.trim())}
              className="min-w-[200px]"
            >
              {isShuffling ? (
                <>
                  <Shuffle className="w-5 h-5 mr-2 animate-spin" />
                  Shuffling...
                </>
              ) : (
                <>
                  <Shuffle className="w-5 h-5 mr-2" />
                  Shuffle & Draw
                </>
              )}
            </Button>
          </div>
        )}

        {/* Drawn Cards */}
        {drawnCards.length > 0 && (
          <div className="mt-8">
            {/* Spread Labels for 3-card readings */}
            {spreadType === 'three' && (
              <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto mb-4">
                <p className="text-center text-sm font-medium text-muted-foreground">Past</p>
                <p className="text-center text-sm font-medium text-muted-foreground">Present</p>
                <p className="text-center text-sm font-medium text-muted-foreground">Future</p>
              </div>
            )}
            
            <div className={`grid gap-4 md:gap-8 max-w-3xl mx-auto ${
              spreadType === 'single' ? 'grid-cols-1 max-w-sm' : 'grid-cols-3'
            }`}>
              {drawnCards.map((card, index) => (
                <div
                  key={index}
                  className="perspective-1000"
                  onClick={() => revealCard(index)}
                >
                  <div
                    className={`relative cursor-pointer transition-transform duration-700 transform-style-3d ${
                      revealedCards.includes(index) ? 'rotate-y-180' : ''
                    }`}
                  >
                    {/* Card Back */}
                    <div className={`aspect-[2/3] rounded-xl bg-gradient-to-br ${feature.color} p-4 flex items-center justify-center border-2 border-accent/30 shadow-xl backface-hidden ${
                      revealedCards.includes(index) ? 'invisible' : ''
                    }`}>
                      <div className="text-center">
                        <Sparkles className="w-12 h-12 text-white/80 mx-auto mb-2" />
                        <p className="text-white/80 text-sm font-medium">
                          {revealedCards.includes(index) ? '' : 'Tap to Reveal'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Card Front */}
                    {revealedCards.includes(index) && (
                      <div className="absolute inset-0 aspect-[2/3] rounded-xl bg-card border-2 border-primary/50 p-4 flex flex-col items-center justify-center shadow-xl animate-fade-in">
                        <span className="text-4xl md:text-5xl mb-3">{card.image}</span>
                        <h3 className="font-heading text-lg md:text-xl font-bold text-foreground text-center mb-2">
                          {card.name}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground text-center line-clamp-3">
                          {card.meaning}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Card Interpretations */}
            {revealedCards.length === drawnCards.length && (
              <div className="mt-8 max-w-2xl mx-auto animate-fade-in">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    Your Reading
                  </h3>
                  
                  {drawnCards.map((card, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      {spreadType === 'three' && (
                        <span className="text-xs font-medium text-primary uppercase tracking-wide">
                          {index === 0 ? 'Past' : index === 1 ? 'Present' : 'Future'}
                        </span>
                      )}
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <span>{card.image}</span> {card.name}
                      </h4>
                      <p className="text-muted-foreground text-sm mt-1">
                        {card.advice}
                      </p>
                    </div>
                  ))}

                  <div className="mt-6 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-4">
                      Want a deeper, personalized reading? Connect with one of our expert advisors.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="hero" asChild>
                        <Link to="/advisors?category=tarot">
                          Talk to a Tarot Expert
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                      <Button variant="outline" onClick={resetReading}>
                        New Reading
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
              <span className="text-foreground">Daily Oracle</span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-hero-gradient py-12 md:py-20 relative overflow-hidden">
          {/* Animated stars */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
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
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Free Daily Insights
              </div>
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Daily <span className="text-gradient">Oracle</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Your free portal for quick insights every day. Tap into your intuition 
                and let the universe guide your path with our mystical oracle readings.
              </p>
            </div>
          </div>
        </section>

        {/* Oracle Features Grid */}
        {!selectedFeature && (
          <section className="py-12 md:py-16">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {oracleFeatures.map((feature, index) => (
                  <Card
                    key={feature.id}
                    className="group cursor-pointer overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => handleFeatureClick(feature.id)}
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${feature.color} opacity-60`} />
                      
                      {/* Icon */}
                      <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>

                      {/* New Badge */}
                      {feature.isNew && (
                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase">
                          New
                        </div>
                      )}
                    </div>

                    <CardContent className="p-6">
                      <h3 className="font-heading text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                      <div className="mt-4 flex items-center text-primary font-medium text-sm">
                        Start Reading
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Reading Area */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {renderReadingArea()}
          </div>
        </section>

        {/* CTA Section */}
        {!selectedFeature && (
          <section className="py-12 md:py-16 bg-secondary/30">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Want a Deeper, Personalized Reading?
                </h2>
                <p className="text-muted-foreground mb-8">
                  While our free oracle readings offer daily guidance, our expert psychic advisors 
                  provide personalized, in-depth readings tailored to your unique situation.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/advisors">
                      Find Your Advisor
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/horoscope">
                      View Horoscopes
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default DailyOracle;
