import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Home, Sparkles, Clock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

const featureNames: Record<string, string> = {
  '/about': 'About Us',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
  '/cookies': 'Cookie Policy',
  '/favorites': 'Favorite Advisors',
  '/payment-methods': 'Payment Methods',
};

const ComingSoon = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive feature name from pathname
  let featureName = featureNames[location.pathname];
  if (!featureName && location.pathname.includes('/ai')) {
    featureName = 'AI Twin Advisor';
  }
  if (!featureName) {
    featureName = 'This Feature';
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Animated Stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-accent rounded-full animate-twinkle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: 0.3 + Math.random() * 0.7,
              }}
            />
          ))}
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blood-vibrant/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blood-dark/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

        <div className="relative z-10 text-center px-4 py-16 max-w-lg mx-auto">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary/50 border border-border mb-8">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-accent" />
              <Clock className="w-4 h-4 text-muted-foreground absolute -bottom-1 -right-1" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-4 text-foreground">
            Coming Soon
          </h1>

          {/* Feature Name */}
          <p className="text-lg text-accent font-medium mb-3">
            {featureName}
          </p>

          {/* Description */}
          <p className="text-muted-foreground mb-8 leading-relaxed">
            We're working hard to bring this feature to life. Stay tuned for updates as we continue to build and improve Cosmiclly.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            <Button asChild className="gap-2">
              <Link to="/">
                <Home className="w-4 h-4" />
                Return Home
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ComingSoon;
