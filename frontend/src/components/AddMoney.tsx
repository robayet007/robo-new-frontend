import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useRoboBalance from '../hooks/useRoboBalance';
import { paymentApi } from '../services/api';
import { createUddoktaPayCheckout, verifyUddoktaPayPayment, getBackendWebhookUrl } from '../services/uddoktaPay';

function AddMoney() {
  // Initialize amount from localStorage or URL params to persist across redirects
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState(() => {
    return localStorage.getItem('add_money_amount') || searchParams.get('amount') || '';
  });
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    backendBalance,
    loading: balanceLoading,
    refreshBalance,
  } = useRoboBalance();

  // Handle Uddokta Pay callback after payment
  useEffect(() => {
    // Check all possible parameter names that Uddokta Pay might use
    const invoiceId = searchParams.get('invoice_id') || 
                      searchParams.get('invoiceId') || 
                      searchParams.get('invoice') ||
                      searchParams.get('transaction_id') ||
                      searchParams.get('transactionId');
    
    const status = searchParams.get('status') || 
                   searchParams.get('payment_status');
    
    console.log('🔍 Uddokta Pay Callback (AddMoney) - URL Params:', {
      invoice_id: searchParams.get('invoice_id'),
      invoiceId: searchParams.get('invoiceId'),
      invoice: searchParams.get('invoice'),
      transaction_id: searchParams.get('transaction_id'),
      transactionId: searchParams.get('transactionId'),
      status: searchParams.get('status'),
      payment_status: searchParams.get('payment_status'),
      allParams: Object.fromEntries(searchParams.entries())
    });
    
    if (invoiceId) {
      console.log('✅ Invoice ID found:', invoiceId);
      console.log('📊 Status:', status);
      
      // Process payment if:
      // 1. Status is COMPLETED
      // 2. Status is PENDING (Uddokta Pay might send pending even when payment is done)
      // 3. No status but invoice_id exists (verify anyway)
      // We always verify via API to get the actual payment status
      if (status === 'COMPLETED' || status === 'pending' || status === 'PENDING' || !status) {
        console.log('🚀 Processing payment callback...');
        console.log('ℹ️ URL status:', status, '- Will verify actual status via API');
        handleUddoktaPayCallback(invoiceId);
      } else if (status === 'CANCELLED' || status === 'cancelled') {
        console.log('❌ Payment was cancelled');
        setError('Payment was cancelled. Please try again.');
      } else {
        console.log('⚠️ Payment status is:', status, '- Still verifying via API...');
        // Even if status is unknown, try to verify via API
        handleUddoktaPayCallback(invoiceId);
      }
    } else {
      console.log('ℹ️ No invoice_id found in URL parameters');
    }
  }, [searchParams]);

  // ✅ currentBalance navbar এর মতই same source থেকে নিচ্ছি
  const currentBalance =
    backendBalance !== null && backendBalance !== undefined ? backendBalance : 0;
  console.log('💰 Current balance value:', currentBalance);

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

    console.log('💸 Proceeding to payment with amount:', amountValue);
    await handleUddoktaPayPayment(amountValue);
  };

  // Handle Uddokta Pay payment
  const handleUddoktaPayPayment = async (amountValue: number) => {
    if (!user?.email) {
      setError('Please login to continue');
      navigate('/login');
      return;
    }

    setProcessing(true);
    setError('');
    
    try {
      // Save amount to localStorage before redirect
      localStorage.setItem('add_money_amount', amountValue.toString());
      
      const baseUrl = window.location.origin;
      // Include amount in redirect URL to restore it after redirect
      const redirectUrl = `${baseUrl}/add-money?amount=${encodeURIComponent(amountValue)}`;
      const cancelUrl = `${baseUrl}/add-money?cancelled=true&amount=${encodeURIComponent(amountValue)}`;
      const webhookUrl = getBackendWebhookUrl();

      const checkoutRequest = {
        full_name: user.displayName || user.email.split('@')[0] || 'User',
        email: user.email,
        amount: amountValue.toString(),
        metadata: {
          user_id: user.uid,
          order_id: `ADD_MONEY_${Date.now()}`,
          product_id: 'add_money',
          product_name: `Add ৳${amountValue} to Robo Balance`,
          player_id: user.email,
          diamonds: 0,
          price: amountValue,
          payment_type: 'add_money' as const,
        },
        redirect_url: redirectUrl,
        cancel_url: cancelUrl,
        webhook_url: webhookUrl,
      };

      const checkoutResponse = await createUddoktaPayCheckout(checkoutRequest);
      
      if (checkoutResponse.status && checkoutResponse.payment_url) {
        // Redirect to Uddokta Pay payment page
        window.location.href = checkoutResponse.payment_url;
      } else {
        throw new Error(checkoutResponse.message || 'Failed to create payment');
      }
    } catch (err: any) {
      console.error('Uddokta Pay checkout error:', err);
      setError('Payment failed: ' + (err.message || 'Please try again.'));
      setProcessing(false);
    }
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

  // Handle Uddokta Pay callback after payment
  const handleUddoktaPayCallback = async (invoiceId: string) => {
    console.log('🔄 handleUddoktaPayCallback (AddMoney) called with invoiceId:', invoiceId);
    
    // Try to restore amount from localStorage or URL if state is empty
    let currentAmount = amount.trim();
    if (!currentAmount) {
      currentAmount = localStorage.getItem('add_money_amount') || searchParams.get('amount') || '';
      if (currentAmount) {
        setAmount(currentAmount);
      }
    }
    
    const amountValue = parseFloat(currentAmount);
    if (!amountValue || isNaN(amountValue)) {
      console.warn('⚠️ Invalid amount:', currentAmount);
      setError('Invalid amount. Please try again.');
      return;
    }

    if (!invoiceId || invoiceId.trim() === '') {
      console.error('❌ Invalid invoice ID:', invoiceId);
      setError('Invalid payment transaction ID. Please contact support.');
      return;
    }

    setProcessing(true);
    setError('');
    
    try {
      console.log('🔍 Verifying payment with Uddokta Pay API...');
      // Verify payment with Uddokta Pay
      const verifyResponse = await verifyUddoktaPayPayment(invoiceId.trim());
      
      console.log('📥 Uddokta Pay verification response:', verifyResponse);
      console.log('📥 Full response structure:', JSON.stringify(verifyResponse, null, 2));
      
      // Check payment status - Uddokta Pay might return status in different formats
      const paymentStatusRaw = verifyResponse.payment?.status || 
                              verifyResponse.status || 
                              verifyResponse.payment_status ||
                              'UNKNOWN';
      
      // Normalize status to uppercase for comparison
      const paymentStatus = typeof paymentStatusRaw === 'string' 
        ? paymentStatusRaw.toUpperCase() as 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'UNKNOWN'
        : 'UNKNOWN';
      
      // Also check if response.status is a boolean (true = success)
      const isResponseSuccessful = verifyResponse.status === true || verifyResponse.status === 'true';
      
      // Check if payment has required data (amount, invoice_id) - indicates successful payment
      const hasPaymentData = verifyResponse.payment?.amount || verifyResponse.amount || verifyResponse.payment?.invoice_id || verifyResponse.invoice_id;
      
      console.log('📊 Detected payment status:', paymentStatus);
      console.log('📊 Response status (boolean):', verifyResponse.status);
      console.log('📊 Is response successful:', isResponseSuccessful);
      console.log('📊 Has payment data:', hasPaymentData);
      
      // If response.status is true and we have payment data, consider it successful
      // OR if payment status is COMPLETED
      // OR if we have payment data and status is not explicitly CANCELLED
      const shouldProcess = (isResponseSuccessful && hasPaymentData) || 
                           paymentStatus === 'COMPLETED' ||
                           (hasPaymentData && paymentStatus !== 'CANCELLED');
      
      if (shouldProcess) {
        console.log('✅ Payment verified by Uddokta Pay, now verifying with backend...');
        console.log('✅ Processing with status:', paymentStatus, 'hasPaymentData:', hasPaymentData);
        
        // Payment successful, now verify with our backend
        const paymentData = {
          transactionId: invoiceId.trim().toUpperCase(),
          amount: amountValue,
          playerId: user?.email || '',
          productId: 'add_money',
          productName: `Add ৳${amountValue} to Robo Balance`,
          diamonds: 0,
          price: amountValue,
          userEmail: user?.email || '',
          userName: user?.displayName || user?.email?.split('@')[0] || 'User',
          userId: user?.uid || user?.email || '',
          paymentMethod: 'uddokta' as const,
        };

        console.log('📤 Sending payment verification to backend:', paymentData);
        const response = await paymentApi.verify(paymentData);
        
        console.log('📥 Backend verification response:', response);
        
        if (response.success) {
          console.log('✅ Payment verified successfully by backend');
          
          // ✅ Wait a moment for backend to process balance update
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // ✅ ব্যালেন্স রিফ্রেশ করি - multiple times to ensure update
          console.log('🔄 Refreshing balance after successful payment');
          await refreshBalance();
          
          // Wait a bit more and refresh again (in case socket event hasn't arrived yet)
          await new Promise(resolve => setTimeout(resolve, 1000));
          await refreshBalance();

          // Get updated balance after refresh
          const updatedBalance = backendBalance !== null && backendBalance !== undefined ? backendBalance : 0;
          console.log(`✅ Balance updated successfully. Added: ৳${amountValue}`);
          console.log('💰 Current balance after refresh:', updatedBalance);
          
          // Clear localStorage and URL params
          localStorage.removeItem('add_money_amount');
          navigate('/add-money', { replace: true });
          alert(`✅ Payment successful! ৳${amountValue} added to your balance.`);
          setAmount('');
        } else {
          throw new Error(response.message || 'Payment verification failed');
        }
      } else {
        // Get status from multiple possible locations
        const finalPaymentStatus = verifyResponse.payment?.status || 
                                  verifyResponse.status || 
                                  verifyResponse.payment_status ||
                                  paymentStatus ||
                                  'UNKNOWN';
        console.error('❌ Payment status is not COMPLETED:', finalPaymentStatus);
        console.error('❌ Full response:', verifyResponse);
        
        // Handle PENDING status - payment might still be processing
        if (finalPaymentStatus === 'PENDING' || (typeof finalPaymentStatus === 'string' && finalPaymentStatus.toUpperCase() === 'PENDING')) {
          console.log('⏳ Payment status is PENDING - payment is still processing');
          setError('Your payment is being processed. Your balance will be updated automatically. Please check back in a few minutes.');
          navigate('/add-money', { replace: true });
          return;
        } else if (finalPaymentStatus === 'CANCELLED' || (typeof finalPaymentStatus === 'string' && finalPaymentStatus.toUpperCase() === 'CANCELLED')) {
          console.error('❌ Payment was cancelled');
          setError('Payment was cancelled. Please try again.');
          return;
        } else {
          throw new Error(`Payment verification failed. Status: ${finalPaymentStatus}. Please try again or contact support.`);
        }
      }
    } catch (err: any) {
      console.error('❌ Payment verification error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        invoiceId: invoiceId
      });
      setError(err.message || 'Payment verification failed. Please try again. If the problem persists, contact support with transaction ID: ' + invoiceId);
    } finally {
      setProcessing(false);
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    console.log('⚡ Quick amount selected:', quickAmount);
    setAmount(quickAmount.toString());
    setError('');
  };


  if (!user) {
    console.log('👤 No user found, showing login prompt');
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
    console.log('⏳ Loading state...');
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

  console.log('🎨 Rendering AddMoney component');
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
            onChange={(e) => {
              const newAmount = e.target.value;
              setAmount(newAmount);
              setError('');
              // Save to localStorage for persistence across redirects
              if (newAmount.trim()) {
                localStorage.setItem('add_money_amount', newAmount.trim());
              } else {
                localStorage.removeItem('add_money_amount');
              }
            }}
            className="w-full px-4 py-3 text-lg font-semibold text-center border-2 rounded-xl border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
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
                className={`py-3 font-semibold rounded-xl transition-all ${
                  amount === quickAmount.toString()
                    ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ৳{quickAmount}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-sky-50">
          <h3 className="flex items-center gap-2 mb-2 font-bold text-blue-800">
            <span className="text-lg">💡</span> How to Pay
          </h3>
          <ol className="pl-5 space-y-2 text-sm text-blue-700 list-decimal">
            {/* <li>Send money to our bKash Merchant number</li> */}
            {/* <li>Enter the bKash Transaction ID (starting with C)</li> */}
            {/* <li>Your balance will be updated instantly</li> */}
          </ol>
          <div className="p-2 mt-3 bg-blue-100 rounded-lg">
            
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 px-4 py-3 font-semibold border text-slate-700 bg-slate-100 border-slate-300 rounded-xl hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!amount || parseFloat(amount) < 10 || balanceLoading || processing}
            className="flex-1 px-4 py-3 font-semibold text-white shadow-md rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : 'Continue to Payment'}
          </button>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            <p className="font-semibold text-slate-700">📢 Important:</p>
            <ul className="mt-1 space-y-1">
              <li>• Minimum deposit: ৳10</li>
              <li>• Secure payment via Uddokta Pay</li>
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