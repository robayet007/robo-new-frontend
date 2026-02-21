import { useState, useEffect, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Global storage for deferred prompt (captures event even before component mounts)
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

// Set up global event listener immediately (before React components mount)
if (typeof window !== 'undefined') {
  const handleGlobalBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    // console.log('🔔 [InstallButton] beforeinstallprompt event captured globally');
  };

  window.addEventListener('beforeinstallprompt', handleGlobalBeforeInstallPrompt);
  
  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    // console.log('📱 [InstallButton] App already installed (standalone mode)');
  }
}

// Detect iOS devices
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Detect if running in standalone mode (already installed)
const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // console.log('🔧 [InstallButton] Component mounted, initializing...');

    // Check if app is already installed
    const checkInstalled = () => {
      const installed = isStandalone();
      if (installed) {
        // console.log('✅ [InstallButton] App is already installed');
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkInstalled()) {
      return;
    }

    // Check if iOS device
    const ios = isIOS();
    setIsIOSDevice(ios);
    
    if (ios) {
      // console.log('🍎 [InstallButton] iOS device detected');
      // Check if already installed on iOS
      if ((window.navigator as any).standalone === true) {
        // console.log('✅ [InstallButton] App already installed on iOS');
        setIsInstalled(true);
        return;
      }
    }

    // Get deferred prompt from global storage if available
    if (globalDeferredPrompt) {
      // console.log('📦 [InstallButton] Found deferred prompt in global storage');
      setDeferredPrompt(globalDeferredPrompt);
      promptRef.current = globalDeferredPrompt;
      globalDeferredPrompt = null; // Clear global storage after use
    }

    // Listen for beforeinstallprompt event (Android/Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      // console.log('🔔 [InstallButton] beforeinstallprompt event received');
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      promptRef.current = promptEvent;
      globalDeferredPrompt = null; // Clear global storage
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      // console.log('✅ [InstallButton] App installed event received');
      setIsInstalled(true);
      setDeferredPrompt(null);
      promptRef.current = null;
      globalDeferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Periodic check for installation status (in case event was missed)
    const checkInterval = setInterval(() => {
      if (checkInstalled()) {
        clearInterval(checkInterval);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(checkInterval);
    };
  }, []);

  const handleInstallClick = async () => {
    const prompt = deferredPrompt || promptRef.current;
    
    if (!prompt) {
      console.warn('⚠️ [InstallButton] No deferred prompt available');
      return;
    }

    try {
      // console.log('🚀 [InstallButton] Showing install prompt...');
      // Show the native install prompt
      await prompt.prompt();

      // Wait for the user to respond
      const { outcome } = await prompt.userChoice;
      // console.log(`📊 [InstallButton] User choice: ${outcome}`);

      if (outcome === 'accepted') {
        setIsInstalled(true);
        // console.log('✅ [InstallButton] Installation accepted');
      } else {
        // console.log('❌ [InstallButton] Installation dismissed');
      }

      // Clear the prompt after use
      setDeferredPrompt(null);
      promptRef.current = null;
    } catch (error) {
      console.error('❌ [InstallButton] Installation error:', error);
      setDeferredPrompt(null);
      promptRef.current = null;
    }
  };

  const handleIOSInstallClick = () => {
    setShowIOSInstructions(true);
    // console.log('🍎 [InstallButton] Showing iOS install instructions');
  };

  const handleCloseIOSInstructions = () => {
    setShowIOSInstructions(false);
  };

  // Don't show anything if already installed
  if (isInstalled) {
    return null;
  }

  // Show iOS manual install instructions
  if (isIOSDevice && !deferredPrompt && !promptRef.current) {
    if (showIOSInstructions) {
      return (
        <div className="fixed z-50 max-w-sm p-4 transition-all duration-300 bg-white border border-gray-200 shadow-2xl bottom-4 right-4 rounded-xl">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-800">Install App</h3>
            <button
              onClick={handleCloseIOSInstructions}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <p className="font-semibold">Follow these steps:</p>
            <ol className="ml-2 space-y-2 list-decimal list-inside">
              <li>Tap the <strong>Share</strong> button <span className="text-lg">⎋</span> at the bottom</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Add"</strong> to confirm</li>
            </ol>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={handleIOSInstallClick}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-white font-semibold text-sm shadow-lg transition-all duration-200 animate-pulse hover:animate-none hover:opacity-90"
        style={{
          background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))',
          boxShadow: '0 10px 30px rgba(var(--theme-primary-rgb), 0.4)'
        }}
        aria-label="Install App"
      >
        <svg className="flex-shrink-0 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  }

  // Show install button for Android/Chrome/Edge (when deferredPrompt is available)
  if (deferredPrompt || promptRef.current) {
    return (
      <button
        onClick={handleInstallClick}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-white font-semibold text-sm shadow-lg transition-all duration-200 animate-pulse hover:animate-none hover:opacity-90"
        style={{
          background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))',
          boxShadow: '0 10px 30px rgba(var(--theme-primary-rgb), 0.4)'
        }}
        aria-label="Install App"
      >
        <svg className="flex-shrink-0 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="hidden sm:inline">Install App Now</span>
        <span className="sm:hidden">Install Now</span>
      </button>
    );
  }

  // Don't show button if no install method available
  // console.log('ℹ️ [InstallButton] No install method available, button hidden');
  return null;
}

export default InstallButton;