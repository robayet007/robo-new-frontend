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
        diamonds: '',
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

  const predefinedAmounts = [100, 500, 1000, 5000];

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

  return (
    <div className="max-w-lg p-4 mx-auto mt-4 bg-white border shadow-md sm:p-4.5 md:p-5 rounded-2xl border-slate-200">
      <div className="mb-4 text-center">
        <h2 className="text-3xl font-bold text-slate-900">Add Money to Wallet</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4.5">
        {error && (
          <div className="p-3 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
            {error}
          </div>
        )}

        <div className="space-y-2.5">
          <label className="block text-xl font-semibold text-slate-900">
            Amount (BDT)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={processing}
            className="w-full px-3.5 py-2.5 text-xl font-semibold border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
            placeholder="Enter amount"
            min="10"
            step="0.01"
            required
          />
          
          <div className="grid grid-cols-2 gap-2.5">
            {predefinedAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => handleQuickAmount(quickAmount)}
                disabled={processing}
                className="py-2 text-2xl font-semibold transition-all border rounded-xl border-slate-300 text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ৳{quickAmount}
              </button>
            ))}
          </div>
        </div>


        {/* Payment Status Messages */}
        {verifyingPayment && (
          <div className={`p-3 mb-3 rounded-xl ${
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

        <div>
          <h3 className="mb-2.5 text-xl font-semibold text-slate-900">Select Payment Method</h3>
          <div className="p-3 border rounded-2xl border-pink-500 bg-rose-50">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 text-xl rounded-full bg-rose-200 text-rose-600">
                $
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">bKash / Nagad / Rocket</p>
                <p className="mt-0.5 text-xs text-pink-600">Instant Payment</p>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={processing || !amount.trim() || !user}
          className="w-full py-3 text-xl font-bold text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(to right, #f48fb1, #ec407a)' }}
        >
          {processing ? 'Processing...' : 'Proceed to Pay'}
        </button>
      </form>
    </div>
  );
}

export default AddMoney;