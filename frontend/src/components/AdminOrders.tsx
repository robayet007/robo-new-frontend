import { useEffect, useState } from 'react';
import { paymentApi } from '../services/api';

type AdminOrder = {
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
  diamonds?: string;
  price?: number;
  status?: string;
  bkashNumber?: string;
  telegramNotification?: boolean;
  telegramMessageId?: string;
  verifiedAt?: string;
  createdAt?: string;
};

function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await paymentApi.getAll(200);
        if (resp.success && Array.isArray(resp.data)) {
          const list = resp.data as AdminOrder[];
          // sort latest first
          list.sort((a, b) => {
            const aTime = new Date(a.verifiedAt || a.createdAt || 0).getTime();
            const bTime = new Date(b.verifiedAt || b.createdAt || 0).getTime();
            return bTime - aTime;
          });
          setOrders(list);
        } else {
          setOrders([]);
          setError(resp.message || 'Failed to load orders');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.userEmail?.toLowerCase().includes(s) ||
      o.userName?.toLowerCase().includes(s) ||
      o.transactionId?.toLowerCase().includes(s) ||
      o.productName?.toLowerCase().includes(s) ||
      o.playerId?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4 pt-4 pr-4 pb-4 pl-0 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold sm:text-xl text-slate-900">Order History (All)</h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Total orders: <span className="font-semibold text-slate-900">{orders.length}</span>
            {search && (
              <span className="ml-2">
                (Filtered: <span className="font-semibold text-slate-900">{filtered.length}</span>)
              </span>
            )}
          </p>
        </div>
        <div className="flex-1 sm:max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, name, product, TrxID or Player ID..."
            className="w-full px-3 py-2 text-sm border sm:px-4 rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-400 rounded-full border-t-transparent animate-spin" />
          <p className="ml-3 text-sm text-slate-600">Loading orders...</p>
        </div>
      )}

      {!loading && error && (
        <div className="p-4 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="py-12 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 mb-2">
            {search ? 'No orders found matching your search.' : 'No orders found.'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-200">
            {filtered.map((order, index) => {
              const date = order.verifiedAt || order.createdAt;
              const dateLabel = date
                ? new Date(date).toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })
                : 'Unknown date';

              const amount = (order.price ?? order.amount ?? 0);
              const status = order.status || 'pending';
              const isComplete = status === 'completed' || status === 'verified' || order.verifiedAt;
              const statusText = isComplete ? 'complete' : 'pending';

              // Extract serial number from transaction ID
              const serialNo = order.transactionId?.slice(-5) || String(10000 + filtered.length - index);

              return (
                <div
                  key={order._id || order.transactionId}
                  className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 sm:gap-4 items-start">
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

                    {/* User */}
                    <div className="sm:col-span-1">
                      <p className="text-xs text-slate-500 mb-1">User</p>
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {order.userName || order.userEmail?.split('@')[0] || 'Unknown'}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {order.userEmail || '-'}
                      </p>
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

                    {/* Player ID */}
                    <div className="sm:col-span-1">
                      <p className="text-xs text-slate-500 mb-1">Player ID</p>
                      <p className="text-sm font-mono text-slate-900 break-all">
                        {order.playerId || '-'}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="sm:col-span-1">
                      <p className="text-xs text-slate-500 mb-1">Price</p>
                      <p className="text-sm font-bold text-slate-900">
                        {amount.toFixed(0)} Tk
                      </p>
                    </div>

                    {/* Status */}
                    <div className="sm:col-span-1">
                      <p className="text-xs text-slate-500 mb-1">Status</p>
                      <p className={`text-sm font-semibold ${
                        isComplete ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {statusText}
                      </p>
                      {/* Payment Method */}
                      <p className="text-[10px] text-slate-500 mt-1">
                        {order.paymentMethod === 'robo' ? 'Robo Pay' : 
                         order.paymentMethod === 'uddokta' ? 'Uddokta Pay' :
                         'bKash'}
                      </p>
                    </div>
                  </div>

                  {/* Additional Info - Show on mobile or when expanded */}
                  <div className="mt-3 pt-3 border-t border-slate-100 sm:hidden">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500">TrxID:</p>
                        <p className="text-slate-700 font-mono">{order.transactionId}</p>
                      </div>
                      {typeof order.updatedBalance === 'number' && (
                        <div>
                          <p className="text-slate-500">Balance After:</p>
                          <p className="text-slate-700">৳{order.updatedBalance.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
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

export default AdminOrders;
