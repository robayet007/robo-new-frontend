import { useState, useEffect, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallButton.tsx:13',message:'useEffect started',data:{userAgent:navigator.userAgent,isStandalone:window.matchMedia('(display-mode: standalone)').matches,hasServiceWorker:'serviceWorker' in navigator},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // Check manifest and service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallButton.tsx:18',message:'service worker registrations check',data:{count:registrations.length,hasController:!!navigator.serviceWorker.controller},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      });
    }
    
    // Check if manifest link exists
    const manifestLink = document.querySelector('link[rel="manifest"]');
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallButton.tsx:25',message:'manifest link check',data:{exists:!!manifestLink,href:manifestLink?.getAttribute('href')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallButton.tsx:26',message:'iOS detected, showing button',data:{isIOS,isInStandaloneMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      setShowButton(true);
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallButton.tsx:30',message:'beforeinstallprompt event fired',data:{hasPrompt:!!(e as any).prompt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      deferredPromptRef.current = promptEvent;
      setShowButton(true);
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallButton.tsx:34',message:'deferredPrompt set and showButton set to true',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    };

    // Set up event listeners immediately (before any delay)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt, { capture: true });
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check icon accessibility
    const checkIcon = async (src: string) => {
      try {
        const response = await fetch(src, { method: 'HEAD' });
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallButton.tsx:65',message:'icon accessibility check',data:{src,status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        return response.ok;
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallButton.tsx:70',message:'icon check failed',data:{src,error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        return false;
      }
    };
    
    // Check if icons are accessible
    checkIcon('/logo-robo.png');

    // Show button for non-iOS devices after a delay (event might fire later)
    // Button will work when beforeinstallprompt event fires
    if (!isIOS) {
      setTimeout(() => {
        if (!window.matchMedia('(display-mode: standalone)').matches) {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallButton.tsx:82',message:'showing button for non-iOS device',data:{hasDeferredPrompt:!!deferredPromptRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          setShowButton(true);
        }
      }, 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt, { capture: true });
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallButton.tsx:66',message:'handleInstallClick called',data:{hasDeferredPrompt:!!deferredPrompt,showButton,isInstalled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // If we don't have deferredPrompt, wait a moment - event might fire after user interaction
    let currentPrompt = deferredPrompt || deferredPromptRef.current;
    if (!currentPrompt) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallButton.tsx:69',message:'deferredPrompt is null, waiting briefly for event after user interaction',data:{userAgent:navigator.userAgent},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Wait a moment - sometimes beforeinstallprompt fires after first user interaction
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check again if deferredPrompt was set during the wait
      currentPrompt = deferredPromptRef.current;
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallButton.tsx:87',message:'after wait, checking deferredPromptRef',data:{hasPrompt:!!currentPrompt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      if (!currentPrompt) {
        // Still no prompt - show Bengali instructions
        alert('📱 App Install করার জন্য:\n\n1️⃣ Browser-এর উপরে ৩টি ডট (⋮) icon-এ click করুন\n2️⃣ নিচে scroll করুন\n3️⃣ "Add to Home Screen" বা "Install app" option-এ click করুন\n4️⃣ "Add" বা "Install" button-এ click করুন\n\n✅ App আপনার home screen-এ install হয়ে যাবে!');
        return;
      }
    }

    try {
      // Use currentPrompt (either from state or ref)
      const promptToUse = currentPrompt || deferredPrompt;
      if (!promptToUse) return;
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallButton.tsx:74',message:'calling deferredPrompt.prompt()',data:{hasPrompt:typeof promptToUse.prompt === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // Show the native install prompt (works on both phone and PC)
      await promptToUse.prompt();
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallButton.tsx:76',message:'deferredPrompt.prompt() completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Wait for the user to respond
      const { outcome } = await promptToUse.userChoice;
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallButton.tsx:80',message:'userChoice received',data:{outcome},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowButton(false);
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InstallButton.tsx:84',message:'error in handleInstallClick',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    } finally {
      setDeferredPrompt(null);
      deferredPromptRef.current = null;
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
      aria-label="Install App Now"
    >
      <svg className="flex-shrink-0 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      <span className="hidden sm:inline">Install App Now</span>
      <span className="sm:hidden">Install Now</span>
    </button>
  );
}

export default InstallButton;

