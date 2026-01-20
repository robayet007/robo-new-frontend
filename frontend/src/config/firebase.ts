import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';  

// Firebase configuration from environment variables
// ⚠️ SECURITY: Never commit .env file to git!
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate that all required environment variables are present
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  // console.error('❌ Firebase configuration is missing! Please check your .env file.');
  throw new Error('Firebase configuration is incomplete. Please set all VITE_FIREBASE_* environment variables.');
}

// Initialize Firebase only if not already initialized (prevents duplicate instances)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Authentication with optimized settings
export const auth = getAuth(app);
// Configure auth for faster popup login
auth.languageCode = 'en'; // Set language for faster UI rendering

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (only in browser environment, optional)
// Analytics initialization may fail due to permissions or API not being enabled
// This is non-critical - app will work without Analytics
// Note: Firebase Analytics may log warnings/errors even with try-catch due to async operations
// These can be safely ignored as they don't affect app functionality
let analytics = null;
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    // Analytics initialization failed (permissions, API not enabled, etc.)
    // Silently fail - app continues to work without Analytics
    analytics = null;
  }
}
// Suppress Firebase Analytics and Installations console warnings/errors (they're non-critical)
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;
  const isProduction = import.meta.env.PROD;
  
  // Suppress warnings
  console.warn = (...args: any[]) => {
    // Filter out Firebase Analytics/Installations permission warnings
    const message = args[0]?.toString() || '';
    const fullMessage = args.map(a => String(a)).join(' ');
    if (
      message.includes('Firebase Analytics') || 
      message.includes('@firebase/analytics') ||
      message.includes('measurement ID') ||
      message.includes('PERMISSION_DENIED') ||
      message.includes('Installations') ||
      message.includes('analytics/config-fetch-failed') ||
      message.includes('installations/request-failed') ||
      message.includes('Cross-Origin-Opener-Policy') ||
      message.includes('window.closed') ||
      fullMessage.includes('Cannot read properties of undefined') ||
      fullMessage.includes('reading \'replace\'') ||
      fullMessage.includes('Theme API returned unsuccessful response') ||
      fullMessage.includes('Failed to preload') ||
      fullMessage.includes('React DevTools') ||
      fullMessage.includes('Download the React DevTools') ||
      fullMessage.includes('Banner not shown') ||
      fullMessage.includes('beforeinstallpromptevent') ||
      fullMessage.includes('beforeinstallpromptevent.preventDefault') ||
      fullMessage.includes('must call beforeinstallpromptevent.prompt') ||
      fullMessage.includes('[vite]') ||
      fullMessage.includes('hot updated') ||
      fullMessage.includes('invalidate') ||
      fullMessage.includes('Fast Refresh') ||
      fullMessage.includes('Violation')
    ) {
      return; // Suppress these warnings
    }
    // In production, suppress all warnings
    if (isProduction) {
      return;
    }
    originalWarn.apply(console, args);
  };
  
  // Suppress errors
  console.error = (...args: any[]) => {
    // Filter out Firebase Analytics/Installations permission errors
    const message = args[0]?.toString() || '';
    const fullMessage = args.map(a => String(a)).join(' ');
    if (
      message.includes('FirebaseError') ||
      message.includes('Installations') ||
      message.includes('PERMISSION_DENIED') ||
      message.includes('analytics') ||
      message.includes('installations/request-failed') ||
      message.includes('Cross-Origin-Opener-Policy') ||
      message.includes('window.closed') ||
      fullMessage.includes('Cannot read properties of undefined') ||
      fullMessage.includes('reading \'replace\'') ||
      fullMessage.includes('Failed to load') ||
      fullMessage.includes('React DevTools') ||
      fullMessage.includes('Download the React DevTools') ||
      fullMessage.includes('firebaseinstallations.googleapis.com') ||
      fullMessage.includes('firebase.googleapis.com') ||
      fullMessage.includes('403 (Forbidden)') ||
      fullMessage.includes('429 (Too Many Requests)') ||
      fullMessage.includes('googleusercontent.com') ||
      fullMessage.includes('WebSocket') ||
      fullMessage.includes('socket.io') ||
      fullMessage.includes('connection') ||
      fullMessage.includes('closed before') ||
      fullMessage.includes('[vite]') ||
      fullMessage.includes('hot updated') ||
      fullMessage.includes('Violation')
    ) {
      return; // Suppress these errors
    }
    // In production, suppress all errors (they're already handled in UI)
    if (isProduction) {
      return;
    }
    originalError.apply(console, args);
  };
  
  // Suppress console.log messages (Vite hot updates, etc.)
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    const fullMessage = args.map(a => String(a)).join(' ');
    if (
      fullMessage.includes('[vite]') ||
      fullMessage.includes('hot updated') ||
      fullMessage.includes('invalidate') ||
      fullMessage.includes('Fast Refresh') ||
      fullMessage.includes('React DevTools') ||
      fullMessage.includes('Download the React DevTools') ||
      fullMessage.includes('Banner not shown') ||
      fullMessage.includes('beforeinstallpromptevent')
    ) {
      return; // Suppress these logs
    }
    // In production, suppress all logs
    if (isProduction) {
      return;
    }
    originalLog.apply(console, args);
  };
  
  // Suppress console.info messages (PWA banner, etc.)
  console.info = (...args: any[]) => {
    const fullMessage = args.map(a => String(a)).join(' ');
    if (
      fullMessage.includes('Banner not shown') ||
      fullMessage.includes('beforeinstallpromptevent') ||
      fullMessage.includes('beforeinstallpromptevent.preventDefault') ||
      fullMessage.includes('must call beforeinstallpromptevent.prompt') ||
      fullMessage.includes('[vite]') ||
      fullMessage.includes('React DevTools')
    ) {
      return; // Suppress these info messages
    }
    // In production, suppress all info
    if (isProduction) {
      return;
    }
    originalInfo.apply(console, args);
  };
}
export { analytics };

// Google Auth Provider with optimized settings for faster login
export const googleProvider = new GoogleAuthProvider();
// Remove prompt to allow Google to use cached credentials for faster login
// Google will automatically show account selection only when needed
googleProvider.addScope('profile');
googleProvider.addScope('email');
// Set language to improve UX
googleProvider.setCustomParameters({
  hd: '' // Allow any domain, don't restrict
});

export default app;

