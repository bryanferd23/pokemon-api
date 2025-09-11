'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkStatusIndicatorProps {
  className?: string;
  showOnlineStatus?: boolean;
}

export function NetworkStatusIndicator({ 
  className,
  showOnlineStatus = false 
}: NetworkStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (!online && !wasOffline) {
        setWasOffline(true);
        setShowStatus(true);
      } else if (online && wasOffline) {
        setShowStatus(true);
        // Hide "back online" status after 5 seconds
        setTimeout(() => {
          setShowStatus(false);
        }, 5000);
      }
    };

    // Set initial status
    setIsOnline(navigator.onLine);

    // Add event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [wasOffline]);

  const handleRetry = () => {
    // Force a network check by attempting to fetch a small resource
    fetch('/favicon.ico', { 
      method: 'HEAD',
      cache: 'no-cache'
    }).then(() => {
      if (navigator.onLine) {
        window.location.reload();
      }
    }).catch(() => {
      // Still offline, show appropriate message
      console.log('Still offline');
    });
  };

  const handleDismiss = () => {
    setShowStatus(false);
  };

  // Don't show anything if online and we don't want to show online status
  if (isOnline && !showOnlineStatus && !showStatus) {
    return null;
  }

  // Don't show if online and haven't been offline
  if (isOnline && !wasOffline && !showOnlineStatus) {
    return null;
  }

  return (
    <div className={cn("fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4", className)}>
      <Alert 
        variant={isOnline ? "default" : "destructive"} 
        className={cn(
          "transition-all duration-300",
          showStatus || !isOnline ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        )}
        role="alert"
        aria-live="polite"
      >
        {isOnline ? (
          <Wifi className="h-4 w-4" aria-hidden="true" />
        ) : (
          <WifiOff className="h-4 w-4" aria-hidden="true" />
        )}
        
        <AlertDescription className="flex items-center justify-between gap-2">
          <span className="flex-1">
            {isOnline 
              ? "Connection restored! All features are available."
              : "You're offline. Some features may be limited to cached content."
            }
          </span>
          
          <div className="flex items-center gap-1">
            {!isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                className="h-7 px-2 text-xs"
                aria-label="Check connection and retry"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
              </Button>
            )}
            
            {(isOnline || showStatus) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-7 w-7 p-0 text-xs"
                aria-label="Dismiss notification"
              >
                ×
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Screen reader only status */}
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {!isOnline && "Your internet connection has been lost. Some features may not work properly."}
        {isOnline && wasOffline && "Your internet connection has been restored. All features are now available."}
      </div>
    </div>
  );
}