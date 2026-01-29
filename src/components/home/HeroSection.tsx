import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Leaf, DollarSign, ThumbsUp, MessageCircle } from 'lucide-react';
import { AdvisorSearchBar } from '@/components/search/AdvisorSearchBar';
import { CategoriesStrip } from './CategoriesStrip';

const quickFilters = [
  { label: 'All advisors', icon: LayoutGrid, filter: 'all' },
  { label: 'New advisors', icon: Leaf, filter: 'new' },
  { label: 'Under $3', icon: DollarSign, filter: 'under-3' },
  { label: '+50 reviews', icon: ThumbsUp, filter: 'reviews-50' },
  { label: 'Live chat', icon: MessageCircle, filter: 'live-chat' },
];

export const HeroSection = () => {
  const navigate = useNavigate();

  const handleFilterClick = (filter: string) => {
    navigate(`/advisors?filter=${filter}`);
  };

  return (
    <section className="relative bg-hero-gradient pt-6 pb-8 md:pt-10 md:pb-12">
      {/* Animated Stars Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
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
      <div className="absolute top-0 -left-32 w-64 h-64 bg-blood-vibrant/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-32 w-64 h-64 bg-blood-dark/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-4 animate-fade-in">
            <span className="text-foreground">Find Your </span>
            <span className="text-gradient">Psychic Advisor</span>
          </h1>

          {/* Subheading */}
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Connect with gifted psychic advisors for love, career, and life guidance
          </p>

          {/* Search Bar */}
          <div className="max-w-lg mx-auto mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <AdvisorSearchBar variant="hero" placeholder="Search by specialty or reading type" />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-6 animate-fade-in" style={{ animationDelay: '0.25s' }}>
            {quickFilters.map((filter) => {
              const IconComponent = filter.icon;
              return (
                <button
                  key={filter.filter}
                  onClick={() => handleFilterClick(filter.filter)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 backdrop-blur-sm border border-border text-sm font-sans text-foreground/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>

          {/* Categories Strip */}
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CategoriesStrip />
          </div>
        </div>
      </div>
    </section>
  );
};
