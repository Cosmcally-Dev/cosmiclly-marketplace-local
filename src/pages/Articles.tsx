import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { articleCategories } from '@/data/articles';
import { ChevronRight, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Articles = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Spiritual <span className="text-gradient-gold">Articles</span> & Guides
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Explore our collection of insightful articles on love, spirituality, tarot, astrology, and personal growth
              </p>
            </div>
          </div>
        </section>

        {/* Category Navigation Grid */}
        <section className="py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              {articleCategories.map((category) => (
                <a
                  key={category.slug}
                  href={`#${category.slug}`}
                  className="group flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <category.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {category.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Love Compatibility Banner */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-purple-500/20 border border-rose-500/30 p-6 md:p-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-rose-500/20 to-transparent rounded-full blur-3xl" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground">
                      Love Compatibility Wizard
                    </h3>
                    <p className="text-muted-foreground">
                      See if you're meant to be together based on your zodiac signs
                    </p>
                  </div>
                </div>
                <Button variant="hero" size="lg" className="whitespace-nowrap">
                  Check Compatibility
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Article Category Sections */}
        {articleCategories.map((category) => (
          <section key={category.slug} id={category.slug} className="py-12 border-b border-border last:border-b-0">
            <div className="container mx-auto px-4">
              {/* Category Header */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                      <category.icon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                      {category.label}
                    </h2>
                  </div>
                  <p className="text-muted-foreground max-w-2xl">
                    {category.description}
                  </p>
                </div>
                <Link
                  to={`/articles/${category.slug}`}
                  className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors whitespace-nowrap"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Articles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.articles.slice(0, 6).map((article) => (
                  <Link
                    key={article.id}
                    to={`/articles/${category.slug}/${article.slug}`}
                    className="group"
                  >
                    <article className="relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300">
                      <div className="aspect-[16/11] overflow-hidden">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto">
              <Sparkles className="w-12 h-12 text-accent mx-auto mb-4" />
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready for Personalized Guidance?
              </h2>
              <p className="text-muted-foreground mb-8">
                Connect with our experienced advisors for one-on-one readings tailored to your unique situation
              </p>
              <Link to="/advisors">
                <Button variant="hero" size="lg">
                  Find Your Advisor
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Articles;
