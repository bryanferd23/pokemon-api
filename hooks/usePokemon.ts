import { useState, useEffect, useCallback } from 'react';
import { Pokemon, PaginationInfo, SearchFilters } from '@/lib/types/pokemon';
import { 
  fetchPokemonList, 
  fetchPokemonByName, 
  fetchPokemonById,
  searchPokemon,
  fetchPokemonByType
} from '@/lib/api/pokemon';

interface UsePokemonListResult {
  pokemon: Pokemon[];
  pagination: PaginationInfo;
  isLoading: boolean;
  error: string | null;
  loadMore: () => void;
  reload: () => void;
  hasMore: boolean;
}

interface UsePokemonResult {
  pokemon: Pokemon | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

// Hook for fetching a list of Pokemon with pagination
export function usePokemonList(
  initialLimit: number = 20,
  searchQuery: string = '',
  filters: SearchFilters = {}
): UsePokemonListResult {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    limit: initialLimit,
    offset: 0,
    total: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPokemon = useCallback(async (
    limit: number, 
    offset: number, 
    append: boolean = false
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      let result;
      let pokemonData: Pokemon[];
      let paginationData: PaginationInfo;

      if (searchQuery.trim()) {
        // Search mode
        const searchResults = await searchPokemon(searchQuery);
        pokemonData = searchResults.slice(offset, offset + limit);
        paginationData = {
          limit,
          offset,
          total: searchResults.length,
          hasNext: offset + limit < searchResults.length,
          hasPrevious: offset > 0,
        };
      } else if (filters.type) {
        // Filter by type
        const typeResults = await fetchPokemonByType(filters.type);
        pokemonData = typeResults.slice(offset, offset + limit);
        paginationData = {
          limit,
          offset,
          total: typeResults.length,
          hasNext: offset + limit < typeResults.length,
          hasPrevious: offset > 0,
        };
      } else {
        // Normal pagination
        result = await fetchPokemonList(limit, offset);
        pokemonData = result.pokemon;
        paginationData = result.pagination;
      }

      setPokemon(prev => append ? [...prev, ...pokemonData] : pokemonData);
      setPagination(paginationData);
    } catch (err) {
      console.error('Error loading Pokemon:', err);
      setError('Failed to load Pokémon. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filters]);

  // Initial load and reload when dependencies change
  useEffect(() => {
    loadPokemon(pagination.limit, 0, false);
  }, [searchQuery, filters, pagination.limit, loadPokemon]);

  const loadMore = useCallback(() => {
    if (pagination.hasNext && !isLoading) {
      loadPokemon(
        pagination.limit, 
        pagination.offset + pagination.limit, 
        true
      );
    }
  }, [pagination, isLoading, loadPokemon]);

  const reload = useCallback(() => {
    loadPokemon(pagination.limit, 0, false);
  }, [pagination.limit, loadPokemon]);

  return {
    pokemon,
    pagination,
    isLoading,
    error,
    loadMore,
    reload,
    hasMore: pagination.hasNext,
  };
}

// Hook for fetching a single Pokemon
export function usePokemon(identifier: string | number): UsePokemonResult {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPokemon = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setPokemon(null);

      let pokemonData: Pokemon;
      
      if (typeof identifier === 'string') {
        pokemonData = await fetchPokemonByName(identifier);
      } else {
        pokemonData = await fetchPokemonById(identifier);
      }

      setPokemon(pokemonData);
    } catch (err) {
      console.error('Error loading Pokemon:', err);
      if (err instanceof Error && err.message.includes('404')) {
        setError('Pokémon not found');
      } else {
        setError('Failed to load Pokémon. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    if (identifier) {
      loadPokemon();
    }
  }, [identifier, loadPokemon]);

  const reload = useCallback(() => {
    loadPokemon();
  }, [loadPokemon]);

  return {
    pokemon,
    isLoading,
    error,
    reload,
  };
}

// Hook for searching Pokemon with debounce
export function usePokemonSearch(initialQuery: string = '', debounceMs: number = 300) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [results, setResults] = useState<Pokemon[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const searchResults = await searchPokemon(debouncedQuery);
        setResults(searchResults);
      } catch (err) {
        console.error('Search error:', err);
        setError('Search failed. Please try again.');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    clearSearch,
  };
}