'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  Ruler, 
  Weight, 
  Zap, 
  RotateCcw,
  AlertCircle,
  ArrowLeft 
} from 'lucide-react';
import { Pokemon, PokemonSpecies } from '@/lib/types/pokemon';
import { TYPE_COLORS, STAT_COLORS } from '@/lib/types/pokemon';
import { 
  getPokemonSprite, 
  formatHeight, 
  formatWeight, 
  formatPokemonDescription 
} from '@/lib/api/pokemon';
import { 
  addToPokédeck, 
  removeFromPokédeck, 
  isInPokédeck 
} from '@/lib/store/pokedeck';
import { cn } from '@/lib/utils';

interface PokemonDetailsProps {
  pokemon: Pokemon | null;
  species?: PokemonSpecies | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onBack?: () => void;
  className?: string;
}

const STAT_NAMES: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Attack',
  'special-defense': 'Sp. Defense',
  speed: 'Speed',
};

export function PokemonDetails({
  pokemon,
  species,
  isLoading = false,
  error = null,
  onRetry,
  onBack,
  className
}: PokemonDetailsProps) {
  const [isInDeck, setIsInDeck] = useState(false);
  const [isUpdatingDeck, setIsUpdatingDeck] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (pokemon) {
      setIsInDeck(isInPokédeck(pokemon.id));
    }
  }, [pokemon]);

  const handlePokedeckToggle = async () => {
    if (!pokemon) return;
    
    setIsUpdatingDeck(true);
    
    try {
      if (isInDeck) {
        removeFromPokédeck(pokemon.id);
        setIsInDeck(false);
      } else {
        const success = addToPokédeck({
          id: pokemon.id,
          name: pokemon.name,
          sprite: getPokemonSprite(pokemon),
          types: pokemon.types.map(t => t.type.name),
        });
        
        if (success) {
          setIsInDeck(true);
        }
      }
    } catch (error) {
      console.error('Error toggling Pokédeck:', error);
    }
    
    setIsUpdatingDeck(false);
  };

  const formatPokemonId = (id: number) => `#${id.toString().padStart(3, '0')}`;

  const getStatPercentage = (baseStat: number) => {
    // Max base stat in Pokemon is around 255 (Shuckle's Defense)
    return Math.min((baseStat / 255) * 100, 100);
  };

  // Error state
  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        {onBack && (
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
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
        {onBack && (
          <Button variant="outline" disabled className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-10 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Skeleton className="h-64 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="mx-auto max-w-md">
          <div className="mx-auto h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Pokemon not found</h3>
          <p className="text-muted-foreground">
            The requested Pokemon could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Back Button */}
      {onBack && (
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      )}

      {/* Main Pokemon Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl capitalize flex items-center gap-3">
                {pokemon.name}
                <span className="text-lg text-muted-foreground font-normal">
                  {formatPokemonId(pokemon.id)}
                </span>
              </CardTitle>
              <div className="flex gap-2 mt-2">
                {pokemon.types.map((typeInfo) => (
                  <Badge
                    key={typeInfo.type.name}
                    className={cn(
                      'text-white capitalize',
                      TYPE_COLORS[typeInfo.type.name] || 'bg-slate-400'
                    )}
                  >
                    {typeInfo.type.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            <Button
              size="lg"
              variant={isInDeck ? "default" : "outline"}
              onClick={handlePokedeckToggle}
              disabled={isUpdatingDeck}
              className={cn(
                "gap-2",
                isInDeck 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "hover:bg-primary hover:text-primary-foreground"
              )}
            >
              {isUpdatingDeck ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : isInDeck ? (
                <Heart className="h-4 w-4 fill-current" />
              ) : (
                <Heart className="h-4 w-4" />
              )}
              {isInDeck ? 'Remove from Pokédeck' : 'Add to Pokédeck'}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pokemon Image and Basic Info */}
            <div className="space-y-4">
              <div className="flex justify-center">
                {!imageError ? (
                  <Image
                    src={getPokemonSprite(pokemon)}
                    alt={pokemon.name}
                    width={256}
                    height={256}
                    className="object-contain"
                    onError={() => setImageError(true)}
                    priority
                  />
                ) : (
                  <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">No Image Available</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center mb-2">
                      <Ruler className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="font-semibold">{formatHeight(pokemon.height)}</div>
                    <div className="text-xs text-muted-foreground">Height</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center mb-2">
                      <Weight className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="font-semibold">{formatWeight(pokemon.weight)}</div>
                    <div className="text-xs text-muted-foreground">Weight</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center mb-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="font-semibold">{pokemon.base_experience || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">Base Exp</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Detailed Information Tabs */}
            <div>
              <Tabs defaultValue="stats" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                  <TabsTrigger value="abilities">Abilities</TabsTrigger>
                  <TabsTrigger value="about">About</TabsTrigger>
                </TabsList>

                {/* Stats Tab */}
                <TabsContent value="stats" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Base Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {pokemon.stats.map((stat) => (
                        <div key={stat.stat.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="capitalize font-medium">
                              {STAT_NAMES[stat.stat.name] || stat.stat.name}
                            </span>
                            <span className="font-bold">{stat.base_stat}</span>
                          </div>
                          <Progress
                            value={getStatPercentage(stat.base_stat)}
                            className="h-2"
                            style={{
                              // @ts-expect-error - CSS custom property not recognized by TypeScript
                              '--progress-background': STAT_COLORS[stat.stat.name] || '#64748b'
                            }}
                          />
                        </div>
                      ))}
                      
                      {/* Total Stats */}
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between font-semibold">
                          <span>Total</span>
                          <span>{pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Abilities Tab */}
                <TabsContent value="abilities" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Abilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {pokemon.abilities.map((abilityInfo) => (
                          <div 
                            key={abilityInfo.ability.name}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <div className="font-medium capitalize">
                                {abilityInfo.ability.name.replace('-', ' ')}
                              </div>
                              {abilityInfo.is_hidden && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  Hidden Ability
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Slot {abilityInfo.slot}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* About Tab */}
                <TabsContent value="about" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">About</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {species && (
                          <div>
                            <h4 className="font-medium mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {formatPokemonDescription(species)}
                            </p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Species:</span>
                            <span className="ml-2 capitalize">
                              {species?.genera.find(g => g.language.name === 'en')?.genus || 'Unknown'}
                            </span>
                          </div>
                          
                          <div>
                            <span className="font-medium">Order:</span>
                            <span className="ml-2">{pokemon.order}</span>
                          </div>
                          
                          {species?.color && (
                            <div>
                              <span className="font-medium">Color:</span>
                              <span className="ml-2 capitalize">{species.color.name}</span>
                            </div>
                          )}
                          
                          {species?.habitat && (
                            <div>
                              <span className="font-medium">Habitat:</span>
                              <span className="ml-2 capitalize">{species.habitat.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PokemonDetails;