'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  Search, 
  Download, 
  Upload, 
  Trash2, 
  SortAsc, 
  SortDesc,
  Calendar,
  Hash,
  Type,
  AlertCircle,
  Plus,
  LayoutGrid,
  List
} from 'lucide-react';
import { PokedeckEntry } from '@/lib/types/pokemon';
import { TYPE_COLORS } from '@/lib/types/pokemon';
import { 
  pokedeckStore,
  getPokédeckStats,
  searchPokédeck,
  exportPokédeckAsync,
  removeMultipleFromPokédeck,
  getPokedeckPerformanceStats
} from '@/lib/store/pokedeck';
import { cn } from '@/lib/utils';

type SortBy = 'name' | 'id' | 'dateAdded';

export default function PokedeckPage() {
  const [pokedeck, setPokedeck] = useState<PokedeckEntry[]>([]);
  const [filteredPokedeck, setFilteredPokedeck] = useState<PokedeckEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPokemon, setSelectedPokemon] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    // Initial load
    const loadPokedeck = () => {
      const entries = pokedeckStore.getAllSorted(sortBy);
      setPokedeck(entries);
      setIsLoading(false);
    };

    loadPokedeck();

    // Subscribe to changes
    const unsubscribe = pokedeckStore.subscribe(() => {
      const entries = pokedeckStore.getAllSorted(sortBy);
      setPokedeck(entries);
    });

    return unsubscribe;
  }, [sortBy]);

  // Filter and sort pokemon
  useEffect(() => {
    let filtered = [...pokedeck];

    // Text search
    if (searchQuery.trim()) {
      filtered = searchPokédeck(searchQuery);
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter(entry =>
        entry.types.some(type => type.toLowerCase() === selectedType.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number = a[sortBy];
      let bValue: string | number = b[sortBy];

      if (sortBy === 'name') {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else if (sortBy === 'dateAdded') {
        aValue = new Date(a.dateAdded).getTime();
        bValue = new Date(b.dateAdded).getTime();
      }

      const comparison = sortBy === 'id' || sortBy === 'dateAdded'
        ? (aValue as number) - (bValue as number)
        : (aValue as string).localeCompare(bValue as string);

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredPokedeck(filtered);
  }, [pokedeck, searchQuery, selectedType, sortBy, sortOrder]);

  const stats = getPokédeckStats();
  const uniqueTypes = Array.from(
    new Set(pokedeck.flatMap(entry => entry.types))
  ).sort();

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType(null);
    setSortBy('dateAdded');
    setSortOrder('desc');
  };

  // Selection functions
  const toggleSelection = (pokemonId: number) => {
    const newSelected = new Set(selectedPokemon);
    if (newSelected.has(pokemonId)) {
      newSelected.delete(pokemonId);
    } else {
      newSelected.add(pokemonId);
    }
    setSelectedPokemon(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(filteredPokedeck.map(p => p.id));
    setSelectedPokemon(allIds);
  };

  const deselectAll = () => {
    setSelectedPokemon(new Set());
  };

  const deleteSelected = async () => {
    if (selectedPokemon.size === 0) return;
    
    const count = selectedPokemon.size;
    if (!confirm(`Are you sure you want to remove ${count} Pokémon from your Pokédeck? This action cannot be undone.`)) {
      return;
    }
    
    const ids = Array.from(selectedPokemon);
    const result = removeMultipleFromPokédeck(ids);
    
    setSelectedPokemon(new Set());
    setIsSelectionMode(false);
    
    alert(`Successfully removed ${result.removed} Pokémon from your Pokédeck.`);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedPokemon(new Set());
    }
  };

  const exportPokedeck = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const data = await exportPokédeckAsync((progress) => {
        setExportProgress(progress);
      });
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pokedeck-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const importPokedeck = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const success = pokedeckStore.import(data);
        if (success) {
          alert('Pokédeck imported successfully!');
        } else {
          alert('Failed to import Pokédeck. Please check the file format.');
        }
      } catch {
        alert('Failed to import Pokédeck. Invalid file.');
      }
    };
    reader.readAsText(file);
  };

  const clearPokedeck = () => {
    if (confirm('Are you sure you want to clear your entire Pokédeck? This action cannot be undone.')) {
      pokedeckStore.clear();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="h-8 bg-muted animate-pulse rounded-lg w-48" />
          <div className="grid md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="h-16 bg-muted animate-pulse rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Heart className="h-8 w-8 text-red-500" />
            My Pokédeck
          </h1>
          <p className="text-muted-foreground">
            Your personal collection of {pokedeck.length} Pokémon
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            onClick={exportPokedeck} 
            disabled={isExporting}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? `Exporting... ${Math.round(exportProgress)}%` : 'Export'}
          </Button>
          
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={importPokedeck}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
          
          {pokedeck.length > 0 && (
            <Button
              variant="outline"
              onClick={toggleSelectionMode}
              className="gap-2"
            >
              <Type className="h-4 w-4" />
              {isSelectionMode ? 'Cancel' : 'Select'}
            </Button>
          )}
          
          {pokedeck.length > 0 && (
            <Button
              variant="outline"
              onClick={clearPokedeck}
              className="gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {pokedeck.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your Pokédeck is empty</h3>
            <p className="text-muted-foreground mb-6">
              Start building your collection by adding Pokémon you discover!
            </p>
            <Link href="/browse">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Browse Pokémon
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pokémon</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Types Collected</CardTitle>
                <Type className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(stats.typeBreakdown).length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">First Caught</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {stats.oldestEntry ? formatDate(stats.oldestEntry.dateAdded) : 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latest Addition</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {stats.newestEntry ? formatDate(stats.newestEntry.dateAdded) : 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search your Pokédeck..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Sort */}
                  <div className="flex items-center gap-1 border rounded-lg p-1">
                    <Button
                      variant={sortBy === 'name' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSortBy('name')}
                      className="h-7 text-xs"
                    >
                      Name
                    </Button>
                    <Button
                      variant={sortBy === 'id' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSortBy('id')}
                      className="h-7 text-xs"
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      ID
                    </Button>
                    <Button
                      variant={sortBy === 'dateAdded' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSortBy('dateAdded')}
                      className="h-7 text-xs"
                    >
                      Date
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSortOrder}
                    className="h-7 w-7 p-0"
                  >
                    {sortOrder === 'desc' ? 
                      <SortDesc className="h-3 w-3" /> : 
                      <SortAsc className="h-3 w-3" />
                    }
                  </Button>

                  {/* Type Filter */}
                  <div className="flex flex-wrap gap-1">
                    {uniqueTypes.map((type) => (
                      <Badge
                        key={type}
                        variant={selectedType === type ? "default" : "outline"}
                        className={cn(
                          'cursor-pointer capitalize text-xs',
                          selectedType === type && (TYPE_COLORS[type] || 'bg-slate-400'),
                          selectedType === type && 'text-white'
                        )}
                        onClick={() => setSelectedType(selectedType === type ? null : type)}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>

                  {/* Clear Filters */}
                  {(searchQuery || selectedType || sortBy !== 'dateAdded' || sortOrder !== 'desc') && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}

                  {/* View Mode Toggle */}
                  <div className="flex rounded-lg border p-1 ml-auto">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-7 w-7 p-0"
                    >
                      <LayoutGrid className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-7 w-7 p-0"
                    >
                      <List className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {filteredPokedeck.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No Pokémon found matching your current filters.
                <Button variant="link" className="h-auto p-0 ml-2" onClick={clearFilters}>
                  Clear filters
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredPokedeck.length} of {pokedeck.length} Pokémon
                  {isSelectionMode && selectedPokemon.size > 0 && (
                    <span className="ml-2 font-medium">
                      ({selectedPokemon.size} selected)
                    </span>
                  )}
                </p>
                
                {/* Bulk Actions */}
                {isSelectionMode && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={selectAll}
                      disabled={filteredPokedeck.length === selectedPokemon.size}
                    >
                      Select All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={deselectAll}
                      disabled={selectedPokemon.size === 0}
                    >
                      Deselect All
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={deleteSelected}
                      disabled={selectedPokemon.size === 0}
                      className="gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete ({selectedPokemon.size})
                    </Button>
                  </div>
                )}
              </div>

              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                  : "space-y-4"
              )}>
                {filteredPokedeck.map((entry) => (
                  <div key={entry.id} className="relative">
                    {isSelectionMode && (
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedPokemon.has(entry.id)}
                          onChange={() => toggleSelection(entry.id)}
                          className="h-4 w-4 rounded border-gray-300"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                    <Link
                      href={`/pokemon/${entry.name}`}
                      className={cn(
                        "block transition-transform duration-200 hover:scale-[0.98]",
                        isSelectionMode && "pointer-events-none"
                      )}
                      onClick={(e) => {
                        if (isSelectionMode) {
                          e.preventDefault();
                          toggleSelection(entry.id);
                        }
                      }}
                    >
                      <Card className={cn(
                        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/20",
                        isSelectionMode && selectedPokemon.has(entry.id) && "ring-2 ring-primary",
                        isSelectionMode && "cursor-pointer"
                      )}>
                      <CardContent className={cn(
                        "p-4 flex",
                        viewMode === 'grid' ? 'flex-col items-center text-center h-64' : 'items-center space-x-4 h-24'
                      )}>
                        {/* Pokemon Image */}
                        <div className={cn(
                          viewMode === 'grid' ? 'mb-3' : 'flex-shrink-0'
                        )}>
                          <Image
                            src={entry.sprite}
                            alt={`${entry.name} - ${entry.types.join(', ')} type Pokemon from your Pokedeck collection`}
                            width={viewMode === 'grid' ? 96 : 64}
                            height={viewMode === 'grid' ? 96 : 64}
                            sizes={viewMode === 'grid' ? '96px' : '64px'}
                            className="object-contain transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAQABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                          />
                        </div>

                        <div className={cn(
                          viewMode === 'grid' ? 'w-full space-y-2' : 'flex-1 min-w-0'
                        )}>
                          {/* Pokemon Info */}
                          <div className={cn(
                            viewMode === 'grid' ? 'space-y-1' : 'flex items-center justify-between'
                          )}>
                            <h3 className="font-semibold capitalize truncate">
                              {entry.name}
                            </h3>
                            <span className="text-sm text-muted-foreground">
                              #{entry.id.toString().padStart(3, '0')}
                            </span>
                          </div>

                          {/* Types */}
                          <div className={cn(
                            "flex gap-1",
                            viewMode === 'grid' ? 'justify-center' : 'justify-start'
                          )}>
                            {entry.types.slice(0, 2).map((type) => (
                              <Badge
                                key={type}
                                className={cn(
                                  'text-white text-xs capitalize',
                                  TYPE_COLORS[type] || 'bg-slate-400'
                                )}
                              >
                                {type}
                              </Badge>
                            ))}
                          </div>

                          {/* Date Added */}
                          {viewMode === 'grid' && (
                            <div className="text-xs text-muted-foreground">
                              Added {formatDate(entry.dateAdded)}
                            </div>
                          )}
                        </div>

                        {viewMode === 'list' && (
                          <div className="text-xs text-muted-foreground text-right">
                            {formatDate(entry.dateAdded)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}