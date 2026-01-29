import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { AdvisorCard } from '@/components/advisors/AdvisorCard';
import { advisors, Advisor } from '@/data/advisors';

// Store recently viewed advisor IDs in localStorage
const STORAGE_KEY = 'recentlyViewedAdvisors';
const MAX_RECENT = 6;

export const getRecentlyViewed = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addToRecentlyViewed = (advisorId: string) => {
  try {
    const current = getRecentlyViewed();
    const filtered = current.filter(id => id !== advisorId);
    const updated = [advisorId, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
};

export const RecentlyViewedSection = () => {
  const [recentAdvisors, setRecentAdvisors] = useState<Advisor[]>([]);

  useEffect(() => {
    const recentIds = getRecentlyViewed();
    const recent = recentIds
      .map(id => advisors.find(a => a.id === id))
      .filter((a): a is Advisor => a !== undefined);
    setRecentAdvisors(recent);
  }, []);

  if (recentAdvisors.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5 border-y border-border/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
              Recently Viewed
            </h2>
          </div>
          <Link
            to="/advisors"
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {recentAdvisors.slice(0, 4).map((advisor, index) => (
            <div
              key={advisor.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <AdvisorCard advisor={advisor} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
