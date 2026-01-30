import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, Sparkles, BookOpen, HelpCircle, UserCheck, ChevronRight, ChevronDown, 
  Star, Heart, CreditCard, History, Shield, Layers, Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { categories } from '@/data/categories';
import { Badge } from '@/components/ui/badge';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { 
    icon: Layers, 
    label: 'Specialties', 
    href: '/advisors',
    isExpandable: true 
  },
  { 
    icon: Sun, 
    label: 'Daily Horoscope', 
    href: '/horoscope' 
  },
  { 
    icon: Star, 
    label: 'Daily Oracle', 
    href: '/daily-oracle',
    badge: 'New'
  },
  { 
    icon: History, 
    label: 'My Activity', 
    href: '/settings' 
  },
  { 
    icon: Heart, 
    label: 'Favorite Advisors', 
    href: '/settings?tab=favorites' 
  },
  { 
    icon: CreditCard, 
    label: 'Add Funds', 
    href: '/add-credit' 
  },
  { 
    icon: BookOpen, 
    label: 'Articles', 
    href: '/articles' 
  },
  { 
    icon: HelpCircle, 
    label: 'Customer Support', 
    href: '/support' 
  },
  { 
    icon: Shield, 
    label: 'How We Verify Advisors', 
    href: '/support#verification' 
  },
  { 
    icon: UserCheck, 
    label: 'Psychic Apply Here', 
    href: '/#apply' 
  },
];

export const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const [isSpecialtiesExpanded, setIsSpecialtiesExpanded] = useState(false);

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
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="font-heading text-lg font-semibold text-gradient">Mystica</span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 min-w-11 min-h-11 flex items-center justify-center text-foreground/70 hover:text-primary transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-2">
            <ul className="space-y-0.5">
              {menuItems.map((item) => (
                <li key={item.label}>
                  {item.isExpandable ? (
                    <div>
                      <button
                        onClick={() => setIsSpecialtiesExpanded(!isSpecialtiesExpanded)}
                        className="flex items-center justify-between w-full px-4 py-3 min-h-11 text-foreground hover:bg-secondary transition-colors font-sans"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isSpecialtiesExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isSpecialtiesExpanded && (
                        <div className="bg-secondary/30 py-1">
                          {categories.map((category) => (
                            <Link
                              key={category.slug}
                              to={`/advisors?category=${category.slug}`}
                              onClick={onClose}
                              className="flex items-center gap-3 px-6 py-2.5 min-h-11 text-foreground/80 hover:bg-secondary hover:text-primary transition-colors group font-sans"
                            >
                              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                                <category.icon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <span className="flex-1 text-sm">{category.label}</span>
                              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 min-h-11 text-foreground hover:bg-secondary transition-colors font-sans"
                    >
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                      <span className="flex-1 font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs font-sans">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-3">
            <Button variant="hero" className="w-full font-sans">
              Join Free
            </Button>
            <Button variant="outline" className="w-full font-sans">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
