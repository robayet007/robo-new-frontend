import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// ⚠️ Note: Ei file-e direct Firebase credentials deoa ache.
// Public frontend project hole etai thik, kintu repository public korle
// Firebase console theke key gulo rotate kore nibe.

// Your web app's Firebase configuration (from Firebase console)
const firebaseConfig = {
  apiKey: 'AIzaSyCbLo1seJxkaneK6u6EoceIuJtiROf1Mds',
  authDomain: 'robotopup-21902.firebaseapp.com',
  projectId: 'robotopup-21902',
  storageBucket: 'robotopup-21902.firebasestorage.app',
  messagingSenderId: '738273737108',
  appId: '1:738273737108:web:e119d99d1cf2126fdd2c61',
  measurementId: 'G-FK6RVTY86D',
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Expose same helpers as age chilo
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;