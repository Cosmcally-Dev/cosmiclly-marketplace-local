import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  User,
  Sparkles,
  CreditCard,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  BookOpen,
  Heart,
  Star,
  Zap,
  LayoutGrid,
  Wallet,
  Activity,
  Phone,
  Shield,
  Bell,
  Receipt,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { MobileMenu } from "./MobileMenu";
import { AuthModal } from "@/components/modals/AuthModal";
import { AdvisorApplicationModal } from "@/components/modals/AdvisorApplicationModal";
import { useAuth } from "@/hooks/useAuth";
import { useAdvisorIncomingCalls } from "@/hooks/useAdvisorIncomingCalls";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { categories } from "@/data/categories";


export const Header = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const { user, isAuthenticated, logout, credits } = useAuth();
  const { toast } = useToast();

  // Global advisor notification — only active for advisor users
  const isAdvisor = user?.isAdvisor ?? false;
  const { incomingSessions } = useAdvisorIncomingCalls(isAdvisor ? user?.id : undefined);
  const prevCountRef = useRef(0);

  // Toast notification when new incoming sessions arrive
  useEffect(() => {
    if (!isAdvisor) return;
    const count = incomingSessions.length;
    if (count > prevCountRef.current && prevCountRef.current >= 0) {
      const newest = incomingSessions[0];
      toast({
        title: "Incoming Session",
        description: `${newest?.client_name || 'A client'} is requesting a ${newest?.type || 'session'}`,
        action: (
          <Button size="sm" variant="default" onClick={() => navigate('/advisor-call')}>
            View
          </Button>
        ),
      });
    }
    prevCountRef.current = count;
  }, [incomingSessions, isAdvisor, toast, navigate]);

  const handleAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  // Updated to prioritize Airtable/n8n username
  const getUserInitials = () => {
    if (user?.username) {
      return user.username[0].toUpperCase();
    }
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  // Updated to show the @username returned from the login webhook
  const getDisplayName = () => {
    if (user?.username) {
      return `@${user.username}`;
    }
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return user?.email || "User";
  };

  return (
    <>
      <header className="bg-background/95 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Hamburger Menu Button - Only visible on mobile/tablet */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 min-w-11 min-h-11 flex items-center justify-center text-foreground hover:text-primary transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-0">
              <img src="/cosmiclly-logo.png" alt="Cosmiclly" className="h-9 w-auto object-contain" />
              <span
                className="font-heading font-semibold text-gradient"
                style={{ marginLeft: "-1.1rem", fontSize: "clamp(1.125rem, 2vw, 1.2rem)", lineHeight: "1.4" }}
              >osmiclly</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6" aria-label="Main navigation">
              <DropdownMenu>
                <DropdownMenuTrigger className="font-sans text-sm font-medium text-foreground/80 hover:text-primary transition-colors flex items-center gap-1 outline-none">
                  Explore Advisors
                  <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[520px] p-0 bg-card/95 backdrop-blur-xl border-border/50 z-50 shadow-2xl rounded-xl overflow-hidden">
                  {/* Quick Links Row */}
                  <div className="grid grid-cols-3 gap-px bg-border/30">
                    <DropdownMenuItem
                      onClick={() => navigate("/advisors?filter=featured")}
                      className="flex items-center justify-center gap-2 px-4 py-3 cursor-pointer rounded-none bg-card/95 hover:bg-primary/10 data-[highlighted]:bg-primary/10 transition-colors"
                    >
                      <Star className="w-4 h-4 text-primary" />
                      <span className="font-sans text-sm font-medium text-foreground">Featured</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/advisors?filter=new")}
                      className="flex items-center justify-center gap-2 px-4 py-3 cursor-pointer rounded-none bg-card/95 hover:bg-primary/10 data-[highlighted]:bg-primary/10 transition-colors"
                    >
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="font-sans text-sm font-medium text-foreground">New Advisors</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/advisors")}
                      className="flex items-center justify-center gap-2 px-4 py-3 cursor-pointer rounded-none bg-card/95 hover:bg-primary/10 data-[highlighted]:bg-primary/10 transition-colors"
                    >
                      <LayoutGrid className="w-4 h-4 text-primary" />
                      <span className="font-sans text-sm font-medium text-foreground">All Advisors</span>
                    </DropdownMenuItem>
                  </div>

                  {/* Specialties Section */}
                  <div className="p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-2 mb-2">
                      Browse by Specialty
                    </p>
                    <div className="grid grid-cols-3 gap-0.5">
                      {categories.map((cat) => {
                        const CatIcon = cat.icon;
                        return (
                          <DropdownMenuItem
                            key={cat.slug}
                            onClick={() => navigate(`/advisors?category=${cat.slug}`)}
                            className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer rounded-lg hover:bg-primary/10 data-[highlighted]:bg-primary/10 transition-colors group"
                          >
                            <CatIcon className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-primary group-data-[highlighted]:text-primary transition-colors" />
                            <span className="font-sans text-[13px] text-foreground/80 group-hover:text-foreground group-data-[highlighted]:text-foreground transition-colors truncate">
                              {cat.label}
                            </span>
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer */}
                  <DropdownMenuSeparator className="m-0" />
                  <DropdownMenuItem
                    onClick={() => navigate("/advisors")}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 cursor-pointer rounded-none hover:bg-primary/10 data-[highlighted]:bg-primary/10 transition-colors"
                  >
                    <span className="font-sans text-sm font-medium text-primary">View All Services</span>
                    <ArrowRight className="w-3.5 h-3.5 text-primary" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link
                to="/horoscope"
                className="font-sans text-sm font-medium text-foreground/80 hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <Sun className="w-4 h-4" />
                Horoscope
              </Link>
              <span
                className="font-sans text-sm font-medium text-muted-foreground flex items-center gap-1.5 cursor-default"
                title="Coming Soon"
              >
                <BookOpen className="w-4 h-4" />
                Articles (Coming Soon)
              </span>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Link
                to="/horoscope"
                className="lg:hidden p-2 min-w-11 min-h-11 flex items-center justify-center text-foreground/70 hover:text-primary transition-colors"
                title="Daily Horoscope"
              >
                <Sun className="w-5 h-5" />
              </Link>

              {isAuthenticated ? (
                <>
                {/* Notification bell for advisors */}
                {isAdvisor && incomingSessions.length > 0 && (
                  <button
                    onClick={() => navigate('/advisor-call')}
                    className="p-2 text-foreground/70 hover:text-primary transition-colors"
                    title={`${incomingSessions.length} incoming session(s)`}
                  >
                    <NotificationBadge count={incomingSessions.length}>
                      <Bell className="w-5 h-5 animate-bounce" />
                    </NotificationBadge>
                  </button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1 min-h-11 rounded-full hover:bg-secondary/50 transition-colors outline-none">
                      <Avatar className="w-9 h-9 border-2 border-primary/30">
                        <AvatarImage src={undefined} alt={getDisplayName()} />
                        <AvatarFallback className="bg-primary/20 text-primary font-medium text-sm">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-popover border-border z-50 font-sans shadow-2xl rounded-xl"
                  >
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <p className="text-sm font-medium text-foreground">{getDisplayName()}</p>
                      <p className="text-xs text-muted-foreground">
                        Balance: <span className="text-primary font-medium">${credits}</span>
                      </p>
                    </div>
                    <DropdownMenuItem
                      onClick={() => navigate("/profile")}
                      className="cursor-pointer flex items-center gap-2 p-2.5"
                    >
                      <User className="w-4 h-4" />
                      My Dashboard
                    </DropdownMenuItem>
                    {!user?.isAdvisor && (
                      <DropdownMenuItem
                        onClick={() => navigate("/activity")}
                        className="cursor-pointer flex items-center gap-2 p-2.5"
                      >
                        <Activity className="w-4 h-4" />
                        My Activity
                      </DropdownMenuItem>
                    )}
                    {!user?.isAdvisor && (
                      <DropdownMenuItem
                        onClick={() => navigate("/favorites")}
                        className="cursor-pointer flex items-center gap-2 p-2.5"
                      >
                        <Heart className="w-4 h-4" />
                        Favorite Advisors
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => navigate("/add-credit")}
                      className="cursor-pointer flex items-center gap-2 p-2.5"
                    >
                      <Wallet className="w-4 h-4" />
                      Add Funds
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/transactions")}
                      className="cursor-pointer flex items-center gap-2 p-2.5"
                    >
                      <Receipt className="w-4 h-4" />
                      Transaction History
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/payment-methods")}
                      className="cursor-pointer flex items-center gap-2 p-2.5"
                    >
                      <CreditCard className="w-4 h-4" />
                      Payment Methods
                    </DropdownMenuItem>
                    {user?.isAdvisor && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => navigate("/advisor-call")}
                          className="cursor-pointer flex items-center gap-2 p-2.5"
                        >
                          <Phone className="w-4 h-4" />
                          Advisor Dashboard
                          {incomingSessions.length > 0 && (
                            <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {incomingSessions.length}
                            </span>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate("/advisor-activity")}
                          className="cursor-pointer flex items-center gap-2 p-2.5"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Advisor Activity
                        </DropdownMenuItem>
                      </>
                    )}
                    {user?.isAdmin && (
                      <DropdownMenuItem
                        onClick={() => navigate("/admin")}
                        className="cursor-pointer flex items-center gap-2 p-2.5"
                      >
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate("/settings")}
                      className="cursor-pointer flex items-center gap-2 p-2.5"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2 p-2.5"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAuth("signin")}
                    className="inline-flex text-xs font-sans"
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={() => handleAuth("signup")}
                    className="text-xs px-3 h-9 sm:h-8 font-sans"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onAuth={handleAuth}
        isAuthenticated={isAuthenticated}
      />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} mode={authMode} />
      <AdvisorApplicationModal isOpen={isApplicationOpen} onClose={() => setIsApplicationOpen(false)} />
    </>
  );
};
