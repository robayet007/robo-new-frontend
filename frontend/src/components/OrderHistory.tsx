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
        // Fetch all payments from backend, then filter by current userId
        const response = await paymentApi.getAll(100);
        if (response.success && Array.isArray(response.data)) {
          const all = response.data as BackendPurchase[];
          const userOrders = all.filter((p) => p.userId === user.uid);
          setOrders(userOrders);
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
    <div className="max-w-2xl p-4 mx-auto mt-4 bg-white border shadow-xl sm:mt-6 md:mt-8 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border-slate-200">
      <div className="mb-6 text-center">
        <p className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/10 text-amber-700 border border-amber-400/35 font-semibold text-sm mb-4">
          📦 Order History
        </p>
        <h2 className="mb-1 text-2xl font-bold text-slate-900">Your Orders</h2>
        <p className="text-sm text-slate-600">
          আপনার সব টপ-আপ ও পেমেন্টের হিস্ট্রি এখানে দেখতে পারবেন।
        </p>
      </div>

      {loading && (
        <div className="py-8 text-sm text-center text-slate-500">
          অর্ডার হিস্ট্রি লোড হচ্ছে...
        </div>
      )}

      {!loading && error && (
        <div className="p-3 mb-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="py-8 text-sm text-center text-slate-500">
          এখনও কোনো অর্ডার পাওয়া যায়নি। আপনি প্রথম টপ-আপ করলেই এখানে দেখাবে।
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {orders.map((order) => {
            const date = order.createdAt ? new Date(order.createdAt) : null;
            const dateLabel = date
              ? date.toLocaleString('bn-BD', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
              : 'Unknown date';

            const isRobo = order.paymentMethod === 'robo';
            const paymentMethod = order.paymentMethod;
            const amount = (order.amount ?? order.price) ?? 0;

            return (
              <div
                key={order._id || order.transactionId}
                className="flex items-start justify-between gap-3 p-3 border rounded-xl border-slate-200 bg-slate-50/60"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-800">
                      {order.productName || 'Top-up'}
                    </span>
                    {order.diamonds ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-sky-100 text-sky-700">
                        💎 {order.diamonds}
                      </span>
                    ) : null}
                  </div>
                  <p className="mb-1 text-xs text-slate-500">
                    TrxID: {order.transactionId}
                  </p>
                  <p className="text-xs text-slate-500">{dateLabel}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    ৳{amount.toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs">
                    <span className={
                      isRobo ? 'text-purple-600' : 
                      paymentMethod === 'uddokta' ? 'text-blue-600' : 
                      'text-rose-600'
                    }>
                      {isRobo ? 'Robo Pay' : paymentMethod === 'uddokta' ? 'Uddokta Pay' : 'bKash'}
                    </span>
                    <span className="text-slate-400"> • </span>
                    <span
                      className={
                        order.status === 'verified' || order.status === 'completed'
                          ? 'text-emerald-600'
                          : order.status === 'pending'
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </p>

                  {typeof order.updatedBalance === 'number' && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Balance after: ৳{order.updatedBalance.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
