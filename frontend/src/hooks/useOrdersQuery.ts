import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../services/api';

export type AdminOrder = {
  _id?: string;
  transactionId: string;
  amount: number;
  playerId: string;
  userEmail?: string;
  userName?: string;
  userId?: string;
  paymentMethod?: 'bkash' | 'robo' | 'uddokta' | string;
  updatedBalance?: number | null;
  productId?: string;
  productName?: string;
  categoryId?: string;
  diamonds?: string;
  price?: number;
  status?: string;
  bkashNumber?: string;
  telegramNotification?: boolean;
  telegramMessageId?: string;
  verifiedAt?: string;
  createdAt?: string;
};

// Query key factory
export const ordersQueryKeys = {
  all: ['orders'] as const,
  lists: () => [...ordersQueryKeys.all, 'list'] as const,
  list: (limit?: number) => [...ordersQueryKeys.lists(), limit] as const,
};

// Fetch orders
async function fetchOrders(limit: number = 1000): Promise<AdminOrder[]> {
  const resp = await paymentApi.getAll(limit);
  if (!resp.success || !Array.isArray(resp.data)) {
    return [];
  }
  return resp.data as AdminOrder[];
}

/**
 * Hook to fetch orders with React Query caching
 * Shared cache between Dashboard and Orders components
 * @param limit - Maximum number of orders to fetch (default: 1000)
 */
export function useOrdersQuery(limit: number = 1000) {
  return useQuery({
    queryKey: ordersQueryKeys.list(limit),
    queryFn: () => fetchOrders(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes - orders change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
