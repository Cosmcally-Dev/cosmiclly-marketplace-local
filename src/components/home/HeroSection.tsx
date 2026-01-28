import { useNavigate } from 'react-router-dom';
import { AdvisorSearchBar } from '@/components/search/AdvisorSearchBar';
import { CategoriesStrip } from './CategoriesStrip';

export const HeroSection = () => {
  const navigate = useNavigate();

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
          <div className="max-w-lg mx-auto mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <AdvisorSearchBar variant="hero" />
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
