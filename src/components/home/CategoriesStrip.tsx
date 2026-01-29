import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { categories } from '@/data/categories';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

export const CategoriesStrip = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Reorder categories so Love is first
  const orderedCategories = [...categories].sort((a, b) => {
    if (a.slug === 'love') return -1;
    if (b.slug === 'love') return 1;
    return 0;
  });

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Desktop Left Chevron - Outside the scroll container */}
      {!isMobile && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-card shadow-md border-border/50 hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex-1 flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {orderedCategories.map((category) => (
          <button
            key={category.slug}
            onClick={() => navigate(`/advisors?category=${category.slug}`)}
            className="flex-shrink-0 snap-start flex flex-col items-center justify-center gap-2 w-24 h-24 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
          >
            {/* Icon Circle */}
            <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <category.icon className="w-5 h-5 text-primary" />
            </div>
            {/* Label */}
            <span className="text-xs font-medium text-foreground text-center leading-tight px-1 line-clamp-2">
              {category.label}
            </span>
          </button>
        ))}
      </div>

      {/* Desktop Right Chevron - Outside the scroll container */}
      {!isMobile && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-card shadow-md border-border/50 hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};
