import { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import { paymentApi } from '../services/api';
import type { BackendPurchase } from '../types';

function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<BackendPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.uid) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch user-specific orders from backend
        const response = await paymentApi.getAll(100, user.uid);
        if (response.success && Array.isArray(response.data)) {
          // Sort by latest first
          const sortedOrders = (response.data as BackendPurchase[]).sort((a, b) => {
            const aTime = new Date(a.verifiedAt || a.createdAt || 0).getTime();
            const bTime = new Date(b.verifiedAt || b.createdAt || 0).getTime();
            return bTime - aTime;
          });
          setOrders(sortedOrders);
        } else {
          setOrders([]);
          if (response.message) {
            setError(response.message);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load order history');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.uid]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">My Orders</h2>
        <p className="text-sm text-slate-600">
          আপনার সব টপ-আপ ও পেমেন্টের হিস্ট্রি এখানে দেখতে পারবেন।
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-400 rounded-full border-t-transparent animate-spin"></div>
          <p className="ml-3 text-sm text-slate-600">অর্ডার হিস্ট্রি লোড হচ্ছে...</p>
        </div>
      )}

      {!loading && error && (
        <div className="p-4 mb-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-slate-500 mb-2">এখনও কোনো অর্ডার পাওয়া যায়নি।</p>
          <p className="text-sm text-slate-400">আপনি প্রথম টপ-আপ করলেই এখানে দেখাবে।</p>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-200">
            {orders.map((order, index) => {
              const date = order.createdAt ? new Date(order.createdAt) : null;
              const dateLabel = date
                ? date.toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })
                : 'Unknown date';

              const amount = (order.amount ?? order.price) ?? 0;
              const status = order.status || 'pending';
              const isComplete = status === 'completed' || status === 'verified' || order.verifiedAt;
              const statusText = isComplete ? 'complete' : 'pending';

              // Extract serial number from transaction ID (last 5 digits or use index)
              const serialNo = order.transactionId?.slice(-5) || String(10000 + orders.length - index);

              return (
                <div
                  key={order._id || order.transactionId}
                  className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 sm:gap-4 items-start">
                    {/* Serial NO */}
                    <div className="sm:col-span-1">
                      <p className="text-xs text-slate-500 mb-1">Serial NO</p>
                      <p className="text-sm font-semibold text-slate-900">{serialNo}</p>
                    </div>

                    {/* Date */}
                    <div className="sm:col-span-1">
                      <p className="text-xs text-slate-500 mb-1">Date</p>
                      <p className="text-sm text-slate-900">{dateLabel}</p>
                    </div>

                    {/* Package */}
                    <div className="sm:col-span-1">
                      <p className="text-xs text-slate-500 mb-1">Package</p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium text-slate-900">
                          {order.diamonds ? `${order.diamonds} Diamond` : order.productName || 'Top-up'}
                        </p>
                        {order.diamonds && (
                          <span className="text-blue-400">💎</span>
                        )}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-1">
                      <p className="text-xs text-slate-500 mb-1">Quantity</p>
                      <p className="text-sm text-slate-900">1</p>
                    </div>

                    {/* Player ID */}
                    <div className="sm:col-span-1">
                      <p className="text-xs text-slate-500 mb-1">Player ID</p>
                      <p className="text-sm font-mono text-slate-900 break-all">
                        {order.playerId || '-'}
                      </p>
                    </div>

                    {/* Price & Status */}
                    <div className="sm:col-span-1 flex flex-col sm:items-end">
                      <div className="mb-2">
                        <p className="text-xs text-slate-500 mb-1">Price</p>
                        <p className="text-sm font-bold text-slate-900">
                          {amount.toFixed(0)} Tk
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Status</p>
                        <p className={`text-sm font-semibold ${
                          isComplete ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {statusText}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Transaction ID - Show on mobile */}
                  <div className="mt-3 pt-3 border-t border-slate-100 sm:hidden">
                    <p className="text-xs text-slate-500">
                      TrxID: <span className="text-slate-700 font-mono">{order.transactionId}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
