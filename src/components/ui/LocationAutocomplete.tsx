import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Loader2, Navigation } from 'lucide-react';
import { geocodingService, type GeocodingResult } from '../../services/geocodingService';
import { cn } from '../../utils/formatters';

export interface LocationAutocompleteProps {
  onSelect: (result: GeocodingResult | null) => void;
  userLocation?: { lat: number; lng: number } | null;
  placeholder?: string;
  initialQuery?: string;
  className?: string;
}

export function LocationAutocomplete({
  onSelect,
  userLocation,
  placeholder = 'Search destination or landmark...',
  initialQuery = '',
  className,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSelected, setIsSelected] = useState(!!initialQuery);
  const [isFocused, setIsFocused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<number | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    if (isSelected) return;

    if (!query || query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
    }

    setIsLoading(true);
    setError(null);

    debounceTimer.current = window.setTimeout(async () => {
      try {
        const results = await geocodingService.searchDestinations(query, userLocation || undefined);
        setSuggestions(results);
        setIsOpen(true);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch suggestions');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => {
      if (debounceTimer.current) {
        window.clearTimeout(debounceTimer.current);
      }
    };
  }, [query, userLocation, isSelected]);

  const handleSelect = (result: GeocodingResult) => {
    setQuery(result.name);
    setIsSelected(true);
    setIsOpen(false);
    setIsFocused(false);
    onSelect(result);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsSelected(false);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <div
        className={cn(
          'relative flex items-center bg-white rounded-2xl border transition-all duration-250 shadow-card',
          isFocused
            ? 'border-primary-400 ring-2 ring-primary-200/60 shadow-card-hover -translate-y-0.5'
            : 'border-pink-200/70 hover:border-primary-300'
        )}
      >
        <div className="pl-4 pr-2 text-primary-500 flex items-center justify-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
          ) : (
            <Search className="w-5 h-5 text-primary-500" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsSelected(false);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent py-3.5 pr-10 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-pink-50 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-md border border-pink-200/80 rounded-2xl shadow-card-hover overflow-hidden max-h-64 overflow-y-auto animate-slide-up">
          {error ? (
            <div className="p-4 text-xs font-semibold text-rose-600 bg-rose-50/50">{error}</div>
          ) : suggestions.length === 0 && query.length >= 3 && !isLoading ? (
            <div className="p-4 text-xs font-medium text-slate-500 text-center">No destination matches found</div>
          ) : (
            <ul className="divide-y divide-pink-50/80 py-1">
              {suggestions.map((result, index) => (
                <li
                  key={result.placeId || `${result.lat}-${result.lon}-${index}`}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    'px-4 py-3 cursor-pointer flex items-start gap-3 transition-colors duration-150',
                    index === selectedIndex ? 'bg-primary-50 text-primary-900' : 'hover:bg-pink-50/70 text-slate-800'
                  )}
                >
                  <div className="w-7 h-7 rounded-xl bg-primary-100/70 text-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{result.name}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{result.address}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
