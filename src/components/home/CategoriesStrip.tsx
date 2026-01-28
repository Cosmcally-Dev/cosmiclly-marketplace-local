import { Link, useNavigate } from 'react-router-dom';
import { categories } from '@/data/categories';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

export const CategoriesStrip = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reorder categories so Love is first
  const orderedCategories = [...categories].sort((a, b) => {
    if (a.slug === 'love') return -1;
    if (b.slug === 'love') return 1;
    return 0;
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative">
      {/* Scroll Buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-card/90 backdrop-blur-sm border border-border rounded-full flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-lg hidden md:flex"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-card/90 backdrop-blur-sm border border-border rounded-full flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-lg hidden md:flex"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Categories */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-1 md:px-8"
      >
        {orderedCategories.map((category) => (
          <button
            key={category.slug}
            onClick={() => navigate(`/advisors?category=${category.slug}`)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 hover:bg-primary hover:text-primary-foreground border border-border hover:border-primary transition-all group"
          >
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center`}>
              <category.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground group-hover:text-primary-foreground whitespace-nowrap">
              {category.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
