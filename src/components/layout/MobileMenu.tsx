import { Link } from 'react-router-dom';
import { X, Sparkles, Star, Heart, Moon, Sun, Eye, Hand, TrendingUp, Ghost, Calendar, BookOpen, HelpCircle, UserCheck, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: Eye, label: 'Psychic Readings', href: '/advisors' },
  { icon: Sun, label: 'Astrology Readings', href: '/advisors?category=astrology' },
  { icon: Star, label: 'Numerology', href: '/advisors?category=numerology' },
  { icon: Sparkles, label: 'Tarot Readings', href: '/advisors?category=tarot' },
  { icon: Moon, label: 'Dream Analysis', href: '/advisors?category=dreams' },
  { icon: Hand, label: 'Palm Readings', href: '/advisors?category=palm' },
  { icon: Heart, label: 'Love Psychics', href: '/advisors?category=love' },
  { icon: Star, label: 'Fortune Telling', href: '/advisors?category=fortune' },
  { icon: TrendingUp, label: 'Career Forecasts', href: '/advisors?category=career' },
  { icon: Ghost, label: 'Psychic Mediums', href: '/advisors?category=mediums' },
  { icon: Calendar, label: 'Horoscopes', href: '/horoscope' },
  { icon: BookOpen, label: 'Articles', href: '/#articles' },
];

const bottomLinks = [
  { icon: HelpCircle, label: 'Customer Support', href: '/#support' },
  { icon: UserCheck, label: 'Become an Advisor', href: '/#apply' },
];

export const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-card z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link to="/" onClick={onClose} className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-accent" />
              <span className="font-heading text-lg font-semibold text-gradient-gold">Mystica</span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-foreground/70 hover:text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 text-foreground/80 hover:bg-secondary hover:text-primary transition-colors group"
                  >
                    <item.icon className="w-5 h-5 text-accent group-hover:text-primary transition-colors" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="h-px bg-border my-4 mx-4" />

            <ul className="space-y-1">
              {bottomLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors group"
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-3">
            <Button variant="hero" className="w-full">
              Join Free
            </Button>
            <Button variant="outline" className="w-full">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
