import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdvisors } from '@/hooks/useAdvisors';

interface AdvisorSearchBarProps {
  variant?: 'hero' | 'compact';
  initialQuery?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

interface SearchResult {
  type: 'advisor';
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
  const { advisors } = useAdvisors();
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Generate search results based on query — advisors only
  const searchResults = useMemo((): SearchResult[] => {
    if (!query.trim() || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();

    return advisors
      .filter(advisor =>
        advisor.name.toLowerCase().includes(lowerQuery) ||
        advisor.title.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 8)
      .map(advisor => ({
        type: 'advisor' as const,
        id: advisor.id,
        name: advisor.name,
        subtitle: advisor.title,
        avatar: advisor.avatar,
        url: `/advisor/${advisor.id}`,
      }));
  }, [query, advisors]);

  // Track wrapper position for portal dropdown
  useEffect(() => {
    const updateRect = () => {
      if (wrapperRef.current) {
        setDropdownRect(wrapperRef.current.getBoundingClientRect());
      }
    };
    if (isOpen) {
      updateRect();
      window.addEventListener('scroll', updateRect, true);
      window.addEventListener('resize', updateRect);
    }
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [isOpen]);

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
    <div ref={wrapperRef} className={`relative ${className}`}>
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

      {/* Autocomplete Dropdown — rendered via portal to escape stacking contexts */}
      {isOpen && searchResults.length > 0 && dropdownRect && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownRect.bottom + 8,
            left: dropdownRect.left,
            width: dropdownRect.width,
            zIndex: 9999,
          }}
          className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="p-2">
            {searchResults.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  selectedIndex === index
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'hover:bg-cyan-500/10 hover:text-cyan-400 text-foreground'
                }`}
              >
                <img
                  src={result.avatar}
                  alt={result.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{result.name}</p>
                  {result.subtitle && (
                    <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                  )}
                </div>
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
        </div>,
        document.body
      )}
    </div>
  );
};
