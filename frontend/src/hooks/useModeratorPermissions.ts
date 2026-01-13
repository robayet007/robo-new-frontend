import { useState, useEffect } from 'react';
import useAuth from './useAuth';
import { isDefaultAdmin } from '../config/admin';
import { adminRoleApi, type AdminUserRole, type AdminModerationPermissions } from '../services/api';

type Role = 'user' | 'moderator' | 'admin';

interface ModeratorPermissionsState {
  role: Role;
  permissions: AdminModerationPermissions;
  loading: boolean;
}

function useModeratorPermissions(): ModeratorPermissionsState {
  const { user } = useAuth();
  const [state, setState] = useState<ModeratorPermissionsState>({
    role: 'user',
    permissions: {},
    loading: true,
  });

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user?.email) {
        setState({ role: 'user', permissions: {}, loading: false });
        return;
      }

      // Default admin gets full access
      if (isDefaultAdmin(user.email)) {
        setState({
          role: 'admin',
          permissions: {
            canAccessDashboard: true,
            canManageProducts: true,
            canManageBanners: true,
            canManageNotices: true,
            canManageGamePackages: true,
            canManageUsers: true,
            canManageOrders: true,
          },
          loading: false,
        });
        return;
      }

      setState(prev => ({ ...prev, loading: true }));

      try {
        // Fetch role and permissions from backend
        const resp = await adminRoleApi.getForUser({
          userId: user.uid,
          userEmail: user.email,
        });

        if (resp.success && Array.isArray(resp.data) && resp.data.length > 0) {
          const roleEntry = resp.data[0] as AdminUserRole;
          const role = roleEntry.role as Role;

          if (role === 'admin') {
            // Full admin gets all permissions
            setState({
              role: 'admin',
              permissions: {
                canAccessDashboard: true,
                canManageProducts: true,
                canManageBanners: true,
                canManageNotices: true,
                canManageGamePackages: true,
                canManageUsers: true,
                canManageOrders: true,
              },
              loading: false,
            });
          } else if (role === 'moderator') {
            // Moderator gets only granted permissions
            setState({
              role: 'moderator',
              permissions: roleEntry.moderationPermissions || {},
              loading: false,
            });
          } else {
            setState({ role: 'user', permissions: {}, loading: false });
          }
        } else {
          setState({ role: 'user', permissions: {}, loading: false });
        }
      } catch {
        setState({ role: 'user', permissions: {}, loading: false });
      }
    };

    loadPermissions();
  }, [user?.email, user?.uid]);

  return state;
}

export default useModeratorPermissions;
