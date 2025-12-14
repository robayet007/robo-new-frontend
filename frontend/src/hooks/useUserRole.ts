import { useState, useEffect } from 'react';
import useAuth from './useAuth';
import { isDefaultAdmin } from '../config/admin';
import useUsers from './useUsers';

function useUserRole() {
  const { user } = useAuth();
  const { getUserRole } = useUsers();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false); // Start with false - non-blocking

  useEffect(() => {
    const checkRole = async () => {
      if (!user?.email) {
        setIsAdmin(false);
        return;
      }

      // Quick check for default admin (synchronous - instant)
      if (isDefaultAdmin(user.email)) {
        setIsAdmin(true);
        return;
      }

      // Check role from Firestore in background (non-blocking)
      setLoading(true);
      try {
        const role = await getUserRole(user.email);
        setIsAdmin(role === 'admin');
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [user?.email, getUserRole]);

  return { isAdmin, loading };
}

export default useUserRole;

