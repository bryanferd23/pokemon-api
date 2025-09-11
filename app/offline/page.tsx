'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RotateCcw, Home } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <WifiOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">
              {isOnline ? 'Connection Restored' : 'You\'re Offline'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            {isOnline ? (
              <>
                <p className="text-muted-foreground">
                  Your internet connection has been restored! You can now access all features.
                </p>
                <Button onClick={handleRetry} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Refresh Page
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Some content may not be available, but you can still browse cached Pokémon data.
                </p>
                <div className="space-y-2">
                  <Button asChild className="w-full gap-2">
                    <Link href="/">
                      <Home className="h-4 w-4" />
                      Go to Homepage
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={handleRetry} className="w-full gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Available while offline:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Browse previously loaded Pokémon</li>
              <li>• View cached Pokémon details</li>
              <li>• Access your Pokédeck collection</li>
              <li>• View offline-cached images</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}