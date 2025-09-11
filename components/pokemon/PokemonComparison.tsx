'use client';

import React, { memo, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Zap, Shield, TrendingUp, Activity, Target, Scale } from 'lucide-react';
import { Pokemon } from '@/lib/types/pokemon';
import { TYPE_COLORS } from '@/lib/types/pokemon';
import { getPokemonSprite } from '@/lib/api/pokemon';
import { cn } from '@/lib/utils';

interface PokemonComparisonProps {
  pokemon: Pokemon[];
  onRemove: (pokemonId: number) => void;
  onClear: () => void;
  className?: string;
}

// Memoized stat comparison component to prevent unnecessary re-renders
const StatComparison = memo<{
  label: string;
  values: number[];
  pokemonNames: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}>(({ label, values, pokemonNames, icon: Icon, color }) => {
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className={cn('h-4 w-4', color)} />
        {label}
      </div>
      <div className="space-y-1">
        {values.map((value, index) => (
          <div key={pokemonNames[index]} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground capitalize">{pokemonNames[index]}</span>
            <div className="flex items-center gap-2">
              <div className="relative w-16 h-2 bg-muted rounded-full">
                <div 
                  className={cn(
                    'absolute top-0 left-0 h-full rounded-full transition-all',
                    value === maxValue ? 'bg-green-500' : 
                    value === minValue && values.length > 1 ? 'bg-red-500' : 'bg-blue-500'
                  )}
                  style={{ width: `${(value / maxValue) * 100}%` }}
                />
              </div>
              <span className={cn(
                'text-sm font-medium',
                value === maxValue ? 'text-green-600' :
                value === minValue && values.length > 1 ? 'text-red-600' : 'text-foreground'
              )}>
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

StatComparison.displayName = 'StatComparison';

// Memoized Pokemon card for comparison to prevent unnecessary re-renders
const ComparisonPokemonCard = memo<{
  pokemon: Pokemon;
  onRemove: (id: number) => void;
  isFirst?: boolean;
}>(({ pokemon, onRemove, isFirst = false }) => {
  const sprite = getPokemonSprite(pokemon);
  
  const handleRemove = useCallback(() => {
    onRemove(pokemon.id);
  }, [pokemon.id, onRemove]);
  
  return (
    <Card className={cn(
      'relative min-h-[200px] transition-all duration-200',
      isFirst ? 'border-primary shadow-md' : 'hover:shadow-md'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg capitalize">{pokemon.name}</CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemove}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${pokemon.name} from comparison`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          #{pokemon.id.toString().padStart(3, '0')}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-col items-center space-y-4">
          {/* Pokemon Image */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <Image
              src={sprite}
              alt={`${pokemon.name} sprite`}
              width={80}
              height={80}
              className="object-contain"
              loading="lazy"
            />
          </div>
          
          {/* Pokemon Types */}
          <div className="flex flex-wrap gap-1 justify-center">
            {pokemon.types.map((typeInfo) => (
              <Badge
                key={typeInfo.type.name}
                variant="secondary"
                className={cn(
                  'text-white text-xs px-2 py-1',
                  TYPE_COLORS[typeInfo.type.name] || 'bg-slate-400'
                )}
              >
                {typeInfo.type.name}
              </Badge>
            ))}
          </div>
          
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-2 text-sm w-full">
            <div className="text-center">
              <div className="text-muted-foreground">Height</div>
              <div className="font-medium">{pokemon.height / 10}m</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Weight</div>
              <div className="font-medium">{pokemon.weight / 10}kg</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ComparisonPokemonCard.displayName = 'ComparisonPokemonCard';

export const PokemonComparison = memo<PokemonComparisonProps>(({
  pokemon,
  onRemove,
  onClear,
  className
}) => {
  const [expandedSection, setExpandedSection] = useState<'stats' | 'types' | null>('stats');
  
  // Memoized calculations to prevent expensive re-computations
  const comparisonData = useMemo(() => {
    if (pokemon.length === 0) return null;
    
    const names = pokemon.map(p => p.name);
    
    // Base stats comparison
    const statsData = [
      {
        label: 'HP',
        values: pokemon.map(p => p.stats.find(s => s.stat.name === 'hp')?.base_stat || 0),
        icon: Activity,
        color: 'text-red-500'
      },
      {
        label: 'Attack',
        values: pokemon.map(p => p.stats.find(s => s.stat.name === 'attack')?.base_stat || 0),
        icon: Target,
        color: 'text-orange-500'
      },
      {
        label: 'Defense', 
        values: pokemon.map(p => p.stats.find(s => s.stat.name === 'defense')?.base_stat || 0),
        icon: Shield,
        color: 'text-blue-500'
      },
      {
        label: 'Sp. Attack',
        values: pokemon.map(p => p.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 0),
        icon: Zap,
        color: 'text-purple-500'
      },
      {
        label: 'Sp. Defense',
        values: pokemon.map(p => p.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 0),
        icon: Shield,
        color: 'text-green-500'
      },
      {
        label: 'Speed',
        values: pokemon.map(p => p.stats.find(s => s.stat.name === 'speed')?.base_stat || 0),
        icon: TrendingUp,
        color: 'text-yellow-500'
      }
    ];
    
    // Physical attributes
    const physicalData = [
      {
        label: 'Height (m)',
        values: pokemon.map(p => p.height / 10),
        icon: Scale,
        color: 'text-indigo-500'
      },
      {
        label: 'Weight (kg)',
        values: pokemon.map(p => p.weight / 10),
        icon: Scale,
        color: 'text-pink-500'
      }
    ];
    
    // Type effectiveness (simplified)
    const typeData = pokemon.map(p => ({
      name: p.name,
      types: p.types.map(t => t.type.name),
      typeCount: p.types.length
    }));
    
    return {
      names,
      stats: statsData,
      physical: physicalData,
      types: typeData,
      totalStats: pokemon.map(p => 
        p.stats.reduce((sum, stat) => sum + stat.base_stat, 0)
      )
    };
  }, [pokemon]);
  
  const toggleSection = useCallback((section: 'stats' | 'types') => {
    setExpandedSection(current => current === section ? null : section);
  }, []);
  
  if (pokemon.length === 0) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <div className="text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No Pokémon selected for comparison</p>
          <p className="text-sm mt-1">Add Pokémon from the browse page to compare their stats</p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pokemon Comparison</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {pokemon.length}/3 Pokemon
          </span>
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear All
          </Button>
        </div>
      </div>
      
      {/* Pokemon Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pokemon.map((p, index) => (
          <ComparisonPokemonCard
            key={p.id}
            pokemon={p}
            onRemove={onRemove}
            isFirst={index === 0}
          />
        ))}
      </div>
      
      {comparisonData && (
        <>
          {/* Stats Comparison */}
          <Card>
            <CardHeader>
              <CardTitle 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => toggleSection('stats')}
              >
                <Activity className="h-5 w-5" />
                Base Stats Comparison
                <Button variant="ghost" size="sm" className="ml-auto p-0 h-auto">
                  {expandedSection === 'stats' ? '−' : '+'}
                </Button>
              </CardTitle>
            </CardHeader>
            {expandedSection === 'stats' && (
              <CardContent className="space-y-6">
                {/* Total Stats */}
                <StatComparison
                  label="Total Base Stats"
                  values={comparisonData.totalStats}
                  pokemonNames={comparisonData.names}
                  icon={TrendingUp}
                  color="text-purple-600"
                />
                
                {/* Individual Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {comparisonData.stats.map((stat) => (
                    <StatComparison
                      key={stat.label}
                      label={stat.label}
                      values={stat.values}
                      pokemonNames={comparisonData.names}
                      icon={stat.icon}
                      color={stat.color}
                    />
                  ))}
                </div>
                
                {/* Physical Stats */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Physical Attributes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {comparisonData.physical.map((stat) => (
                      <StatComparison
                        key={stat.label}
                        label={stat.label}
                        values={stat.values}
                        pokemonNames={comparisonData.names}
                        icon={stat.icon}
                        color={stat.color}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
          
          {/* Type Analysis */}
          <Card>
            <CardHeader>
              <CardTitle 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => toggleSection('types')}
              >
                <Zap className="h-5 w-5" />
                Type Analysis
                <Button variant="ghost" size="sm" className="ml-auto p-0 h-auto">
                  {expandedSection === 'types' ? '−' : '+'}
                </Button>
              </CardTitle>
            </CardHeader>
            {expandedSection === 'types' && (
              <CardContent>
                <div className="space-y-4">
                  {comparisonData.types.map((typeData) => (
                    <div key={typeData.name} className="flex items-center justify-between">
                      <span className="font-medium capitalize">{typeData.name}</span>
                      <div className="flex gap-1">
                        {typeData.types.map(type => (
                          <Badge
                            key={type}
                            variant="secondary"
                            className={cn(
                              'text-white text-xs',
                              TYPE_COLORS[type] || 'bg-slate-400'
                            )}
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  );
});

PokemonComparison.displayName = 'PokemonComparison';

export default PokemonComparison;