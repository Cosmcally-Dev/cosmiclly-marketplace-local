import { Link } from 'react-router-dom';
import { categories } from '@/data/categories';

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
          {categories.slice(0, 10).map((category, index) => (
            <Link
              key={category.slug}
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
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block line-clamp-2">
                {category.shortDescription}
              </p>

              {/* Hover Glow */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Link>
          ))}
        </div>

        {/* View All Link */}
        {categories.length > 10 && (
          <div className="text-center mt-8">
            <Link
              to="/advisors"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              View All {categories.length} Services
              <span className="text-lg">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
