import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, Sparkles, CreditCard, Settings, LogOut, ChevronDown, Sun, BookOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileMenu } from './MobileMenu';
import { AuthModal } from '@/components/modals/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const { user, isAuthenticated, logout, credits } = useAuth();

  const handleAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleSignOut = () => {
    logout();
  };

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Hamburger Menu Button - Only visible on mobile/tablet */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 min-w-11 min-h-11 flex items-center justify-center text-foreground hover:text-accent transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-accent" />
              <span className="font-heading text-lg md:text-xl font-semibold text-gradient-gold">
                Mystica
              </span>
            </Link>

            {/* Desktop Navigation - Hidden on mobile/tablet */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link
                to="/advisors"
                className="font-sans text-sm font-medium text-foreground/80 hover:text-accent transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-4 h-4" />
                Specialties
              </Link>
              <Link
                to="/horoscope"
                className="font-sans text-sm font-medium text-foreground/80 hover:text-accent transition-colors flex items-center gap-1.5"
              >
                <Sun className="w-4 h-4" />
                Horoscope
              </Link>
              <Link
                to="/articles"
                className="font-sans text-sm font-medium text-foreground/80 hover:text-accent transition-colors flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" />
                Articles
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Horoscope Link - Mobile only (since it's in desktop nav) */}
              <Link
                to="/horoscope"
                className="lg:hidden p-2 min-w-11 min-h-11 flex items-center justify-center text-foreground/70 hover:text-accent transition-colors"
                title="Daily Horoscope"
              >
                <Sun className="w-5 h-5" />
              </Link>
              
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2 py-1.5 min-h-11 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors font-sans">
                      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-accent" />
                      </div>
                      <span className="hidden md:block text-sm font-medium text-foreground max-w-[100px] truncate">
                        {user?.name || user?.email}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border z-50 font-sans">
                    <div className="px-2 py-1.5 text-sm font-medium text-foreground border-b border-border mb-1">
                      Balance: <span className="text-primary">${credits}</span>
                    </div>
                    <DropdownMenuItem onClick={() => navigate('/add-credit')} className="cursor-pointer">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Add Credit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  {/* Desktop: Show both Sign In and Join */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleAuth('signin')}
                    className="hidden lg:inline-flex text-xs font-sans"
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="hero" 
                    size="sm"
                    onClick={() => handleAuth('signup')}
                    className="text-xs px-3 h-8 font-sans"
                  >
                    Join Free
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} mode={authMode} />
    </>
  );
};
