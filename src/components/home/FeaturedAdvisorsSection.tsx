import { ChevronLeft, ChevronRight, ArrowRight, Star } from 'lucide-react';
import { useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AdvisorCard } from '@/components/advisors/AdvisorCard';
import { useAdvisors } from '@/hooks/useAdvisors';

export const FeaturedAdvisorsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { advisors } = useAdvisors();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Get top-rated advisors for featured section
  const featuredAdvisors = advisors
    .filter(a => a.isTopRated || a.rating >= 4.8)
    .slice(0, 12);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

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
    <section className="py-4 md:py-5 mb-8 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-primary fill-primary" />
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
              Featured <span className="text-gradient">Advisors</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
<<<<<<< HEAD
              disabled={!canScrollLeft}
              className="rounded-full w-8 h-8"
=======
              className="rounded-full w-10 h-10 sm:w-8 sm:h-8"
>>>>>>> ab2c37d4763b34b5f93f4107bc089dcdc740b4ed
              aria-label="Scroll advisors left"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
<<<<<<< HEAD
              disabled={!canScrollRight}
              className="rounded-full w-8 h-8"
=======
              className="rounded-full w-10 h-10 sm:w-8 sm:h-8"
>>>>>>> ab2c37d4763b34b5f93f4107bc089dcdc740b4ed
              aria-label="Scroll advisors right"
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
            onScroll={updateScrollState}
            className="grid grid-flow-col auto-cols-[280px] md:auto-cols-[320px] gap-6 overflow-x-auto py-2 scrollbar-hide snap-x snap-mandatory"
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
