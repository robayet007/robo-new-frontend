import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import BkashVerification from '../BkashVerification';
import { paymentApi } from '../services/api';
import type { Product } from '../types';
import useRoboBalance from '../hooks/useRoboBalance';
import useAuth from '../hooks/useAuth';

// Note: addMoney is not needed here as we only deduct

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

  useEffect(() => {
    if (!products.length) navigate('/');
  }, [products, navigate]);

  useEffect(() => {
    // Set default payment method based on balance
    if (user && product && !isNaN(balance) && balance >= product.price) {
      setPayment('robo');
    } else {
      setPayment('bkash');
    }
  }, [user, product, balance]);

  if (!product) {
    return <Navigate to="/" replace />;
  }

  const handleBkashVerify = async (businessId: string) => {
    try {
      // Validate transaction ID format
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
        price: product.price
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
    console.log('🔄 Robo Balance Payment Started');
    console.log('Current balance:', balance);
    console.log('Product price:', product.price);
    console.log('Has enough balance:', hasEnoughBalance(product.price));
    
    if (!uid.trim()) {
      alert('Please enter your Free Fire UID');
      return;
    }

    // Double check balance before proceeding
    if (balance < product.price) {
      alert(`Insufficient balance. You have ৳${balance.toFixed(2)} but need ৳${product.price.toFixed(2)}. Please add money to your Robo Balance.`);
      setPayment('bkash');
      return;
    }

    if (!hasEnoughBalance(product.price)) {
      alert('Insufficient balance. Please add money to your Robo Balance.');
      setPayment('bkash');
      return;
    }

    setProcessing(true);

    try {
      console.log('💰 Step 1: Deducting balance...');
      // Deduct balance first
      const deductResult = await deductMoney(product.price, `Payment for ${product.name}`);
      
      console.log('✅ Balance deduction result:', deductResult);
      
      if (!deductResult.success) {
        console.error('❌ Balance deduction failed:', deductResult.error);
        alert(deductResult.error || 'Payment failed. Please try again.');
        setProcessing(false);
        return;
      }

      // Get the updated balance after deduction
      const updatedBalance = deductResult.newBalance || (balance - product.price);
      console.log('✅ Updated balance:', updatedBalance);

      // Process payment with backend - send updated balance instead of transaction ID
      console.log('📡 Step 2: Sending payment to backend for Telegram notification...');
      
      const paymentPayload = {
        transactionId: `ROBO_${Date.now()}`, // Unique transaction ID
        amount: product.price,
        playerId: uid,
        productId: product.id,
        productName: product.name || 'Product',
        diamonds: product.diamonds || 0,
        price: product.price,
        paymentMethod: 'robo' as const, // Important: This tells backend it's a Robo Balance payment
        updatedBalance: updatedBalance, // Send updated balance for Telegram
        userEmail: user?.email || '', // User email for Telegram
        userName: user?.displayName || user?.email?.split('@')[0] || 'User', // User name for Telegram
        timestamp: new Date().toISOString() // Timestamp for tracking
      };
      
      console.log('📤 Full Payment Payload:', JSON.stringify(paymentPayload, null, 2));
      console.log('📤 Payment Method:', paymentPayload.paymentMethod);
      console.log('📤 Updated Balance:', paymentPayload.updatedBalance);
      console.log('📤 User Email:', paymentPayload.userEmail);
      
      // Set timeout for API call (30 seconds)
      const apiCallPromise = paymentApi.verify(paymentPayload);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API call timeout after 30 seconds')), 30000)
      );
      
      let response;
      try {
        console.log('⏳ Waiting for backend response...');
        response = await Promise.race([apiCallPromise, timeoutPromise]) as any;
        console.log('📥 Backend Response Received:', JSON.stringify(response, null, 2));
        console.log('✅ Response Success:', response?.success);
        console.log('📝 Response Message:', response?.message);
      } catch (apiError: any) {
        console.error('❌ API Call Exception:', apiError);
        console.error('❌ Error Type:', apiError.constructor?.name);
        console.error('❌ Error Message:', apiError.message);
        console.error('❌ Error Stack:', apiError.stack);
        
        // Continue with payment even if API fails - balance is already deducted
        response = { 
          success: false, 
          message: apiError.message || 'API call failed. Balance was deducted but Telegram notification may not have been sent.' 
        };
      }

      // Always complete payment since balance is already deducted
      if (response && response.success) {
        console.log('✅ Payment successful and Telegram notification sent!');
        alert(`✅ Payment successful!\n\n৳${product.price} deducted from your Robo Balance.\nRemaining balance: ৳${updatedBalance.toFixed(2)}\n\nTelegram notification sent!`);
      } else {
        // Even if backend fails, balance is already deducted
        console.warn('⚠️ Backend response indicates failure:', response);
        console.warn('⚠️ Balance was deducted but Telegram notification may not have been sent');
        console.warn('⚠️ Backend error message:', response?.message || 'Unknown error');
        
        // Show user-friendly message
        alert(`✅ Payment processed!\n\n৳${product.price} deducted from your Robo Balance.\nRemaining balance: ৳${updatedBalance.toFixed(2)}\n\n⚠️ Note: ${response?.message || 'Telegram notification may not have been sent. Please check backend logs.'}`);
      }
      
      // Refresh balance and navigate
      await refresh();
      navigate('/');
      
    } catch (err: any) {
      console.error('❌ Payment error:', err);
      console.error('❌ Error Type:', err.constructor?.name);
      console.error('❌ Error Message:', err.message);
      console.error('❌ Error Stack:', err.stack);
      alert('❌ Payment failed: ' + (err.message || 'Please try again.'));
    } finally {
      console.log('🔄 Resetting processing state...');
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

  return (
    <section className="section checkout">
      <div className="checkout-head">
        <div>
          <p className="pill">Free Fire</p>
          <h2>{product.name}</h2>
          <p className="muted">
            আপনার Free Fire UID দিন 🔢 এবং bKash দিয়ে সহজেই পেমেন্ট করুন 💸"
          </p>
        </div>
        <button className="btn ghost" onClick={() => navigate('/')}>
          Back to store
        </button>
      </div>

      <div className="checkout-grid">
        <div className="card">
          <p className="label">1) UID</p>
          <input
            required
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="Enter your Free Fire UID"
          />
          <p className="help">We'll use this UID to deliver your diamonds.</p>

          <p className="label">2) Payment method</p>
          
          {user && (
            <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Robo Balance</p>
                  {balanceLoading ? (
                    <p className="text-xl font-bold text-green-600">Loading...</p>
                  ) : (
                    <p className="text-xl font-bold text-green-600">৳{balance.toFixed(2)}</p>
                  )}
                </div>
                {!balanceLoading && !hasEnoughBalance(product.price) && (
                  <button
                    onClick={() => navigate('/add-money')}
                    className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-all"
                  >
                    Add Money
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="pay-options space-y-2">
            {user && !balanceLoading && hasEnoughBalance(product.price) && (
              <button
                className={`pay-card w-full ${payment === 'robo' ? 'active' : ''}`}
                onClick={() => setPayment('robo')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                    R
                  </div>
                  <div className="flex-1">
                    <p className="pay-title">Robo Balance</p>
                    <p className="muted">Pay with your balance</p>
                  </div>
                </div>
                <span className="tag" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                  Available
                </span>
              </button>
            )}
            
            <button
              className={`pay-card w-full ${payment === 'bkash' ? 'active' : ''}`}
              onClick={() => setPayment('bkash')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="bkash-logo">
                  bK
                </div>
                <div className="flex-1">
                  <p className="pay-title">bKash</p>
                  <p className="muted">Instant Pay</p>
                </div>
              </div>
              <span className="tag bkash-tag">
                {!user || !hasEnoughBalance(product.price) ? 'Recommended' : 'Alternative'}
              </span>
            </button>
          </div>

          {payment === 'robo' ? (
            <button
              className="btn primary full"
              disabled={!uid.trim() || processing || balanceLoading || !hasEnoughBalance(product.price)}
              onClick={handleRoboBalancePayment}
            >
              {balanceLoading ? 'Loading Balance...' :
               processing ? 'Processing...' : 
               !hasEnoughBalance(product.price) ? `Insufficient Balance (৳${balance.toFixed(2)})` :
               `Pay ৳${product.price} with Robo Balance`}
            </button>
          ) : (
            <button
              className="btn primary full"
              disabled={!uid.trim()}
              onClick={() => setShowBkashVerification(true)}
            >
              Pay with bKash
            </button>
          )}
        </div>

        <div className="card summary">
          <p className="label">Order summary</p>
          <div className="summary-line">
            <span>Item</span>
            <strong>{product.name}</strong>
          </div>
          <div className="summary-line">
            <span>Diamonds</span>
            <strong>{product.diamonds || 'Special item'}</strong>
          </div>
          <div className="summary-line total">
            <span>Total</span>
            <strong>৳{product.price}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Checkout;

