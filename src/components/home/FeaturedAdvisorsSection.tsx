import { ChevronLeft, ChevronRight, ArrowRight, Star } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AdvisorCard } from '@/components/advisors/AdvisorCard';
import { advisors } from '@/data/advisors';

export const FeaturedAdvisorsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Get top-rated advisors for featured section
  const featuredAdvisors = advisors
    .filter(a => a.isTopRated || a.rating >= 4.8)
    .slice(0, 12);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-10 md:py-14 mb-8 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-accent fill-accent" />
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
              Featured <span className="text-gradient">Advisors</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              className="rounded-full w-8 h-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              className="rounded-full w-8 h-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Link to="/advisors" className="ml-2">
              <Button variant="mystical" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Advisors Grid/Carousel with visible arrows */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="grid grid-flow-col auto-cols-[280px] md:auto-cols-[300px] gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          >
            {featuredAdvisors.map((advisor, index) => (
              <div
                key={advisor.id}
                className="snap-start animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <AdvisorCard advisor={advisor} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
