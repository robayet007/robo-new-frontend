import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCbLo1seJxkaneK6u6EoceIuJtiROf1Mds",
  authDomain: "robotopup-21902.firebaseapp.com",
  projectId: "robotopup-21902",
  storageBucket: "robotopup-21902.firebasestorage.app",
  messagingSenderId: "738273773108",
  appId: "1:738273773108:web:e119d99dc1f2126fdd2c61",
  measurementId: "G-FK6RVTY86D"
};

// Initialize Firebase only if not already initialized (prevents duplicate instances)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Google Auth Provider with optimized settings
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;

