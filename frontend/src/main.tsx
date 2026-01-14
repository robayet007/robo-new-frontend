import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import UpdateNotification from './components/UpdateNotification'
import SplashScreen from './components/SplashScreen'
import { RoboGameZoneProvider } from './contexts/RoboGameZoneContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './style.css'

// Update notification wrapper component
function AppWithUpdates() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Register Service Worker for PWA with auto-update
    // Register in both dev and production for PWA install to work
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((reg) => {
          setRegistration(reg);
          
          // Check for updates every 2 minutes (more frequent)
          setInterval(() => {
            reg.update();
          }, 2 * 60 * 1000);
          
          // Check for updates when page becomes visible
          document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
              reg.update();
            }
          });
          
          // Listen for service worker updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available - show notification instead of auto-reload
                  setUpdateAvailable(true);
                }
              });
            }
          });
          
          // Check immediately on load
          reg.update();
        })
        .catch((_error) => {
          // console.error('❌ Service Worker registration failed:', _error);
        });
      
      // Listen for controller change (when update is activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload when new service worker takes control
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the waiting service worker to skip waiting and activate
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      // Force reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // Force cache clear and reload
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        });
      }
      window.location.reload();
    }
  };

  return (
    <>
      <SplashScreen />
      <App />
      {updateAvailable && (
        <UpdateNotification 
          onUpdate={handleUpdate}
          onDismiss={() => setUpdateAvailable(false)}
        />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider>
        <RoboGameZoneProvider>
          <AppWithUpdates />
        </RoboGameZoneProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)


























































