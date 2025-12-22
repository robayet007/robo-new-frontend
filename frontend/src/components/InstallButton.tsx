import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;

    // For iOS, show button if not in standalone mode
    if (isIOS && !isInStandaloneMode) {
      setShowButton(true);
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed (Android)
    if ('serviceWorker' in navigator && !isIOS) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length > 0) {
          // App might be installed
          setTimeout(() => {
            if (!window.matchMedia('(display-mode: standalone)').matches) {
              setShowButton(true);
            }
          }, 1000);
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // iOS doesn't support beforeinstallprompt, show instructions
    if (isIOS || !deferredPrompt) {
      // Show detailed iOS instructions
      if (isIOS) {
        const instructions = `📱 iPhone/iPad Installation Guide:

1️⃣ Tap the Share button (⬆️) at the bottom of Safari
2️⃣ Scroll down in the menu
3️⃣ Tap "Add to Home Screen"
4️⃣ Tap "Add" in the top right corner

✅ The app will appear on your home screen like a native app!

💡 Tip: Make sure you're using Safari browser (not Chrome)`;
        
        alert(instructions);
        return;
      }
      
      // Fallback for other devices
      let instructions = '';
      if (isAndroid) {
        instructions = '📱 Android Installation:\n\n1. Tap the menu (⋮) in your browser\n2. Select "Add to Home screen" or "Install app"\n3. Tap "Add" or "Install" to confirm';
      } else {
        instructions = '💻 Desktop Installation:\n\n1. Look for the install icon in your browser address bar\n2. Or use browser menu: More tools > Create shortcut\n3. Check "Open as window" option';
      }
      
      alert(instructions);
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        // console.log('✅ User accepted the install prompt');
        setIsInstalled(true);
        setShowButton(false);
      } else {
        // console.log('❌ User dismissed the install prompt');
      }
    } catch (error) {
      // console.error('Error showing install prompt:', error);
    } finally {
      setDeferredPrompt(null);
    }
  };

  if (isInstalled || !showButton) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-purple-500/30 hover:from-purple-600 hover:to-violet-700 transition-all duration-200 animate-pulse hover:animate-none"
      style={{
        boxShadow: '0 10px 30px rgba(14, 165, 233, 0.4)'
      }}
      aria-label="Install App"
    >
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      <span className="hidden sm:inline">Install App</span>
      <span className="sm:hidden">Install</span>
    </button>
  );
}

export default InstallButton;

