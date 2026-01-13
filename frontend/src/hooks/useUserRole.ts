import { useState, useEffect } from 'react';
import useAuth from './useAuth';
import { isDefaultAdmin } from '../config/admin';
import useUsers from './useUsers';
import { adminRoleApi, type AdminUserRole } from '../services/api';

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

      setLoading(true);
      try {
        // 1) Check new payments-based role store first
        try {
          const resp = await adminRoleApi.getForUser({
            userId: user.uid,
            userEmail: user.email,
          });

          if (resp.success && Array.isArray(resp.data) && resp.data.length > 0) {
            const roleEntry = resp.data[0] as AdminUserRole;
            const role = roleEntry.role;
            // Treat both admin and moderator as "can access admin panel"
            setIsAdmin(role === 'admin' || role === 'moderator');
            return;
          }
        } catch {
          // ignore payments-role errors and fall back to Firestore roles
        }

        // 2) Fallback: Check role from Firestore (legacy path)
        const role = await getUserRole(user.email);
        setIsAdmin(role === 'admin');
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [user?.email, user?.uid, getUserRole]);

  return { isAdmin, loading };
}

export default useUserRole;

