import { useState, useEffect, useCallback } from 'react';
import { PokedeckEntry } from '@/lib/types/pokemon';
import { pokedeckStore } from '@/lib/store/pokedeck';

interface UsePokedeckResult {
  pokedeck: PokedeckEntry[];
  count: number;
  isInDeck: (pokemonId: number) => boolean;
  addToDeck: (pokemon: {
    id: number;
    name: string;
    sprite: string;
    types: string[];
  }) => Promise<boolean>;
  removeFromDeck: (pokemonId: number) => boolean;
  clearDeck: () => void;
  searchDeck: (query: string) => PokedeckEntry[];
  getStats: () => ReturnType<typeof pokedeckStore.getStats>;
  exportDeck: () => string;
  importDeck: (data: string) => boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePokedeck(): UsePokedeckResult {
  const [pokedeck, setPokedeck] = useState<PokedeckEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and subscribe to changes
  useEffect(() => {
    const loadPokedeck = () => {
      try {
        const entries = pokedeckStore.getAll();
        setPokedeck(entries);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading Pokedeck:', err);
        setError('Failed to load Pokédeck');
        setIsLoading(false);
      }
    };

    loadPokedeck();

    // Subscribe to changes
    const unsubscribe = pokedeckStore.subscribe((entries) => {
      setPokedeck(entries);
    });

    return unsubscribe;
  }, []);

  const isInDeck = useCallback((pokemonId: number): boolean => {
    return pokedeckStore.has(pokemonId);
  }, []);

  const addToDeck = useCallback(async (pokemon: {
    id: number;
    name: string;
    sprite: string;
    types: string[];
  }): Promise<boolean> => {
    try {
      setError(null);
      const success = pokedeckStore.add(pokemon);
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add Pokémon to Pokédeck';
      setError(message);
      throw err;
    }
  }, []);

  const removeFromDeck = useCallback((pokemonId: number): boolean => {
    try {
      setError(null);
      return pokedeckStore.remove(pokemonId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove Pokémon from Pokédeck';
      setError(message);
      return false;
    }
  }, []);

  const clearDeck = useCallback(() => {
    try {
      setError(null);
      pokedeckStore.clear();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear Pokédeck';
      setError(message);
    }
  }, []);

  const searchDeck = useCallback((query: string): PokedeckEntry[] => {
    return pokedeckStore.search(query);
  }, []);

  const getStats = useCallback(() => {
    return pokedeckStore.getStats();
  }, []);

  const exportDeck = useCallback((): string => {
    return pokedeckStore.export();
  }, []);

  const importDeck = useCallback((data: string): boolean => {
    try {
      setError(null);
      return pokedeckStore.import(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import Pokédeck';
      setError(message);
      return false;
    }
  }, []);

  return {
    pokedeck,
    count: pokedeck.length,
    isInDeck,
    addToDeck,
    removeFromDeck,
    clearDeck,
    searchDeck,
    getStats,
    exportDeck,
    importDeck,
    isLoading,
    error,
  };
}

// Hook for managing a single Pokemon's Pokedeck status
export function usePokemonInDeck(pokemonId: number | null) {
  const [isInDeck, setIsInDeck] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (pokemonId) {
      setIsInDeck(pokedeckStore.has(pokemonId));

      // Subscribe to changes
      const unsubscribe = pokedeckStore.subscribe(() => {
        setIsInDeck(pokedeckStore.has(pokemonId));
      });

      return unsubscribe;
    }
  }, [pokemonId]);

  const toggle = useCallback(async (pokemon: {
    id: number;
    name: string;
    sprite: string;
    types: string[];
  }) => {
    if (!pokemonId) return false;
    
    setIsUpdating(true);
    
    try {
      if (isInDeck) {
        pokedeckStore.remove(pokemonId);
        return false; // Removed
      } else {
        const success = pokedeckStore.add(pokemon);
        return success; // Added
      }
    } catch (error) {
      console.error('Error toggling Pokédeck status:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [pokemonId, isInDeck]);

  return {
    isInDeck,
    isUpdating,
    toggle,
  };
}