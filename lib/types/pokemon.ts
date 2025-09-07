// Core Pokemon API Types
export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

export interface PokemonListItem {
  name: string;
  url: string;
}

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  types: PokemonType[];
  sprites: PokemonSprites;
  abilities: PokemonAbility[];
  stats: PokemonStat[];
  species: {
    name: string;
    url: string;
  };
  order: number;
}

export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonSprites {
  back_default: string | null;
  back_female: string | null;
  back_shiny: string | null;
  back_shiny_female: string | null;
  front_default: string | null;
  front_female: string | null;
  front_shiny: string | null;
  front_shiny_female: string | null;
  other: {
    dream_world: {
      front_default: string | null;
      front_female: string | null;
    };
    home: {
      front_default: string | null;
      front_female: string | null;
      front_shiny: string | null;
      front_shiny_female: string | null;
    };
    'official-artwork': {
      front_default: string | null;
      front_shiny: string | null;
    };
    showdown: {
      back_default: string | null;
      back_female: string | null;
      back_shiny: string | null;
      back_shiny_female: string | null;
      front_default: string | null;
      front_female: string | null;
      front_shiny: string | null;
      front_shiny_female: string | null;
    };
  };
}

export interface PokemonAbility {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
  slot: number;
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface PokemonSpecies {
  id: number;
  name: string;
  color: {
    name: string;
    url: string;
  };
  flavor_text_entries: FlavorTextEntry[];
  genera: Genus[];
  habitat: {
    name: string;
    url: string;
  } | null;
  evolution_chain: {
    url: string;
  };
}

export interface FlavorTextEntry {
  flavor_text: string;
  language: {
    name: string;
    url: string;
  };
  version: {
    name: string;
    url: string;
  };
}

export interface Genus {
  genus: string;
  language: {
    name: string;
    url: string;
  };
}

// App-specific types
export interface PokedeckEntry {
  id: number;
  name: string;
  dateAdded: string;
  sprite: string;
  types: string[];
}

export interface SearchFilters {
  type?: string;
  minId?: number;
  maxId?: number;
  sortBy?: 'id' | 'name' | 'height' | 'weight';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  limit: number;
  offset: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Pokemon type colors for UI
export const TYPE_COLORS: Record<string, string> = {
  normal: 'bg-slate-400',
  fire: 'bg-red-500',
  water: 'bg-blue-500',
  electric: 'bg-yellow-400',
  grass: 'bg-green-500',
  ice: 'bg-cyan-400',
  fighting: 'bg-red-700',
  poison: 'bg-purple-500',
  ground: 'bg-yellow-600',
  flying: 'bg-indigo-400',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-500',
  rock: 'bg-yellow-800',
  ghost: 'bg-purple-700',
  dragon: 'bg-indigo-700',
  dark: 'bg-gray-800',
  steel: 'bg-gray-500',
  fairy: 'bg-pink-300',
};

export const STAT_COLORS: Record<string, string> = {
  hp: 'bg-green-500',
  attack: 'bg-red-500',
  defense: 'bg-blue-500',
  'special-attack': 'bg-purple-500',
  'special-defense': 'bg-yellow-500',
  speed: 'bg-pink-500',
};