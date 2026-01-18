import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AdvisorCard } from '@/components/advisors/AdvisorCard';
import { advisors, getOnlineAdvisors } from '@/data/advisors';

export const FeaturedAdvisorsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const onlineAdvisors = getOnlineAdvisors();

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
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
              Online <span className="text-gradient">Advisors</span>
            </h2>
            <p className="text-muted-foreground">
              Connect instantly with our available psychic advisors
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              className="rounded-full hidden md:flex"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              className="rounded-full hidden md:flex"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            <Link to="/advisors">
              <Button variant="mystical" className="hidden md:flex">
                View All Advisors
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Advisors Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        >
          {advisors.map((advisor, index) => (
            <div
              key={advisor.id}
              className="flex-shrink-0 w-[280px] md:w-[300px] snap-start animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <AdvisorCard advisor={advisor} />
            </div>
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-8 text-center md:hidden">
          <Link to="/advisors">
            <Button variant="mystical" size="lg">
              View All Advisors
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
