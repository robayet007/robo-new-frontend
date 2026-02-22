import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useRoboBalance from '../hooks/useRoboBalance';
import { paymentApi } from '../services/api';
import type { BackendPurchase } from '../types';
import { FaSearch, FaRedo, FaBoxOpen } from 'react-icons/fa';

function OrderHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ucTopupStatus } = useRoboBalance();
  const [orders, setOrders] = useState<BackendPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'processing' | 'failed'>('all');

  const fetchOrders = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const response = await paymentApi.getAll(100, user.uid);
      if (response.success && Array.isArray(response.data)) {
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
  }, [user?.uid]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Refetch orders when UC webhook returns completed/failed so status updates in real time
  useEffect(() => {
    if (ucTopupStatus?.status === 'completed' || ucTopupStatus?.status === 'failed') {
      fetchOrders();
    }
  }, [ucTopupStatus?.status, ucTopupStatus?.transactionId, fetchOrders]);

  const normalizedStatus = (order: BackendPurchase): 'completed' | 'pending' | 'processing' | 'failed' => {
    const status = String(order.status || '').toLowerCase();
    if (status === 'processing') return 'processing';
    if (status === 'failed' || status === 'cancelled' || status === 'rejected') return 'failed';
    if (status === 'completed' || status === 'verified' || !!order.verifiedAt) return 'completed';
    return 'pending';
  };

  const statusDisplayLabel = (status: string) => {
    if (status === 'processing') return 'Processing';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredOrders = orders.filter((order) => {
    const q = searchText.trim().toLowerCase();
    const status = normalizedStatus(order);
    if (statusFilter !== 'all' && status !== statusFilter) return false;
    if (!q) return true;
    return (
      (order.transactionId || '').toLowerCase().includes(q) ||
      (order.productName || '').toLowerCase().includes(q) ||
      (order.playerId || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl p-4 mx-auto sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="mb-1 text-2xl font-bold sm:text-3xl text-slate-900">My Orders</h2>
        <p className="text-sm text-slate-500">A list of your recent orders.</p>
      </div>

      <div className="p-4 bg-white border shadow-sm rounded-2xl border-slate-200 sm:p-5">
        <div className="flex flex-col gap-3 mb-5 sm:flex-row">
          <div className="relative flex-1">
            <FaSearch className="absolute text-slate-400 left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by Order ID..."
              className="w-full py-2.5 pl-10 pr-4 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'pending' | 'processing' | 'failed')}
            className="px-3 py-2.5 border rounded-xl border-slate-300 text-slate-700 focus:outline-none focus:ring-2 min-w-[140px]"
            style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setSearchText('');
              setStatusFilter('all');
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <FaRedo className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-purple-400 rounded-full border-t-transparent animate-spin"></div>
            <p className="ml-3 text-sm text-slate-600">Loading orders...</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-4 mb-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        {!loading && !error && filteredOrders.length === 0 && (
          <div className="py-16 text-center">
            <FaBoxOpen className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p className="mb-3 text-2xl text-slate-500">No orders yet.</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
              style={{ background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))' }}
            >
              Browse Games
            </button>
          </div>
        )}

        {!loading && filteredOrders.length > 0 && (
          <div className="overflow-hidden bg-white border rounded-xl border-slate-200">
            <div className="divide-y divide-slate-200">
              {filteredOrders.map((order, index) => {
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
              const status = normalizedStatus(order);

              // Extract serial number from transaction ID (last 5 digits or use index)
              const serialNo = order.transactionId?.slice(-5) || String(10000 + filteredOrders.length - index);

              return (
                <div
                  key={order._id || order.transactionId}
                  className="p-4 transition-colors sm:p-5 hover:bg-slate-50/50"
                >
                  <div className="grid items-start grid-cols-1 gap-3 sm:grid-cols-6 sm:gap-4">
                    {/* Serial NO */}
                    <div className="sm:col-span-1">
                      <p className="mb-1 text-xs text-slate-500">Serial NO</p>
                      <p className="text-sm font-semibold text-slate-900">{serialNo}</p>
                    </div>

                    {/* Date */}
                    <div className="sm:col-span-1">
                      <p className="mb-1 text-xs text-slate-500">Date</p>
                      <p className="text-sm text-slate-900">{dateLabel}</p>
                    </div>

                    {/* Package */}
                    <div className="sm:col-span-1">
                      <p className="mb-1 text-xs text-slate-500">Package</p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium text-slate-900">
                          {order.diamonds ? `${order.productName}` : order.productName || 'Top-up'}
                        </p>
                        {/* {order.diamonds && (
                          <span className="text-blue-400"></span>
                        )} */}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-1">
                      <p className="mb-1 text-xs text-slate-500">Quantity</p>
                      <p className="text-sm text-slate-900">1</p>
                    </div>

                    {/* Player ID */}
                    <div className="sm:col-span-1">
                      <p className="mb-1 text-xs text-slate-500">Player ID</p>
                      <p className="font-mono text-sm break-all text-slate-900">
                        {order.playerId || '-'}
                      </p>
                    </div>

                    {/* Price & Status */}
                    <div className="flex flex-col sm:col-span-1 sm:items-end">
                      <div className="mb-2">
                        <p className="mb-1 text-xs text-slate-500">Price</p>
                        <p className="text-sm font-bold text-slate-900">
                          {amount.toFixed(0)} Tk
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-slate-500">Status</p>
                        <p className={`text-sm font-semibold ${
                          status === 'completed' ? 'text-green-600' : status === 'failed' ? 'text-red-600' : status === 'processing' ? 'text-blue-600' : 'text-amber-600'
                        }`}>
                          {statusDisplayLabel(status)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Transaction ID - Show on mobile */}
                  <div className="pt-3 mt-3 border-t border-slate-100 sm:hidden">
                    <p className="text-xs text-slate-500">
                      TrxID: <span className="font-mono text-slate-700">{order.transactionId}</span>
                    </p>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
      )}
      </div>
    </div>
  );
}

export default OrderHistory;
