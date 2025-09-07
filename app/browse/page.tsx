'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SearchBar } from '@/components/pokemon/SearchBar';
import { PokemonList } from '@/components/pokemon/PokemonList';
import { LayoutGrid, List, RotateCcw } from 'lucide-react';
import { Pokemon, SearchFilters, PaginationInfo } from '@/lib/types/pokemon';
import { fetchPokemonList, searchPokemon, fetchPokemonByType } from '@/lib/api/pokemon';

function BrowsePageContent() {
  const searchParams = useSearchParams();
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    limit: 20,
    offset: 0,
    total: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Initialize with URL params
  useEffect(() => {
    const q = searchParams.get('q');
    const type = searchParams.get('type');
    const sortBy = searchParams.get('sortBy') as SearchFilters['sortBy'];
    const sortOrder = searchParams.get('sortOrder') as SearchFilters['sortOrder'];

    if (q) setSearchQuery(q);
    if (type || sortBy || sortOrder) {
      setFilters({
        type: type || undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || 'asc',
      });
    }
  }, [searchParams]);

  const loadPokemon = useCallback(async (
    limit: number = 20, 
    offset: number = 0, 
    query: string = '', 
    currentFilters: SearchFilters = {}
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      let result;
      let pokemonData: Pokemon[] = [];
      let paginationData: PaginationInfo;

      if (query.trim()) {
        // Search mode
        const searchResults = await searchPokemon(query);
        pokemonData = searchResults.slice(offset, offset + limit);
        paginationData = {
          limit,
          offset,
          total: searchResults.length,
          hasNext: offset + limit < searchResults.length,
          hasPrevious: offset > 0,
        };
      } else if (currentFilters.type) {
        // Filter by type
        const typeResults = await fetchPokemonByType(currentFilters.type);
        pokemonData = typeResults.slice(offset, offset + limit);
        paginationData = {
          limit,
          offset,
          total: typeResults.length,
          hasNext: offset + limit < typeResults.length,
          hasPrevious: offset > 0,
        };
      } else {
        // Normal pagination
        result = await fetchPokemonList(limit, offset);
        pokemonData = result.pokemon;
        paginationData = result.pagination;
      }

      setPokemon(pokemonData);
      setPagination(paginationData);
    } catch (err) {
      console.error('Error loading Pokemon:', err);
      setError('Failed to load Pokémon. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPokemon(pagination.limit, 0, searchQuery, filters);
  }, [loadPokemon, pagination.limit, searchQuery, filters]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
    loadPokemon(pagination.limit, 0, query, filters);
  }, [pagination.limit, filters, loadPokemon]);

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
    loadPokemon(pagination.limit, 0, searchQuery, newFilters);
  }, [pagination.limit, searchQuery, loadPokemon]);

  const handlePageChange = useCallback((newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
    loadPokemon(pagination.limit, newOffset, searchQuery, filters);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pagination.limit, searchQuery, filters, loadPokemon]);

  const handleRetry = () => {
    loadPokemon(pagination.limit, pagination.offset, searchQuery, filters);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({});
    setPagination(prev => ({ ...prev, offset: 0 }));
    loadPokemon(pagination.limit, 0, '', {});
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    url.searchParams.delete('type');
    url.searchParams.delete('sortBy');
    url.searchParams.delete('sortOrder');
    window.history.replaceState({}, '', url);
  };

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
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <SearchBar
            onSearch={handleSearch}
            onFiltersChange={handleFiltersChange}
            placeholder="Search Pokémon by name, type, or ID..."
            showFilters={true}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Pokemon List */}
      <PokemonList
        pokemon={pokemon}
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