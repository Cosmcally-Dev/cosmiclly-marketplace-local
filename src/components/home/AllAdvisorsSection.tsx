import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight, Filter, ChevronDown, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdvisorCard } from '@/components/advisors/AdvisorCard';
import { useAdvisors } from '@/hooks/useAdvisors';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

type SortOption = 'top-rated' | 'price-low' | 'price-high' | 'reviews';
type CommType = 'any' | 'chat' | 'call' | 'video';

export const AllAdvisorsSection = () => {
  const { advisors } = useAdvisors();
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('top-rated');
  const [priceRange, setPriceRange] = useState([0.99, 24.99]);
  const [showOffline, setShowOffline] = useState(true);
  const [commType, setCommType] = useState<CommType>('any');
  const [minReviews, setMinReviews] = useState(0);
  const [visibleCount, setVisibleCount] = useState(12);

  // Filter and sort advisors
  let filteredAdvisors = advisors.filter(advisor => {
    const effectivePrice = advisor.discountedPrice || advisor.pricePerMinute;
    const priceMatch = effectivePrice >= priceRange[0] && effectivePrice <= priceRange[1];
    const statusMatch = showOffline || advisor.status !== 'offline';
    const reviewMatch = advisor.reviewCount >= minReviews;
    return priceMatch && statusMatch && reviewMatch;
  });

  // Sort
  filteredAdvisors = [...filteredAdvisors].sort((a, b) => {
    switch (sortBy) {
      case 'top-rated':
        if (a.isTopRated && !b.isTopRated) return -1;
        if (!a.isTopRated && b.isTopRated) return 1;
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (a.status !== 'online' && b.status === 'online') return 1;
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
    <section className="py-12 md:py-16 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
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
              <div className="flex flex-wrap items-end gap-6">
                {/* Sort By — dropdown */}
                <div>
                  <Label className="text-sm font-sans font-medium text-foreground mb-3 block">
                    Sort By
                  </Label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <SelectTrigger className="w-[160px] bg-card border-border font-sans">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-rated">Top Rated</SelectItem>
                      <SelectItem value="reviews">Most Reviews</SelectItem>
                      <SelectItem value="price-low">Price: Low</SelectItem>
                      <SelectItem value="price-high">Price: High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Show Only — dropdown */}
                <div>
                  <Label className="text-sm font-sans font-medium text-foreground mb-3 block">
                    Show only
                  </Label>
                  <Select value={commType} onValueChange={(v) => setCommType(v as CommType)}>
                    <SelectTrigger className="w-[160px] bg-card border-border font-sans">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="chat">Live chat</SelectItem>
                      <SelectItem value="call">Voice call</SelectItem>
                      <SelectItem value="video">Video call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Number of Reviews — dropdown */}
                <div>
                  <Label className="text-sm font-sans font-medium text-foreground mb-3 block">
                    Number of reviews
                  </Label>
                  <Select value={minReviews.toString()} onValueChange={(v) => setMinReviews(parseInt(v))}>
                    <SelectTrigger className="w-[160px] bg-card border-border font-sans">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Over 0</SelectItem>
                      <SelectItem value="10">Over 10</SelectItem>
                      <SelectItem value="50">Over 50</SelectItem>
                      <SelectItem value="100">Over 100</SelectItem>
                      <SelectItem value="500">Over 500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price per minute — slider with amounts on each side */}
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-sm font-sans font-medium text-foreground mb-3 block">
                    Price per minute
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground shrink-0">${priceRange[0].toFixed(2)}</span>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={24.99}
                      min={0.99}
                      step={0.5}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">${priceRange[1].toFixed(2)}</span>
                  </div>
                  <p className="text-center text-xs text-muted-foreground mt-1">
                    ${priceRange[0].toFixed(2)}–${priceRange[1].toFixed(2)}/min
                  </p>
                </div>

                {/* Show Offline */}
                <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-border bg-secondary/20 self-end">
                  <Switch
                    id="show-offline"
                    checked={showOffline}
                    onCheckedChange={setShowOffline}
                  />
                  <Label htmlFor="show-offline" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
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
