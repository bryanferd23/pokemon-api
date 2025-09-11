/**
 * Image preloader utility for Pokemon sprites
 * Handles critical above-the-fold image preloading for performance optimization
 */

// Critical Pokemon IDs that should be preloaded (from homepage featured list)
const CRITICAL_POKEMON_IDS = [1, 4, 7, 25, 39, 54, 104, 132, 144, 150];

// Sprite URL template for Pokemon images
const getSpriteUrl = (pokemonId: number): string => {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
};

/**
 * Preloads critical Pokemon images that appear above the fold
 * Uses link preload tags for immediate availability
 */
export const preloadCriticalPokemonImages = (): void => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  // Prevent duplicate preloading
  if (document.querySelector('[data-pokemon-preloaded]')) {
    return;
  }

  CRITICAL_POKEMON_IDS.forEach((pokemonId) => {
    const spriteUrl = getSpriteUrl(pokemonId);
    
    // Create link element for preloading
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = spriteUrl;
    link.setAttribute('data-pokemon-preloaded', 'true');
    
    // Add to document head
    document.head.appendChild(link);
  });
};

/**
 * Preloads a specific Pokemon image
 * @param pokemonId - ID of the Pokemon to preload
 */
export const preloadPokemonImage = (pokemonId: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload Pokemon ${pokemonId}`));
    
    img.src = getSpriteUrl(pokemonId);
  });
};

/**
 * Batch preload multiple Pokemon images
 * @param pokemonIds - Array of Pokemon IDs to preload
 */
export const preloadMultiplePokemonImages = async (pokemonIds: number[]): Promise<void> => {
  try {
    await Promise.all(pokemonIds.map(id => preloadPokemonImage(id)));
  } catch (error) {
    console.warn('Some Pokemon images failed to preload:', error);
  }
};

/**
 * Check if critical images should be preloaded based on route
 * @param pathname - Current pathname
 */
export const shouldPreloadCriticalImages = (pathname: string): boolean => {
  // Preload critical images on homepage and browse page
  return pathname === '/' || pathname === '/browse';
};