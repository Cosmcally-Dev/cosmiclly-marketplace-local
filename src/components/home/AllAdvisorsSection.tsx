import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight, Filter, ChevronDown, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdvisorCard } from '@/components/advisors/AdvisorCard';
import { advisors } from '@/data/advisors';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

type SortOption = 'rating' | 'price-low' | 'price-high' | 'reviews';

export const AllAdvisorsSection = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [priceRange, setPriceRange] = useState([0, 10]);
  const [showOffline, setShowOffline] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  // Filter and sort advisors
  let filteredAdvisors = advisors.filter(advisor => {
    const effectivePrice = advisor.discountedPrice || advisor.pricePerMinute;
    const priceMatch = effectivePrice >= priceRange[0] && effectivePrice <= priceRange[1];
    const statusMatch = showOffline || advisor.status !== 'offline';
    return priceMatch && statusMatch;
  });

  // Sort
  filteredAdvisors = [...filteredAdvisors].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'price-low':
        return (a.discountedPrice || a.pricePerMinute) - (b.discountedPrice || b.pricePerMinute);
      case 'price-high':
        return (b.discountedPrice || b.pricePerMinute) - (a.discountedPrice || a.pricePerMinute);
      case 'reviews':
        return b.reviewCount - a.reviewCount;
      default:
        return 0;
    }
  });

  const displayedAdvisors = filteredAdvisors.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAdvisors.length;

  return (
    <section className="py-12 md:py-16 bg-secondary/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-accent" />
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
              All Advisors
            </h2>
            <span className="text-sm text-muted-foreground">
              ({filteredAdvisors.length})
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Sliders className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className="mb-6">
            <div className="bg-card rounded-xl border border-border p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sort By */}
                <div>
                  <Label className="text-sm font-sans font-medium text-foreground mb-3 block">
                    Sort By
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'rating', label: 'Most Accurate' },
                      { value: 'reviews', label: 'Most Reviews' },
                      { value: 'price-low', label: 'Price: Low' },
                      { value: 'price-high', label: 'Price: High' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value as SortOption)}
                        className={`px-3 py-1.5 rounded-full text-sm font-sans transition-colors ${
                          sortBy === option.value
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'bg-card text-foreground border border-border hover:border-primary/50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <Label className="text-sm font-sans font-medium text-foreground mb-3 block">
                    Price per minute: ${priceRange[0]} - ${priceRange[1]}
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={10}
                    min={0}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                {/* Show Offline */}
                <div className="flex items-center gap-3">
                  <Switch
                    id="show-offline"
                    checked={showOffline}
                    onCheckedChange={setShowOffline}
                  />
                  <Label htmlFor="show-offline" className="text-sm text-foreground cursor-pointer">
                    Show Offline Advisors
                  </Label>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {displayedAdvisors.map((advisor, index) => (
            <div
              key={advisor.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <AdvisorCard advisor={advisor} />
            </div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setVisibleCount(prev => prev + 12)}
            >
              Load More Advisors
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
