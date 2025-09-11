/**
 * Service Worker utilities for offline caching and performance
 */

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('SW registered: ', registration);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content is available, notify user
                console.log('New content is available; please refresh.');
                showUpdateAvailableNotification();
              } else {
                // Content is cached for offline use
                console.log('Content is cached for offline use.');
              }
            }
          });
        }
      });

      // Handle controller change (when new SW takes control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

    } catch (error) {
      console.log('SW registration failed: ', error);
    }
  });
}

function showUpdateAvailableNotification(): void {
  // Simple notification - could be replaced with a toast library
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Pokemon API Update Available', {
      body: 'New content is available. Please refresh the page.',
      icon: '/icon-192x192.png',
    });
  } else {
    // Fallback to console log or custom notification UI
    console.log('Update available: Please refresh to get the latest content.');
  }
}

export function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(false);
  }

  return navigator.serviceWorker.ready.then((registration) => {
    return registration.unregister();
  });
}

export function checkForUpdates(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve();
  }

  return navigator.serviceWorker.ready.then((registration) => {
    registration.update();
  });
}

// Utility to check online status
export function isOnline(): boolean {
  return typeof window !== 'undefined' && navigator.onLine;
}

// Utility to show offline indicator
export function addOfflineIndicator(): void {
  if (typeof window === 'undefined') return;

  // Create offline indicator element
  const offlineIndicator = document.createElement('div');
  offlineIndicator.className = 'offline-indicator';
  offlineIndicator.textContent = 'You are currently offline. Some features may be limited.';
  document.body.appendChild(offlineIndicator);

  const updateOnlineStatus = () => {
    const isCurrentlyOnline = navigator.onLine;
    document.body.classList.toggle('offline', !isCurrentlyOnline);
    
    if (!isCurrentlyOnline) {
      console.log('App is now offline. Some features may be limited.');
    } else {
      console.log('App is back online.');
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial check
  updateOnlineStatus();
}