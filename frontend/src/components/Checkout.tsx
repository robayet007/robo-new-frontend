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
  const { balance, hasEnoughBalance, deductMoney, refresh, loading: balanceLoading } = useRoboBalance();
  const productId =
    (location.state as { productId?: string } | undefined)?.productId ??
    new URLSearchParams(location.search).get('productId') ??
    '';
  const product = products.find((p) => p.id === productId) ?? products[0];
  const [uid, setUid] = useState('');
  const [payment, setPayment] = useState<'robo' | 'bkash'>('bkash');
  const [showBkashVerification, setShowBkashVerification] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);

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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eab5df58-3135-4efe-ad19-feee35996b24', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'initial',
        hypothesisId: 'H3',
        location: 'Checkout.tsx:paymentEffect',
        message: 'Evaluating default payment method',
        data: {
          hasUser: !!user,
          hasProduct: !!product,
          balance,
          price: product?.price ?? null,
          hasEnough,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (user && product && !isNaN(balance) && balance > 0 && hasEnough) {
      setPayment('robo');
    } else {
      setPayment('bkash');
    }
  }, [user, product, balance, hasEnoughBalance]);

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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eab5df58-3135-4efe-ad19-feee35996b24', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'initial',
        hypothesisId: 'H3',
        location: 'Checkout.tsx:handleRoboBalancePayment',
        message: 'Starting Robo balance payment',
        data: {
          hasUser: !!user,
          hasUid: !!uid.trim(),
          balance,
          price: product.price,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (balance < product.price) {
      const shouldAddMoney = confirm(
        `Insufficient balance. You have ৳${balance.toFixed(2)} but need ৳${product.price.toFixed(2)}.\n\nDo you want to add money to your Robo Balance?`
      );
      if (shouldAddMoney) {
        navigate('/add-money');
      }
      return;
    }

    if (!hasEnoughBalance(product.price)) {
      const shouldAddMoney = confirm(
        `Insufficient balance. You have ৳${balance.toFixed(2)} but need ৳${product.price.toFixed(2)}.\n\nDo you want to add money to your Robo Balance?`
      );
      if (shouldAddMoney) {
        navigate('/add-money');
      }
      return;
    }

    setProcessing(true);

    try {
      const deductResult = await deductMoney(product.price, `Payment for ${product.name}`);
      
      if (!deductResult.success) {
        alert(deductResult.error || 'Payment failed. Please try again.');
        setProcessing(false);
        return;
      }

      const updatedBalance = deductResult.newBalance || (balance - product.price);

      const paymentPayload = {
        transactionId: `ROBO_${Date.now()}`,
        amount: product.price,
        playerId: uid,
        productId: product.id,
        productName: product.name || 'Product',
        diamonds: product.diamonds || 0,
        price: product.price,
        paymentMethod: 'robo' as const,
        updatedBalance: updatedBalance,
        userEmail: user?.email || '',
        userName: user?.displayName || user?.email?.split('@')[0] || 'User',
        userId: user?.uid || '',
        timestamp: new Date().toISOString()
      };
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      let response;
      try {
        response = await paymentApi.verify(paymentPayload, { signal: controller.signal });
        clearTimeout(timeoutId);
      } catch (apiError: any) {
        clearTimeout(timeoutId);
        response = { 
          success: false, 
          message: apiError.name === 'AbortError' 
            ? 'Request timeout. Payment processed but Telegram notification may be delayed.'
            : apiError.message || 'API call failed. Balance was deducted but Telegram notification may not have been sent.' 
        };
      }

      if (response && response.success) {
        alert(`✅ Payment successful!\n\n৳${product.price} deducted from your Robo Balance.\nRemaining balance: ৳${updatedBalance.toFixed(2)}\n\nTelegram notification sent!`);
      } else {
        alert(`✅ Payment processed successfully!\n\n৳${product.price} deducted from your Robo Balance.\nRemaining balance: ৳${updatedBalance.toFixed(2)}\n\n⚠️ Note: ${response?.message || 'Telegram notification may be delayed.'}`);
      }
      
      try {
        await refresh();
      } catch (refreshError) {
        console.warn('Balance refresh failed (non-critical):', refreshError);
      }
      
      setProcessing(false);
      navigate('/');
      
    } catch (err: any) {
      await refresh();
      alert('⚠️ Payment Error: ' + (err.message || 'Unknown error') + '\n\nIf your balance was deducted, payment was successful. Please check your balance.');
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
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Section 2: Account Info */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
            2
          </div>
          <h2 className="text-xl font-bold text-slate-800">Account Info</h2>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <input
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="এখানে আপনার গেমের আইডি কোড লিখুন"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-700"
          />
          <button
            onClick={() => {
              // Add game ID verification logic here
              if (uid.trim()) {
                alert('Game ID checked: ' + uid);
              }
            }}
            className="mt-3 w-full bg-gradient-to-r from-purple-500 to-violet-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-violet-700 transition-all"
          >
            আপনার গেম আইডির নাম চেক করুন
          </button>
        </div>
      </div>

      {/* Section 3: Select Payment Method */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
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
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <FaCheck className="text-white text-xs" />
              </div>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg">
                R
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-purple-600 text-sm">Robo Top Up</p>
                <p className="text-xs text-slate-500">ওয়ালেট পে</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2">Wallet Pay</p>
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
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <FaCheck className="text-white text-xs" />
              </div>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">bK</span>
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-purple-600 text-sm">bKash</p>
                <p className="text-xs text-slate-500">ইনস্ট্যান্ট পে</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2">Instant Pay</p>
          </button>
        </div>

        {/* Balance Information */}
        {user && (
          <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 text-sm">ℹ️</span>
                <span className="text-slate-700 text-sm">আপনার অ্যাকাউন্ট ব্যালেন্স</span>
              </div>
              <button
                onClick={handleRefreshBalance}
                disabled={refreshingBalance}
                className="text-purple-600 hover:text-purple-700 transition-colors"
              >
                <FaSyncAlt className={`text-sm ${refreshingBalance ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-2xl font-bold text-green-600 mb-3">
              ৳ {balanceLoading ? 'Loading...' : balance.toFixed(2)}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 text-sm">ℹ️</span>
              <span className="text-slate-700 text-sm">
                প্রোডাক্ট কিনতে আপনার প্রয়োজন ৳ {requiredAmount}।
              </span>
            </div>
            {payment === 'robo' && !hasEnough && !balanceLoading && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ আপনার ব্যালেন্স অপর্যাপ্ত। Robo Pay ব্যবহার করতে প্রথমে টাকা যোগ করুন।
                </p>
                <button
                  onClick={() => navigate('/add-money')}
                  className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-semibold underline"
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
          className="w-full bg-gradient-to-r from-purple-500 to-violet-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
        >
          {processing ? 'Processing...' : 'Buy Now'}
        </button>
      </div>
    </div>
  );
}

export default Checkout;
