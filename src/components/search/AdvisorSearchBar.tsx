import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { advisors } from '@/data/advisors';
import { categories } from '@/data/categories';

interface AdvisorSearchBarProps {
  variant?: 'hero' | 'compact';
  initialQuery?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

interface SearchResult {
  type: 'advisor' | 'category' | 'specialty';
  id: string;
  name: string;
  subtitle?: string;
  avatar?: string;
  url: string;
}

export const AdvisorSearchBar = ({
  variant = 'hero',
  initialQuery = '',
  onSearch,
  placeholder = 'Find your perfect advisor...',
  className = '',
}: AdvisorSearchBarProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get unique specialties from all advisors
  const allSpecialties = useMemo(() => {
    const specialtySet = new Set<string>();
    advisors.forEach(advisor => {
      advisor.specialties.forEach(s => specialtySet.add(s));
    });
    return Array.from(specialtySet);
  }, []);

  // Generate search results based on query
  const searchResults = useMemo((): SearchResult[] => {
    if (!query.trim() || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search advisors by name
    const matchingAdvisors = advisors
      .filter(advisor => 
        advisor.name.toLowerCase().includes(lowerQuery) ||
        advisor.title.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 4)
      .map(advisor => ({
        type: 'advisor' as const,
        id: advisor.id,
        name: advisor.name,
        subtitle: advisor.title,
        avatar: advisor.avatar,
        url: `/advisor/${advisor.id}`,
      }));

    results.push(...matchingAdvisors);

    // Search categories
    const matchingCategories = categories
      .filter(cat => 
        cat.label.toLowerCase().includes(lowerQuery) ||
        cat.shortDescription.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .map(cat => ({
        type: 'category' as const,
        id: cat.slug,
        name: cat.label,
        subtitle: `Browse ${cat.label} advisors`,
        url: `/advisors?category=${cat.slug}`,
      }));

    results.push(...matchingCategories);

    // Search specialties
    const matchingSpecialties = allSpecialties
      .filter(s => s.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .map(specialty => ({
        type: 'specialty' as const,
        id: specialty,
        name: specialty,
        subtitle: `Find advisors specializing in ${specialty}`,
        url: `/advisors?search=${encodeURIComponent(specialty)}`,
      }));

    results.push(...matchingSpecialties);

    return results.slice(0, 8);
  }, [query, allSpecialties]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults]);

  const handleSearch = () => {
    setIsOpen(false);
    if (onSearch) {
      onSearch(query.trim());
    } else if (query.trim()) {
      navigate(`/advisors?search=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/advisors');
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    navigate(result.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        handleResultClick(searchResults[selectedIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const isHero = variant === 'hero';

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground ${isHero ? 'w-5 h-5' : 'w-4 h-4'}`} />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className={`w-full bg-card/80 backdrop-blur-sm border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
            isHero 
              ? 'h-14 pl-12 pr-36 rounded-full' 
              : 'h-10 pl-10 pr-20 rounded-lg text-sm'
          }`}
        />
        {query && (
          <button
            onClick={clearSearch}
            className={`absolute top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors ${
              isHero ? 'right-32' : 'right-20'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <Button
          variant={isHero ? 'hero' : 'default'}
          size={isHero ? 'default' : 'sm'}
          className={`absolute top-1/2 -translate-y-1/2 ${isHero ? 'right-2 rounded-full' : 'right-1 rounded-md'}`}
          onClick={handleSearch}
        >
          {isHero ? 'Find Advisor' : 'Search'}
        </Button>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && searchResults.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
        >
          <div className="p-2">
            {searchResults.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  selectedIndex === index 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-secondary text-foreground'
                }`}
              >
                {result.type === 'advisor' && result.avatar ? (
                  <img 
                    src={result.avatar} 
                    alt={result.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : result.type === 'category' ? (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{result.name}</p>
                  {result.subtitle && (
                    <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground capitalize px-2 py-1 bg-secondary rounded-full">
                  {result.type}
                </span>
              </button>
            ))}
          </div>
          
          {/* Search all results footer */}
          <div className="border-t border-border p-2">
            <button
              onClick={handleSearch}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              Search all for "{query}"
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
