'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/pokemon/SearchBar';
import { PokemonList } from '@/components/pokemon/PokemonList';
import { LayoutGrid, List, RotateCcw, Zap } from 'lucide-react';
import { Pokemon, SearchFilters, PaginationInfo } from '@/lib/types/pokemon';
import { fetchPokemonList, searchPokemon, fetchPokemonByType } from '@/lib/api/pokemon';
import { 
  useFilteredPokemon, 
  FILTER_PRESETS, 
  filtersToUrlParams, 
  urlParamsToFilters,
  measureFilterPerformance 
} from '@/lib/utils/filtering';

function BrowsePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    limit: 20,
    offset: 0,
    total: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Initialize with URL params using the new utility
  useEffect(() => {
    const q = searchParams.get('q');
    const urlFilters = urlParamsToFilters(searchParams);
    
    if (q) setSearchQuery(q);
    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
  }, [searchParams]);

  // Update URL when filters change
  const updateURL = useCallback((query: string, currentFilters: SearchFilters) => {
    const params = filtersToUrlParams(currentFilters);
    if (query) params.set('q', query);
    
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl);
  }, [pathname, router]);

  // Efficient client-side filtering with memoization
  const filteredPokemon = useMemo(() => {
    if (!allPokemon.length) return [];
    
    return measureFilterPerformance(() => {
      setIsFiltering(true);
      
      let result = allPokemon;
      
      // Apply search query filter
      if (searchQuery?.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(pokemon => 
          pokemon.name.toLowerCase().includes(query) ||
          pokemon.id.toString().includes(query) ||
          pokemon.types.some(type => type.type.name.toLowerCase().includes(query))
        );
      }
      
      // Apply type filter
      if (filters.type) {
        result = result.filter(pokemon => 
          pokemon.types.some(type => type.type.name === filters.type)
        );
      }
      
      // Apply ID range filters
      if (filters.minId !== undefined) {
        result = result.filter(pokemon => pokemon.id >= filters.minId!);
      }
      
      if (filters.maxId !== undefined) {
        result = result.filter(pokemon => pokemon.id <= filters.maxId!);
      }
      
      // Apply preset filters
      if (filters.preset && FILTER_PRESETS[filters.preset as keyof typeof FILTER_PRESETS]) {
        const preset = FILTER_PRESETS[filters.preset as keyof typeof FILTER_PRESETS];
        result = result.filter(pokemon => preset.ids.includes(pokemon.id));
      }
      
      // Apply sorting
      if (filters.sortBy) {
        const sortOrder = filters.sortOrder || 'asc';
        result = [...result].sort((a, b) => {
          let comparison = 0;
          
          switch (filters.sortBy) {
            case 'id':
              comparison = a.id - b.id;
              break;
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'height':
              comparison = a.height - b.height;
              break;
            case 'weight':
              comparison = a.weight - b.weight;
              break;
          }
          
          return sortOrder === 'desc' ? -comparison : comparison;
        });
      }
      
      setTimeout(() => setIsFiltering(false), 0);
      return result;
    }, 'Pokemon Filtering');
  }, [allPokemon, searchQuery, filters]);

  // Paginated results from filtered data
  const paginatedPokemon = useMemo(() => {
    const start = pagination.offset;
    const end = start + pagination.limit;
    return filteredPokemon.slice(start, end);
  }, [filteredPokemon, pagination.offset, pagination.limit]);

  // Update pagination info based on filtered results
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      total: filteredPokemon.length,
      hasNext: prev.offset + prev.limit < filteredPokemon.length,
      hasPrevious: prev.offset > 0
    }));
  }, [filteredPokemon.length, pagination.offset, pagination.limit]);

  // Load all Pokemon data for client-side filtering (more efficient for 1000+ Pokemon)
  const loadAllPokemon = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load a larger dataset for client-side filtering
      const result = await fetchPokemonList(1000, 0); // Load first 1000 Pokemon
      setAllPokemon(result.pokemon);
    } catch (err) {
      console.error('Error loading Pokemon:', err);
      setError('Failed to load Pokémon. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAllPokemon();
  }, [loadAllPokemon]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
    updateURL(query, filters);
  }, [filters, updateURL]);

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
    updateURL(searchQuery, newFilters);
  }, [searchQuery, updateURL]);

  const handlePageChange = useCallback((newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleRetry = () => {
    loadAllPokemon();
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({});
    setPagination(prev => ({ ...prev, offset: 0 }));
    updateURL('', {});
  };

  // Quick filter presets
  const applyPreset = useCallback((presetKey: string) => {
    const newFilters = { ...filters, preset: presetKey };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, offset: 0 }));
    updateURL(searchQuery, newFilters);
  }, [filters, searchQuery, updateURL]);

  const hasActiveFilters = searchQuery || Object.keys(filters).some(key => 
    filters[key as keyof SearchFilters] !== undefined
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Browse Pokémon</h1>
          <p className="text-muted-foreground">
            Discover and explore all Pokémon with advanced search and filtering
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearAllFilters} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Clear All
            </Button>
          )}
          
          <div className="flex rounded-lg border p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Filter Presets */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-sm font-medium text-muted-foreground mr-2">Quick filters:</span>
        {Object.entries(FILTER_PRESETS).map(([key, preset]) => (
          <Badge 
            key={key}
            variant={filters.preset === key ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => applyPreset(key)}
          >
            <Zap className="h-3 w-3 mr-1" />
            {preset.label}
          </Badge>
        ))}
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <SearchBar
            onSearch={handleSearch}
            onFiltersChange={handleFiltersChange}
            placeholder="Search Pokémon by name, type, or ID..."
            showFilters={true}
            isLoading={isLoading || isFiltering}
          />
          
          {/* Performance indicator */}
          {isFiltering && (
            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Filtering {allPokemon.length} Pokemon...
            </div>
          )}
          
          {/* Results summary */}
          {!isLoading && filteredPokemon.length > 0 && (
            <div className="mt-2 text-sm text-muted-foreground">
              Showing {paginatedPokemon.length} of {filteredPokemon.length} Pokemon
              {searchQuery && ` matching "${searchQuery}"`}
              {filters.type && ` of type "${filters.type}"`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pokemon List */}
      <PokemonList
        pokemon={paginatedPokemon}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        searchQuery={searchQuery}
        filters={filters}
        onPageChange={handlePageChange}
        onRetry={handleRetry}
        variant={viewMode}
      />
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <div className="h-8 bg-muted animate-pulse rounded-lg w-48 mb-2" />
            <div className="h-4 bg-muted animate-pulse rounded-lg w-96" />
          </div>
        </div>
        <div className="h-32 bg-muted animate-pulse rounded-lg mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-fr">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="h-72 w-full aspect-[3/4] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    }>
      <BrowsePageContent />
    </Suspense>
  );
}