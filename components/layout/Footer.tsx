import Link from 'next/link';
import { Github, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-foreground">About Pokédeck</h3>
            <p className="text-sm text-muted-foreground">
              A modern Pokémon encyclopedia built with Next.js and the PokéAPI.
              Discover, collect, and learn about all your favorite Pokémon.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <Link 
                href="/" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link 
                href="/browse" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse Pokémon
              </Link>
              <Link 
                href="/pokedeck" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                My Pokédeck
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Resources</h3>
            <nav className="flex flex-col space-y-2">
              <Link 
                href="https://pokeapi.co/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center space-x-1"
              >
                <span>PokéAPI</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link 
                href="https://pokemon.com/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center space-x-1"
              >
                <span>Official Pokémon Site</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link 
                href="https://github.com/PokeAPI/pokeapi" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center space-x-1"
              >
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <p className="text-sm text-muted-foreground">
              Built with Next.js and the PokéAPI. Not affiliated with Nintendo or The Pokémon Company.
            </p>
            <p className="text-sm text-muted-foreground">
              © 2025 Pokédeck. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}