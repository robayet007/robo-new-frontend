import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useRoboBalance from '../hooks/useRoboBalance';
import { paymentApi } from '../services/api';
import type { BackendPurchase } from '../types';
import { getImageUrl } from '../utils/imageUrl';
import { FaSearch, FaRedo, FaBoxOpen, FaCopy, FaCheck } from 'react-icons/fa';

function OrderHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ucTopupStatus } = useRoboBalance();
  const [orders, setOrders] = useState<BackendPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'processing' | 'failed'>('all');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    if (!text || text === '—') return;
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const isAddMoneyOrTransfer = (order: BackendPurchase) =>
    ['add_money', 'balance_transfer'].includes(order.productId || '');

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
    <div className="mx-auto max-w-6xl p-3 sm:p-5">
      {/* Header */}
      <div className="mb-4">
        <h2 className="mb-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Order History</h2>
        <p className="text-sm text-slate-500">Track and manage your purchase history.</p>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute text-slate-400 left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by Order ID, product, or player..."
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
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin" />
            <p className="mt-3 text-sm font-medium text-slate-600">Loading...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && filteredOrders.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
            <FaBoxOpen className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="mb-1 text-base font-semibold text-slate-600">No orders yet</p>
            <p className="mb-4 text-sm text-slate-500">Your purchase history will appear here.</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md transition-shadow hover:shadow-lg"
              style={{ background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))' }}
            >
              Browse Games
            </button>
          </div>
        )}

        {!loading && filteredOrders.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="divide-y divide-slate-100">
              {filteredOrders.map((order, index) => {
              const date = order.createdAt ? new Date(order.createdAt) : null;
              const dateLabel = date
                ? date.toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })
                : '—';

              const amount = (order.amount ?? order.price) ?? 0;
              const status = normalizedStatus(order);
              const orderUid = order.transactionId || order._id || `ORD-${10000 + filteredOrders.length - index}`;

              const userPhotoKey = `${order._id}-user`;
              const productImgKey = `${order._id}-product`;
              const displayName = order.userName || order.userEmail?.split('@')[0] || 'User';
              const initial = displayName.charAt(0).toUpperCase();
              const isCopied = copiedId === orderUid;

              const showUcCode = order.diamonds && !isAddMoneyOrTransfer(order);
              const ucCodeVal = order.ucCode || '—';
              const ucCopyKey = `uc-${orderUid}`;

              return (
                <div
                  key={order._id || order.transactionId}
                  className="group p-3 transition-all duration-200 sm:p-4 hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-transparent"
                >
                  {/* Order ID + Status - compact */}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white px-2.5 py-1.5 shadow-sm">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Order ID</span>
                      <code className="font-mono text-sm font-semibold tracking-tight text-slate-800 sm:text-base">
                        {orderUid}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(orderUid, orderUid)}
                        className="rounded p-1 transition-colors hover:bg-slate-200/60"
                        title="Copy"
                      >
                        {isCopied ? (
                          <FaCheck className="h-3 w-3 text-green-600 sm:h-3.5 sm:w-3.5" />
                        ) : (
                          <FaCopy className="h-3 w-3 text-slate-500 sm:h-3.5 sm:w-3.5" />
                        )}
                      </button>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:text-xs ${
                        status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60'
                          : status === 'failed'
                          ? 'bg-red-50 text-red-700 ring-1 ring-red-200/60'
                          : status === 'processing'
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60'
                          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60'
                      }`}
                    >
                      {statusDisplayLabel(status)}
                    </span>
                  </div>

                  {/* Mobile: 2-col | Desktop: auto grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4 lg:grid-cols-6 sm:gap-3">
                    {/* Images - full row on mobile */}
                    <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 flex-shrink-0 sm:h-9 sm:w-9">
                          {order.userPhotoURL && !imageErrors.has(userPhotoKey) ? (
                            <img
                              src={getImageUrl(order.userPhotoURL)}
                              alt={displayName}
                              className="h-8 w-8 rounded-full border border-slate-200 object-cover sm:h-9 sm:w-9"
                              onError={() => setImageErrors((prev) => new Set(prev).add(userPhotoKey))}
                            />
                          ) : (
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-xs font-semibold sm:h-9 sm:w-9"
                              style={{ backgroundColor: 'var(--theme-primary)', color: 'white', opacity: 0.95 }}
                            >
                              {initial}
                            </div>
                          )}
                        </div>
                        {order.productImage && !imageErrors.has(productImgKey) ? (
                          <img
                            src={getImageUrl(order.productImage)}
                            alt={order.productName || 'Product'}
                            className="h-8 w-8 flex-shrink-0 rounded-lg border border-slate-200 object-cover sm:h-9 sm:w-9"
                            onError={() => setImageErrors((prev) => new Set(prev).add(productImgKey))}
                          />
                        ) : (
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 sm:h-9 sm:w-9">
                            <FaBoxOpen className="h-3.5 w-3.5 text-slate-400 sm:h-4 sm:w-4" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date</p>
                      <p className="text-sm font-medium text-slate-800 sm:text-base">{dateLabel}</p>
                    </div>

                    {/* Package */}
                    <div>
                      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Package</p>
                      <p className="text-sm font-semibold text-slate-900 sm:text-base">
                        {order.diamonds ? order.productName : order.productName || 'Top-up'}
                      </p>
                    </div>

                    {/* Qty - hide for add/transfer */}
                    {!isAddMoneyOrTransfer(order) && (
                      <div>
                        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Qty</p>
                        <p className="text-sm font-medium text-slate-800 sm:text-base">1</p>
                      </div>
                    )}

                    {/* Player ID - hide for add/transfer */}
                    {!isAddMoneyOrTransfer(order) && (
                      <div className="col-span-2 sm:col-span-1">
                        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Player ID</p>
                        <p className="font-mono text-sm font-medium text-slate-800 sm:text-base break-all">
                          {order.playerId || '—'}
                        </p>
                      </div>
                    )}

                    {/* UC Code - only for diamond/UC, not add_money/transfer, with copy */}
                    {showUcCode && (
                      <div className="col-span-2 sm:col-span-1">
                        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">UC Code</p>
                        <div className="inline-flex items-center gap-1">
                          <code className="font-mono text-sm font-semibold text-slate-800 sm:text-base break-all">
                            {ucCodeVal}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(ucCodeVal, ucCopyKey)}
                            className="rounded p-1 transition-colors hover:bg-slate-200/60"
                            title="Copy UC Code"
                          >
                            {copiedId === ucCopyKey ? (
                              <FaCheck className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <FaCopy className="h-3.5 w-3.5 text-slate-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Price - full width on mobile */}
                    <div className="col-span-2 sm:col-span-1 sm:text-right">
                      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Price</p>
                      <p className="text-base font-bold text-slate-900 sm:text-lg">
                        {amount.toFixed(0)} <span className="text-sm font-medium text-slate-600">৳</span>
                      </p>
                    </div>
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
