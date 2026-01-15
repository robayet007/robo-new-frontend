import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import useAuth from '../hooks/useAuth';
import { paymentApi, digitalCodeApi } from '../services/api';
import type { BackendPurchase, BackendDigitalCodePurchase } from '../types';
import { FaCopy, FaCheck } from 'react-icons/fa';

function OrderHistory() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<BackendPurchase[]>([]);
  const [digitalCodePurchases, setDigitalCodePurchases] = useState<BackendDigitalCodePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize activeTab based on URL parameter
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'orders' | 'digitalCodes'>(
    tabParam === 'digitalCodes' ? 'digitalCodes' : 'orders'
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Update tab when URL parameter changes
  useEffect(() => {
    if (tabParam === 'digitalCodes') {
      setActiveTab('digitalCodes');
    } else if (tabParam === 'orders') {
      setActiveTab('orders');
    }
  }, [tabParam]);

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

    const fetchDigitalCodes = async () => {
      if (!user?.uid) return;
      setLoadingCodes(true);
      try {
        const response = await digitalCodeApi.getUserPurchases(user.uid, 100);
        if (response.success && Array.isArray(response.data)) {
          setDigitalCodePurchases(response.data);
        } else {
          setDigitalCodePurchases([]);
        }
      } catch (err: any) {
        console.error('Failed to load digital codes:', err);
        setDigitalCodePurchases([]);
      } finally {
        setLoadingCodes(false);
      }
    };

    fetchOrders();
    fetchDigitalCodes();
  }, [user?.uid]);

  // Socket.IO real-time updates for digital code purchases
  useEffect(() => {
    if (!user?.uid) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'https://backend-dawn-wind-7381.fly.dev';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      socket.emit('join-user-room', user.uid);
    });

    socket.on('digital-code-purchased', (data: { purchase: BackendDigitalCodePurchase }) => {
      if (data.purchase.userId === user.uid) {
        setDigitalCodePurchases(prev => {
          // Check if purchase already exists (update case)
          const existingIndex = prev.findIndex(p => p.transactionId === data.purchase.transactionId);
          
          if (existingIndex >= 0) {
            // Update existing purchase
            const updated = [...prev];
            updated[existingIndex] = data.purchase;
            return updated.sort((a, b) => {
              const aTime = new Date(a.purchasedAt).getTime();
              const bTime = new Date(b.purchasedAt).getTime();
              return bTime - aTime;
            });
          } else {
            // Add new purchase and sort by date (newest first)
            const updated = [data.purchase, ...prev];
            return updated.sort((a, b) => {
              const aTime = new Date(a.purchasedAt).getTime();
              const bTime = new Date(b.purchasedAt).getTime();
              return bTime - aTime;
            });
          }
        });
      }
    });

    socket.on('disconnect', () => {
      // console.log('Socket disconnected');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.uid]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      setError('Failed to copy code');
    }
  };

  return (
    <div className="max-w-4xl p-4 mx-auto sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold sm:text-3xl text-slate-900">My Orders</h2>
        <p className="text-sm text-slate-600">
          আপনার সব টপ-আপ ও পেমেন্টের হিস্ট্রি এখানে দেখতে পারবেন।
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Regular Orders
          </button>
          <button
            onClick={() => setActiveTab('digitalCodes')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === 'digitalCodes'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Digital Codes
          </button>
        </div>
      </div>

      {/* Regular Orders Tab */}
      {activeTab === 'orders' && (
        <>
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
              <p className="mb-2 text-slate-500">এখনও কোনো অর্ডার পাওয়া যায়নি।</p>
              <p className="text-sm text-slate-400">আপনি প্রথম টপ-আপ করলেই এখানে দেখাবে।</p>
            </div>
          )}

          {!loading && orders.length > 0 && (
        <div className="overflow-hidden bg-white border shadow-sm rounded-xl border-slate-200">
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
                          isComplete ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {statusText}
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
        </>
      )}

      {/* Digital Codes Tab */}
      {activeTab === 'digitalCodes' && (
        <>
          {loadingCodes && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-400 rounded-full border-t-transparent animate-spin"></div>
              <p className="ml-3 text-sm text-slate-600">ডিজিটাল কোড লোড হচ্ছে...</p>
            </div>
          )}

          {!loadingCodes && digitalCodePurchases.length === 0 && (
            <div className="py-12 text-center">
              <p className="mb-2 text-slate-500">এখনও কোনো ডিজিটাল কোড কেনা হয়নি।</p>
              <p className="text-sm text-slate-400">আপনি প্রথম ডিজিটাল কোড কিনলেই এখানে দেখাবে।</p>
            </div>
          )}

          {!loadingCodes && digitalCodePurchases.length > 0 && (
            <div className="overflow-hidden bg-white border shadow-sm rounded-xl border-slate-200">
              <div className="divide-y divide-slate-200">
                {digitalCodePurchases.map((purchase) => {
                  const date = purchase.purchasedAt ? new Date(purchase.purchasedAt) : null;
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

                  const fullCode = purchase.prefix ? `${purchase.prefix} ${purchase.code}` : purchase.code;

                  return (
                    <div
                      key={purchase._id || purchase.transactionId}
                      className="p-4 transition-colors sm:p-5 hover:bg-slate-50/50"
                    >
                      <div className="grid items-start grid-cols-1 gap-3 sm:grid-cols-6 sm:gap-4">
                        {/* Date */}
                        <div className="sm:col-span-1">
                          <p className="mb-1 text-xs text-slate-500">Date</p>
                          <p className="text-sm text-slate-900">{dateLabel}</p>
                        </div>

                        {/* Product Name */}
                        <div className="sm:col-span-2">
                          <p className="mb-1 text-xs text-slate-500">Product</p>
                          <p className="text-sm font-medium text-slate-900">{purchase.productName}</p>
                        </div>

                        {/* Code */}
                        <div className="sm:col-span-2">
                          <p className="mb-1 text-xs text-slate-500">Code</p>
                          {purchase.status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-purple-400 rounded-full border-t-transparent animate-spin"></div>
                              <p className="text-sm text-slate-600">Loading code...</p>
                            </div>
                          ) : purchase.status === 'completed' && purchase.code ? (
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-sm break-all text-slate-900">{fullCode}</p>
                              <button
                                onClick={() => handleCopyCode(fullCode)}
                                className="px-2 py-1 text-xs text-blue-700 transition-colors bg-blue-100 rounded hover:bg-blue-200"
                                title="Copy code"
                              >
                                {copiedCode === fullCode ? <FaCheck /> : <FaCopy />}
                              </button>
                            </div>
                          ) : purchase.status === 'failed' ? (
                            <p className="text-sm text-red-600">Code assignment failed</p>
                          ) : (
                            <p className="text-sm text-slate-500">No code available</p>
                          )}
                        </div>

                        {/* Price & Status */}
                        <div className="flex flex-col sm:col-span-1 sm:items-end">
                          <div className="mb-2">
                            <p className="mb-1 text-xs text-slate-500">Price</p>
                            <p className="text-sm font-bold text-slate-900">
                              {purchase.amount.toFixed(0)} Tk
                            </p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs text-slate-500">Status</p>
                            <div className="flex items-center gap-2">
                              {purchase.status === 'pending' && (
                                <div className="w-3 h-3 border-2 border-yellow-400 rounded-full border-t-transparent animate-spin"></div>
                              )}
                              <p className={`text-sm font-semibold ${
                                purchase.status === 'completed' 
                                  ? 'text-green-600' 
                                  : purchase.status === 'pending'
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}>
                                {purchase.status === 'completed' 
                                  ? 'Completed' 
                                  : purchase.status === 'pending'
                                  ? 'Pending'
                                  : purchase.status === 'failed'
                                  ? 'Failed'
                                  : purchase.status}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Input Field Values */}
                      {purchase.inputFieldValues && Object.keys(purchase.inputFieldValues).length > 0 && (
                        <div className="pt-3 mt-3 border-t border-slate-100">
                          <p className="mb-2 text-xs text-slate-500">Additional Information:</p>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {Object.entries(purchase.inputFieldValues).map(([key, value]) => (
                              <div key={key}>
                                <p className="text-xs text-slate-500">{key}:</p>
                                <p className="text-sm font-medium text-slate-900">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Transaction ID - Show on mobile */}
                      <div className="pt-3 mt-3 border-t border-slate-100 sm:hidden">
                        <p className="text-xs text-slate-500">
                          TrxID: <span className="font-mono text-slate-700">{purchase.transactionId}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default OrderHistory;
