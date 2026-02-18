import { useQuery } from '@tanstack/react-query';
import { paymentApi, adminRoleApi } from '../services/api';

type Role = 'user' | 'moderator' | 'admin' | 'reseller';

type AdminModerationPermissions = {
  canAccessDashboard?: boolean;
  canManageProducts?: boolean;
  canManageDigitalCodes?: boolean;
  canManageSubscriptions?: boolean;
  canManageBanners?: boolean;
  canManageNotices?: boolean;
  canManageGamePackages?: boolean;
  canManageUsers?: boolean;
  canManageOrders?: boolean;
};

export type PaymentUserSummary = {
  userId: string;
  userEmail: string;
  userName: string;
  lastBalance: number | null;
  lastPaymentAt: string | null;
  totalOrders: number;
  role?: Role;
  moderationPermissions?: AdminModerationPermissions;
};

// Query key factory
export const paymentUsersQueryKeys = {
  all: ['paymentUsers'] as const,
  lists: () => [...paymentUsersQueryKeys.all, 'list'] as const,
  list: () => [...paymentUsersQueryKeys.lists()] as const,
};

// Fetch payment users summary
async function fetchPaymentUsers(): Promise<PaymentUserSummary[]> {
  // Load roles from backend
  let roleMap = new Map<string, { role: Role; moderationPermissions?: AdminModerationPermissions }>();
  try {
    const rolesResp = await adminRoleApi.getAll();
    if (rolesResp.success && Array.isArray(rolesResp.data)) {
      roleMap = new Map(
        (rolesResp.data as any[]).map((r) => {
          const key = (r.userId || r.userEmail || '').toString();
          return [
            key,
            {
              role: (r.role as Role) || 'user',
              moderationPermissions: r.moderationPermissions || {},
            },
          ];
        })
      );
    }
  } catch {
    // ignore role fetch errors; we'll just default to user
  }

  // Fetch payments (limit 200 for faster user list load; still enough for summary)
  const resp = await paymentApi.getAll(500);
  if (!resp.success || !Array.isArray(resp.data)) {
    return [];
  }

  const byKey = new Map<string, PaymentUserSummary>();

  (resp.data as any[]).forEach((p) => {
    const email: string | undefined = p.userEmail;
    const uid: string | undefined = p.userId;
    if (!email && !uid) return;

    const key = uid || email!;
    const createdTs = new Date(p.verifiedAt || p.createdAt || Date.now()).toISOString();

    const existing = byKey.get(key);
    if (!existing) {
      const roleInfo = roleMap.get(key) || { role: 'user' as Role, moderationPermissions: {} };
      byKey.set(key, {
        userId: uid || email || 'unknown',
        userEmail: email || 'unknown',
        userName: p.userName || '',
        lastBalance:
          typeof p.updatedBalance === 'number' ? Number(p.updatedBalance) : null,
        lastPaymentAt: createdTs,
        totalOrders: 1,
        role: roleInfo.role,
        moderationPermissions: roleInfo.moderationPermissions || {},
      });
    } else {
      existing.totalOrders += 1;

      // update last payment time if newer
      if (
        existing.lastPaymentAt &&
        new Date(createdTs).getTime() > new Date(existing.lastPaymentAt).getTime()
      ) {
        existing.lastPaymentAt = createdTs;
        if (typeof p.updatedBalance === 'number') {
          existing.lastBalance = Number(p.updatedBalance);
        }
      }
    }
  });

  const list = Array.from(byKey.values()).sort((a, b) => {
    const at = a.lastPaymentAt ? new Date(a.lastPaymentAt).getTime() : 0;
    const bt = b.lastPaymentAt ? new Date(b.lastPaymentAt).getTime() : 0;
    return bt - at;
  });

  return list;
}

/**
 * Hook to fetch payment users summary with React Query caching
 * Combines payment data and admin roles
 */
export function usePaymentUsersQuery() {
  return useQuery({
    queryKey: paymentUsersQueryKeys.list(),
    queryFn: fetchPaymentUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
