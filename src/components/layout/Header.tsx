import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, User, Sparkles, CreditCard, Settings, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileMenu } from './MobileMenu';
import { SearchModal } from '@/components/modals/SearchModal';
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

export const Header = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const { user, isAuthenticated, logout, credits } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleSignOut = () => {
    logout();
  };

  // Featured categories for the mega menu (first 8)
  const featuredCategories = categories.slice(0, 8);
  // More categories
  const moreCategories = categories.slice(8);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-foreground hover:text-accent transition-colors"
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
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/advisors" className="px-4 py-2 text-foreground/80 hover:text-accent transition-colors">
                    All Advisors
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-foreground/80 hover:text-accent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent">
                    Services
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[600px] p-4 bg-card border border-border rounded-lg shadow-xl">
                      <div className="mb-4">
                        <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                          Explore Our Services
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Choose from a wide range of psychic services to find the guidance you seek
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {featuredCategories.map((category) => (
                          <NavigationMenuLink key={category.slug} asChild>
                            <Link
                              to={`/advisors?category=${category.slug}`}
                              className="group flex items-start gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                            >
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                                <category.icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                  {category.label}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {category.shortDescription}
                                </p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        ))}
                      </div>

                      {moreCategories.length > 0 && (
                        <>
                          <div className="border-t border-border my-4" />
                          <div className="flex flex-wrap gap-2">
                            {moreCategories.map((category) => (
                              <Link
                                key={category.slug}
                                to={`/advisors?category=${category.slug}`}
                                className="px-3 py-1.5 text-sm rounded-full bg-secondary text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
                              >
                                {category.label}
                              </Link>
                            ))}
                          </div>
                        </>
                      )}

                      <div className="border-t border-border mt-4 pt-4">
                        <Link
                          to="/advisors"
                          className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          View All Services
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/daily-oracle" className="px-4 py-2 text-foreground/80 hover:text-accent transition-colors">
                    Daily Oracle
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/articles" className="px-4 py-2 text-foreground/80 hover:text-accent transition-colors">
                    Articles
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/horoscope" className="px-4 py-2 text-foreground/80 hover:text-accent transition-colors">
                    Horoscopes
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-foreground/70 hover:text-accent transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-accent" />
                      </div>
                      <span className="hidden md:block text-sm font-medium text-foreground">
                        {user?.name || user?.email}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border z-50">
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
                  <button
                    onClick={() => handleAuth('signin')}
                    className="hidden md:flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors"
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
                </>
              )}
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
