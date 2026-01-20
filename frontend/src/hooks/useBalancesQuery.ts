import { useQuery } from '@tanstack/react-query';
import { balanceApi } from '../services/api';

export type BalanceRecord = {
  userId: string;
  userEmail: string;
  balance: number;
};

// Query key factory
export const balancesQueryKeys = {
  all: ['balances'] as const,
  lists: () => [...balancesQueryKeys.all, 'list'] as const,
  list: () => [...balancesQueryKeys.lists()] as const,
};

// Fetch balance records
async function fetchBalances(): Promise<BalanceRecord[]> {
  const resp = await balanceApi.getAllBalances();
  if (!resp.success || !Array.isArray(resp.data)) {
    return [];
  }

  return (resp.data as any[]).map((b) => ({
    userId: b.userId,
    userEmail: b.userEmail,
    balance: typeof b.balance === 'number' ? Number(b.balance) : 0,
  }));
}

/**
 * Hook to fetch balance records with React Query caching
 * Returns cached data immediately on subsequent visits
 */
export function useBalancesQuery() {
  return useQuery({
    queryKey: balancesQueryKeys.list(),
    queryFn: fetchBalances,
    staleTime: 3 * 60 * 1000, // 3 minutes - balances change more frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
