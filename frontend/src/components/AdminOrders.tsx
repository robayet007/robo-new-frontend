import { useState, useMemo } from 'react';
import { useOrdersQuery } from '../hooks/useOrdersQuery';

function AdminOrders() {
  // Use cached orders hook - data is cached and shared with AdminDashboard component
  const { data: ordersData = [], isLoading: loading, error: queryError } = useOrdersQuery(200);
  const [search, setSearch] = useState('');

  // Sort orders latest first (memoized for performance)
  const orders = useMemo(() => {
    const sorted = [...ordersData].sort((a, b) => {
      const aTime = new Date(a.verifiedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.verifiedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
    return sorted;
  }, [ordersData]);

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load orders') : null;

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
    <div className="space-y-4 pt-4 pb-4 pl-0 pr-4 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0" style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="p-4 border shadow-sm rounded-2xl border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-white sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight sm:text-xl text-slate-900">Order History (All)</h3>
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
        <div className="py-12 text-center bg-white border rounded-xl border-slate-200">
          <p className="mb-2 text-slate-500">
            {search ? 'No orders found matching your search.' : 'No orders found.'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-hidden bg-white border shadow-sm rounded-xl border-slate-200">
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
              const rawStatus = String(order.status || '').toLowerCase();
              const normalizedStatus =
                rawStatus === 'processing' ? 'processing' :
                rawStatus === 'failed' || rawStatus === 'cancelled' || rawStatus === 'rejected' ? 'failed' :
                rawStatus === 'completed' || rawStatus === 'verified' || !!order.verifiedAt ? 'completed' :
                'pending';
              const statusText = normalizedStatus === 'processing' ? 'Processing' :
                normalizedStatus === 'failed' ? 'Failed' :
                normalizedStatus === 'completed' ? 'Complete' : 'Pending';
              const isUcPurchase = Boolean(order.diamonds && String(order.productId || '').toLowerCase() !== 'add_money');

              // Extract serial number from transaction ID
              const serialNo = order.transactionId?.slice(-5) || String(10000 + filtered.length - index);

              return (
                <div
                  key={order._id || order.transactionId}
                  className="p-4 transition-all border-l-4 sm:p-5 hover:bg-slate-50/60 border-l-transparent hover:border-l-slate-300"
                >
                  <div className="grid items-start grid-cols-1 gap-3 sm:grid-cols-7 sm:gap-4">
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

                    {/* User */}
                    <div className="sm:col-span-1">
                      <p className="mb-1 text-xs text-slate-500">User</p>
                      <p className="text-sm font-medium truncate text-slate-900">
                        {order.userName || order.userEmail?.split('@')[0] || 'Unknown'}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {order.userEmail || '-'}
                      </p>
                    </div>

                    {/* Package */}
                    <div className="sm:col-span-1">
                      <p className="mb-1 text-xs text-slate-500">Package</p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium text-slate-900">
                          {order.diamonds ? `${order.productName}` : order.productName || 'Top-up'}
                        </p>
                        {/* {order.diamonds && (
                          <span className="text-blue-400">💎</span>
                        )} */}
                      </div>
                    </div>

                    {/* Player ID */}
                    <div className="sm:col-span-1">
                      <p className="mb-1 text-xs text-slate-500">Player ID</p>
                      <p className="font-mono text-sm break-all text-slate-900">
                        {order.playerId || '-'}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="sm:col-span-1">
                      <p className="mb-1 text-xs text-slate-500">Price</p>
                      <p className="text-sm font-bold text-slate-900">
                        {amount.toFixed(0)} Tk
                      </p>
                    </div>

                    {/* Status */}
                    <div className="sm:col-span-1">
                      <p className="mb-1 text-xs text-slate-500">Status</p>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        normalizedStatus === 'completed' ? 'text-green-600' :
                        normalizedStatus === 'processing' ? 'text-amber-600' :
                        normalizedStatus === 'failed' ? 'text-red-600' : 'text-slate-600'
                      } ${
                        normalizedStatus === 'completed' ? 'bg-emerald-50 ring-1 ring-emerald-200/70' :
                        normalizedStatus === 'processing' ? 'bg-amber-50 ring-1 ring-amber-200/70' :
                        normalizedStatus === 'failed' ? 'bg-red-50 ring-1 ring-red-200/70' :
                        'bg-slate-50 ring-1 ring-slate-200/70'
                      }`}>
                        {statusText}
                      </span>
                      {/* Payment Method */}
                      <p className="text-[10px] text-slate-500 mt-1">
                        {order.paymentMethod === 'robo' ? 'Robo Pay' : 
                         order.paymentMethod === 'uddokta' ? 'Uddokta Pay' :
                         'bKash'}
                      </p>
                    </div>
                  </div>

                  {isUcPurchase && (
                    <div className="pt-3 mt-3 border-t border-slate-100">
                      <p className="mb-1 text-xs text-slate-500">UC Code</p>
                      <p className="px-2.5 py-1.5 inline-flex rounded-lg bg-slate-50 ring-1 ring-slate-200 font-mono text-xs sm:text-sm break-all text-slate-800">
                        {order.ucCode || 'Pending / not generated yet'}
                      </p>
                    </div>
                  )}

                  {/* Additional Info - Show on mobile or when expanded */}
                  <div className="pt-3 mt-3 border-t border-slate-100 sm:hidden">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500">TrxID:</p>
                        <p className="font-mono text-slate-700">{order.transactionId}</p>
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
