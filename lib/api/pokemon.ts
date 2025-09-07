import {
  Pokemon,
  PokemonListResponse,
  PokemonSpecies,
  PaginationInfo,
} from '@/lib/types/pokemon';

// Type API response interface
interface TypeResponse {
  pokemon: Array<{
    pokemon: {
      name: string;
      url: string;
    };
  }>;
}

const BASE_URL = 'https://pokeapi.co/api/v2';
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache
const cache = new Map<string, CacheEntry<unknown>>();

// Cache utility functions
function getCacheKey(endpoint: string, params?: Record<string, string>): string {
  const paramString = params ? new URLSearchParams(params).toString() : '';
  return `${endpoint}${paramString ? `?${paramString}` : ''}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

// API helper function
async function apiRequest<T>(endpoint: string): Promise<T> {
  const cacheKey = getCacheKey(endpoint);
  const cached = getFromCache<T>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
}

// Extract Pokemon ID from URL
function extractIdFromUrl(url: string): number {
  const matches = url.match(/\/(\d+)\/$/);
  return matches ? parseInt(matches[1], 10) : 0;
}

// Main API functions
export async function fetchPokemonList(
  limit: number = 20,
  offset: number = 0
): Promise<{ pokemon: Pokemon[]; pagination: PaginationInfo }> {
  const listResponse = await apiRequest<PokemonListResponse>(
    `/pokemon?limit=${limit}&offset=${offset}`
  );
  
  // Fetch detailed info for each Pokemon in parallel
  const pokemonPromises = listResponse.results.map(async (item) => {
    const id = extractIdFromUrl(item.url);
    return fetchPokemonById(id);
  });
  
  const pokemon = await Promise.all(pokemonPromises);
  
  const pagination: PaginationInfo = {
    limit,
    offset,
    total: listResponse.count,
    hasNext: !!listResponse.next,
    hasPrevious: !!listResponse.previous,
  };
  
  return { pokemon, pagination };
}

export async function fetchPokemonById(id: number): Promise<Pokemon> {
  return apiRequest<Pokemon>(`/pokemon/${id}`);
}

export async function fetchPokemonByName(name: string): Promise<Pokemon> {
  return apiRequest<Pokemon>(`/pokemon/${name.toLowerCase()}`);
}

export async function fetchPokemonSpecies(id: number): Promise<PokemonSpecies> {
  return apiRequest<PokemonSpecies>(`/pokemon-species/${id}`);
}

export async function searchPokemon(query: string): Promise<Pokemon[]> {
  const cacheKey = getCacheKey('/pokemon/search', { query });
  const cached = getFromCache<Pokemon[]>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  try {
    // For search, we'll fetch a larger list and filter client-side
    // This is more efficient than making individual API calls
    const { pokemon } = await fetchPokemonList(1000, 0);
    
    const filteredPokemon = pokemon.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.id.toString().includes(query)
    );
    
    setCache(cacheKey, filteredPokemon);
    return filteredPokemon;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

export async function fetchPokemonByType(typeName: string): Promise<Pokemon[]> {
  const cacheKey = getCacheKey(`/type/${typeName}`);
  const cached = getFromCache<Pokemon[]>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  try {
    const typeResponse = await apiRequest<TypeResponse>(`/type/${typeName}`);
    
    // Extract Pokemon from the type data and fetch their full details
    const pokemonPromises = typeResponse.pokemon
      .slice(0, 50) // Limit to first 50 for performance
      .map((entry) => {
        const id = extractIdFromUrl(entry.pokemon.url);
        return fetchPokemonById(id);
      });
    
    const pokemon = await Promise.all(pokemonPromises);
    setCache(cacheKey, pokemon);
    return pokemon;
  } catch (error) {
    console.error('Type filter error:', error);
    return [];
  }
}

// Get Pokemon sprite URL with fallbacks
export function getPokemonSprite(pokemon: Pokemon): string {
  return (
    pokemon.sprites.other['official-artwork'].front_default ||
    pokemon.sprites.other.home.front_default ||
    pokemon.sprites.front_default ||
    '/placeholder-pokemon.png'
  );
}

// Format Pokemon description from species data
export function formatPokemonDescription(species: PokemonSpecies): string {
  const englishEntry = species.flavor_text_entries.find(
    entry => entry.language.name === 'en'
  );
  
  return englishEntry?.flavor_text
    .replace(/\f/g, '\n')
    .replace(/\u00ad\n/g, '')
    .replace(/\u00ad/g, '')
    .replace(/ -\n/g, ' - ')
    .replace(/-\n/g, '-')
    .replace(/\n/g, ' ') || 'No description available.';
}

// Convert height from decimeters to feet/inches
export function formatHeight(heightInDecimeters: number): string {
  const totalInches = heightInDecimeters * 3.937008;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches.toString().padStart(2, '0')}"`;
}

// Convert weight from hectograms to pounds
export function formatWeight(weightInHectograms: number): string {
  const pounds = (weightInHectograms * 0.220462).toFixed(1);
  return `${pounds} lbs`;
}

// Clear cache (useful for testing or manual refresh)
export function clearCache(): void {
  cache.clear();
}

// Get cache size (for debugging)
export function getCacheSize(): number {
  return cache.size;
}