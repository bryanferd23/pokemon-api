'use client';

import { Pokemon } from '@/lib/types/pokemon';

// Maximum number of Pokemon that can be compared at once
const MAX_COMPARISONS = 3;
const STORAGE_KEY = 'pokemon-comparison';

// Comparison state interface
export interface ComparisonState {
  pokemon: Pokemon[];
  isEnabled: boolean;
  lastUpdated: number;
}

// Event listeners for state changes
type ComparisonListener = (state: ComparisonState) => void;
const listeners = new Set<ComparisonListener>();

// Internal state
let comparisonState: ComparisonState = {
  pokemon: [],
  isEnabled: false,
  lastUpdated: Date.now()
};

// Load state from localStorage on initialization
function loadStateFromStorage(): ComparisonState {
  if (typeof window === 'undefined') {
    return comparisonState;
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate the stored data structure
      if (parsed && Array.isArray(parsed.pokemon) && typeof parsed.isEnabled === 'boolean') {
        return {
          pokemon: parsed.pokemon,
          isEnabled: parsed.isEnabled,
          lastUpdated: parsed.lastUpdated || Date.now()
        };
      }
    }
  } catch (error) {
    console.warn('Error loading comparison state from localStorage:', error);
    // Clear corrupted data
    localStorage.removeItem(STORAGE_KEY);
  }
  
  return comparisonState;
}

// Save state to localStorage
function saveStateToStorage(state: ComparisonState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Error saving comparison state to localStorage:', error);
  }
}

// Notify all listeners of state changes
function notifyListeners(): void {
  listeners.forEach(listener => {
    try {
      listener(comparisonState);
    } catch (error) {
      console.error('Error in comparison state listener:', error);
    }
  });
}

// Update state and notify listeners
function updateState(updates: Partial<ComparisonState>): void {
  comparisonState = {
    ...comparisonState,
    ...updates,
    lastUpdated: Date.now()
  };
  
  saveStateToStorage(comparisonState);
  notifyListeners();
}

// Initialize state from localStorage
if (typeof window !== 'undefined') {
  comparisonState = loadStateFromStorage();
}

// Public API
export function getComparisonState(): ComparisonState {
  return { ...comparisonState };
}

export function isComparisonEnabled(): boolean {
  return comparisonState.isEnabled;
}

export function getComparedPokemon(): Pokemon[] {
  return [...comparisonState.pokemon];
}

export function getComparisonCount(): number {
  return comparisonState.pokemon.length;
}

export function isComparisonFull(): boolean {
  return comparisonState.pokemon.length >= MAX_COMPARISONS;
}

export function isPokemonInComparison(pokemonId: number): boolean {
  return comparisonState.pokemon.some(p => p.id === pokemonId);
}

export function canAddToComparison(): boolean {
  return comparisonState.pokemon.length < MAX_COMPARISONS;
}

export function enableComparison(): void {
  updateState({ isEnabled: true });
}

export function disableComparison(): void {
  updateState({ isEnabled: false });
}

export function toggleComparison(): void {
  updateState({ isEnabled: !comparisonState.isEnabled });
}

export function addToComparison(pokemon: Pokemon): boolean {
  // Check if already in comparison
  if (isPokemonInComparison(pokemon.id)) {
    return false;
  }
  
  // Check if comparison is full
  if (isComparisonFull()) {
    return false;
  }
  
  const newPokemon = [...comparisonState.pokemon, pokemon];
  updateState({ 
    pokemon: newPokemon,
    isEnabled: true // Auto-enable comparison when adding Pokemon
  });
  
  return true;
}

export function removeFromComparison(pokemonId: number): boolean {
  const initialLength = comparisonState.pokemon.length;
  const newPokemon = comparisonState.pokemon.filter(p => p.id !== pokemonId);
  
  if (newPokemon.length === initialLength) {
    return false; // Pokemon not found
  }
  
  updateState({ 
    pokemon: newPokemon,
    // Disable comparison if no Pokemon left
    isEnabled: newPokemon.length > 0 ? comparisonState.isEnabled : false
  });
  
  return true;
}

export function clearComparison(): void {
  updateState({ 
    pokemon: [],
    isEnabled: false
  });
}

export function replaceComparison(pokemon: Pokemon[]): void {
  // Limit to maximum allowed
  const limitedPokemon = pokemon.slice(0, MAX_COMPARISONS);
  
  updateState({ 
    pokemon: limitedPokemon,
    isEnabled: limitedPokemon.length > 0
  });
}

// Bulk operations for performance
export function addMultipleToComparison(pokemon: Pokemon[]): { added: Pokemon[], skipped: Pokemon[] } {
  const added: Pokemon[] = [];
  const skipped: Pokemon[] = [];
  
  const currentPokemon = [...comparisonState.pokemon];
  
  for (const p of pokemon) {
    if (currentPokemon.length >= MAX_COMPARISONS) {
      skipped.push(p);
      continue;
    }
    
    if (currentPokemon.some(existing => existing.id === p.id)) {
      skipped.push(p);
      continue;
    }
    
    currentPokemon.push(p);
    added.push(p);
  }
  
  if (added.length > 0) {
    updateState({ 
      pokemon: currentPokemon,
      isEnabled: true
    });
  }
  
  return { added, skipped };
}

export function removeMultipleFromComparison(pokemonIds: number[]): number {
  const initialLength = comparisonState.pokemon.length;
  const idsSet = new Set(pokemonIds);
  const newPokemon = comparisonState.pokemon.filter(p => !idsSet.has(p.id));
  
  const removedCount = initialLength - newPokemon.length;
  
  if (removedCount > 0) {
    updateState({ 
      pokemon: newPokemon,
      isEnabled: newPokemon.length > 0 ? comparisonState.isEnabled : false
    });
  }
  
  return removedCount;
}

// Event subscription
export function subscribeToComparison(listener: ComparisonListener): () => void {
  listeners.add(listener);
  
  // Immediately call listener with current state
  listener(comparisonState);
  
  // Return unsubscribe function
  return () => {
    listeners.delete(listener);
  };
}

// React hook for convenient state management
export function useComparisonState() {
  const [state, setState] = React.useState<ComparisonState>(getComparisonState);
  
  React.useEffect(() => {
    return subscribeToComparison(setState);
  }, []);
  
  return state;
}

// Performance monitoring
export function getComparisonStats() {
  return {
    pokemonCount: comparisonState.pokemon.length,
    maxComparisons: MAX_COMPARISONS,
    isEnabled: comparisonState.isEnabled,
    lastUpdated: comparisonState.lastUpdated,
    memoryUsage: JSON.stringify(comparisonState).length,
    listenerCount: listeners.size
  };
}

// Debug utilities for development
export function debugComparisonState() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Comparison State Debug:', {
      state: comparisonState,
      stats: getComparisonStats(),
      storage: localStorage.getItem(STORAGE_KEY)
    });
  }
}

// Clean up expired comparison data (optional feature)
export function cleanupExpiredComparisons(maxAge: number = 24 * 60 * 60 * 1000): boolean {
  const now = Date.now();
  const age = now - comparisonState.lastUpdated;
  
  if (age > maxAge) {
    clearComparison();
    return true;
  }
  
  return false;
}

// Export constants
export const COMPARISON_CONSTANTS = {
  MAX_COMPARISONS,
  STORAGE_KEY
} as const;

// React import for the hook
import React from 'react';