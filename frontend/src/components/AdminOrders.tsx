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
  diamonds?: number;
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
        // console.error('Error loading orders:', err);
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
      o.productName?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">Order History (All)</h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Total orders: <span className="font-semibold text-slate-900">{orders.length}</span>
          </p>
        </div>
        <div className="flex-1 sm:max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, name, product or TrxID..."
            className="w-full px-3 sm:px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <p className="ml-3 text-slate-600 text-sm">Loading orders...</p>
        </div>
      )}

      {!loading && error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
          <div className="grid grid-cols-[1.6fr_1.6fr_1fr_1fr_1.1fr_1.2fr] min-w-[980px] gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 border-b border-slate-200 text-[11px] sm:text-xs font-semibold text-slate-700">
            <div>User</div>
            <div>Product</div>
            <div>Amount</div>
            <div>Payment</div>
            <div>Balance After</div>
            <div>Time</div>
          </div>
          {filtered.length > 0 ? (
            filtered.map((o) => {
              const date = o.verifiedAt || o.createdAt;
              const dateLabel = date
                ? new Date(date).toLocaleString('bn-BD', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })
                : '-';

              return (
                <div
                  key={o._id || o.transactionId}
                  className="grid grid-cols-[1.6fr_1.6fr_1fr_1fr_1.1fr_1.2fr] min-w-[980px] gap-2 sm:gap-3 p-3 sm:p-4 border-b border-slate-100 text-[11px] sm:text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {o.userName || o.userEmail || 'Unknown user'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {o.userEmail || '-'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      UID: {o.userId || '-'}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {o.productName || 'Top up'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {o.diamonds ? `💎 ${o.diamonds}` : o.productId}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      TrxID: {o.transactionId}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      ৳{(o.price ?? o.amount ?? 0).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Paid: ৳{(o.amount ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        o.paymentMethod === 'robo'
                          ? 'bg-purple-100 text-purple-700'
                          : o.paymentMethod === 'uddokta'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {o.paymentMethod === 'robo' ? 'Robo Pay' : 
                       o.paymentMethod === 'uddokta' ? 'Uddokta Pay' :
                       'bKash'}
                    </span>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {o.status || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-emerald-700">
                      {typeof o.updatedBalance === 'number'
                        ? `৳${o.updatedBalance.toFixed(2)}`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600">{dateLabel}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-500 text-sm">
              No orders found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminOrders;


