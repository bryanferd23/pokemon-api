'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  X, 
  Filter, 
  SortAsc, 
  SortDesc,
  Loader2,
  History,
  Clock
} from 'lucide-react';
import { SearchFilters, Pokemon } from '@/lib/types/pokemon';
import { TYPE_COLORS } from '@/lib/types/pokemon';
import { cn } from '@/lib/utils';
import { searchPokemon } from '@/lib/api/pokemon';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFiltersChange: (filters: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
  isLoading?: boolean;
  className?: string;
  showAutocomplete?: boolean;
  maxAutocompleteResults?: number;
  onPokemonSelect?: (pokemon: Pokemon) => void;
}

const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

const SORT_OPTIONS = [
  { value: 'id', label: 'ID' },
  { value: 'name', label: 'Name' },
  { value: 'height', label: 'Height' },
  { value: 'weight', label: 'Weight' },
];

export function SearchBar({
  onSearch,
  onFiltersChange,
  placeholder = "Search Pokemon by name or ID...",
  showFilters = true,
  isLoading = false,
  className,
  showAutocomplete = true,
  maxAutocompleteResults = 8,
  onPokemonSelect
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<Pokemon[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autocompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('pokemon-search-history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveToHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setSearchHistory(prevHistory => {
      const newHistory = [searchQuery, ...prevHistory.filter(h => h !== searchQuery)].slice(0, 10);
      localStorage.setItem('pokemon-search-history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // Debounce search query
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query]);

  // Autocomplete search with debouncing
  useEffect(() => {
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current);
    }

    if (!query.trim() || query.length < 2) {
      setAutocompleteResults([]);
      setShowDropdown(false);
      return;
    }

    autocompleteTimeoutRef.current = setTimeout(async () => {
      if (showAutocomplete) {
        setIsAutocompleteLoading(true);
        try {
          const results = await searchPokemon(query);
          setAutocompleteResults(results.slice(0, maxAutocompleteResults));
          setShowDropdown(results.length > 0);
        } catch (error) {
          console.error('Autocomplete error:', error);
          setAutocompleteResults([]);
          setShowDropdown(false);
        } finally {
          setIsAutocompleteLoading(false);
        }
      }
    }, 500);

    return () => {
      if (autocompleteTimeoutRef.current) {
        clearTimeout(autocompleteTimeoutRef.current);
      }
    };
  }, [query, showAutocomplete, maxAutocompleteResults]);

  // Call onSearch when debounced query changes
  useEffect(() => {
    onSearch(debouncedQuery);
    if (debouncedQuery) {
      saveToHistory(debouncedQuery);
    }
  }, [debouncedQuery, onSearch, saveToHistory]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    onFiltersChange(newFilters);
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setAutocompleteResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    onSearch('');
    searchInputRef.current?.focus();
  }, []);

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {};
    setFilters(clearedFilters);
    handleFilterChange(clearedFilters);
  };

  const toggleSortOrder = () => {
    const newOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
    handleFilterChange({ ...filters, sortOrder: newOrder });
  };

  const handleTypeFilter = (type: string) => {
    const newFilters = {
      ...filters,
      type: filters.type === type ? undefined : type
    };
    handleFilterChange(newFilters);
  };

  const handleSortChange = (sortBy: SearchFilters['sortBy']) => {
    handleFilterChange({ 
      ...filters, 
      sortBy,
      sortOrder: filters.sortOrder || 'asc'
    });
  };

  // Handle autocomplete selection
  const handleAutocompleteSelect = useCallback((pokemon: Pokemon) => {
    setQuery(pokemon.name);
    setDebouncedQuery(pokemon.name);
    setShowDropdown(false);
    setSelectedIndex(-1);
    saveToHistory(pokemon.name);
    onPokemonSelect?.(pokemon);
    searchInputRef.current?.blur();
  }, [onPokemonSelect, saveToHistory]);

  // Handle search history selection
  const handleHistorySelect = useCallback((historyQuery: string) => {
    setQuery(historyQuery);
    setDebouncedQuery(historyQuery);
    setShowDropdown(false);
    setSelectedIndex(-1);
    searchInputRef.current?.blur();
  }, []);

  // Virtual scrolling for large autocomplete lists
  const visibleResults = useMemo(() => {
    return autocompleteResults.slice(0, maxAutocompleteResults);
  }, [autocompleteResults, maxAutocompleteResults]);

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof SearchFilters] !== undefined
  );

  // Keyboard shortcuts and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        if (searchHistory.length > 0 && !showDropdown) {
          setShowDropdown(true);
        }
      }
      
      // Handle autocomplete navigation
      if (showDropdown && document.activeElement === searchInputRef.current) {
        const totalResults = visibleResults.length + (searchHistory.length > 0 ? searchHistory.length : 0);
        
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => prev < totalResults - 1 ? prev + 1 : -1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => prev > -1 ? prev - 1 : totalResults - 1);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
          e.preventDefault();
          if (selectedIndex < visibleResults.length) {
            handleAutocompleteSelect(visibleResults[selectedIndex]);
          } else {
            const historyIndex = selectedIndex - visibleResults.length;
            if (historyIndex < searchHistory.length) {
              handleHistorySelect(searchHistory[historyIndex]);
            }
          }
        } else if (e.key === 'Escape') {
          setShowDropdown(false);
          setSelectedIndex(-1);
        }
      }
      
      // Escape to clear search when not in autocomplete
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current && !showDropdown) {
        clearQuery();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearQuery, showDropdown, visibleResults, searchHistory, selectedIndex, handleAutocompleteSelect, handleHistorySelect]);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={searchInputRef}
          id="search-input"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-12 h-12 text-base"
          aria-label="Search Pokemon by name or ID"
          aria-describedby="search-instructions"
          aria-autocomplete="list"
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-owns={showDropdown ? 'search-autocomplete' : undefined}
          aria-activedescendant={selectedIndex >= 0 ? `autocomplete-item-${selectedIndex}` : undefined}
          onFocus={() => {
            if (query.length >= 2 || searchHistory.length > 0) {
              setShowDropdown(true);
            }
          }}
        />
        
        {/* Clear button */}
        {query && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearQuery}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        {/* Loading indicator */}
        {(isLoading || isAutocompleteLoading) && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        
        {/* Autocomplete Dropdown */}
        {showDropdown && (visibleResults.length > 0 || searchHistory.length > 0) && (
          <div 
            ref={autocompleteRef}
            id="search-autocomplete"
            className="absolute top-full left-0 right-0 z-50 mt-1"
            role="listbox"
            aria-label="Search suggestions"
          >
            <Card className="max-h-64 overflow-y-auto shadow-lg">
              <CardContent className="p-0">
                {/* Pokemon Results */}
                {visibleResults.length > 0 && (
                  <div className="border-b border-border/50 last:border-b-0">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                      Pokemon
                    </div>
                    {visibleResults.map((pokemon, index) => (
                      <button
                        key={pokemon.id}
                        id={`autocomplete-item-${index}`}
                        className={cn(
                          'w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center gap-2',
                          selectedIndex === index && 'bg-muted'
                        )}
                        onClick={() => handleAutocompleteSelect(pokemon)}
                        role="option"
                        aria-selected={selectedIndex === index}
                      >
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-xs font-medium">
                          #{pokemon.id.toString().padStart(3, '0')}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium capitalize">{pokemon.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {pokemon.types.map(t => t.type.name).join(', ')}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Search History */}
                {searchHistory.length > 0 && query.length < 2 && (
                  <div className="border-b border-border/50 last:border-b-0">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 flex items-center gap-2">
                      <History className="h-3 w-3" />
                      Recent Searches
                    </div>
                    {searchHistory.slice(0, 5).map((historyQuery, index) => {
                      const historyIndex = visibleResults.length + index;
                      return (
                        <button
                          key={historyQuery}
                          id={`autocomplete-item-${historyIndex}`}
                          className={cn(
                            'w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center gap-2',
                            selectedIndex === historyIndex && 'bg-muted'
                          )}
                          onClick={() => handleHistorySelect(historyQuery)}
                          role="option"
                          aria-selected={selectedIndex === historyIndex}
                        >
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{historyQuery}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                {Object.keys(filters).filter(key => filters[key as keyof SearchFilters]).length}
              </Badge>
            )}
          </Button>

          {/* Sort Controls */}
          {filters.sortBy && (
            <>
              <Badge variant="outline" className="gap-1">
                Sort: {SORT_OPTIONS.find(opt => opt.value === filters.sortBy)?.label}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
                className="h-8 w-8 p-0"
              >
                {filters.sortOrder === 'desc' ? 
                  <SortDesc className="h-4 w-4" /> : 
                  <SortAsc className="h-4 w-4" />
                }
              </Button>
            </>
          )}

          {/* Active Type Filter */}
          {filters.type && (
            <Badge 
              variant="secondary" 
              className={cn(
                'text-white gap-1 cursor-pointer hover:opacity-80',
                TYPE_COLORS[filters.type] || 'bg-slate-400'
              )}
              onClick={() => handleTypeFilter(filters.type!)}
            >
              {filters.type}
              <X className="h-3 w-3" />
            </Badge>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && showAdvancedFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
          {/* Type Filters */}
          <div>
            <h4 className="text-sm font-medium mb-2">Filter by Type</h4>
            <div className="flex flex-wrap gap-2">
              {POKEMON_TYPES.map((type) => (
                <Badge
                  key={type}
                  variant={filters.type === type ? "default" : "outline"}
                  className={cn(
                    'cursor-pointer capitalize transition-all',
                    filters.type === type && (TYPE_COLORS[type] || 'bg-slate-400'),
                    filters.type === type && 'text-white'
                  )}
                  onClick={() => handleTypeFilter(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <h4 className="text-sm font-medium mb-2">Sort by</h4>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <Badge
                  key={option.value}
                  variant={filters.sortBy === option.value ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleSortChange(option.value as SearchFilters['sortBy'])}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* ID Range Filters */}
          <div>
            <h4 className="text-sm font-medium mb-2">ID Range</h4>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="Min ID"
                min="1"
                max="1010"
                value={filters.minId || ''}
                onChange={(e) => handleFilterChange({
                  ...filters,
                  minId: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="w-24"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max ID"
                min="1"
                max="1010"
                value={filters.maxId || ''}
                onChange={(e) => handleFilterChange({
                  ...filters,
                  maxId: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="w-24"
              />
            </div>
          </div>
        </div>
      )}

      {/* Screen reader instructions */}
      <div id="search-instructions" className="sr-only">
        Search for Pokemon by typing their name or ID number. Use keyboard shortcuts: Cmd+K or Ctrl+K to focus search, Escape to clear. Use filters to refine results by type, stats, or ID range.
      </div>
      
      {/* Live region for search status announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoading && "Searching for Pokemon..."}
        {query && !isLoading && `Search completed for "${query}"`}
        {hasActiveFilters && "Filters have been applied"}
      </div>
    </div>
  );
}