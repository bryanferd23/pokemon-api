'use client';

import { useEffect } from 'react';
import { registerServiceWorker, addOfflineIndicator } from '@/lib/utils/service-worker';

export function ServiceWorkerProvider() {
  useEffect(() => {
    // Register service worker for offline caching
    registerServiceWorker();
    
    // Add offline status indicator
    addOfflineIndicator();
  }, []);

  return null; // This component doesn't render anything
}