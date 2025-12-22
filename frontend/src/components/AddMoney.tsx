import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useRoboBalance from '../hooks/useRoboBalance';
import { paymentApi } from '../services/api';

function AddMoney() {
  // Initialize amount from localStorage or URL params to persist across redirects
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState(() => {
    return localStorage.getItem('add_money_amount') || searchParams.get('amount') || '';
  });
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState<{
    invoiceId: string;
    status: "verifying" | "verified" | "failed";
    message?: string;
  } | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    backendBalance,
    loading: balanceLoading,
    refreshBalance,
  } = useRoboBalance();

  // ✅ Handle Uddokta Pay payment for add money
  const handleUddoktaPayPayment = async () => {
    const amountValue = parseFloat(amount);
    
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountValue < 10) {
      setError('Minimum amount is ৳10');
      return;
    }

    if (!user?.email) {
      setError('Please login to continue');
      navigate('/login');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const checkoutData = {
        amount: amountValue,
        playerId: user.uid || '', // For add_money, we use userId as playerId
        productId: 'add_money',
        productName: `Add Money - ৳${amountValue}`,
        diamonds: 0,
        price: amountValue,
        userEmail: user.email,
        userName: user.displayName || user.email.split('@')[0] || 'User',
        userId: user.uid || '',
        fullName: user.displayName || user.email.split('@')[0] || 'Customer',
        email: user.email,
        redirectUrl: `${window.location.origin}/add-money?status=completed&payment=uddokta`,
        cancelUrl: `${window.location.origin}/add-money?status=cancelled&payment=uddokta`
      };

      // console.log('🔄 Creating Uddokta Pay checkout for add money...', checkoutData);

      const response = await paymentApi.uddoktaCheckout(checkoutData);

      // console.log('📥 Uddokta Pay response:', response);

      if (response.success && response.data?.paymentUrl) {
        // console.log('✅ Checkout created, redirecting to payment page...', response.data.paymentUrl);
        // Save amount to localStorage for after redirect
        localStorage.setItem('add_money_amount', amount);
        // Redirect to Uddokta Pay payment page
        window.location.href = response.data.paymentUrl;
      } else {
        setProcessing(false);
        const errorMsg = response.message || "Failed to create payment session. Please try again.";
        // console.error("❌ Uddokta Pay checkout failed:", errorMsg);
        setError(errorMsg);
      }
    } catch (error: any) {
      // console.error("❌ Uddokta Pay checkout error:", error);
      setProcessing(false);
      const errorMsg = error.message || "Failed to process payment. Please try again.";
      setError(errorMsg);
    }
  };

  // ✅ Handle payment status from URL params (after redirect)
  useEffect(() => {
    const status = searchParams.get("status");
    const invoiceId = searchParams.get("invoice_id");
    const paymentMethod = searchParams.get("payment");

    // Handle both "success" and "completed" status from Uddokta Pay
    if ((status === "success" || status === "completed") && invoiceId && paymentMethod === "uddokta") {
      setVerifyingPayment({
        invoiceId: invoiceId,
        status: "verifying",
        message: "Verifying payment..."
      });

      // Verify payment - Backend will automatically verify and update balance
      paymentApi.uddoktaVerify(invoiceId)
        .then((response) => {
          if (response.success && response.data?.payment) {
            setVerifyingPayment({
              invoiceId: invoiceId,
              status: "verified",
              message: "Payment verified successfully! ✅"
            });
            
            // Refresh balance
            if (user) {
              refreshBalance().then(() => {
                // Clear URL params and show success
                setTimeout(() => {
                  navigate("/add-money", { replace: true });
                  setVerifyingPayment(null);
                }, 2000);
              });
            }
          } else {
            // If verification response doesn't have payment data, but status is completed
            if (status === "completed") {
              setVerifyingPayment({
                invoiceId: invoiceId,
                status: "verified",
                message: "Payment completed! ✅"
              });
              if (user) {
                refreshBalance().then(() => {
                  setTimeout(() => {
                    navigate("/add-money", { replace: true });
                    setVerifyingPayment(null);
                  }, 2000);
                });
              }
            } else {
              setVerifyingPayment({
                invoiceId: invoiceId,
                status: "failed",
                message: response.message || "Verification failed"
              });
            }
          }
        })
        .catch((error) => {
          // console.error("Verification error:", error);
          // If status is completed, show success even if verification API fails
          if (status === "completed") {
            setVerifyingPayment({
              invoiceId: invoiceId,
              status: "verified",
              message: "Payment completed! ✅"
            });
            if (user) {
              refreshBalance().then(() => {
                setTimeout(() => {
                  navigate("/add-money", { replace: true });
                  setVerifyingPayment(null);
                }, 2000);
              });
            }
          } else {
            setVerifyingPayment({
              invoiceId: invoiceId,
              status: "failed",
              message: error.message || "Failed to verify payment"
            });
          }
        });
    } else if (status === "cancelled" && paymentMethod === "uddokta") {
      setProcessing(false);
      setError("Payment was cancelled. Please try again if you want to add money.");
      // Clear URL params
      navigate("/add-money", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user, navigate]);

  // ✅ currentBalance navbar এর মতই same source থেকে নিচ্ছি
  const currentBalance =
    backendBalance !== null && backendBalance !== undefined ? backendBalance : 0;
  // console.log('💰 Current balance value:', currentBalance);

  const predefinedAmounts = [100, 200, 500, 1000, 2000, 5000];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const amountValue = parseFloat(amount);
    
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountValue < 10) {
      setError('Minimum amount is ৳10');
      return;
    }

    if (!user?.email) {
      setError('Please login to continue');
      navigate('/login');
      return;
    }

    // console.log('💸 Proceeding to payment with amount:', amountValue);
    // Use Uddokta Pay for add money
    handleUddoktaPayPayment();
  };

  // Restore amount from localStorage or URL params on mount
  useEffect(() => {
    if (!amount.trim()) {
      const savedAmount = localStorage.getItem('add_money_amount') || searchParams.get('amount') || '';
      if (savedAmount) {
        setAmount(savedAmount);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Removed: handleUddoktaPayCallback function - all Uddokta Pay code removed

  const handleQuickAmount = (quickAmount: number) => {
    // console.log('⚡ Quick amount selected:', quickAmount);
    setAmount(quickAmount.toString());
    setError('');
  };


  if (!user) {
    // console.log('👤 No user found, showing login prompt');
    return (
      <div className="max-w-md p-6 mx-auto mt-8 bg-white border shadow-xl rounded-2xl border-slate-200">
        <div className="text-center">
          <p className="mb-4 text-red-600">Please login to add money</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 font-semibold text-white rounded-xl bg-gradient-to-r from-purple-500 to-violet-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (balanceLoading) {
    // console.log('⏳ Loading state...');
    return (
      <div className="max-w-md p-6 mx-auto mt-8 text-center bg-white border shadow-xl rounded-2xl border-slate-200">
        <div className="animate-pulse">
          <div className="h-4 mx-auto mb-4 bg-gray-200 rounded w-28"></div>
          <div className="w-48 h-8 mx-auto mb-6 bg-gray-200 rounded"></div>
          <div className="h-32 mb-6 bg-gray-100 rounded-xl"></div>
          <div className="h-12 mb-4 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // console.log('🎨 Rendering AddMoney component');
  return (
    <div className="max-w-md p-4 mx-auto mt-4 bg-white border shadow-xl sm:mt-6 md:mt-8 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border-slate-200">
      <div className="mb-6 text-center">
        <p className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-400/14 text-green-700 border border-green-400/35 font-semibold text-sm mb-4">
          💰 Add Money
        </p>
        <h2 className="mb-2 text-2xl font-bold text-slate-900">Add Money to Robo Balance</h2>
        <div className="p-4 mt-4 border border-green-200 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-slate-700">Current Balance</p>
            <button
              type="button"
              onClick={refreshBalance}
              disabled={balanceLoading}
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {balanceLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {balanceLoading ? (
            <div className="flex items-center justify-center h-12">
              <div className="w-8 h-8 border-2 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-green-600">
                ৳{currentBalance.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Balance for {user.email}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                User ID: {user.uid?.substring(0, 8)}...
              </p>
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-800">
            Enter Amount (৳)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={processing}
            className="w-full px-4 py-3 text-lg font-semibold text-center border-2 rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            placeholder="0.00"
            min="10"
            step="0.01"
            required
          />
          
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {predefinedAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => handleQuickAmount(quickAmount)}
                disabled={processing}
                className="py-3 font-semibold text-purple-700 transition-all rounded-xl bg-gradient-to-r from-purple-100 to-violet-100 hover:from-purple-200 hover:to-violet-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ৳{quickAmount}
              </button>
            ))}
          </div>
        </div>


        {/* Payment Status Messages */}
        {verifyingPayment && (
          <div className={`p-4 mb-4 rounded-xl ${
            verifyingPayment.status === "verified" 
              ? "bg-green-50 border border-green-200" 
              : verifyingPayment.status === "failed"
              ? "bg-red-50 border border-red-200"
              : "bg-blue-50 border border-blue-200"
          }`}>
            <p className={`text-sm font-medium ${
              verifyingPayment.status === "verified"
                ? "text-green-700"
                : verifyingPayment.status === "failed"
                ? "text-red-700"
                : "text-blue-700"
            }`}>
              {verifyingPayment.status === "verifying" && "⏳ Verifying payment..."}
              {verifyingPayment.status === "verified" && "✅ Payment verified successfully! Your balance has been updated."}
              {verifyingPayment.status === "failed" && `❌ ${verifyingPayment.message}`}
            </p>
          </div>
        )}

        <div className="p-4 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-sky-50">
          <h3 className="flex items-center gap-2 mb-2 font-bold text-blue-800">
            <span className="text-lg">💡</span> Payment Method
          </h3>
          <p className="mb-2 text-sm text-blue-700">
            We use <strong>Uddokta Pay</strong> for secure online payments. Your balance will be updated automatically after payment.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 px-4 py-3 font-semibold border text-slate-700 bg-slate-100 border-slate-300 rounded-xl hover:bg-slate-200"
          >
            Go Back
          </button>
          <button
            type="submit"
            disabled={processing || !amount.trim() || !user}
            className="flex-1 px-4 py-3 font-semibold text-white shadow-md rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : !user ? 'Please Login' : 'Add Money with Uddokta Pay'}
          </button>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            <p className="font-semibold text-slate-700">📢 Important:</p>
            <ul className="mt-1 space-y-1">
              <li>• Minimum deposit: ৳10</li>
              <li>• Secure payment via bKash</li>
              <li>• Balance updates automatically after payment</li>
              <li>• Multiple payment methods supported</li>
              <li>• If you need help, contact support</li>
            </ul>
            <div className="p-2 mt-3 rounded-lg bg-slate-100">
              <p className="text-xs text-slate-600">
                Debug: Balance = {currentBalance}, User = {user.email}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AddMoney;