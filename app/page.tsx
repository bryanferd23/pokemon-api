'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchBar } from '@/components/pokemon/SearchBar';
import { PokemonCard } from '@/components/pokemon/PokemonCard';
import { 
  Zap, 
  Search, 
  Heart, 
  TrendingUp, 
  ArrowRight,
  Sparkles 
} from 'lucide-react';
import { Pokemon, SearchFilters } from '@/lib/types/pokemon';
import { fetchPokemonList, searchPokemon } from '@/lib/api/pokemon';
import { getPokédeckCount } from '@/lib/store/pokedeck';
import { preloadCriticalPokemonImages } from '@/lib/utils/image-preloader';

export default function Home() {
  const [featuredPokemon, setFeaturedPokemon] = useState<Pokemon[]>([]);
  const [searchResults, setSearchResults] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pokedeckCount, setPokedeckCount] = useState(0);

  const loadFeaturedPokemon = useCallback(async () => {
    try {
      setIsLoading(true);
      // Featured Pokemon IDs (popular/iconic ones)
      const featuredIds = [1, 4, 7, 25, 39, 54, 104, 132, 144, 150]; // Bulbasaur, Charmander, Squirtle, Pikachu, etc.
      // Fetch featured Pokemon by their IDs
      const { pokemon } = await fetchPokemonList(150, 0); // Get first 150 to include featured ones
      const featured = pokemon.filter(p => featuredIds.includes(p.id));
      setFeaturedPokemon(featured);
    } catch (error) {
      console.error('Error loading featured Pokemon:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeaturedPokemon();
    setPokedeckCount(getPokédeckCount());
    // Preload critical Pokemon images for immediate availability
    preloadCriticalPokemonImages();
  }, [loadFeaturedPokemon]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchPokemon(query);
      setSearchResults(results.slice(0, 8)); // Limit to 8 results for preview
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleFiltersChange = useCallback((filters: SearchFilters) => {
    // For home page, we can ignore filters or implement basic filtering
    console.log('Filters changed:', filters);
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="text-center py-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Zap className="h-12 w-12 text-yellow-500" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pokédeck
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Discover, collect, and learn about all your favorite Pokémon
          </p>

          <div className="max-w-md mx-auto mb-8">
            <SearchBar
              onSearch={handleSearch}
              onFiltersChange={handleFiltersChange}
              placeholder="Search for any Pokémon..."
              showFilters={false}
              isLoading={isSearching}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse">
              <Button size="lg" className="gap-2">
                <Search className="h-5 w-5" />
                Browse All Pokémon
              </Button>
            </Link>
            
            <Link href="/pokedeck">
              <Button variant="outline" size="lg" className="gap-2">
                <Heart className="h-5 w-5" />
                My Pokédeck ({pokedeckCount})
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searchQuery && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Search className="h-6 w-6" />
              Search Results
            </h2>
            {searchResults.length > 0 && (
              <Link href={`/browse?q=${encodeURIComponent(searchQuery)}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  View All Results
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

          {isSearching ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-fr">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-72 w-full aspect-[3/4] bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-fr">
              {searchResults.map((pokemon) => (
                <PokemonCard key={pokemon.id} pokemon={pokemon} />
              ))}
            </div>
          ) : searchQuery ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No Pokémon found for &ldquo;{searchQuery}&rdquo;
                </p>
                <Link href="/browse">
                  <Button variant="outline" className="mt-4">
                    Browse All Pokémon
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : null}
        </section>
      )}

      {/* Stats Section */}
      <section className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pokémon</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,000+</div>
            <p className="text-xs text-muted-foreground">
              Pokémon available to discover
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Collection</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pokedeckCount}</div>
            <p className="text-xs text-muted-foreground">
              Pokémon in your Pokédeck
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Types Available</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              Different Pokémon types
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Featured Pokemon */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Featured Pokémon
          </h2>
          <Link href="/browse">
            <Button variant="outline" className="gap-2">
              Browse All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-fr">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-72 w-full aspect-[3/4] bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-fr">
            {featuredPokemon.map((pokemon) => (
              <PokemonCard key={pokemon.id} pokemon={pokemon} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="text-center py-16">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold mb-4">
            Start building your collection today!
          </h3>
          <p className="text-lg text-muted-foreground mb-8">
            Explore thousands of Pokémon, learn about their abilities, and create your perfect team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse">
              <Button size="lg" className="gap-2">
                Start Exploring
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
