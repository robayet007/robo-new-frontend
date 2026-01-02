import { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useRoboBalance from '../hooks/useRoboBalance';
import { paymentApi } from '../services/api';
import type { BackendPurchase } from '../types';
import { FaUser, FaEnvelope, FaShoppingBag, FaMoneyBillWave, FaWallet, FaSyncAlt, FaCheckCircle, FaFolder, FaInfoCircle } from 'react-icons/fa';

function MyAccount() {
  const { user } = useAuth();
  const { backendBalance, loading: balanceLoading, refreshBalance } = useRoboBalance();
  const [orders, setOrders] = useState<BackendPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;
      setLoading(true);
      setError(null);
      try {
        const response = await paymentApi.getAll(100, user.uid);
        if (response.success && Array.isArray(response.data)) {
          setOrders(response.data as BackendPurchase[]);
        } else {
          setOrders([]);
          if (response.message) {
            setError(response.message);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load account data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.uid]);

  // Calculate total purchases and total amount
  const totalPurchases = orders.length;
  const totalAmount = orders.reduce((sum, order) => {
    return sum + (order.amount || order.price || 0);
  }, 0);

  // Calculate weekly spent (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklySpent = orders
    .filter(order => {
      const orderDate = new Date(order.createdAt || order.verifiedAt || 0);
      return orderDate >= oneWeekAgo;
    })
    .reduce((sum, order) => sum + (order.amount || order.price || 0), 0);

  // Generate support pin from user ID (first 9 digits)
  const supportPin = user?.uid ? user.uid.slice(0, 9).padEnd(9, '0') : '000000000';
  
  // Get user initials
  const userInitials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() || 'U';

  return (
    <div className="max-w-3xl mx-auto mt-4 sm:mt-6 md:mt-8 p-4 sm:p-6 bg-gradient-to-br from-purple-50 via-violet-50/30 to-white min-h-screen">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600">Loading account information...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg">
              {userInitials}
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-sky-500 mb-2">
              Hi, {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </h2>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-medium">Available Balance:</span>
              <span className="font-bold">
                {balanceLoading ? (
                  <span className="inline-block w-12 h-4 bg-slate-200 rounded animate-pulse"></span>
                ) : (
                  `${(backendBalance !== null ? backendBalance : 0).toFixed(2)} Tk`
                )}
              </span>
              <button
                onClick={refreshBalance}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                title="Refresh Balance"
              >
                <FaSyncAlt className="text-slate-600 text-sm" />
              </button>
            </div>
          </div>

          {/* Four Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl bg-white border-2 border-purple-200 shadow-sm">
              <p className="text-lg sm:text-xl font-bold text-slate-900 mb-1">{supportPin}</p>
              <p className="text-xs sm:text-sm text-slate-600">Support Pin</p>
            </div>
            <div className="p-4 rounded-xl bg-white border-2 border-purple-200 shadow-sm">
              <p className="text-lg sm:text-xl font-bold text-slate-900 mb-1">{weeklySpent.toFixed(2)}৳</p>
              <p className="text-xs sm:text-sm text-slate-600">Weekly Spent</p>
            </div>
            <div className="p-4 rounded-xl bg-white border-2 border-purple-200 shadow-sm">
              <p className="text-lg sm:text-xl font-bold text-slate-900 mb-1">{totalAmount.toFixed(2)}</p>
              <p className="text-xs sm:text-sm text-slate-600">Total Spent</p>
            </div>
            <div className="p-4 rounded-xl bg-white border-2 border-purple-200 shadow-sm">
              <p className="text-lg sm:text-xl font-bold text-slate-900 mb-1">{totalPurchases}</p>
              <p className="text-xs sm:text-sm text-slate-600">Total Order</p>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <FaFolder className="text-purple-600 text-sm" />
              <h3 className="text-lg font-semibold text-slate-900">Account Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
                <p className="text-2xl sm:text-3xl font-bold mb-2">
                  {balanceLoading ? (
                    <span className="inline-block w-20 h-6 bg-white/30 rounded animate-pulse"></span>
                  ) : (
                    `${(backendBalance !== null ? backendBalance : 0).toFixed(2)}৳`
                  )}
                </p>
                <p className="text-sm font-semibold">Available Balance</p>
              </div>
              <div className="p-5 rounded-xl bg-white border-2 border-purple-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <FaCheckCircle className="text-blue-500 text-xl" />
                </div>
                <p className="text-base font-bold text-slate-900">Account Verified!</p>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                <FaInfoCircle className="text-purple-600 text-xs" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">User Information</h3>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <div>
                <p className="text-sm text-slate-600 mb-1">email :</p>
                <p className="text-sm font-semibold text-slate-900">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Phone :</p>
                <p className="text-sm font-semibold text-slate-900">{user?.phoneNumber || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyAccount;

