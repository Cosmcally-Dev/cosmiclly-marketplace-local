import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, User, Sparkles, CreditCard, Settings, LogOut, ChevronDown, Sun, BookOpen,
  Heart, Star, Compass, Users, Flame, ScrollText, Zap, Moon, DollarSign, 
  Layers, Feather, Waves, LayoutGrid, Wallet, Activity, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileMenu } from './MobileMenu';
import { AuthModal } from '@/components/modals/AuthModal';
import { AdvisorApplicationModal } from '@/components/modals/AdvisorApplicationModal';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

// Explore Advisors menu items with icons (removed NEW Advisors from specialties submenu)
const exploreMenuItems = [
  { label: 'Psychic Readings', icon: Sparkles, slug: 'psychic-readings' },
  { label: 'Love & Relationships', icon: Heart, slug: 'love-relationships' },
  { label: 'Life Path & Advice', icon: Compass, slug: 'life-path' },
  { label: 'Psychic Mediums', icon: Users, slug: 'psychic-mediums' },
  { label: 'Spiritual Readings', icon: Flame, slug: 'spiritual-readings' },
  { label: 'Tarot Card Readings', icon: ScrollText, slug: 'tarot-readings' },
  { label: 'Astrology Readings', icon: Star, slug: 'astrology' },
  { label: 'Dream Interpretation', icon: Moon, slug: 'dream-interpretation' },
  { label: 'Financial Guidance', icon: DollarSign, slug: 'financial-guidance' },
  { label: 'Cartomancy Readings', icon: Layers, slug: 'cartomancy' },
  { label: 'Angel Readings', icon: Feather, slug: 'angel-readings' },
  { label: 'Aura Cleansing', icon: Waves, slug: 'aura-cleansing' },
];

export const Header = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const { user, isAuthenticated, logout, credits } = useAuth();

  const handleAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleSignOut = () => {
    logout();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
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
              <Sparkles className="w-7 h-7 text-primary" />
              <span className="font-heading text-lg md:text-xl font-semibold text-gradient">
                Mystica
              </span>
            </Link>

            {/* Desktop Navigation - Hidden on mobile/tablet */}
            <nav className="hidden lg:flex items-center gap-6">
              {/* Explore Advisors Dropdown - Click to Open */}
              <DropdownMenu>
                <DropdownMenuTrigger className="font-sans text-sm font-medium text-foreground/80 hover:text-accent transition-colors flex items-center gap-1 outline-none">
                  Explore Advisors
                  <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className="w-56 bg-popover border-border z-50 shadow-2xl rounded-xl"
                >
                  {/* Featured Advisors */}
                  <DropdownMenuItem
                    onClick={() => navigate('/advisors?filter=featured')}
                    className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-primary data-[highlighted]:bg-primary group"
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 group-data-[highlighted]:bg-primary/20 transition-colors">
                      <Star className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground group-data-[highlighted]:text-primary-foreground transition-colors" />
                    </div>
                    <span className="font-sans text-sm font-medium text-foreground group-hover:text-primary-foreground group-data-[highlighted]:text-primary-foreground transition-colors">
                      Featured Advisors
                    </span>
                  </DropdownMenuItem>

                  {/* NEW Advisors */}
                  <DropdownMenuItem
                    onClick={() => navigate('/advisors?filter=new')}
                    className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-primary data-[highlighted]:bg-primary group"
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 group-data-[highlighted]:bg-primary/20 transition-colors">
                      <Zap className="w-4 h-4 text-foreground group-hover:text-primary-foreground group-data-[highlighted]:text-primary-foreground transition-colors" />
                    </div>
                    <span className="font-sans text-sm font-medium text-foreground group-hover:text-primary-foreground group-data-[highlighted]:text-primary-foreground transition-colors">
                      NEW Advisors
                    </span>
                  </DropdownMenuItem>

                  {/* All Advisors */}
                  <DropdownMenuItem
                    onClick={() => navigate('/advisors')}
                    className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-primary data-[highlighted]:bg-primary group"
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 group-data-[highlighted]:bg-primary/20 transition-colors">
                      <LayoutGrid className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground group-data-[highlighted]:text-primary-foreground transition-colors" />
                    </div>
                    <span className="font-sans text-sm font-medium text-foreground group-hover:text-primary-foreground group-data-[highlighted]:text-primary-foreground transition-colors">
                      All Advisors
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Specialties Sub-Menu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-primary data-[state=open]:bg-primary data-[highlighted]:bg-primary group">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 group-data-[state=open]:bg-primary/20 group-data-[highlighted]:bg-primary/20 transition-colors">
                        <Compass className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground group-data-[state=open]:text-primary-foreground group-data-[highlighted]:text-primary-foreground transition-colors" />
                      </div>
                      <span className="font-sans text-sm font-medium text-foreground group-hover:text-primary-foreground group-data-[state=open]:text-primary-foreground group-data-[highlighted]:text-primary-foreground transition-colors">
                        Specialties
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-64 max-h-[60vh] overflow-y-auto bg-popover border-border shadow-2xl rounded-xl">
                      {exploreMenuItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <DropdownMenuItem
                            key={item.slug}
                            onClick={() => navigate(`/advisors?category=${item.slug}`)}
                            className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-primary data-[highlighted]:bg-primary group"
                          >
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 group-data-[highlighted]:bg-primary/20 transition-colors">
                              <IconComponent className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground group-data-[highlighted]:text-primary-foreground transition-colors" />
                            </div>
                            <span className="font-sans text-sm font-medium text-foreground group-hover:text-primary-foreground group-data-[highlighted]:text-primary-foreground transition-colors">
                              {item.label}
                            </span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Link
                to="/horoscope"
                className="font-sans text-sm font-medium text-foreground/80 hover:text-accent transition-colors flex items-center gap-1.5"
              >
                <Sun className="w-4 h-4" />
                Horoscope
              </Link>
              <span
                className="font-sans text-sm font-medium text-muted-foreground flex items-center gap-1.5 cursor-not-allowed"
                title="Coming Soon"
              >
                <BookOpen className="w-4 h-4" />
                Articles (Coming Soon)
              </span>
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
                    <button className="flex items-center gap-2 p-1 min-h-11 rounded-full hover:bg-secondary/50 transition-colors">
                      <Avatar className="w-9 h-9 border-2 border-primary/30">
                        <AvatarImage src={undefined} alt={user?.name || 'User'} />
                        <AvatarFallback className="bg-accent/20 text-accent font-medium text-sm">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-popover border-border z-50 font-sans shadow-2xl rounded-xl">
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <p className="text-sm font-medium text-foreground">{user?.name || user?.email}</p>
                      <p className="text-xs text-muted-foreground">Balance: <span className="text-primary font-medium">${credits}</span></p>
                    </div>
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer flex items-center gap-2 p-2.5">
                      <User className="w-4 h-4" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/activity')} className="cursor-pointer flex items-center gap-2 p-2.5">
                      <Activity className="w-4 h-4" />
                      My Activity
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/favorites')} className="cursor-pointer flex items-center gap-2 p-2.5">
                      <Heart className="w-4 h-4" />
                      Favorite Advisors
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/add-credit')} className="cursor-pointer flex items-center gap-2 p-2.5">
                      <Wallet className="w-4 h-4" />
                      Add Funds
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/payment-methods')} className="cursor-pointer flex items-center gap-2 p-2.5">
                      <CreditCard className="w-4 h-4" />
                      Payment Methods
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer flex items-center gap-2 p-2.5">
                      <Settings className="w-4 h-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2 p-2.5">
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  {/* Desktop: Show both Sign In and Apply Now */}
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
                    onClick={() => setIsApplicationOpen(true)}
                    className="text-xs px-3 h-8 font-sans"
                  >
                    Apply Now
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} mode={authMode} />
      <AdvisorApplicationModal isOpen={isApplicationOpen} onClose={() => setIsApplicationOpen(false)} />
    </>
  );
};
