import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Search, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileMenu } from './MobileMenu';
import { SearchModal } from '@/components/modals/SearchModal';
import { AuthModal } from '@/components/modals/AuthModal';

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const handleAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-accent" />
              <span className="font-heading text-xl md:text-2xl font-semibold text-gradient-gold">
                Mystica
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/advisors" className="text-foreground/80 hover:text-primary transition-colors">
                Psychic Readings
              </Link>
              <Link to="/advisors?category=tarot" className="text-foreground/80 hover:text-primary transition-colors">
                Tarot
              </Link>
              <Link to="/advisors?category=astrology" className="text-foreground/80 hover:text-primary transition-colors">
                Astrology
              </Link>
              <Link to="/advisors?category=love" className="text-foreground/80 hover:text-primary transition-colors">
                Love & Relationships
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-foreground/70 hover:text-primary transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => handleAuth('signin')}
                className="hidden md:flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors"
              >
                <User className="w-5 h-5" />
                <span>Sign In</span>
              </button>

              <Button 
                variant="hero" 
                size="sm"
                onClick={() => handleAuth('signup')}
                className="hidden sm:inline-flex"
              >
                Join Free
              </Button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} mode={authMode} />
    </>
  );
};
