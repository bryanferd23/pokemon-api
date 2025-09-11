'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Plus, Eye, GitCompare, Check } from 'lucide-react';
import { Pokemon } from '@/lib/types/pokemon';
import { TYPE_COLORS } from '@/lib/types/pokemon';
import { getPokemonSprite } from '@/lib/api/pokemon';
import { addToPokédeck, removeFromPokédeck, isInPokédeck } from '@/lib/store/pokedeck';
import { 
  addToComparison, 
  removeFromComparison, 
  isPokemonInComparison, 
  canAddToComparison,
  isComparisonEnabled 
} from '@/lib/store/comparison';
import { cn } from '@/lib/utils';

interface PokemonCardProps {
  pokemon: Pokemon;
  variant?: 'default' | 'compact';
  showPokedeckButton?: boolean;
  showComparisonButton?: boolean;
  className?: string;
}

export function PokemonCard({ 
  pokemon, 
  variant = 'default',
  showPokedeckButton = true,
  showComparisonButton = true,
  className 
}: PokemonCardProps) {
  const [isInDeck, setIsInDeck] = useState(isInPokédeck(pokemon.id));
  const [isInComparison, setIsInComparison] = useState(isPokemonInComparison(pokemon.id));
  const [isLoading, setIsLoading] = useState(false);
  const [isComparisonLoading, setIsComparisonLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const pokemonSprite = getPokemonSprite(pokemon);

  const handlePokedeckToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if card is wrapped in Link
    e.stopPropagation();
    
    setIsLoading(true);
    
    try {
      if (isInDeck) {
        removeFromPokédeck(pokemon.id);
        setIsInDeck(false);
      } else {
        const success = addToPokédeck({
          id: pokemon.id,
          name: pokemon.name,
          sprite: pokemonSprite,
          types: pokemon.types.map(t => t.type.name),
        });
        
        if (success) {
          setIsInDeck(true);
        }
      }
    } catch (error) {
      console.error('Error toggling Pokédeck:', error);
    }
    
    setIsLoading(false);
  };

  const handleComparisonToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if card is wrapped in Link
    e.stopPropagation();
    
    setIsComparisonLoading(true);
    
    try {
      if (isInComparison) {
        const success = removeFromComparison(pokemon.id);
        if (success) {
          setIsInComparison(false);
        }
      } else {
        const success = addToComparison(pokemon);
        if (success) {
          setIsInComparison(true);
        }
      }
    } catch (error) {
      console.error('Error toggling comparison:', error);
    }
    
    setIsComparisonLoading(false);
  };

  const formatPokemonId = (id: number) => `#${id.toString().padStart(3, '0')}`;

  const cardContent = (
    <Card 
      className={cn(
        'group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 pokemon-card',
        variant === 'compact' ? 'h-48' : 'h-72',
        'w-full aspect-[3/4]', // Fixed aspect ratio
        className
      )}
      role="article"
      aria-label={`${pokemon.name} Pokemon card. ${pokemon.types.map(t => t.type.name).join(' and ')} type. Click to view details.`}
    >
      <CardContent className="p-3 h-full flex flex-col">
        {/* Pokemon ID and Action Buttons */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            {formatPokemonId(pokemon.id)}
          </span>
          
          <div className="flex items-center gap-1">
            {/* Comparison Button */}
            {showComparisonButton && isComparisonEnabled() && (
              <Button
                size="sm"
                variant={isInComparison ? "default" : "outline"}
                onClick={handleComparisonToggle}
                disabled={isComparisonLoading || (!isInComparison && !canAddToComparison())}
                aria-label={isInComparison ? `Remove ${pokemon.name} from comparison` : `Add ${pokemon.name} to comparison`}
                className={cn(
                  "h-8 w-8 p-0 transition-all duration-200",
                  isInComparison 
                    ? "bg-blue-500 hover:bg-blue-600 text-white" 
                    : "hover:bg-primary hover:text-primary-foreground",
                  !canAddToComparison() && !isInComparison && "opacity-50 cursor-not-allowed"
                )}
                title={!canAddToComparison() && !isInComparison ? "Comparison is full (max 3 Pokemon)" : undefined}
              >
                {isComparisonLoading ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : isInComparison ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <GitCompare className="h-3 w-3" />
                )}
              </Button>
            )}
            
            {/* Pokedeck Button */}
            {showPokedeckButton && (
              <Button
                size="sm"
                variant={isInDeck ? "default" : "outline"}
                onClick={handlePokedeckToggle}
                disabled={isLoading}
                aria-label={isInDeck ? `Remove ${pokemon.name} from Pokédeck` : `Add ${pokemon.name} to Pokédeck`}
                className={cn(
                  "h-8 w-8 p-0 transition-all duration-200",
                  isInDeck 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "hover:bg-primary hover:text-primary-foreground"
                )}
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : isInDeck ? (
                  <Heart className="h-4 w-4 fill-current" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Pokemon Image */}
        <div className="flex-1 flex items-center justify-center mb-3 relative min-h-0">
          <div className={cn(
            "relative flex items-center justify-center",
            variant === 'compact' ? 'w-16 h-16' : 'w-20 h-20'
          )}>
            {!imageError ? (
              <Image
                src={pokemonSprite}
                alt={`${pokemon.name}, ${pokemon.types.map(t => t.type.name).join(' and ')} type Pokemon. Height: ${pokemon.height}, Weight: ${pokemon.weight}${pokemon.base_experience ? `, Base experience: ${pokemon.base_experience}` : ''}`}
                width={variant === 'compact' ? 64 : 80}
                height={variant === 'compact' ? 64 : 80}
                sizes={variant === 'compact' ? '64px' : '80px'}
                className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-110"
                onError={() => setImageError(true)}
                priority={pokemon.id <= 20} // Priority for first 20 Pokemon (above the fold)
                loading={pokemon.id <= 20 ? 'eager' : 'lazy'} // Explicit lazy loading
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />
            ) : (
              <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground text-xs">No Image</span>
              </div>
            )}
          </div>
        </div>

        {/* Pokemon Name */}
        <h3 className={cn(
          "font-semibold capitalize text-center mb-2 line-clamp-1",
          variant === 'compact' ? 'text-sm' : 'text-base'
        )}>
          {pokemon.name}
        </h3>

        {/* Pokemon Types */}
        <div className="flex flex-wrap gap-1 justify-center mb-2">
          {pokemon.types.map((typeInfo) => (
            <Badge
              key={typeInfo.type.name}
              variant="secondary"
              className={cn(
                'text-white capitalize font-medium',
                variant === 'compact' ? 'text-xs px-2 py-0.5' : 'text-xs px-2 py-1',
                TYPE_COLORS[typeInfo.type.name] || 'bg-slate-400'
              )}
            >
              {typeInfo.type.name}
            </Badge>
          ))}
        </div>

        {/* Stats Preview (only in default variant) */}
        {variant === 'default' && (
          <div className="mt-auto grid grid-cols-3 gap-1 text-xs text-muted-foreground pt-2">
            <div className="text-center">
              <div className="font-medium">{pokemon.height}</div>
              <div className="text-[10px]">Height</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{pokemon.weight}</div>
              <div className="text-[10px]">Weight</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{pokemon.base_experience || 'N/A'}</div>
              <div className="text-[10px]">Exp</div>
            </div>
          </div>
        )}

        {/* Hover overlay for details link */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button size="sm" variant="secondary" className="gap-2">
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Wrap in Link for navigation to details page
  return (
    <Link
      href={`/pokemon/${pokemon.name}`}
      className="block transition-transform duration-200 hover:scale-[0.98] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-lg"
      aria-describedby={`pokemon-${pokemon.id}-description`}
    >
      {cardContent}
      <div id={`pokemon-${pokemon.id}-description`} className="sr-only">
        {pokemon.name} is a {pokemon.types.map(t => t.type.name).join(' and ')} type Pokemon with ID {pokemon.id}. 
        Height: {pokemon.height}, Weight: {pokemon.weight}
        {pokemon.base_experience && `, Base experience: ${pokemon.base_experience}`}.
        Click to view full details and stats.
      </div>
    </Link>
  );
}

export default PokemonCard;