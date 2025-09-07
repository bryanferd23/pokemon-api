'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Navigation } from 'lucide-react';
import { Pokemon, PokemonSpecies } from '@/lib/types/pokemon';
import { fetchPokemonByName, fetchPokemonSpecies } from '@/lib/api/pokemon';
import { PokemonDetails } from '@/components/pokemon/PokemonDetails';

interface PokemonPageProps {
  params: Promise<{
    name: string;
  }>;
}

export default function PokemonPage({ params }: PokemonPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pokemonName = decodeURIComponent(resolvedParams.name);

  const loadPokemon = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch Pokemon data
      const pokemonData = await fetchPokemonByName(pokemonName);
      setPokemon(pokemonData);

      // Fetch species data for additional info
      try {
        const speciesData = await fetchPokemonSpecies(pokemonData.id);
        setSpecies(speciesData);
      } catch (speciesError) {
        console.warn('Could not load species data:', speciesError);
        // Species data is optional, continue without it
      }
    } catch (err) {
      console.error('Error loading Pokemon:', err);
      
      // Check if it's a 404 error
      if (err instanceof Error && err.message.includes('404')) {
        notFound();
        return;
      }
      
      setError('Failed to load Pokémon details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [pokemonName]);

  useEffect(() => {
    loadPokemon();
  }, [loadPokemon]);

  const handleBack = () => {
    // Check if user came from within the app
    if (document.referrer && document.referrer.includes(window.location.origin)) {
      router.back();
    } else {
      // Fallback to browse page
      router.push('/browse');
    }
  };

  const handleRetry = () => {
    loadPokemon();
  };

  // Navigation between Pokemon
  const navigateToPokemon = (direction: 'prev' | 'next') => {
    if (!pokemon) return;
    
    const newId = direction === 'prev' ? pokemon.id - 1 : pokemon.id + 1;
    
    // Validate ID range (assuming Pokemon IDs go up to ~1010)
    if (newId < 1 || newId > 1010) return;
    
    router.push(`/pokemon/${newId}`);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation Controls */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {pokemon && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPokemon('prev')}
              disabled={pokemon.id <= 1}
              className="gap-2"
            >
              <Navigation className="h-4 w-4 rotate-180" />
              #{(pokemon.id - 1).toString().padStart(3, '0')}
            </Button>
            
            <div className="px-3 py-1 bg-muted rounded-md text-sm font-medium">
              #{pokemon.id.toString().padStart(3, '0')}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPokemon('next')}
              disabled={pokemon.id >= 1010}
              className="gap-2"
            >
              #{(pokemon.id + 1).toString().padStart(3, '0')}
              <Navigation className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Pokemon Details */}
      <PokemonDetails
        pokemon={pokemon}
        species={species}
        isLoading={isLoading}
        error={error}
        onRetry={handleRetry}
      />

      {/* Related Pokemon Section */}
      {pokemon && !isLoading && !error && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">More Pokémon</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Previous Pokemon */}
            {pokemon.id > 1 && (
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-muted"
                onClick={() => navigateToPokemon('prev')}
              >
                <Navigation className="h-5 w-5 rotate-180" />
                <div className="text-center">
                  <div className="font-medium">Previous Pokémon</div>
                  <div className="text-sm text-muted-foreground">
                    #{(pokemon.id - 1).toString().padStart(3, '0')}
                  </div>
                </div>
              </Button>
            )}

            {/* Browse All */}
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-muted"
              onClick={() => router.push('/browse')}
            >
              <div className="grid grid-cols-2 gap-1">
                <div className="w-2 h-2 bg-current rounded-full"></div>
                <div className="w-2 h-2 bg-current rounded-full"></div>
                <div className="w-2 h-2 bg-current rounded-full"></div>
                <div className="w-2 h-2 bg-current rounded-full"></div>
              </div>
              <div className="text-center">
                <div className="font-medium">Browse All</div>
                <div className="text-sm text-muted-foreground">
                  Discover more Pokémon
                </div>
              </div>
            </Button>

            {/* Next Pokemon */}
            {pokemon.id < 1010 && (
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-muted"
                onClick={() => navigateToPokemon('next')}
              >
                <Navigation className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-medium">Next Pokémon</div>
                  <div className="text-sm text-muted-foreground">
                    #{(pokemon.id + 1).toString().padStart(3, '0')}
                  </div>
                </div>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

