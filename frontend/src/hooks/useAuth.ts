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

// Suppress COOP (Cross-Origin-Opener-Policy) warnings globally
// These are browser security warnings that don't affect functionality
const originalError = console.error;
console.error = (...args: any[]) => {
  const message = String(args[0] || '');
  // Suppress COOP-related warnings only
  if (message.includes('Cross-Origin-Opener-Policy') || 
      message.includes('window.closed')) {
    return; // Silently ignore COOP warnings
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
            }).catch(err => {/* console.error('Error getting token:', err) */}),
            addUserToFirestore(authUser).catch(err => {/* console.error('Error adding to Firestore:', err) */}),
            firebaseUser.uid && firebaseUser.email ? updateDoc(doc(db, 'users', firebaseUser.uid), { lastLogin: Date.now() }).catch(err => {/* console.error('Error updating lastLogin:', err) */}) : Promise.resolve()
          ]).catch(err => {/* console.error('Background auth update error:', err) */});
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
          addUserToFirestore(authUser).catch(err => {/* console.error('Error adding to Firestore:', err) */});
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
      
      // Update user in Firestore and lastLogin
      if (userCredential.user.uid && userCredential.user.email) {
        const authUser: AuthUser = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
        };
        await addUserToFirestore(authUser);
        
        const userRef = doc(db, 'users', userCredential.user.uid);
        await updateDoc(userRef, { lastLogin: Date.now() });
      }
      
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
      const result = await signInWithPopup(auth, googleProvider);
      
      // Update user in Firestore and lastLogin
      if (result.user.uid && result.user.email) {
        const authUser: AuthUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        };
        await addUserToFirestore(authUser);
        
        const userRef = doc(db, 'users', result.user.uid);
        await updateDoc(userRef, { lastLogin: Date.now() });
      }
      
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

