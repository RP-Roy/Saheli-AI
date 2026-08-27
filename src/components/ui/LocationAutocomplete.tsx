import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import { geocodingService, type GeocodingResult } from '../../services/geocodingService';

export interface LocationAutocompleteProps {
  onSelect: (result: GeocodingResult | null) => void;
  userLocation?: { lat: number; lng: number } | null;
  placeholder?: string;
  initialQuery?: string;
}

export function LocationAutocomplete({ onSelect, userLocation, placeholder = 'Search destination', initialQuery = '' }: LocationAutocompleteProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSelected, setIsSelected] = useState(!!initialQuery);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<number | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    if (isSelected) return; // Don't search if we just selected a suggestion

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
    }, 400);

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
    <div className="relative" ref={containerRef}>
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-safe-400">
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
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
          if (suggestions.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        className="w-full bg-surface-800 border border-white/10 rounded-xl py-3 pl-11 pr-10 text-white focus:outline-none focus:border-primary-500 transition-colors"
      />
      
      {query && (
        <button 
          type="button" 
          onClick={handleClear}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-surface-800 border border-white/10 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {error ? (
            <div className="p-4 text-sm text-danger-400">{error}</div>
          ) : suggestions.length === 0 && query.length >= 3 && !isLoading ? (
            <div className="p-4 text-sm text-slate-400">No destinations found</div>
          ) : (
            <ul>
              {suggestions.map((result, index) => (
                <li
                  key={result.placeId}
                  onClick={() => handleSelect(result)}
                  className={`px-4 py-3 cursor-pointer flex items-start gap-3 transition-colors ${
                    index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-semibold text-white truncate">{result.name}</span>
                    <span className="text-xs text-slate-400 truncate">{result.address}</span>
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
