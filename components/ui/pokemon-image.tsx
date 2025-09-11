/**
 * Pokemon Image component with enhanced error handling and performance optimization
 */

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface PokemonImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  pokemonId?: number;
  sizes?: string;
  fallbackText?: string;
}

const POKEMON_IMAGE_FALLBACKS = [
  // Primary: PokeAPI sprites
  (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
  // Secondary: Official artwork
  (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
  // Tertiary: Front default
  (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/front/default/${id}.png`,
];

export function PokemonImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  pokemonId,
  sizes,
  fallbackText = "No Image"
}: PokemonImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleImageError = useCallback(() => {
    if (pokemonId && fallbackIndex < POKEMON_IMAGE_FALLBACKS.length) {
      // Try next fallback
      const nextFallback = POKEMON_IMAGE_FALLBACKS[fallbackIndex](pokemonId);
      setCurrentSrc(nextFallback);
      setFallbackIndex(prev => prev + 1);
      setIsRetrying(true);
    } else {
      // All fallbacks exhausted
      setHasError(true);
      setIsRetrying(false);
    }
  }, [pokemonId, fallbackIndex]);

  const handleImageLoad = useCallback(() => {
    setIsRetrying(false);
    setHasError(false);
  }, []);

  const retryImageLoad = useCallback(() => {
    setHasError(false);
    setFallbackIndex(0);
    setCurrentSrc(src);
    setIsRetrying(true);
  }, [src]);

  // Base64 blur placeholder
  const blurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAQABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

  if (hasError && !isRetrying) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/20 transition-colors hover:bg-muted/80 cursor-pointer",
          className
        )}
        style={{ width, height }}
        onClick={retryImageLoad}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            retryImageLoad();
          }
        }}
        aria-label="Retry loading image"
      >
        <div className="text-center p-2">
          <div className="text-muted-foreground text-xs mb-1">{fallbackText}</div>
          <div className="text-xs text-muted-foreground/70">Click to retry</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)} style={{ width, height }}>
      {isRetrying && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center z-10">
          <div className="text-xs text-muted-foreground">Loading...</div>
        </div>
      )}
      
      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        className={cn(
          "object-contain transition-all duration-300",
          isRetrying && "opacity-0",
          className
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        placeholder="blur"
        blurDataURL={blurDataURL}
      />
    </div>
  );
}