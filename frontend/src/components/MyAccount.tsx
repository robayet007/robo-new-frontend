import { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useRoboBalance from '../hooks/useRoboBalance';
import { paymentApi } from '../services/api';
import { FaSyncAlt, FaWallet, FaChartLine, FaChartBar, FaShoppingBag, FaBox } from 'react-icons/fa';

function MyAccount() {
  const { user } = useAuth();
  const { backendBalance, loading: balanceLoading, refreshBalance } = useRoboBalance();
  const [weeklySpend, setWeeklySpend] = useState<number>(0);
  const [totalSpend, setTotalSpend] = useState<number>(0);
  const [weeklyOrderCount, setWeeklyOrderCount] = useState<number>(0);
  const [totalOrderCount, setTotalOrderCount] = useState<number>(0);
  const [spendLoading, setSpendLoading] = useState(true);

  // Get user initials
  const userInitials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() || 'U';

  // Calculate weekly and total spend
  useEffect(() => {
    const calculateSpends = async () => {
      if (!user?.uid) {
        setSpendLoading(false);
        return;
      }

      try {
        setSpendLoading(true);
        const response = await paymentApi.getAll(1000, user.uid);
        
        if (response.success && Array.isArray(response.data)) {
          const payments = response.data;
          
          // Calculate date 7 days ago
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          
          let weeklyTotal = 0;
          let totalSpent = 0;
          let weeklyOrders = 0;
          let totalOrders = 0;
          
          payments.forEach((payment: any) => {
            // Count all orders (not add_money) that are verified/completed
            if (
              payment.productId !== 'add_money' &&
              (payment.status === 'verified' || payment.status === 'completed' || payment.verifiedAt)
            ) {
              totalOrders++;
              
              // Check if payment is within last 7 days
              const paymentDate = payment.verifiedAt 
                ? new Date(payment.verifiedAt) 
                : payment.createdAt 
                  ? new Date(payment.createdAt) 
                  : null;
              
              if (paymentDate && paymentDate >= weekAgo) {
                weeklyOrders++;
              }
              
              // Only count purchases with robo payment method for spend calculation
              if (payment.paymentMethod === 'robo') {
                const amount = typeof payment.amount === 'number' 
                  ? payment.amount 
                  : parseFloat(payment.amount) || 0;
                
                totalSpent += amount;
                
                if (paymentDate && paymentDate >= weekAgo) {
                  weeklyTotal += amount;
                }
              }
            }
          });
          
          setWeeklySpend(weeklyTotal);
          setTotalSpend(totalSpent);
          setWeeklyOrderCount(weeklyOrders);
          setTotalOrderCount(totalOrders);
        }
      } catch (error) {
        console.error('Error calculating spends:', error);
        setWeeklySpend(0);
        setTotalSpend(0);
      } finally {
        setSpendLoading(false);
      }
    };

    calculateSpends();
  }, [user?.uid]);

  return (
    <div className="max-w-3xl mx-auto mt-4 sm:mt-6 md:mt-8 p-4 sm:p-6 bg-gradient-to-br from-purple-50 via-violet-50/30 to-white min-h-screen">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg">
            {userInitials}
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-sky-500 mb-2">
            Hi, {user?.displayName || user?.email?.split('@')[0] || 'User'}
          </h2>
        </div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Email Card */}
          <div className="p-5 rounded-xl bg-white border-2 border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-sm font-semibold">@</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Email</p>
                <p className="text-sm font-semibold text-slate-900 break-all">{user?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Balance Card */}
          <div className="p-5 rounded-xl bg-white border-2 border-purple-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <FaWallet className="text-purple-600 text-sm" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Available Balance</p>
                  <p className="text-lg font-bold text-slate-900">
                    {balanceLoading ? (
                      <span className="inline-block w-16 h-5 bg-slate-200 rounded animate-pulse"></span>
                    ) : (
                      `${(backendBalance !== null ? backendBalance : 0).toFixed(2)} Tk`
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={refreshBalance}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                title="Refresh Balance"
              >
                <FaSyncAlt className="text-slate-600 text-sm" />
              </button>
            </div>
          </div>

          {/* Weekly Spend Card */}
          <div className="p-5 rounded-xl bg-white border-2 border-emerald-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <FaChartLine className="text-emerald-600 text-sm" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Weekly Spend</p>
                <p className="text-lg font-bold text-slate-900">
                  {spendLoading ? (
                    <span className="inline-block w-16 h-5 bg-slate-200 rounded animate-pulse"></span>
                  ) : (
                    `${weeklySpend.toFixed(2)} Tk`
                  )}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Last 7 days</p>
              </div>
            </div>
          </div>

          {/* Total Spend Card */}
          <div className="p-5 rounded-xl bg-white border-2 border-orange-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <FaChartBar className="text-orange-600 text-sm" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Spend</p>
                <p className="text-lg font-bold text-slate-900">
                  {spendLoading ? (
                    <span className="inline-block w-16 h-5 bg-slate-200 rounded animate-pulse"></span>
                  ) : (
                    `${totalSpend.toFixed(2)} Tk`
                  )}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">All time</p>
              </div>
            </div>
          </div>

          {/* Weekly Orders Card */}
          <div className="p-5 rounded-xl bg-white border-2 border-indigo-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <FaShoppingBag className="text-indigo-600 text-sm" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Weekly Orders</p>
                <p className="text-lg font-bold text-slate-900">
                  {spendLoading ? (
                    <span className="inline-block w-12 h-5 bg-slate-200 rounded animate-pulse"></span>
                  ) : (
                    weeklyOrderCount
                  )}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Last 7 days</p>
              </div>
            </div>
          </div>

          {/* Total Orders Card */}
          <div className="p-5 rounded-xl bg-white border-2 border-pink-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                <FaBox className="text-pink-600 text-sm" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Orders</p>
                <p className="text-lg font-bold text-slate-900">
                  {spendLoading ? (
                    <span className="inline-block w-12 h-5 bg-slate-200 rounded animate-pulse"></span>
                  ) : (
                    totalOrderCount
                  )}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">All time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyAccount;
