import { Link } from 'react-router-dom';
import { Eye, Sun, Star, Sparkles, Moon, Hand, Heart, TrendingUp, Ghost, Layers } from 'lucide-react';

const categories = [
  { icon: Eye, label: 'Psychic Readings', color: 'from-purple-500 to-purple-700', description: 'Gain clarity on any situation', slug: 'all' },
  { icon: Sun, label: 'Astrology', color: 'from-amber-500 to-orange-600', description: 'Chart your cosmic path', slug: 'astrology' },
  { icon: Sparkles, label: 'Tarot', color: 'from-violet-500 to-purple-600', description: 'Reveal hidden truths', slug: 'tarot' },
  { icon: Heart, label: 'Love & Relationships', color: 'from-pink-500 to-rose-600', description: 'Find your soulmate', slug: 'love' },
  { icon: Star, label: 'Numerology', color: 'from-blue-500 to-indigo-600', description: 'Decode your life path', slug: 'numerology' },
  { icon: Moon, label: 'Dream Analysis', color: 'from-indigo-500 to-purple-600', description: 'Understand your dreams', slug: 'dreams' },
  { icon: Hand, label: 'Palm Readings', color: 'from-emerald-500 to-teal-600', description: 'Your destiny in your hands', slug: 'palm' },
  { icon: TrendingUp, label: 'Career Forecasts', color: 'from-cyan-500 to-blue-600', description: 'Navigate your success', slug: 'career' },
  { icon: Ghost, label: 'Mediums', color: 'from-slate-500 to-slate-700', description: 'Connect with loved ones', slug: 'mediums' },
  { icon: Layers, label: 'Fortune Telling', color: 'from-fuchsia-500 to-pink-600', description: 'See your future', slug: 'fortune' },
];

export const CategoriesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Explore Our <span className="text-gradient">Services</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose from a wide range of psychic services to find the guidance you seek
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((category, index) => (
            <Link
              key={category.label}
              to={`/advisors?category=${category.slug}`}
              className="group relative p-4 md:p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 card-shadow animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Icon */}
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <category.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="font-semibold text-foreground text-sm md:text-base mb-1 group-hover:text-primary transition-colors">
                {category.label}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                {category.description}
              </p>

              {/* Hover Glow */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
