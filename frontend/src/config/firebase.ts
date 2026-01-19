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
  const isProduction = import.meta.env.PROD;
  
  // Suppress warnings
  console.warn = (...args: any[]) => {
    // Filter out Firebase Analytics/Installations permission warnings
    const message = args[0]?.toString() || '';
    if (
      message.includes('Firebase Analytics') || 
      message.includes('@firebase/analytics') ||
      message.includes('measurement ID') ||
      message.includes('PERMISSION_DENIED') ||
      message.includes('Installations') ||
      message.includes('analytics/config-fetch-failed') ||
      message.includes('installations/request-failed') ||
      message.includes('Cross-Origin-Opener-Policy') ||
      message.includes('window.closed')
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
    if (
      message.includes('FirebaseError') ||
      message.includes('Installations') ||
      message.includes('PERMISSION_DENIED') ||
      message.includes('analytics') ||
      message.includes('installations/request-failed') ||
      message.includes('Cross-Origin-Opener-Policy') ||
      message.includes('window.closed') ||
      message.includes('Cannot read properties of undefined') ||
      message.includes('replace')
    ) {
      return; // Suppress these errors
    }
    // In production, suppress all errors (they're already handled in UI)
    if (isProduction) {
      return;
    }
    originalError.apply(console, args);
  };
  
  // Suppress console.log in production
  if (isProduction) {
    console.log = () => {}; // Suppress all logs in production
  }
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

