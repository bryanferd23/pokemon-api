'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, RotateCcw, AlertCircle } from 'lucide-react';
import { Pokemon, SearchFilters, PaginationInfo } from '@/lib/types/pokemon';
import { PokemonCard } from './PokemonCard';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { cn } from '@/lib/utils';

interface PokemonListProps {
  pokemon: Pokemon[];
  pagination?: PaginationInfo;
  isLoading?: boolean;
  error?: string | null;
  searchQuery?: string;
  filters?: SearchFilters;
  onPageChange?: (offset: number) => void;
  onRetry?: () => void;
  variant?: 'grid' | 'list';
  className?: string;
}

export function PokemonList({
  pokemon = [],
  pagination,
  isLoading = false,
  error = null,
  searchQuery = '',
  filters = {},
  onPageChange,
  onRetry,
  variant = 'grid',
  className
}: PokemonListProps) {
  const [displayedPokemon, setDisplayedPokemon] = useState<Pokemon[]>([]);

  // Calculate columns for keyboard navigation
  const getColumnsCount = () => {
    if (variant === 'list') return 1;
    // Based on grid classes: 2 sm:3 md:4 lg:5 xl:6
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width >= 1280) return 6; // xl
      if (width >= 1024) return 5; // lg
      if (width >= 768) return 4;  // md
      if (width >= 640) return 3;  // sm
      return 2; // default
    }
    return 4; // fallback
  };

  // Keyboard navigation
  const { setInitialFocus, resetFocus } = useKeyboardNavigation({
    itemCount: displayedPokemon.length,
    columnsCount: getColumnsCount(),
    onSelect: (index) => {
      // Navigate to selected Pokemon
      const pokemon = displayedPokemon[index];
      if (pokemon) {
        window.location.href = `/pokemon/${pokemon.name}`;
      }
    },
    enabled: displayedPokemon.length > 0,
    containerSelector: '[role="grid"]',
  });

  // Filter and sort Pokemon based on search query and filters
  const filteredAndSortedPokemon = useMemo(() => {
    let filtered = [...pokemon];

    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.id.toString().includes(query)
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(p =>
        p.types.some(t => t.type.name === filters.type)
      );
    }

    // ID range filters
    if (filters.minId) {
      filtered = filtered.filter(p => p.id >= filters.minId!);
    }
    if (filters.maxId) {
      filtered = filtered.filter(p => p.id <= filters.maxId!);
    }

    // Sort
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: string | number = a[filters.sortBy as keyof Pokemon] as string | number;
        let bValue: string | number = b[filters.sortBy as keyof Pokemon] as string | number;

        // Special handling for name sorting
        if (filters.sortBy === 'name') {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        }

        // Handle numeric sorting
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return filters.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
        }

        // Handle string sorting
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return filters.sortOrder === 'desc' ? -comparison : comparison;
        }

        return 0;
      });
    }

    return filtered;
  }, [pokemon, searchQuery, filters]);

  // Update displayed Pokemon when filtered results change
  useEffect(() => {
    setDisplayedPokemon(filteredAndSortedPokemon);
    resetFocus(); // Reset focus when content changes
  }, [filteredAndSortedPokemon, resetFocus]);

  // Calculate pagination info for filtered results
  const filteredPagination = useMemo(() => {
    if (!pagination) return undefined;

    const totalFiltered = filteredAndSortedPokemon.length;
    return {
      ...pagination,
      total: totalFiltered,
      hasNext: totalFiltered > (pagination.offset + pagination.limit),
      hasPrevious: pagination.offset > 0,
    };
  }, [pagination, filteredAndSortedPokemon.length]);

  const handlePreviousPage = () => {
    if (pagination && pagination.hasPrevious && onPageChange) {
      onPageChange(Math.max(0, pagination.offset - pagination.limit));
    }
  };

  const handleNextPage = () => {
    if (pagination && pagination.hasNext && onPageChange) {
      onPageChange(pagination.offset + pagination.limit);
    }
  };

  const getCurrentPageNumber = () => {
    if (!pagination) return 1;
    return Math.floor(pagination.offset / pagination.limit) + 1;
  };

  const getTotalPages = () => {
    if (!filteredPagination) return 1;
    return Math.ceil(filteredPagination.total / filteredPagination.limit);
  };

  // Error state
  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="ml-2 gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className={cn(
          variant === 'grid' 
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-fr"
            : "space-y-4"
        )}>
          {Array.from({ length: 20 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-72 w-full aspect-[3/4] rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (displayedPokemon.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="mx-auto max-w-md">
          <div className="mx-auto h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery || Object.keys(filters).length > 0 
              ? "No Pokemon found" 
              : "No Pokemon available"
            }
          </h3>
          <p className="text-muted-foreground">
            {searchQuery || Object.keys(filters).length > 0
              ? "Try adjusting your search or filters to find Pokemon."
              : "There are no Pokemon to display at the moment."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {displayedPokemon.length} of {filteredPagination?.total || pokemon.length} Pokemon
          {searchQuery && (
            <span className="ml-1">
              for &ldquo;<strong className="text-foreground">{searchQuery}</strong>&rdquo;
            </span>
          )}
        </div>
        
        {filteredPagination && (
          <div>
            Page {getCurrentPageNumber()} of {getTotalPages()}
          </div>
        )}
      </div>

      {/* Keyboard Navigation Instructions */}
      <div className="sr-only" aria-live="polite">
        Use arrow keys to navigate through Pokemon. Press Enter or Space to select a Pokemon. Use Home/End to jump to first/last Pokemon.
      </div>

      {/* Pokemon Grid/List */}
      <div 
        className={cn(
          variant === 'grid' 
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-fr"
            : "space-y-4"
        )}
        role="grid"
        aria-label={`Pokemon ${variant} containing ${displayedPokemon.length} Pokemon`}
        tabIndex={0}
        onFocus={() => setInitialFocus()}
      >
        {displayedPokemon.map((pokemon, index) => (
          <div
            key={pokemon.id}
            role="gridcell"
            aria-rowindex={variant === 'grid' ? Math.floor(index / getColumnsCount()) + 1 : index + 1}
            aria-colindex={variant === 'grid' ? (index % getColumnsCount()) + 1 : 1}
            tabIndex={index === 0 ? 0 : -1}
          >
            <PokemonCard
              pokemon={pokemon}
              variant={variant === 'list' ? 'compact' : 'default'}
            />
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {filteredPagination && (
        <div className="flex items-center justify-center space-x-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={!filteredPagination.hasPrevious || isLoading}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center space-x-2 text-sm">
            <span>Page</span>
            <div className="flex items-center justify-center min-w-[2rem] h-8 px-2 border rounded">
              {getCurrentPageNumber()}
            </div>
            <span>of {getTotalPages()}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!filteredPagination.hasNext || isLoading}
            className="gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default PokemonList;