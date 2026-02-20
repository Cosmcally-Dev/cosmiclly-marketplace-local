import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export const StickyPromoBar = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div
      className="relative text-white border-b-2 border-primary/30"
      style={{ background: 'linear-gradient(to right, hsl(263,70%,16%), hsl(187,94%,16%))' }}
    >
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm">
          <Sparkles className="w-4 h-4 text-primary hidden sm:block" />
          <span className="font-medium text-xs sm:text-sm font-sans text-white/80">
            Get <span className="text-primary font-bold">3 Free Minutes</span> + <span className="text-primary font-bold">70% Off</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 sm:h-8 px-4 sm:px-3 text-xs font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg transition-all min-w-[140px] font-sans"
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
