import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PromoBanner = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-mystical-gradient p-8 md:p-12 lg:p-16">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm text-white/90">Limited Time Offer</span>
              </div>

              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Get 3 Free Minutes
                <br />
                <span className="text-accent">+ 70% Off</span>
              </h2>

              <p className="text-lg text-white/80 max-w-md mb-8">
                Start your spiritual journey today. Connect with a gifted advisor and discover the answers you seek.
              </p>

              <Button variant="gold" size="xl" className="shadow-xl">
                Claim Your Free Reading
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Feature List */}
            <div className="grid gap-4 w-full lg:w-auto">
              {[
                '3 free minutes with any advisor',
                'Access to 500+ verified psychics',
                '100% satisfaction guaranteed',
                '24/7 support available',
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <svg className="w-3 h-3 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/90">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
