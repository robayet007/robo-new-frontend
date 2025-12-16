import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import BkashVerification from '../BkashVerification';
import { paymentApi } from '../services/api';
import type { Product } from '../types';
import useRoboBalance from '../hooks/useRoboBalance';
import useAuth from '../hooks/useAuth';
import { FaCheck, FaSyncAlt } from 'react-icons/fa';

function Checkout({ products }: { products: Product[] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    balance,
    hasEnoughBalance,
    refresh,
    getCurrentBalance,
    loading: balanceLoading,
  } = useRoboBalance();
  const productId =
    (location.state as { productId?: string } | undefined)?.productId ??
    new URLSearchParams(location.search).get('productId') ??
    '';
  const product = products.find((p) => p.id === productId) ?? products[0];
  const [uid, setUid] = useState('');
  const [ffName, setFfName] = useState<string | null>(null);
  const [ffNameLoading, setFfNameLoading] = useState(false);
  const [ffNameError, setFfNameError] = useState<string | null>(null);
  const [payment, setPayment] = useState<'robo' | 'bkash'>('bkash');
  const [showBkashVerification, setShowBkashVerification] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    status: 'success' | 'warning';
    message: string;
    amount: number;
    remaining: number;
  } | null>(null);

  useEffect(() => {
    if (!products.length) navigate('/');
  }, [products, navigate]);

  useEffect(() => {
    // Set default payment method based on balance
    // If user has balance and enough for product, default to Robo Pay
    // Otherwise default to bKash Pay
    const hasEnough = typeof hasEnoughBalance === 'function' && product
      ? hasEnoughBalance(product.price)
      : false;

    if (user && product && !isNaN(balance) && balance > 0 && hasEnough) {
      setPayment('robo');
    } else {
      setPayment('bkash');
    }
  }, [user, product, balance, hasEnoughBalance]);

  // Auto-fetch FF name when UID changes (with small debounce)
  useEffect(() => {
    const trimmed = uid.trim();
    setFfName(null);
    setFfNameError(null);

    if (!trimmed) {
      return;
    }

    // খুব ছোট ইনপুটে রিকোয়েস্ট না পাঠানোর জন্য
    if (trimmed.length < 3) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setFfNameLoading(true);
        const url = `https://info-ob49.vercel.app/api/account/?uid=${encodeURIComponent(
          trimmed
        )}&region=BD`;
        const resp = await fetch(url);
        if (!resp.ok) {
          throw new Error('UID info not found');
        }
        const json = await resp.json();
        const nickname = json?.basicInfo?.nickname;
        if (!nickname) {
          throw new Error('Name not found for this UID');
        }
        setFfName(nickname);
      } catch (err: any) {
        setFfName(null);
        setFfNameError(err?.message || 'Failed to fetch name');
      } finally {
        setFfNameLoading(false);
      }
    }, 600); // 0.6s debounce

    return () => clearTimeout(timeoutId);
  }, [uid]);

  if (!product) {
    return <Navigate to="/" replace />;
  }

  const handleRefreshBalance = async () => {
    setRefreshingBalance(true);
    await refresh();
    setRefreshingBalance(false);
  };

  const handleBkashVerify = async (businessId: string) => {
    try {
      const trimmedTrxId = businessId.trim().toUpperCase();
      if (!trimmedTrxId.startsWith('C')) {
        alert('Invalid bKash Transaction ID. bKash TrxID must start with "C"');
        return;
      }

      const bKashTrxIdRegex = /^C[A-Z0-9]{9,11}$/;
      if (!bKashTrxIdRegex.test(trimmedTrxId)) {
        alert('Invalid bKash Transaction ID format. Must be 10-12 characters starting with C');
        return;
      }

      const response = await paymentApi.verify({
        transactionId: trimmedTrxId,
        amount: product.price,
        playerId: uid,
        productId: product.id,
        productName: product.name,
        diamonds: product.diamonds,
        price: product.price,
        paymentMethod: 'bkash',
        userEmail: user?.email || '',
        userName: user?.displayName || user?.email?.split('@')[0] || 'User',
        userId: user?.uid || ''
      });
      
      if (response.success) {
        alert('Payment verified successfully! Transaction ID: ' + trimmedTrxId);
        setShowBkashVerification(false);
        navigate('/');
      } else {
        alert('Payment verification failed: ' + response.message);
        setShowBkashVerification(false);
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      alert('Payment verification failed. Please try again.');
      setShowBkashVerification(false);
    }
  };

  const handleBkashClose = () => {
    setShowBkashVerification(false);
  };

  const handleRoboBalancePayment = async () => {
    if (!uid.trim()) {
      alert('Please enter your Free Fire UID');
      return;
    }

    setProcessing(true);

    // ✅ Refresh balance before purchase to get latest balance
    // This prevents race conditions when same account is open in multiple tabs
    try {
      await refresh();
      // Small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (refreshError) {
      console.warn('Balance refresh failed:', refreshError);
    }

    // Get fresh balance after refresh - check current balance state
    const currentBalance = typeof getCurrentBalance === 'function' ? getCurrentBalance() : balance;
    
    if (currentBalance < product.price) {
      setProcessing(false);
      const shouldAddMoney = confirm(
        `Insufficient balance. You have ৳${currentBalance.toFixed(2)} but need ৳${product.price.toFixed(2)}.\n\nDo you want to add money to your Robo Balance?`
      );
      if (shouldAddMoney) {
        navigate('/add-money');
      }
      return;
    }

    if (!hasEnoughBalance(product.price)) {
      setProcessing(false);
      const shouldAddMoney = confirm(
        `Insufficient balance. You have ৳${currentBalance.toFixed(2)} but need ৳${product.price.toFixed(2)}.\n\nDo you want to add money to your Robo Balance?`
      );
      if (shouldAddMoney) {
        navigate('/add-money');
      }
      return;
    }

    try {
      // Note: We don't deduct locally anymore - backend handles it atomically
      // But we still update local state optimistically for better UX
      const expectedNewBalance = currentBalance - product.price;

      const paymentPayload = {
        transactionId: `ROBO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique transaction ID
        amount: product.price,
        playerId: uid,
        productId: product.id,
        productName: product.name || 'Product',
        diamonds: product.diamonds || 0,
        price: product.price,
        paymentMethod: 'robo' as const,
        updatedBalance: expectedNewBalance, // Expected balance (backend will validate and use actual)
        userEmail: user?.email || '',
        userName: user?.displayName || user?.email?.split('@')[0] || 'User',
        userId: user?.uid || '',
        timestamp: new Date().toISOString()
      };
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout
      
      let response;
      try {
        response = await paymentApi.verify(paymentPayload, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        // Check if backend rejected due to insufficient balance
        if (!response.success && (response.message?.includes('Insufficient balance') || response.message?.includes('insufficient'))) {
          await refresh();
          alert('⚠️ Insufficient balance. Your balance may have been used in another tab/device. Please refresh and try again.');
          setProcessing(false);
          return;
        }
      } catch (apiError: any) {
        clearTimeout(timeoutId);
        // If backend rejected due to insufficient balance, refresh and show error
        if (apiError.message?.includes('Insufficient balance') || apiError.message?.includes('insufficient')) {
          await refresh();
          alert('⚠️ Insufficient balance. Your balance may have been used in another tab/device. Please refresh and try again.');
          setProcessing(false);
          return;
        }
        response = { 
          success: false, 
          message: apiError.name === 'AbortError' 
            ? 'Request timeout. Please check your connection and try again.'
            : apiError.message || 'Payment failed. Please try again.' 
        };
      }

      // Refresh balance to get actual balance from backend
      await refresh();
      await new Promise((resolve) => setTimeout(resolve, 200)); // Wait for state update
      const actualBalance =
        typeof getCurrentBalance === 'function' ? getCurrentBalance() : balance;

      if (response && response.success) {
        setPaymentResult({
          status: 'success',
          message: 'Your top-up was successful! 💎 Your diamonds will arrive shortly.',
          amount: product.price,
          remaining: actualBalance,
        });
      } else {
        // Backend rejected the payment
        const errorMessage = response?.message || 'Payment failed. Please try again.';
        console.error('Payment failed:', {
          response,
          errorMessage,
          actualBalance,
          expectedBalance: currentBalance - product.price
        });
        
        setPaymentResult({
          status: 'warning',
          message: errorMessage,
          amount: product.price,
          remaining: actualBalance,
        });
      }
      
      setProcessing(false);
    } catch (err: any) {
      // Refresh balance on any error
      await refresh();
      alert('⚠️ Payment Error: ' + (err.message || 'Unknown error') + '\n\nPlease check your balance and try again.');
      setProcessing(false);
    } finally {
      setProcessing(false);
    }
  };

  if (showBkashVerification) {
    return <BkashVerification 
      onVerify={handleBkashVerify} 
      onClose={handleBkashClose} 
      amount={product.price}
    />;
  }

  const requiredAmount = product.price;
  const hasEnough = user && !balanceLoading && hasEnoughBalance(requiredAmount);

  return (
    <div className="relative max-w-2xl px-4 py-6 mx-auto">
      {/* Nice payment result popup instead of browser alert */}
      {paymentResult && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm p-5 mx-4 text-center bg-white shadow-2xl rounded-2xl sm:p-6">
            <div className="flex justify-center mb-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  paymentResult.status === 'success'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                <span className="text-2xl">✓</span>
              </div>
            </div>
            <h3 className="mb-1 text-lg font-bold text-slate-900">
              {paymentResult.status === 'success'
                ? 'Top-up Successful'
                : 'Top-up Completed'}
            </h3>
            <p className="mb-3 text-sm text-slate-600">{paymentResult.message}</p>
            <div className="mb-4 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-left text-sm">
              <p className="flex justify-between font-semibold text-slate-800">
                <span>Paid</span>
                <span>৳{paymentResult.amount.toFixed(2)}</span>
              </p>
              <p className="flex justify-between mt-1 text-xs text-slate-600">
                <span>Remaining balance</span>
                <span>৳{paymentResult.remaining.toFixed(2)}</span>
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setPaymentResult(null);
                  navigate('/');
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white text-sm font-semibold shadow-md hover:from-purple-600 hover:to-violet-700 transition-all"
              >
                Go to Home
              </button>
              <button
                type="button"
                onClick={() => setPaymentResult(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all"
              >
                Stay on page
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Section 2: Account Info */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-gradient-to-br from-purple-500 to-violet-600">
            2
          </div>
          <h2 className="text-xl font-bold text-slate-800">Account Info</h2>
        </div>
        
        <div className="p-4 bg-white border rounded-xl border-slate-200">
          <input
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="এখানে আপনার গেমের আইডি কোড লিখুন"
            className="w-full px-4 py-3 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-700"
          />
          <div className="mt-2 text-xs text-slate-600">
            {ffNameLoading && (
              <span className="inline-flex items-center px-2 py-1 text-[11px] font-medium rounded-full bg-slate-100 text-slate-700">
                UID থেকে নাম লোড হচ্ছে...
              </span>
            )}
            {!ffNameLoading && ffName && (
              <div className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                <span className="mr-1.5 text-xs">✅</span>
                <span className="mr-1 text-slate-600 font-normal">Account Name:</span>
                <span className="text-emerald-800">{ffName}</span>
              </div>
            )}
            {!ffNameLoading && !ffName && ffNameError && (
              <span className="inline-flex items-center px-2 py-1 text-[11px] font-medium rounded-full bg-red-50 text-red-600 border border-red-200">
                UID থেকে নাম পাওয়া যায়নি
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Select Payment Method */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-gradient-to-br from-purple-500 to-violet-600">
            3
          </div>
          <h2 className="text-xl font-bold text-slate-800">Select one option</h2>
        </div>

        {/* Payment Method Cards - Always show both */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Robo Pay / Wallet Pay */}
          <button
            onClick={() => setPayment('robo')}
            className={`relative bg-white border-2 rounded-xl p-4 transition-all ${
              payment === 'robo' 
                ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                : 'border-slate-200 hover:border-purple-300'
            }`}
          >
            {payment === 'robo' && (
              <div className="absolute flex items-center justify-center w-6 h-6 bg-red-500 rounded-full -top-2 -left-2">
                <FaCheck className="text-xs text-white" />
              </div>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white rounded-lg bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-600">
                R
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-purple-600">Robo Top Up</p>
                <p className="text-xs text-slate-500">ওয়ালেট পে</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-600">Wallet Pay</p>
          </button>

          {/* bKash Pay / Instant Payment */}
          <button
            onClick={() => setPayment('bkash')}
            className={`relative bg-white border-2 rounded-xl p-4 transition-all ${
              payment === 'bkash' 
                ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                : 'border-slate-200 hover:border-purple-300'
            }`}
          >
            {payment === 'bkash' && (
              <div className="absolute flex items-center justify-center w-6 h-6 bg-red-500 rounded-full -top-2 -left-2">
                <FaCheck className="text-xs text-white" />
              </div>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
                <span className="text-xl font-bold text-white">bK</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-purple-600">bKash</p>
                <p className="text-xs text-slate-500">ইনস্ট্যান্ট পে</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-600">Instant Pay</p>
          </button>
        </div>

        {/* Balance Information */}
        {user && (
          <div className="p-4 mb-4 border bg-slate-50 rounded-xl border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">ℹ️</span>
                <span className="text-sm text-slate-700">আপনার অ্যাকাউন্ট ব্যালেন্স</span>
              </div>
              <button
                onClick={handleRefreshBalance}
                disabled={refreshingBalance}
                className="text-purple-600 transition-colors hover:text-purple-700"
              >
                <FaSyncAlt className={`text-sm ${refreshingBalance ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="mb-3 text-2xl font-bold text-green-600">
              ৳ {balanceLoading ? 'Loading...' : balance.toFixed(2)}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">ℹ️</span>
              <span className="text-sm text-slate-700">
                প্রোডাক্ট কিনতে আপনার প্রয়োজন ৳ {requiredAmount}।
              </span>
            </div>
            {payment === 'robo' && !hasEnough && !balanceLoading && (
              <div className="p-3 mt-3 border border-yellow-200 rounded-lg bg-yellow-50">
                <p className="text-sm text-yellow-800">
                  ⚠️ আপনার ব্যালেন্স অপর্যাপ্ত। Robo Pay ব্যবহার করতে প্রথমে টাকা যোগ করুন।
                </p>
                <button
                  onClick={() => navigate('/add-money')}
                  className="mt-2 text-sm font-semibold text-purple-600 underline hover:text-purple-700"
                >
                  টাকা যোগ করুন →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Buy Now Button */}
        <button
          onClick={() => {
            if (!uid.trim()) {
              alert('Please enter your Free Fire UID');
              return;
            }
            if (payment === 'robo') {
              handleRoboBalancePayment();
            } else {
              setShowBkashVerification(true);
            }
          }}
          disabled={!uid.trim() || processing || balanceLoading}
          className="w-full px-6 py-4 text-lg font-bold text-white transition-all shadow-lg bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl hover:from-purple-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-purple-500/30"
        >
          {processing ? 'Processing...' : 'Buy Now'}
        </button>
      </div>
    </div>
  );
}

export default Checkout;
