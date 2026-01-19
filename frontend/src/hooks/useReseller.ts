import { useState, useEffect, useCallback } from 'react';
import useAuth from './useAuth';
import { adminRoleApi, type AdminUserRole } from '../services/api';

function useReseller() {
  const { user } = useAuth();
  const [isReseller, setIsReseller] = useState(false);
  const [loading, setLoading] = useState(false); // Start with false - non-blocking

  const checkReseller = useCallback(async () => {
    if (!user?.email) {
      setIsReseller(false);
      return;
    }

    setLoading(true);
    try {
      // Check reseller status from backend
      const resp = await adminRoleApi.getForUser({
        userId: user.uid,
        userEmail: user.email,
      });

      if (resp.success && Array.isArray(resp.data) && resp.data.length > 0) {
        const roleEntry = resp.data[0] as AdminUserRole;
        const role = roleEntry.role;
        setIsReseller(role === 'reseller');
        return;
      }
      
      // If no role found, user is not a reseller
      setIsReseller(false);
    } catch {
      // On error, assume not a reseller
      setIsReseller(false);
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.uid]);

  useEffect(() => {
    checkReseller();
  }, [checkReseller]);

  // Refresh function that can be called externally
  const refreshReseller = useCallback(() => {
    checkReseller();
  }, [checkReseller]);

  return { isReseller, loading, refreshReseller };
}

export default useReseller;
