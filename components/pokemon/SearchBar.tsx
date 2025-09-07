'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  X, 
  Filter, 
  SortAsc, 
  SortDesc,
  Loader2
} from 'lucide-react';
import { SearchFilters } from '@/lib/types/pokemon';
import { TYPE_COLORS } from '@/lib/types/pokemon';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFiltersChange: (filters: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
  isLoading?: boolean;
  className?: string;
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
  className
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Call onSearch when debounced query changes
  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    onFiltersChange(newFilters);
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
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

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof SearchFilters] !== undefined
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Escape to clear search
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        clearQuery();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearQuery]);

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
        />
        
        {/* Clear button */}
        {query && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearQuery}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
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
    </div>
  );
}