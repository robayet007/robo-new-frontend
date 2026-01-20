import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { AppUser, UserRole } from './useUsers';

const USERS_COLLECTION = 'users';

// Query key factory
export const usersQueryKeys = {
  all: ['users'] as const,
  lists: () => [...usersQueryKeys.all, 'list'] as const,
  list: () => [...usersQueryKeys.lists()] as const,
};

// Fetch users from Firebase
async function fetchUsers(): Promise<AppUser[]> {
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

  return usersList;
}

/**
 * Hook to fetch users with React Query caching
 * Returns cached data immediately on subsequent visits
 */
export function useUsersQuery() {
  return useQuery({
    queryKey: usersQueryKeys.list(),
    queryFn: fetchUsers,
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter for user data that might change
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
