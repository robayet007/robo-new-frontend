import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import BkashVerification from '../BkashVerification';
import { paymentApi } from '../services/api';

function AddMoney() {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [showBkashVerification, setShowBkashVerification] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // ✅ সরাসরি API কল করে ব্যালেন্স ফেচ করি user-এর email ব্যবহার করে
  const fetchBalance = async () => {
    console.log('🔍 fetchBalance called with user:', user);
    
    if (!user?.email) {
      console.log('⚠️ No user email found, setting balance to 0');
      setBalance(0);
      setLoading(false);
      return;
    }

    try {
      setBalanceLoading(true);
      const userEmail = user.email;
      console.log('📧 Fetching balance for email:', userEmail);
      
      // Encode email for URL
      const encodedEmail = encodeURIComponent(userEmail);
      const apiUrl = `http://localhost:3000/api/balance/by-email/${encodedEmail}`;
      console.log('🌐 API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 API Response Status:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('❌ API Error:', response.status, response.statusText);
        throw new Error(`Failed to fetch balance: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 API Response Data:', JSON.stringify(data, null, 2));
      
      if (data.success && data.data) {
        const userBalance = data.data.balance;
        console.log('✅ Balance found:', userBalance);
        setBalance(userBalance);
      } else {
        console.log('ℹ️ No balance data found in response, setting to 0');
        setBalance(0);
      }
    } catch (error: any) {
      console.error('❌ Error fetching balance:', error);
      console.log('⚠️ Setting balance to 0 due to error');
      setBalance(0);
    } finally {
      console.log('🏁 Balance fetch completed');
      setLoading(false);
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect triggered, user:', user);
    if (user?.email) {
      console.log('📝 User email available:', user.email);
      fetchBalance();
    } else {
      console.log('👤 No user or email found');
      setLoading(false);
      setBalance(0);
    }
  }, [user?.email]);

  // ✅ currentBalance safe way এ define করুন
  const currentBalance = balance !== null && balance !== undefined ? balance : 0;
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

    console.log('💸 Proceeding to payment with amount:', amountValue);
    // Show bKash verification modal
    setShowBkashVerification(true);
  };

  const handleBkashVerify = async (transactionId: string): Promise<void> => {
    const amountValue = parseFloat(amount);
    console.log('🔐 Verifying bKash payment:', { transactionId, amountValue });
    
    // Validate transaction ID format
    const trimmedTrxId = transactionId.trim().toUpperCase();
    if (!trimmedTrxId.startsWith('C')) {
      throw new Error('Invalid bKash Transaction ID. bKash TrxID must start with "C"');
    }

    const bKashTrxIdRegex = /^C[A-Z0-9]{9,11}$/;
    if (!bKashTrxIdRegex.test(trimmedTrxId)) {
      throw new Error('Invalid bKash Transaction ID format. Must be 10-12 characters starting with C');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      // ✅ Ensure user email is available
      if (!user?.email) {
        throw new Error('User email not found. Please login again.');
      }

      console.log('👤 User info for payment:', {
        email: user.email,
        displayName: user.displayName,
        uid: user.uid
      });

      // ✅ Verify payment
      const paymentData = {
        transactionId: trimmedTrxId,
        amount: amountValue,
        playerId: user.email,
        productId: 'add_money',
        productName: `Add ৳${amountValue} to Robo Balance`,
        diamonds: 0,
        price: amountValue,
        userEmail: user.email,
        userName: user.displayName || user.email.split('@')[0] || 'User',
        userId: user.uid || user.email,
        // Narrow to literal type so it matches `"bkash" | "robo"` union
        paymentMethod: 'bkash' as const,
      };

      console.log('📤 Sending payment verification:', paymentData);
      
      const response = await paymentApi.verify(paymentData, { signal: controller.signal });
      
      clearTimeout(timeoutId);
      
      console.log('📥 Payment verification response:', response);
      
      if (response.success) {
        setShowBkashVerification(false);

        // ✅ ব্যালেন্স রিফ্রেশ করি
        console.log('🔄 Refreshing balance after successful payment');
        await fetchBalance();

        console.log(`✅ Balance updated successfully. Added: ৳${amountValue}`);
        
        navigate('/');
        return;
      } else {
        throw new Error(response.message || 'Payment verification failed');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('❌ Payment verification error:', err);
      
      if (err.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      
      throw new Error(err.message || 'Payment verification failed. Please try again.');
    }
  };

  const handleBkashClose = () => {
    console.log('❌ bKash verification closed');
    setShowBkashVerification(false);
  };

  const handleQuickAmount = (quickAmount: number) => {
    console.log('⚡ Quick amount selected:', quickAmount);
    setAmount(quickAmount.toString());
    setError('');
  };

  if (showBkashVerification) {
    return (
      <BkashVerification 
        onVerify={handleBkashVerify} 
        onClose={handleBkashClose} 
        amount={parseFloat(amount) || 0}
      />
    );
  }

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

  if (loading) {
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
              onClick={fetchBalance}
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
              setAmount(e.target.value);
              setError('');
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
            <li>Send money to our bKash Merchant number</li>
            <li>Enter the bKash Transaction ID (starting with C)</li>
            <li>Your balance will be updated instantly</li>
          </ol>
          <div className="p-2 mt-3 bg-blue-100 rounded-lg">
            <p className="text-xs font-medium text-blue-800">
              API Endpoint: GET /api/balance/by-email/{user.email?.substring(0, 10)}...
            </p>
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
            disabled={!amount || parseFloat(amount) < 10 || balanceLoading}
            className="flex-1 px-4 py-3 font-semibold text-white shadow-md rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to bKash
          </button>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            <p className="font-semibold text-slate-700">📢 Important:</p>
            <ul className="mt-1 space-y-1">
              <li>• Minimum deposit: ৳10</li>
              <li>• Only use bKash Personal to Merchant payment</li>
              <li>• Transaction ID must start with "C"</li>
              <li>• Balance updates automatically after verification</li>
              <li>• Contact support if you face any issues</li>
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