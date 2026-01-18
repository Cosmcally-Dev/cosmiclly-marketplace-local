import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles, Calendar, BookOpen, HelpCircle, UserCheck, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { categories } from '@/data/categories';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const bottomLinks = [
  { icon: Calendar, label: 'Horoscopes', href: '/horoscope' },
  { icon: BookOpen, label: 'Articles', href: '/#articles' },
  { icon: HelpCircle, label: 'Customer Support', href: '/#support' },
  { icon: UserCheck, label: 'Become an Advisor', href: '/#apply' },
];

export const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const [isServicesExpanded, setIsServicesExpanded] = useState(true);

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
            {/* All Advisors Link */}
            <Link
              to="/advisors"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-foreground font-medium hover:bg-secondary hover:text-primary transition-colors"
            >
              <span>All Advisors</span>
            </Link>

            {/* Services Section */}
            <div className="mt-2">
              <button
                onClick={() => setIsServicesExpanded(!isServicesExpanded)}
                className="flex items-center justify-between w-full px-4 py-3 text-foreground font-medium hover:bg-secondary transition-colors"
              >
                <span>Explore Services</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isServicesExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isServicesExpanded && (
                <div className="bg-secondary/30">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      to={`/advisors?category=${category.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-3 px-6 py-2.5 text-foreground/80 hover:bg-secondary hover:text-primary transition-colors group"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                        <category.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="flex-1 text-sm">{category.label}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

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
