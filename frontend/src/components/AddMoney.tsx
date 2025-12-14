import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import useRoboBalance from '../hooks/useRoboBalance';
import useAuth from '../hooks/useAuth';
import BkashVerification from '../BkashVerification';
import { paymentApi } from '../services/api';

function AddMoney() {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [showBkashVerification, setShowBkashVerification] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance, addMoney } = useRoboBalance();

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

    // Show bKash verification modal
    setShowBkashVerification(true);
  };

  const handleBkashVerify = async (transactionId: string): Promise<void> => {
    const amountValue = parseFloat(amount);
    
    // Validate transaction ID format
    const trimmedTrxId = transactionId.trim().toUpperCase();
    if (!trimmedTrxId.startsWith('C')) {
      throw new Error('Invalid bKash Transaction ID. bKash TrxID must start with "C"');
    }

    const bKashTrxIdRegex = /^C[A-Z0-9]{9,11}$/;
    if (!bKashTrxIdRegex.test(trimmedTrxId)) {
      throw new Error('Invalid bKash Transaction ID format. Must be 10-12 characters starting with C');
    }

    // Add timeout for API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    try {
      // Verify payment with backend
      const response = await paymentApi.verify({
        transactionId: trimmedTrxId,
        amount: amountValue,
        playerId: user?.email || user?.uid || '',
        productId: 'add_money',
        productName: `Add ৳${amountValue} to Robo Balance`,
        diamonds: 0,
        price: amountValue,
        // User information for database tracking
        userEmail: user?.email || '',
        userName: user?.displayName || user?.email?.split('@')[0] || 'User',
        userId: user?.uid || '',
        paymentMethod: 'bkash'
      }, { signal: controller.signal });
      
      clearTimeout(timeoutId);
      
      if (response.success) {
        // Add money to balance after successful payment verification
        const result = await addMoney(amountValue, `Added ৳${amountValue} via bKash (TrxID: ${trimmedTrxId})`);
        
        if (result.success) {
          // Success - will be handled by BkashVerification component
          return;
        } else {
          throw new Error('Payment verified but failed to add money: ' + result.error);
        }
      } else {
        throw new Error(response.message || 'Payment verification failed');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Payment verification error:', err);
      
      if (err.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      
      throw new Error(err.message || 'Payment verification failed. Please try again.');
    }
  };

  const handleBkashClose = () => {
    setShowBkashVerification(false);
  };

  const handleQuickAmount = (quickAmount: number) => {
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
    return (
      <div className="max-w-md mx-auto mt-8 p-6 rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="text-center">
          <p className="text-red-600 mb-4">Please login to add money</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-semibold"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-4 sm:mt-6 md:mt-8 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="text-center mb-6">
        <p className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-400/14 text-green-700 border border-green-400/35 font-semibold text-sm mb-4">
          💰 Add Money
        </p>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Add Money to Robo Balance</h2>
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <p className="text-sm text-slate-600 mb-1">Current Balance</p>
          <p className="text-3xl font-bold text-green-600">৳{balance.toFixed(2)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Amount (৳)
          </label>
          <input
            type="number"
            required
            min="10"
            step="1"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
            }}
            placeholder="Enter amount (minimum ৳10)"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all text-lg font-semibold"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Quick Select</p>
          <div className="grid grid-cols-3 gap-2">
            {predefinedAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => handleQuickAmount(quickAmount)}
                className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all ${
                  amount === quickAmount.toString()
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-green-300'
                }`}
              >
                ৳{quickAmount}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!amount || parseFloat(amount) < 10}
          className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Pay ৳{amount || '0'} with bKash
        </button>
      </form>

      <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>💡 Note:</strong> After clicking "Pay with bKash", you'll need to complete the bKash payment and enter the transaction ID to add money to your Robo Balance.
        </p>
      </div>

      <button
        onClick={() => navigate('/')}
        className="w-full mt-4 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
      >
        Back to Store
      </button>
    </div>
  );
}

export default AddMoney;

