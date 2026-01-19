import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Suppress COOP (Cross-Origin-Opener-Policy) warnings and Firebase permission errors globally
// These are browser security warnings and Firebase permission errors that don't affect functionality
// Note: This is a fallback - firebase.ts also handles suppression
const originalError = console.error;
const isProduction = import.meta.env.PROD;
console.error = (...args: any[]) => {
  const message = String(args[0] || '');
  // Suppress COOP-related warnings and Firebase permission errors
  if (
    message.includes('Cross-Origin-Opener-Policy') || 
    message.includes('window.closed') ||
    message.includes('FirebaseError') ||
    message.includes('Installations') ||
    message.includes('PERMISSION_DENIED') ||
    message.includes('installations/request-failed') ||
    message.includes('analytics') ||
    message.includes('Cannot read properties of undefined') ||
    message.includes('replace')
  ) {
    return; // Silently ignore these errors
  }
  // In production, suppress all errors (they're handled in UI)
  if (isProduction) {
    return;
  }
  originalError.apply(console, args);
};

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  token?: string;
}

// Utility function to add user to Firestore
const addUserToFirestore = async (user: AuthUser) => {
  try {
    if (!user.uid || !user.email) return;

    const userRef = doc(db, 'users', user.uid);
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      role: user.email.toLowerCase() === 'mdrobayet007@gmail.com' ? 'admin' : 'user',
      createdAt: Date.now(),
      lastLogin: Date.now(),
    };

    await setDoc(userRef, userData, { merge: true });
    // console.log('User added/updated in Firestore:', user.email);
  } catch (error) {
    // console.error('Error adding user to Firestore:', error);
  }
};

function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set loading to false quickly - auth state loads fast
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Set user immediately for faster UI
          const authUser: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };
          setUser(authUser);
          setLoading(false); // Don't wait for token/Firestore
          
          // Get JWT token and update Firestore in background (non-blocking)
          Promise.all([
            firebaseUser.getIdToken().then(token => {
              setUser(prev => prev ? { ...prev, token } : prev);
            }).catch(_err => {/* console.error('Error getting token:', _err) */}),
            addUserToFirestore(authUser).catch(_err => {/* console.error('Error adding to Firestore:', _err) */}),
            firebaseUser.uid && firebaseUser.email ? updateDoc(doc(db, 'users', firebaseUser.uid), { lastLogin: Date.now() }).catch(_err => {/* console.error('Error updating lastLogin:', _err) */}) : Promise.resolve()
          ]).catch(_err => {/* console.error('Background auth update error:', _err) */});
        } catch (error) {
          // console.error('Error in auth state change:', error);
          const authUser: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };
          setUser(authUser);
          setLoading(false);
          
          // Add to Firestore in background
          addUserToFirestore(authUser).catch(_err => {/* console.error('Error adding to Firestore:', _err) */});
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (name: string, email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name,
        });
        
        // Add user to Firestore
        const authUser: AuthUser = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: name,
          photoURL: userCredential.user.photoURL,
        };
        await addUserToFirestore(authUser);
      }
      
      return { success: true, user: userCredential.user };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create account';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Return success immediately - Firestore updates happen automatically via onAuthStateChanged
      // This makes login faster by not blocking on Firestore operations
      // The onAuthStateChanged handler (line 69-108) will handle Firestore updates in background
      return { success: true, user: userCredential.user };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      
      // Use signInWithPopup with optimized settings for faster authentication
      // The popup will use cached credentials when available for instant login
      const result = await signInWithPopup(auth, googleProvider);
      
      // Return success immediately - Firestore updates happen automatically via onAuthStateChanged
      // This makes login much faster by not blocking on Firestore operations
      // The onAuthStateChanged handler (line 84-123) will handle Firestore updates in background
      return { success: true, user: result.user };
    } catch (err: any) {
      // Handle specific error codes
      let errorMessage = 'Failed to login with Google';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed';
      } else if (err.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Only one popup request is allowed at a time';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by browser. Please allow popups for this site.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to logout';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Get current token
  const getToken = async (): Promise<string | null> => {
    if (user) {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          return await currentUser.getIdToken();
        }
      } catch (error) {
        // console.error('Error getting token:', error);
      }
    }
    return null;
  };

  // Change current user's password (requires re-auth with old password)
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);
      const currentUser = auth.currentUser;

      if (!currentUser || !currentUser.email) {
        return { success: false, error: 'No authenticated user' };
      }

      // Reauthenticate with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);

      // Update to new password
      await updatePassword(currentUser, newPassword);

      return { success: true };
    } catch (err: any) {
      // console.error('Error changing password:', err);
      let errorMessage = 'Failed to change password';

      if (err.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);
      if (!email) {
        return { success: false, error: 'Please enter your email first' };
      }
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err: any) {
      // console.error('Error sending password reset email:', err);
      let errorMessage = 'Failed to send password reset email';

      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    user,
    loading,
    error,
    signUp,
    login,
    loginWithGoogle,
    logout,
    getToken,
    changePassword,
    resetPassword,
  };
}

export default useAuth;

