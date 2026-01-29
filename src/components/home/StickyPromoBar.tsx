import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export const StickyPromoBar = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-hero-gradient text-white relative border-b border-white/10">
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm">
          <Sparkles className="w-4 h-4 text-accent hidden sm:block" />
          <span className="font-medium text-xs sm:text-sm">
            Get <span className="text-accent font-bold">3 Free Minutes</span> + <span className="text-accent font-bold">70% Off</span>
          </span>
          <Button 
            variant="gold" 
            size="sm" 
            className="h-9 sm:h-8 px-4 sm:px-3 text-xs font-bold shadow-lg hover:shadow-xl transition-shadow min-w-[140px]"
          >
            Claim Your Free Reading
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 min-w-11 min-h-11 flex items-center justify-center text-white/60 hover:text-white transition-colors"
        aria-label="Close promo"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
