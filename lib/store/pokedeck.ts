import { PokedeckEntry } from '@/lib/types/pokemon';

const POKEDECK_KEY = 'pokemon-pokedeck';
const MAX_POKEDECK_SIZE = 50; // Reasonable limit for performance
const BATCH_SIZE = 20; // For bulk operations
const STATS_CACHE_TTL = 5000; // Cache stats for 5 seconds

// Pokedeck storage utilities
export class PokedeckStore {
  private static instance: PokedeckStore;
  private pokedeck: Map<number, PokedeckEntry> = new Map();
  private listeners: Set<(pokedeck: PokedeckEntry[]) => void> = new Set();

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): PokedeckStore {
    if (!PokedeckStore.instance) {
      PokedeckStore.instance = new PokedeckStore();
    }
    return PokedeckStore.instance;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(POKEDECK_KEY);
      if (stored) {
        const entries: PokedeckEntry[] = JSON.parse(stored);
        this.pokedeck = new Map(entries.map(entry => [entry.id, entry]));
      }
    } catch (error) {
      console.error('Error loading Pokedeck from storage:', error);
      this.pokedeck = new Map();
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const entries = Array.from(this.pokedeck.values());
      localStorage.setItem(POKEDECK_KEY, JSON.stringify(entries));
      this.invalidateStatsCache(); // Invalidate cache when data changes
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving Pokedeck to storage:', error);
    }
  }

  private notifyListeners(): void {
    const entries = this.getAll();
    this.listeners.forEach(listener => listener(entries));
  }

  public add(pokemon: {
    id: number;
    name: string;
    sprite: string;
    types: string[];
  }): boolean {
    if (this.pokedeck.size >= MAX_POKEDECK_SIZE && !this.pokedeck.has(pokemon.id)) {
      throw new Error(`Pokedeck is full! Maximum ${MAX_POKEDECK_SIZE} Pokemon allowed.`);
    }

    if (this.pokedeck.has(pokemon.id)) {
      return false; // Already exists
    }

    const entry: PokedeckEntry = {
      ...pokemon,
      dateAdded: new Date().toISOString(),
    };

    this.pokedeck.set(pokemon.id, entry);
    this.saveToStorage();
    return true;
  }

  public remove(pokemonId: number): boolean {
    const existed = this.pokedeck.has(pokemonId);
    this.pokedeck.delete(pokemonId);
    
    if (existed) {
      this.saveToStorage();
    }
    
    return existed;
  }

  public has(pokemonId: number): boolean {
    return this.pokedeck.has(pokemonId);
  }

  public get(pokemonId: number): PokedeckEntry | null {
    return this.pokedeck.get(pokemonId) || null;
  }

  public getAll(): PokedeckEntry[] {
    return Array.from(this.pokedeck.values())
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
  }

  public getAllSorted(sortBy: 'name' | 'id' | 'dateAdded' = 'dateAdded'): PokedeckEntry[] {
    const entries = Array.from(this.pokedeck.values());
    
    return entries.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'id':
          return a.id - b.id;
        case 'dateAdded':
        default:
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      }
    });
  }

  public getByType(typeName: string): PokedeckEntry[] {
    return this.getAll().filter(entry =>
      entry.types.some(type => type.toLowerCase() === typeName.toLowerCase())
    );
  }

  public search(query: string): PokedeckEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(entry =>
      entry.name.toLowerCase().includes(lowerQuery) ||
      entry.id.toString().includes(query) ||
      entry.types.some(type => type.toLowerCase().includes(lowerQuery))
    );
  }

  public count(): number {
    return this.pokedeck.size;
  }

  public isEmpty(): boolean {
    return this.pokedeck.size === 0;
  }

  public clear(): void {
    this.pokedeck.clear();
    this.saveToStorage();
  }

  // Memoized stats calculation for better performance
  private statsCache: {
    lastUpdate: number;
    stats: {
      total: number;
      typeBreakdown: Record<string, number>;
      oldestEntry: PokedeckEntry | null;
      newestEntry: PokedeckEntry | null;
      averagePerType: number;
      mostCommonType: string | null;
      rarest: PokedeckEntry | null;
    };
  } | null = null;

  private invalidateStatsCache(): void {
    this.statsCache = null;
  }

  public getStats(): {
    total: number;
    typeBreakdown: Record<string, number>;
    oldestEntry: PokedeckEntry | null;
    newestEntry: PokedeckEntry | null;
    averagePerType: number;
    mostCommonType: string | null;
    rarest: PokedeckEntry | null;
  } {
    // Check cache validity (5 seconds)
    if (this.statsCache && Date.now() - this.statsCache.lastUpdate < 5000) {
      return this.statsCache.stats;
    }

    const entries = this.getAll();
    const typeBreakdown: Record<string, number> = {};
    const typeSet = new Set<string>();

    entries.forEach(entry => {
      entry.types.forEach(type => {
        typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
        typeSet.add(type);
      });
    });

    const sortedByDate = [...entries].sort((a, b) =>
      new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
    );

    // Find most common type
    let mostCommonType: string | null = null;
    let maxCount = 0;
    Object.entries(typeBreakdown).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonType = type;
      }
    });

    // Find rarest Pokemon (lowest ID = older generation)
    const rarest = entries.reduce((rare, entry) => 
      rare === null || entry.id < rare.id ? entry : rare, 
      null as PokedeckEntry | null
    );

    const stats = {
      total: entries.length,
      typeBreakdown,
      oldestEntry: sortedByDate[0] || null,
      newestEntry: sortedByDate[sortedByDate.length - 1] || null,
      averagePerType: typeSet.size > 0 ? entries.length / typeSet.size : 0,
      mostCommonType,
      rarest
    };

    // Cache the results
    this.statsCache = {
      lastUpdate: Date.now(),
      stats
    };

    return stats;
  }

  public subscribe(listener: (pokedeck: PokedeckEntry[]) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Bulk operations for better performance
  public addMultiple(pokemon: Array<{
    id: number;
    name: string;
    sprite: string;
    types: string[];
  }>): { added: number; skipped: number; errors: string[] } {
    const results = { added: 0, skipped: 0, errors: [] as string[] };
    const batchSize = 10; // Process in batches to avoid blocking UI
    
    for (let i = 0; i < pokemon.length; i += batchSize) {
      const batch = pokemon.slice(i, i + batchSize);
      
      batch.forEach(p => {
        try {
          if (this.pokedeck.has(p.id)) {
            results.skipped++;
          } else if (this.pokedeck.size >= MAX_POKEDECK_SIZE) {
            results.errors.push(`Pokedeck full, cannot add ${p.name}`);
          } else {
            const entry: PokedeckEntry = {
              ...p,
              dateAdded: new Date().toISOString(),
            };
            this.pokedeck.set(p.id, entry);
            results.added++;
          }
        } catch (error) {
          results.errors.push(`Failed to add ${p.name}: ${error}`);
        }
      });
    }
    
    if (results.added > 0) {
      this.saveToStorage();
    }
    
    return results;
  }

  public removeMultiple(pokemonIds: number[]): { removed: number; notFound: number } {
    const results = { removed: 0, notFound: 0 };
    
    pokemonIds.forEach(id => {
      if (this.pokedeck.has(id)) {
        this.pokedeck.delete(id);
        results.removed++;
      } else {
        results.notFound++;
      }
    });
    
    if (results.removed > 0) {
      this.saveToStorage();
    }
    
    return results;
  }

  // Performance optimized export with progress callback
  public exportAsync(progressCallback?: (progress: number) => void): Promise<string> {
    return new Promise((resolve) => {
      const entries = this.getAll();
      const total = entries.length;
      let processed = 0;
      
      const processEntries = () => {
        const batchSize = 50;
        const endIndex = Math.min(processed + batchSize, total);
        
        // Process a batch
        while (processed < endIndex) {
          processed++;
          if (progressCallback) {
            progressCallback((processed / total) * 100);
          }
        }
        
        if (processed < total) {
          // Schedule next batch
          setTimeout(processEntries, 0);
        } else {
          // Complete
          const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            entries,
            stats: this.getStats()
          };
          resolve(JSON.stringify(data, null, 2));
        }
      };
      
      processEntries();
    });
  }

  public export(): string {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      entries: this.getAll(),
      stats: this.getStats()
    };
    return JSON.stringify(data, null, 2);
  }

  public import(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error('Invalid import format');
      }

      // Validate entries
      const validEntries = data.entries.filter((entry: unknown): entry is PokedeckEntry => {
        return (
          typeof entry === 'object' &&
          entry !== null &&
          'id' in entry && typeof (entry as PokedeckEntry).id === 'number' &&
          'name' in entry && typeof (entry as PokedeckEntry).name === 'string' &&
          'sprite' in entry && typeof (entry as PokedeckEntry).sprite === 'string' &&
          'types' in entry && Array.isArray((entry as PokedeckEntry).types) &&
          'dateAdded' in entry && typeof (entry as PokedeckEntry).dateAdded === 'string'
        );
      });

      if (validEntries.length === 0) {
        throw new Error('No valid entries found');
      }

      // Clear current deck and import new entries
      this.pokedeck.clear();
      
      validEntries.forEach((entry: PokedeckEntry) => {
        this.pokedeck.set(entry.id, {
          ...entry,
          dateAdded: entry.dateAdded || new Date().toISOString(),
        });
      });

      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const pokedeckStore = PokedeckStore.getInstance();

// Enhanced convenience functions for direct usage
export const addToPokédeck = (pokemon: {
  id: number;
  name: string;
  sprite: string;
  types: string[];
}) => pokedeckStore.add(pokemon);

export const addMultipleToPokédeck = (pokemon: Array<{
  id: number;
  name: string;
  sprite: string;
  types: string[];
}>) => pokedeckStore.addMultiple(pokemon);

export const removeFromPokédeck = (pokemonId: number) =>
  pokedeckStore.remove(pokemonId);

export const removeMultipleFromPokédeck = (pokemonIds: number[]) =>
  pokedeckStore.removeMultiple(pokemonIds);

export const isInPokédeck = (pokemonId: number) =>
  pokedeckStore.has(pokemonId);

export const getPokédeck = () => pokedeckStore.getAll();

export const getPokédeckSorted = (sortBy: 'name' | 'id' | 'dateAdded' = 'dateAdded') => 
  pokedeckStore.getAllSorted(sortBy);

export const getPokédeckCount = () => pokedeckStore.count();

export const clearPokédeck = () => pokedeckStore.clear();

export const searchPokédeck = (query: string) => pokedeckStore.search(query);

export const getPokédeckStats = () => pokedeckStore.getStats();

export const exportPokédeck = () => pokedeckStore.export();

export const exportPokédeckAsync = (progressCallback?: (progress: number) => void) =>
  pokedeckStore.exportAsync(progressCallback);

export const importPokédeck = (jsonData: string) => pokedeckStore.import(jsonData);

export const subscribeToPokédeck = (listener: (pokedeck: PokedeckEntry[]) => void) =>
  pokedeckStore.subscribe(listener);

// Performance utilities
export const getPokedeckPerformanceStats = () => ({
  size: pokedeckStore.count(),
  maxSize: MAX_POKEDECK_SIZE,
  isEmpty: pokedeckStore.isEmpty(),
  memoryUsage: JSON.stringify(pokedeckStore.getAll()).length,
  lastStatsUpdate: pokedeckStore['statsCache']?.lastUpdate || null
});