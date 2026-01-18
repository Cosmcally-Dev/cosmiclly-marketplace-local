import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ChevronRight, SlidersHorizontal, X, Grid3X3, List,
  Star, ChevronDown
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdvisorCard } from '@/components/advisors/AdvisorCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { advisors } from '@/data/advisors';

const categoryInfo: Record<string, { title: string; description: string }> = {
  'all': {
    title: 'All Psychic Advisors',
    description: 'Browse our complete directory of verified psychic advisors. Find your perfect match based on specialty, rating, and availability.',
  },
  'soulmate': {
    title: 'Who is my soulmate?',
    description: 'The search for your soulmate is one of life\'s most profound quests. Let our psychics guide your quest to find your soulmate. Tap into universal wisdom and recognize the one meant for you.',
  },
  'love': {
    title: 'Love & Relationships',
    description: 'Get guidance on matters of the heart. Our love psychics can help you navigate relationships, find clarity, and discover your path to lasting happiness.',
  },
  'tarot': {
    title: 'Tarot Readings',
    description: 'Unlock the wisdom of the cards. Our expert tarot readers will reveal insights about your past, present, and future to guide your decisions.',
  },
  'astrology': {
    title: 'Astrology Readings',
    description: 'Discover what the stars have in store for you. Our astrologers provide personalized insights based on your birth chart and planetary alignments.',
  },
  'career': {
    title: 'Career Forecasts',
    description: 'Navigate your professional path with confidence. Get insights on job changes, business decisions, and your path to success.',
  },
  'numerology': {
    title: 'Numerology Readings',
    description: 'Discover the hidden meaning in numbers. Our numerologists reveal insights about your life path, destiny, and the cosmic patterns that shape your journey.',
  },
  'dreams': {
    title: 'Dream Analysis',
    description: 'Unlock the secrets of your subconscious mind. Our dream interpreters help you understand the symbols and messages in your dreams.',
  },
  'palm': {
    title: 'Palm Readings',
    description: 'Your hands hold the map to your destiny. Our palm readers interpret the lines and patterns to reveal insights about your past, present, and future.',
  },
  'mediums': {
    title: 'Psychic Mediums',
    description: 'Connect with loved ones who have passed. Our gifted mediums bridge the gap between worlds to deliver messages of love and healing.',
  },
  'fortune': {
    title: 'Fortune Telling',
    description: 'Glimpse into what lies ahead. Our fortune tellers use ancient arts to reveal the possibilities that await you on your life\'s journey.',
  },
};

type SortOption = 'recommended' | 'rating' | 'reviews' | 'price-low' | 'price-high';
type StatusFilter = 'all' | 'online' | 'available';

const AdvisorsListing = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'all';
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showOffline, setShowOffline] = useState(true);
  const [minReviews, setMinReviews] = useState(0);
  const [priceRange, setPriceRange] = useState([1.99, 39.99]);
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const info = categoryInfo[category] || categoryInfo['all'];

  // Filter and sort advisors
  const filteredAdvisors = useMemo(() => {
    let result = [...advisors];

    // Status filter
    if (statusFilter === 'online') {
      result = result.filter(a => a.status === 'online');
    } else if (statusFilter === 'available') {
      result = result.filter(a => a.status !== 'offline');
    }

    // Show offline toggle
    if (!showOffline) {
      result = result.filter(a => a.status !== 'offline');
    }

    // Min reviews filter
    if (minReviews > 0) {
      result = result.filter(a => a.reviewCount >= minReviews);
    }

    // Price range filter
    result = result.filter(a => {
      const price = a.discountedPrice || a.pricePerMinute;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sorting
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'price-low':
        result.sort((a, b) => (a.discountedPrice || a.pricePerMinute) - (b.discountedPrice || b.pricePerMinute));
        break;
      case 'price-high':
        result.sort((a, b) => (b.discountedPrice || b.pricePerMinute) - (a.discountedPrice || a.pricePerMinute));
        break;
      default:
        // Recommended: Online first, then by rating
        result.sort((a, b) => {
          if (a.status === 'online' && b.status !== 'online') return -1;
          if (a.status !== 'online' && b.status === 'online') return 1;
          return b.rating - a.rating;
        });
    }

    return result;
  }, [statusFilter, showOffline, minReviews, priceRange, sortBy]);

  const onlineCount = advisors.filter(a => a.status === 'online').length;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Status Filter */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Show only</label>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="online">Online now ({onlineCount})</SelectItem>
            <SelectItem value="available">Online & Busy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Min Reviews */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Number of reviews</label>
        <Select value={minReviews.toString()} onValueChange={(v) => setMinReviews(parseInt(v))}>
          <SelectTrigger className="w-full bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Over 0</SelectItem>
            <SelectItem value="100">Over 100</SelectItem>
            <SelectItem value="500">Over 500</SelectItem>
            <SelectItem value="1000">Over 1,000</SelectItem>
            <SelectItem value="5000">Over 5,000</SelectItem>
            <SelectItem value="10000">Over 10,000</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">
          Price per minute
        </label>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={1.99}
            max={39.99}
            step={0.5}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${priceRange[0].toFixed(2)}</span>
            <span>${priceRange[1].toFixed(2)}/min</span>
          </div>
        </div>
      </div>

      {/* Show Offline Toggle */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="showOffline"
          checked={showOffline}
          onCheckedChange={(checked) => setShowOffline(checked as boolean)}
        />
        <label htmlFor="showOffline" className="text-sm text-foreground cursor-pointer">
          Show offline advisors
        </label>
      </div>

      {/* Apply Button (Mobile) */}
      <Button
        variant="hero"
        className="w-full md:hidden"
        onClick={() => setIsFilterOpen(false)}
      >
        Apply Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        {/* Breadcrumb */}
        <div className="bg-secondary/30 border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{info.title}</span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-hero-gradient py-10 md:py-16 relative overflow-hidden">
          {/* Stars */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-accent rounded-full animate-twinkle"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
            ))}
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                {info.title}
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {info.description}
              </p>
            </div>
          </div>
        </section>

        {/* Promo Banner */}
        <div className="bg-accent/10 border-y border-accent/20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-2 text-center">
              <span className="text-accent font-medium">🎉 New members get 3 FREE minutes + 70% off!</span>
              <Button variant="gold" size="sm" className="ml-2">
                Claim Now
              </Button>
            </div>
          </div>
        </div>

        {/* Filters & Grid */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-xl bg-card border border-border">
              {/* Left: Filter Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Mobile Filter Button */}
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="md:hidden">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 bg-card border-border">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Desktop Filters */}
                <div className="hidden md:flex items-center gap-3">
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <SelectTrigger className="w-[140px] bg-secondary border-border">
                      <SelectValue placeholder="Show only" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="online">Online ({onlineCount})</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={minReviews.toString()} onValueChange={(v) => setMinReviews(parseInt(v))}>
                    <SelectTrigger className="w-[150px] bg-secondary border-border">
                      <SelectValue placeholder="Reviews" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any reviews</SelectItem>
                      <SelectItem value="100">100+ reviews</SelectItem>
                      <SelectItem value="1000">1000+ reviews</SelectItem>
                      <SelectItem value="5000">5000+ reviews</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showOfflineDesktop"
                      checked={showOffline}
                      onCheckedChange={(checked) => setShowOffline(checked as boolean)}
                    />
                    <label htmlFor="showOfflineDesktop" className="text-sm text-muted-foreground cursor-pointer">
                      Show offline
                    </label>
                  </div>
                </div>
              </div>

              {/* Right: Sort & View */}
              <div className="flex items-center gap-3">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[160px] bg-secondary border-border">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="hidden md:flex items-center border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${
                      viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${
                      viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-6">
              <p className="text-muted-foreground">
                Showing <span className="text-foreground font-medium">{filteredAdvisors.length}</span> advisors
                {statusFilter === 'online' && <span className="text-green-500 ml-1">• Online now</span>}
              </p>
            </div>

            {/* Advisors Grid */}
            {filteredAdvisors.length > 0 ? (
              <div className={`grid gap-4 md:gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {filteredAdvisors.map((advisor, index) => (
                  <div
                    key={advisor.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <AdvisorCard advisor={advisor} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔮</div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                  No advisors found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters to see more results
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter('all');
                    setShowOffline(true);
                    setMinReviews(0);
                    setPriceRange([1.99, 39.99]);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Load More */}
            {filteredAdvisors.length > 0 && (
              <div className="text-center mt-12">
                <Button variant="outline" size="lg">
                  Load More Advisors
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AdvisorsListing;
