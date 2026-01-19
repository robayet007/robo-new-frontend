import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import useAuth from '../hooks/useAuth';
import { isDefaultAdmin } from '../config/admin';
import { adminRoleApi, type AdminUserRole, type AdminModerationPermissions } from '../services/api';

type Role = 'user' | 'moderator' | 'admin' | 'reseller';

interface ModeratorPermissionsState {
  role: Role;
  permissions: AdminModerationPermissions;
  loading: boolean;
}

interface ModeratorPermissionsContextType extends ModeratorPermissionsState {}

const ModeratorPermissionsContext = createContext<ModeratorPermissionsContextType | undefined>(undefined);

export function ModeratorPermissionsProvider({ children }: { children: ReactNode }) {
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
        // Fetch role and permissions from backend (single API call)
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
          } else if (role === 'reseller') {
            // Resellers are like regular users - no admin access
            setState({ role: 'reseller', permissions: {}, loading: false });
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

  return (
    <ModeratorPermissionsContext.Provider value={state}>
      {children}
    </ModeratorPermissionsContext.Provider>
  );
}

export function useModeratorPermissionsContext(): ModeratorPermissionsContextType {
  const context = useContext(ModeratorPermissionsContext);
  if (context === undefined) {
    throw new Error('useModeratorPermissionsContext must be used within a ModeratorPermissionsProvider');
  }
  return context;
}
