import { Pokemon, SearchFilters } from '@/lib/types/pokemon';
import { useMemo, useCallback } from 'react';

// Filter presets for common searches to reduce computation
export const FILTER_PRESETS = {
  starter: {
    ids: [1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501, 650, 653, 656, 722, 725, 728, 810, 813, 816],
    label: 'Starter Pokemon'
  },
  legendary: {
    ids: [144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386],
    label: 'Legendary Pokemon'
  },
  popular: {
    ids: [1, 4, 7, 25, 39, 54, 104, 132, 144, 150, 151, 249, 250, 448, 493],
    label: 'Popular Pokemon'
  }
};

// Memoized sorting functions to avoid recreation
const sortingFunctions = {
  id: (a: Pokemon, b: Pokemon, order: 'asc' | 'desc') => 
    order === 'asc' ? a.id - b.id : b.id - a.id,
  
  name: (a: Pokemon, b: Pokemon, order: 'asc' | 'desc') => 
    order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
  
  height: (a: Pokemon, b: Pokemon, order: 'asc' | 'desc') => 
    order === 'asc' ? a.height - b.height : b.height - a.height,
  
  weight: (a: Pokemon, b: Pokemon, order: 'asc' | 'desc') => 
    order === 'asc' ? a.weight - b.weight : b.weight - a.weight,
};

// Efficient text search with multiple strategies
function searchText(pokemon: Pokemon, query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  
  // Quick ID match check first (most efficient)
  if (pokemon.id.toString().includes(normalizedQuery)) {
    return true;
  }
  
  // Name match (case-insensitive)
  if (pokemon.name.toLowerCase().includes(normalizedQuery)) {
    return true;
  }
  
  // Type match
  if (pokemon.types.some(type => type.type.name.toLowerCase().includes(normalizedQuery))) {
    return true;
  }
  
  return false;
}

// High-performance filtering function with multiple optimizations
export function filterPokemon(
  pokemonList: Pokemon[],
  filters: SearchFilters,
  searchQuery?: string
): Pokemon[] {
  let result = pokemonList;
  
  // Early return for empty dataset
  if (!pokemonList.length) return result;
  
  // Apply search query filter first (most selective)
  if (searchQuery && searchQuery.trim()) {
    result = result.filter(pokemon => searchText(pokemon, searchQuery.trim()));
  }
  
  // Apply type filter
  if (filters.type) {
    result = result.filter(pokemon => 
      pokemon.types.some(type => type.type.name === filters.type)
    );
  }
  
  // Apply ID range filters
  if (filters.minId !== undefined) {
    result = result.filter(pokemon => pokemon.id >= filters.minId!);
  }
  
  if (filters.maxId !== undefined) {
    result = result.filter(pokemon => pokemon.id <= filters.maxId!);
  }
  
  // Apply preset filters
  if (filters.preset && FILTER_PRESETS[filters.preset as keyof typeof FILTER_PRESETS]) {
    const preset = FILTER_PRESETS[filters.preset as keyof typeof FILTER_PRESETS];
    result = result.filter(pokemon => preset.ids.includes(pokemon.id));
  }
  
  // Apply sorting
  if (filters.sortBy && sortingFunctions[filters.sortBy]) {
    const sortOrder = filters.sortOrder || 'asc';
    result = [...result].sort((a, b) => 
      sortingFunctions[filters.sortBy!](a, b, sortOrder)
    );
  }
  
  return result;
}

// Memoized hook for efficient filtering
export function useFilteredPokemon(
  pokemonList: Pokemon[],
  filters: SearchFilters,
  searchQuery?: string
) {
  return useMemo(() => {
    // Create a cache key for memoization
    const cacheKey = JSON.stringify({ filters, searchQuery, length: pokemonList.length });
    
    return filterPokemon(pokemonList, filters, searchQuery);
  }, [pokemonList, filters, searchQuery]);
}

// Debounced search hook for performance
export function useDebouncedFilter<T>(
  value: T,
  delay: number = 300
): [T, boolean] {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  const [isDebouncing, setIsDebouncing] = React.useState(false);
  
  React.useEffect(() => {
    setIsDebouncing(true);
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return [debouncedValue, isDebouncing];
}

// Performance monitoring for filter operations
export function measureFilterPerformance<T>(
  operation: () => T,
  operationName: string = 'Filter Operation'
): T {
  const start = performance.now();
  const result = operation();
  const end = performance.now();
  
  // Only log if operation takes longer than 50ms
  if (end - start > 50) {
    console.warn(`${operationName} took ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
}

// Batch filtering for large datasets with virtual scrolling support
export function useBatchFilteredPokemon(
  pokemonList: Pokemon[],
  filters: SearchFilters,
  searchQuery: string = '',
  batchSize: number = 50,
  visibleRange: { start: number; end: number } = { start: 0, end: 50 }
) {
  return useMemo(() => {
    // First apply all filters
    const filtered = filterPokemon(pokemonList, filters, searchQuery);
    
    // Then return only the visible portion for performance
    const visible = filtered.slice(visibleRange.start, visibleRange.end);
    
    return {
      filtered,
      visible,
      totalCount: filtered.length,
      visibleCount: visible.length,
      hasMore: visibleRange.end < filtered.length
    };
  }, [pokemonList, filters, searchQuery, batchSize, visibleRange]);
}

// URL state management for filters
export function filtersToUrlParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value.toString());
    }
  });
  
  return params;
}

export function urlParamsToFilters(searchParams: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {};
  
  const type = searchParams.get('type');
  const sortBy = searchParams.get('sortBy') as SearchFilters['sortBy'];
  const sortOrder = searchParams.get('sortOrder') as SearchFilters['sortOrder'];
  const minId = searchParams.get('minId');
  const maxId = searchParams.get('maxId');
  const preset = searchParams.get('preset');
  
  if (type) filters.type = type;
  if (sortBy) filters.sortBy = sortBy;
  if (sortOrder) filters.sortOrder = sortOrder;
  if (minId) filters.minId = parseInt(minId, 10);
  if (maxId) filters.maxId = parseInt(maxId, 10);
  if (preset) filters.preset = preset;
  
  return filters;
}

// React import fix
import React from 'react';