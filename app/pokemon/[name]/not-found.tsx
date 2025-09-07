import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card className="max-w-md mx-auto">
        <CardContent className="py-16 text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">Pokémon Not Found</h2>
          <p className="text-muted-foreground">
            The Pokémon you&apos;re looking for doesn&apos;t exist or may have been spelled incorrectly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link href="/">
              <Button variant="default" className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
            <Link href="/browse">
              <Button variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Browse Pokémon
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}