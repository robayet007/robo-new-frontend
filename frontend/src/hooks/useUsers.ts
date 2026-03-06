import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { AuthUser } from './useAuth';

export type UserRole = 'user' | 'admin' | 'moderator' | 'reseller';

export interface AppUser extends AuthUser {
  role: UserRole;
  createdAt: number;
  lastLogin?: number;
  // Latest known balance from payments (updatedBalance) if available
  lastBalance?: number;
}

const USERS_COLLECTION = 'users';

function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // console.log('🔄 Initializing users fetch from Firebase Firestore...');

    // Initial load
    loadUsers();

    // Real-time listener for users (with error handling for blocked requests)
    let unsubscribe: (() => void) | null = null;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    try {
      unsubscribe = onSnapshot(
        collection(db, USERS_COLLECTION),
        (snapshot) => {
          const usersList: AppUser[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as any;
            usersList.push({
              uid: data.uid,
              email: data.email,
              displayName: data.displayName,
              photoURL: data.photoURL,
              role: (data.role as UserRole) || 'user',
              createdAt: data.createdAt || Date.now(),
              lastLogin: data.lastLogin,
            });
          });
          // console.log(`✅ Users fetched from Firestore: ${usersList.length} users found`);
          setUsers(usersList);
          setLoading(false);

          // Clear fallback interval if real-time listener is working
          if (fallbackInterval) {
            clearInterval(fallbackInterval);
            fallbackInterval = null;
          }
        },
        (_error) => {
          // console.error('❌ Error loading users from Firestore:', _error);
          // console.warn('⚠️ Real-time listener failed (may be blocked by browser extension)');
          // console.warn('⚠️ Falling back to periodic fetch every 10 seconds');
          setLoading(false);

          // Fall back to periodic polling if real-time listener fails
          if (!fallbackInterval) {
            fallbackInterval = setInterval(() => {
              // console.log('🔄 Periodic refresh: Fetching users...');
              loadUsers();
            }, 10000); // Refresh every 10 seconds
          }
        }
      );
    } catch (error) {
      // console.error('❌ Failed to set up real-time listener:', error);
      // console.warn('⚠️ Using periodic fetch instead');
      setLoading(false);

      // Set up periodic polling as fallback
      fallbackInterval = setInterval(() => {
        // console.log('🔄 Periodic refresh: Fetching users...');
        loadUsers();
      }, 10000);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // console.log('📡 Fetching users from Firebase Firestore...');
      const q = query(collection(db, USERS_COLLECTION));
      const querySnapshot = await getDocs(q);

      const usersList: AppUser[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        usersList.push({
          uid: data.uid,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          role: (data.role as UserRole) || 'user',
          createdAt: data.createdAt || Date.now(),
          lastLogin: data.lastLogin,
        });
      });

      // console.log(`✅ Successfully loaded ${usersList.length} users from Firestore`);
      setUsers(usersList);
    } catch (error) {
      // console.error('❌ Error loading users from Firestore:', error);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (user: AuthUser) => {
    try {
      if (!user.uid || !user.email) return;

      const userRef = doc(db, USERS_COLLECTION, user.uid);
      const userData: AppUser = {
        ...user,
        role: user.email.toLowerCase() === 'mdrobayet007@gmail.com' ? 'admin' : 'user',
        createdAt: Date.now(),
        lastLogin: Date.now(),
      };

      await setDoc(userRef, userData, { merge: true });
      // console.log('User added to Firestore:', user.email);
    } catch (error) {
      // console.error('Error adding user:', error);
    }
  };

  const updateUserRole = async (email: string, newRole: UserRole) => {
    try {
      if (!email) return;

      // Find user by email
      const q = query(collection(db, USERS_COLLECTION), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // console.error('User not found:', email);
        return;
      }

      // Update all matching users (should be only one)
      const updatePromises = querySnapshot.docs.map((docSnap) => {
        return updateDoc(docSnap.ref, { role: newRole });
      });

      await Promise.all(updatePromises);
      // console.log('User role updated:', email, newRole);
    } catch (error) {
      // console.error('Error updating user role:', error);
      throw error;
    }
  };

  const getUserRole = useCallback(async (email: string | null | undefined): Promise<UserRole> => {
    if (!email) return 'user';

    // Default admin email
    if (email.toLowerCase().trim() === 'mdrobayet007@gmail.com') {
      return 'admin';
    }

    try {
      const q = query(collection(db, USERS_COLLECTION), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        return userData.role || 'user';
      }
    } catch (error) {
      // console.error('Error getting user role:', error);
    }

    return 'user';
  }, []);

  const refreshUsers = () => {
    loadUsers();
  };

  const syncCurrentUser = async (authUser: AuthUser) => {
    if (authUser.uid && authUser.email) {
      await addUser(authUser);
    }
  };

  return {
    users,
    loading,
    addUser,
    updateUserRole,
    getUserRole,
    refreshUsers,
    syncCurrentUser,
  };
}

export default useUsers;
