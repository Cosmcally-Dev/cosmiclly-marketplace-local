import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, Sparkles, CreditCard, Settings, LogOut, ChevronDown, Sun, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileMenu } from './MobileMenu';
import { AuthModal } from '@/components/modals/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { categories } from '@/data/categories';
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
      <header className="bg-background/95 backdrop-blur-xl border-b border-border">
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
              {/* Specialties Dropdown - Click to Open */}
              <DropdownMenu>
                <DropdownMenuTrigger className="font-sans text-sm font-medium text-foreground/80 hover:text-accent transition-colors flex items-center gap-1 outline-none">
                  Specialties
                  <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className="w-64 max-h-[70vh] overflow-y-auto bg-popover border-border z-50 shadow-2xl rounded-xl"
                >
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <DropdownMenuItem
                        key={category.slug}
                        onClick={() => navigate(`/advisors?category=${category.slug}`)}
                        className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-primary/10 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <IconComponent className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className="font-sans text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {category.label}
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              
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
