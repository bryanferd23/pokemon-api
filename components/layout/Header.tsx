'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Menu, Search, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { pokedeckStore } from '@/lib/store/pokedeck';

export function Header() {
  const pathname = usePathname();
  const [pokedeckCount, setPokedeckCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Initial count
    setPokedeckCount(pokedeckStore.count());

    // Subscribe to changes
    const unsubscribe = pokedeckStore.subscribe(() => {
      setPokedeckCount(pokedeckStore.count());
    });

    return unsubscribe;
  }, []);

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/browse', label: 'Browse' },
    { href: '/pokedeck', label: 'Pokédeck' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 font-bold text-xl text-primary hover:text-primary/80 transition-colors"
          >
            <Zap className="h-6 w-6 text-yellow-500" />
            <span className="hidden sm:inline">Pokédeck</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.href)
                    ? 'text-primary border-b-2 border-primary pb-1'
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
                {item.href === '/pokedeck' && pokedeckCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {pokedeckCount}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>

          {/* Quick Search Button */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center space-x-2 text-muted-foreground"
              onClick={() => {
                // Will implement global search later
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                  searchInput.focus();
                }
              }}
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline">Search Pokemon...</span>
              <kbd className="pointer-events-none hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur">
            <nav className="flex flex-col space-y-1 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-2 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-muted ${
                    isActive(item.href)
                      ? 'bg-muted text-primary'
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>{item.label}</span>
                  {item.href === '/pokedeck' && pokedeckCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {pokedeckCount}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}