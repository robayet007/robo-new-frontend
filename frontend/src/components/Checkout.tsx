import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { paymentApi } from '../services/api';
import { createUddoktaPayCheckout, verifyUddoktaPayPayment, getBackendWebhookUrl } from '../services/uddoktaPay';
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
  const [searchParams] = useSearchParams();
  
  // #region agent log
  // Initialize UID from localStorage to persist across redirects
  const [uid, setUid] = useState(() => {
    const savedUid = localStorage.getItem('checkout_uid') || '';
    fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:26',message:'UID state initialization',data:{savedUid,fromLocalStorage:!!localStorage.getItem('checkout_uid')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    return savedUid;
  });
  // #endregion
  
  const [ffName, setFfName] = useState<string | null>(null);
  const [ffNameLoading, setFfNameLoading] = useState(false);
  const [ffNameError, setFfNameError] = useState<string | null>(null);
  const [payment, setPayment] = useState<'robo' | 'uddokta'>('uddokta');
  const [processing, setProcessing] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState<{
    invoiceId: string;
    status: 'verifying' | 'verified' | 'failed';
    message?: string;
  } | null>(null);
  const [paymentResult, setPaymentResult] = useState<{
    status: 'success' | 'warning';
    message: string;
    amount: number;
    remaining: number;
    transactionId?: string;
    productName?: string;
    paymentMethod?: string;
    ffName?: string | null;
    playerId?: string;
  } | null>(null);

  useEffect(() => {
    if (!products.length) navigate('/');
  }, [products, navigate]);

  // Restore UID from localStorage or URL params on mount and when searchParams change
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:64',message:'Component mount - checking UID restoration',data:{currentUid:uid,localStorageUid:localStorage.getItem('checkout_uid'),urlUid:searchParams.get('uid')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Priority: URL param > localStorage > current state
    const urlUid = searchParams.get('uid');
    const localUid = localStorage.getItem('checkout_uid');
    const savedUid = urlUid || localUid || '';
    
    if (savedUid && savedUid !== uid) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:71',message:'Restoring UID on mount',data:{savedUid,fromLocalStorage:!!localUid,fromUrl:!!urlUid,currentUid:uid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setUid(savedUid);
      // Also save to localStorage if it came from URL
      if (urlUid) {
        localStorage.setItem('checkout_uid', urlUid);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only run when searchParams change (after redirect)

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
    
    console.log('🔍 Uddokta Pay Callback - URL Params:', {
      invoice_id: searchParams.get('invoice_id'),
      invoiceId: searchParams.get('invoiceId'),
      invoice: searchParams.get('invoice'),
      transaction_id: searchParams.get('transaction_id'),
      transactionId: searchParams.get('transactionId'),
      status: searchParams.get('status'),
      payment_status: searchParams.get('payment_status'),
      allParams: Object.fromEntries(searchParams.entries()),
      fullURL: window.location.href
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
        // Use setTimeout to ensure component is fully mounted
        setTimeout(() => {
          handleUddoktaPayCallback(invoiceId);
        }, 100);
      } else if (status === 'CANCELLED' || status === 'cancelled') {
        console.log('❌ Payment was cancelled');
        alert('Payment was cancelled. Please try again.');
      } else {
        console.log('⚠️ Payment status is:', status, '- Still verifying via API...');
        // Even if status is unknown, try to verify via API
        setTimeout(() => {
          handleUddoktaPayCallback(invoiceId);
        }, 100);
      }
    } else {
      console.log('ℹ️ No invoice_id found in URL parameters');
      console.log('📋 Full URL:', window.location.href);
      console.log('📋 All search params:', Array.from(searchParams.entries()));
      
      // Check if cancelled
      if (searchParams.get('cancelled') === 'true') {
        console.log('❌ Payment was cancelled');
        alert('Payment was cancelled. Please try again.');
      } else {
        // Check if payment was successful but invoice_id not in URL
        // Uddokta Pay might redirect without invoice_id in some cases
        console.log('⚠️ Payment completed but invoice_id not found in URL');
        console.log('💡 Possible reasons:');
        console.log('   1. Payment is still processing - wait a few seconds');
        console.log('   2. Webhook will handle verification automatically (in production)');
        console.log('   3. Check Uddokta Pay dashboard for invoice_id');
        console.log('   4. Payment will be verified via webhook');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    // Set default payment method based on balance
    // If user has balance and enough for product, default to Robo Pay
    // Otherwise default to Uddokta Pay
    const hasEnough = typeof hasEnoughBalance === 'function' && product
      ? hasEnoughBalance(product.price)
      : false;

    if (user && product && !isNaN(balance) && balance > 0 && hasEnough) {
      setPayment('robo');
    } else {
      setPayment('uddokta');
    }
  }, [user, product, balance, hasEnoughBalance]);

  // Auto-fetch FF name when UID changes (with retry mechanism)
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

    const maxRetries = 10; // Maximum 10 retries
    let isCancelled = false;
    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const fetchFFName = async (attempt: number = 0): Promise<void> => {
      if (isCancelled) return;

      try {
        setFfNameLoading(true);
        setFfNameError(null);
        
        const url = `https://info-ob49.vercel.app/api/account/?uid=${encodeURIComponent(
          trimmed
        )}&region=BD`;
        
        console.log(`🔍 Fetching FF name (Attempt ${attempt + 1}/${maxRetries}) for UID: ${trimmed}`);
        
        const resp = await fetch(url);
        
        if (!resp.ok) {
          throw new Error('UID info not found');
        }
        
        const json = await resp.json();
        const nickname = json?.basicInfo?.nickname;
        
        if (!nickname) {
          throw new Error('Name not found for this UID');
        }
        
        // Success! Name found
        console.log(`✅ FF Name found: ${nickname}`);
        setFfName(nickname);
        setFfNameError(null);
        setFfNameLoading(false);
        return; // Stop retrying
        
      } catch (err: any) {
        if (isCancelled) return;
        
        console.log(`❌ Attempt ${attempt + 1} failed:`, err.message);
        
        // If we haven't reached max retries, retry
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 3s, 4s, 5s, then 5s intervals
          const delay = Math.min(1000 * (attempt + 1), 5000);
          console.log(`⏳ Retrying in ${delay}ms...`);
          
          setFfNameError(`Searching... (${attempt + 1}/${maxRetries})`);
          
          retryTimeoutId = setTimeout(() => {
            fetchFFName(attempt + 1);
          }, delay);
        } else {
          // Max retries reached
          console.log(`❌ Max retries (${maxRetries}) reached. Giving up.`);
          setFfName(null);
          setFfNameError('Name not found. Please check your UID or try again.');
          setFfNameLoading(false);
        }
      }
    };

    // Initial delay before first attempt (debounce)
    const timeoutId = setTimeout(() => {
      fetchFFName(0);
    }, 600); // 0.6s debounce

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
    };
  }, [uid]);

  if (!product) {
    return <Navigate to="/" replace />;
  }

  const handleRefreshBalance = async () => {
    setRefreshingBalance(true);
    await refresh();
    setRefreshingBalance(false);
  };

  // Handle Uddokta Pay callback after payment
  const handleUddoktaPayCallback = async (invoiceId: string) => {
    console.log('🔄 handleUddoktaPayCallback called with invoiceId:', invoiceId);
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:246',message:'handleUddoktaPayCallback entry',data:{invoiceId,uid,uidLength:uid.length,uidTrimmed:uid.trim(),localStorageUid:localStorage.getItem('checkout_uid'),urlUid:searchParams.get('uid')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Try to restore UID from localStorage or URL if state is empty
    let currentUid = uid.trim();
    if (!currentUid) {
      currentUid = localStorage.getItem('checkout_uid') || searchParams.get('uid') || '';
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:252',message:'UID restored from storage',data:{restoredUid:currentUid,fromLocalStorage:!!localStorage.getItem('checkout_uid'),fromUrl:!!searchParams.get('uid')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      if (currentUid) {
        setUid(currentUid);
      }
    }
    
    if (!currentUid) {
      console.warn('⚠️ UID is empty, cannot process payment');
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:260',message:'UID validation failed',data:{uid,currentUid,localStorageUid:localStorage.getItem('checkout_uid'),urlUid:searchParams.get('uid')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      alert('Please enter your Free Fire UID');
      return;
    }

    if (!invoiceId || invoiceId.trim() === '') {
      console.error('❌ Invalid invoice ID:', invoiceId);
      alert('Invalid payment transaction ID. Please contact support.');
      return;
    }

    // Show verification UI immediately
    setVerifyingPayment({
      invoiceId: invoiceId.trim().toUpperCase(),
      status: 'verifying',
      message: 'Verifying payment...'
    });
    setProcessing(true);

    // Small delay to ensure UI is visible
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      console.log('🔍 Verifying payment with Uddokta Pay API...');
      setVerifyingPayment({
        invoiceId: invoiceId.trim().toUpperCase(),
        status: 'verifying',
        message: 'Verifying with Uddokta Pay...'
      });

      // Verify payment with Uddokta Pay
      const verifyResponse = await verifyUddoktaPayPayment(invoiceId.trim());
      
      console.log('📥 Uddokta Pay verification response:', verifyResponse);
      console.log('📥 Full response structure:', JSON.stringify(verifyResponse, null, 2));
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:333',message:'Uddokta Pay verification response received',data:{verifyResponse,hasStatus:!!verifyResponse.status,hasPayment:!!verifyResponse.payment,paymentStatus:verifyResponse.payment?.status,allKeys:Object.keys(verifyResponse)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Check payment status - Uddokta Pay might return status in different formats
      // The response might be flat (not nested in payment object)
      // Try multiple possible locations for status
      const paymentStatusRaw = verifyResponse.payment?.status ||
                              verifyResponse.status ||
                              verifyResponse.payment_status ||
                              (verifyResponse.payment && typeof verifyResponse.payment === 'object' ? verifyResponse.payment.status : null) ||
                              'UNKNOWN';

      // Normalize status to uppercase for comparison
      type PaymentStatusType = 'COMPLETED' | 'PENDING' | 'VERIFIED' | 'CANCELLED' | 'UNKNOWN';
      let paymentStatus: PaymentStatusType = 'UNKNOWN';
      
      if (typeof paymentStatusRaw === 'string') {
        const upperStatus = paymentStatusRaw.toUpperCase();
        if (upperStatus === 'COMPLETED' || upperStatus === 'PENDING' || upperStatus === 'VERIFIED' || upperStatus === 'CANCELLED' || upperStatus === 'UNKNOWN') {
          paymentStatus = upperStatus as PaymentStatusType;
        }
      }

      // Also check if response.status is a boolean (true = success)
      const isResponseSuccessful = verifyResponse.status === true || verifyResponse.status === 'true';

      console.log('📊 ========== VERIFICATION RESPONSE ANALYSIS ==========');
      console.log('📊 Full verifyResponse:', JSON.stringify(verifyResponse, null, 2));
      console.log('📊 Detected payment status (raw):', paymentStatusRaw);
      console.log('📊 Detected payment status (normalized):', paymentStatus);
      console.log('📊 Response status (boolean):', verifyResponse.status);
      console.log('📊 Is response successful:', isResponseSuccessful);
      console.log('📊 Has payment object:', !!verifyResponse.payment);
      console.log('📊 Payment object:', verifyResponse.payment);
      console.log('📊 Response structure:', {
        hasStatus: 'status' in verifyResponse,
        hasPayment: 'payment' in verifyResponse,
        paymentKeys: verifyResponse.payment ? Object.keys(verifyResponse.payment) : [],
        allKeys: Object.keys(verifyResponse)
      });
      console.log('📊 ===================================================');
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:345',message:'Payment status check',data:{paymentStatus,isCompleted:paymentStatus === 'COMPLETED',isResponseSuccessful,responseStatus:verifyResponse.status,paymentObjectStatus:verifyResponse.payment?.status,hasPayment:!!verifyResponse.payment,responseKeys:Object.keys(verifyResponse)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Check if payment has required data (amount, invoice_id) - indicates successful payment
      const hasPaymentData = verifyResponse.payment?.amount || verifyResponse.amount || verifyResponse.payment?.invoice_id || verifyResponse.invoice_id;

      // ✅ ACCEPT PENDING payments if transaction ID is valid (has payment data)
      // According to Uddokta Pay docs: PENDING payments should be accepted and stored
      // Webhook will notify when status changes to COMPLETED
      const isVerified = paymentStatus === 'COMPLETED' || 
                        paymentStatus === 'VERIFIED';
      
      const isPending = paymentStatus === 'PENDING';
      
      // Process if: (1) COMPLETED/VERIFIED, OR (2) PENDING with valid transaction data
      // Do NOT process if CANCELLED or UNKNOWN
      const shouldProcess = (isVerified || (isPending && hasPaymentData)) && 
                           paymentStatus !== 'CANCELLED' && 
                           paymentStatus !== 'UNKNOWN';

      console.log('🔍 Verification Decision:');
      console.log('  - paymentStatus:', paymentStatus);
      console.log('  - isResponseSuccessful:', isResponseSuccessful);
      console.log('  - hasPaymentData:', hasPaymentData);
      console.log('  - isVerified:', isVerified);
      console.log('  - shouldProcess:', shouldProcess);
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:384',message:'Verification decision',data:{invoiceId,paymentStatus,isResponseSuccessful,hasPaymentData,isVerified,shouldProcess,fullResponse:verifyResponse},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      if (shouldProcess) {
        const isPendingStatus = paymentStatus === 'PENDING';
        console.log('✅ Payment verified by Uddokta Pay, now verifying with backend...');
        console.log('✅ Processing with status:', paymentStatus, 'isVerified:', isVerified, 'isPending:', isPendingStatus, 'hasPaymentData:', hasPaymentData);
        console.log('✅ Status Code: 0.0.0.0'); // Transaction ID verified successfully

        setVerifyingPayment({
          invoiceId: invoiceId.trim().toUpperCase(),
          status: 'verifying',
          message: isPendingStatus 
            ? 'Payment received! Status: PENDING. Your order will be processed when payment is completed...'
            : 'Payment verified! Processing order...'
        });

        // ✅ Payment verified - sending data to backend
        // #region agent log
        const finalUid = uid.trim() || localStorage.getItem('checkout_uid') || searchParams.get('uid') || '';
        fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:395',message:'Payment verified - sending data to backend',data:{uid,finalUid,paymentStatus,isVerified,hasPaymentData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        const paymentData = {
          transactionId: invoiceId.trim().toUpperCase(),
          amount: product.price,
          playerId: finalUid,
          productId: product.id,
          productName: product.name,
          diamonds: product.diamonds,
          price: product.price,
          paymentMethod: 'uddokta' as const,
          userEmail: user?.email || '',
          userName: user?.displayName || user?.email?.split('@')[0] || 'User',
          userId: user?.uid || '',
          uddoktaPayStatus: paymentStatus // Pass Uddokta Pay status to backend
        };
        
        console.log('📤 Sending payment verification to backend:', paymentData);
        
        const response = await paymentApi.verify(paymentData);

        console.log('📥 Backend verification response:', response);
        
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:415',message:'Backend verification response received',data:{success:response.success,message:response.message,paymentStatus,isVerified},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        if (response.success) {
          console.log('✅ Payment successfully processed!');
          
          setVerifyingPayment({
            invoiceId: invoiceId.trim().toUpperCase(),
            status: 'verified',
            message: 'Payment verified successfully!'
          });
          
          // Refresh balance after successful payment
          try {
            await refresh();
          } catch (refreshError) {
            console.warn('Balance refresh failed:', refreshError);
          }
          
          // Wait a moment to show verified status
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          setPaymentResult({
            status: 'success',
            message: 'Your top-up was successful! 💎 Your diamonds will arrive shortly.',
            amount: product.price,
            remaining: balance,
            transactionId: invoiceId.trim().toUpperCase(),
            productName: product.name,
            paymentMethod: 'Uddokta Pay',
            ffName: ffName,
            playerId: (uid.trim() || localStorage.getItem('checkout_uid') || searchParams.get('uid') || '').trim(),
          });
          setVerifyingPayment(null);
          
          // Clear URL params after a delay to show success message
          setTimeout(() => {
            navigate('/checkout?productId=' + product.id, { replace: true });
          }, 2000);
          } else {
            console.error('❌ Backend verification failed:', response.message);
            
            // Check if it's a duplicate transaction error
            if (response.message?.includes('already exists') || response.message?.includes('already verified')) {
              console.log('ℹ️ Payment already processed, showing success');
              
              setVerifyingPayment({
                invoiceId: invoiceId.trim().toUpperCase(),
                status: 'verified',
                message: 'Payment already processed!'
              });
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              setPaymentResult({
                status: 'success',
                message: 'Payment already processed! Your order is being processed.',
                amount: product.price,
                remaining: balance,
                transactionId: invoiceId.trim().toUpperCase(),
                productName: product.name,
                paymentMethod: 'Uddokta Pay',
              });
              setVerifyingPayment(null);
              
              setTimeout(() => {
                navigate('/checkout?productId=' + product.id, { replace: true });
              }, 2000);
            } else {
              // Show detailed error
              const errorMsg = response.message || 'Payment verification failed';
              console.error('Full error response:', response);
              
              setVerifyingPayment({
                invoiceId: invoiceId.trim().toUpperCase(),
                status: 'failed',
                message: errorMsg
              });
              
              setTimeout(() => {
                setVerifyingPayment(null);
                alert(`Payment verification failed: ${errorMsg}\n\nTransaction ID: ${invoiceId}\n\nPlease contact support if this issue persists.`);
              }, 2000);
            }
          }
      } else {
        const paymentStatusRaw = verifyResponse.payment?.status || 'UNKNOWN';
        // Normalize to uppercase for comparison
        const paymentStatus = typeof paymentStatusRaw === 'string' 
          ? paymentStatusRaw.toUpperCase() as 'COMPLETED' | 'VERIFIED' | 'PENDING' | 'CANCELLED' | 'UNKNOWN'
          : 'UNKNOWN';
        
        // Handle PENDING status - payment might still be processing
        // ✅ DO NOT send to backend if status is PENDING - wait for verification with multiple retries
        if (paymentStatus === 'PENDING') {
          console.log('⏳ Payment status is PENDING - payment is still processing');
          console.log('⚠️ NOT sending to backend - waiting for payment to be verified');
          console.log('🔄 Will retry verification multiple times...');

          setVerifyingPayment({
            invoiceId: invoiceId.trim().toUpperCase(),
            status: 'verifying',
            message: 'Payment is processing. Please wait...'
          });
          
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:531',message:'Payment PENDING - NOT sending to backend, starting retries',data:{invoiceId,paymentStatus},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion

          // Retry verification multiple times (up to 5 times with increasing delays)
          let retryCount = 0;
          const maxRetries = 5;
          let retryResponse: any = null;
          let isRetryVerified = false;
          let retryPaymentStatus = 'PENDING';

          while (retryCount < maxRetries && !isRetryVerified) {
            // Wait before retry (increasing delay: 3s, 5s, 7s, 10s, 15s)
            const delay = retryCount === 0 ? 3000 : retryCount === 1 ? 5000 : retryCount === 2 ? 7000 : retryCount === 3 ? 10000 : 15000;
            console.log(`⏳ Waiting ${delay/1000}s before retry ${retryCount + 1}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, delay));

            try {
              console.log(`🔄 Retrying verification (attempt ${retryCount + 1}/${maxRetries})...`);
              retryResponse = await verifyUddoktaPayPayment(invoiceId.trim());

              // ✅ STRICT: Only process if payment status is explicitly COMPLETED/VERIFIED
              const retryPaymentStatusRaw = retryResponse.payment?.status || retryResponse.status || 'UNKNOWN';
              retryPaymentStatus = typeof retryPaymentStatusRaw === 'string'
                ? retryPaymentStatusRaw.toUpperCase() as 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'UNKNOWN' | 'VERIFIED'
                : 'UNKNOWN';
              
              isRetryVerified = retryPaymentStatus === 'COMPLETED' || retryPaymentStatus === 'VERIFIED';
              
              console.log(`📊 Retry ${retryCount + 1} result:`, {
                status: retryPaymentStatus,
                isVerified: isRetryVerified,
                hasPayment: !!retryResponse.payment
              });
              
              // #region agent log
              fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:560',message:'Retry verification result',data:{retryCount:retryCount+1,maxRetries,invoiceId,retryPaymentStatus,isRetryVerified},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
              // #endregion
              
              if (isRetryVerified) {
                break; // Exit retry loop if verified
              }
              
              retryCount++;
            } catch (retryError: any) {
              console.error(`❌ Retry ${retryCount + 1} error:`, retryError);
              retryCount++;
              if (retryCount >= maxRetries) {
                throw retryError;
              }
            }
          }

          // After retries, check if verified
          if (isRetryVerified && retryResponse) {
            console.log('✅ Payment verified after retries! Processing with backend...');
            console.log(`✅ Verified after ${retryCount} retry attempts`);
            
            setVerifyingPayment({
              invoiceId: invoiceId.trim().toUpperCase(),
              status: 'verifying',
              message: 'Payment verified! Processing order...'
            });
            
            // Process with backend
            const paymentData = {
              transactionId: invoiceId.trim().toUpperCase(),
              amount: product.price,
              playerId: (uid.trim() || localStorage.getItem('checkout_uid') || searchParams.get('uid') || '').trim(),
              productId: product.id,
              productName: product.name,
              diamonds: product.diamonds,
              price: product.price,
              paymentMethod: 'uddokta' as const,
              userEmail: user?.email || '',
              userName: user?.displayName || user?.email?.split('@')[0] || 'User',
              userId: user?.uid || ''
            };
            
            const response = await paymentApi.verify(paymentData);
            
            if (response.success) {
              await refresh();

              setVerifyingPayment({
                invoiceId: invoiceId.trim().toUpperCase(),
                status: 'verified',
                message: 'Payment verified successfully!'
              });
              
              // #region agent log
              fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:580',message:'Payment verified after retries - data sent to backend',data:{invoiceId,retryPaymentStatus,isRetryVerified,retryCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
              // #endregion
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                setPaymentResult({
                  status: 'success',
                  message: 'Your top-up was successful! 💎 Your diamonds will arrive shortly.',
                  amount: product.price,
                  remaining: balance,
                  transactionId: invoiceId.trim().toUpperCase(),
                  productName: product.name,
                  paymentMethod: 'Uddokta Pay',
                  ffName: ffName,
                  playerId: (uid.trim() || localStorage.getItem('checkout_uid') || searchParams.get('uid') || '').trim(),
                });
                setVerifyingPayment(null);
                
                setTimeout(() => {
                  navigate('/checkout?productId=' + product.id, { replace: true });
                }, 2000);
              } else if (response.message?.includes('already exists') || response.message?.includes('already verified')) {
                await refresh();
                
                setVerifyingPayment({
                  invoiceId: invoiceId.trim().toUpperCase(),
                  status: 'verified',
                  message: 'Payment already processed!'
                });
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                setPaymentResult({
                  status: 'success',
                  message: 'Payment already processed! Your order is being processed.',
                  amount: product.price,
                  remaining: balance,
                  transactionId: invoiceId.trim().toUpperCase(),
                  productName: product.name,
                  paymentMethod: 'Uddokta Pay',
                });
                setVerifyingPayment(null);
                
                setTimeout(() => {
                  navigate('/checkout?productId=' + product.id, { replace: true });
                }, 2000);
              } else {
                throw new Error(response.message || 'Backend verification failed');
              }
          } else {
            // Still pending after all retries - DO NOT send to backend
            console.log('⚠️ Payment still not verified after all retries - NOT sending to backend');
            console.log('⚠️ Final status:', retryPaymentStatus);
            console.log(`⚠️ Tried ${retryCount} times, max retries: ${maxRetries}`);
            
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:595',message:'Payment retry exhausted - NOT sending to backend',data:{invoiceId,retryPaymentStatus,isRetryVerified,retryCount,maxRetries},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            
            setVerifyingPayment({
              invoiceId: invoiceId.trim().toUpperCase(),
              status: 'verifying',
              message: 'Payment is still processing. Webhook will complete your order automatically.'
            });
            
            setTimeout(() => {
              setVerifyingPayment(null);
              alert(`Your payment is being processed. Transaction ID: ${invoiceId}\n\nStatus: ${retryPaymentStatus}\n\nTried ${retryCount} times. Your order will be completed automatically via webhook. Please check your order history in a few minutes.`);
              navigate('/checkout?productId=' + product.id, { replace: true });
            }, 3000);
          }
        } else if (paymentStatus === 'CANCELLED') {
          console.error('❌ Payment was cancelled');
          
          setVerifyingPayment({
            invoiceId: invoiceId.trim().toUpperCase(),
            status: 'failed',
            message: 'Payment was cancelled'
          });
          
          setTimeout(() => {
            setVerifyingPayment(null);
            alert('Payment was cancelled. Please try again.');
          }, 2000);
        } else {
          // Get status from multiple possible locations
          const finalPaymentStatus = verifyResponse.payment?.status || 
                                    verifyResponse.status || 
                                    verifyResponse.payment_status ||
                                    paymentStatus ||
                                    'UNKNOWN';
          console.error('❌ Payment status is not COMPLETED:', finalPaymentStatus);
          console.error('❌ Full response:', verifyResponse);
          
          // ✅ Payment verification failed - DO NOT send data to backend
          // Only send to backend if verification is successful
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:654',message:'Payment verification failed - NOT sending to backend',data:{finalPaymentStatus,verifyResponse,hasPayment:!!verifyResponse.payment,responseKeys:Object.keys(verifyResponse)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          
          setVerifyingPayment({
            invoiceId: invoiceId.trim().toUpperCase(),
            status: 'failed',
            message: `Payment status: ${finalPaymentStatus}`
          });
          
          setTimeout(() => {
            setVerifyingPayment(null);
            alert(`Payment verification failed. Status: ${finalPaymentStatus}. Please try again or contact support.`);
          }, 2000);
        }
      }
    } catch (err: any) {
      console.error('❌ Payment verification error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        invoiceId: invoiceId
      });
      
      setVerifyingPayment({
        invoiceId: invoiceId.trim().toUpperCase(),
        status: 'failed',
        message: err.message || 'Verification failed'
      });
      
      setTimeout(() => {
        setVerifyingPayment(null);
        alert('Payment verification failed: ' + (err.message || 'Please try again. If the problem persists, contact support with transaction ID: ' + invoiceId));
      }, 2000);
    } finally {
      setProcessing(false);
    }
  };

  // Handle Uddokta Pay checkout
  const handleUddoktaPayPayment = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:578',message:'handleUddoktaPayPayment entry',data:{uid,uidLength:uid.length,uidTrimmed:uid.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (!uid.trim()) {
      alert('Please enter your Free Fire UID');
      return;
    }

    if (!user?.email) {
      alert('Please login to continue');
      navigate('/login');
      return;
    }

    // Save UID to localStorage before redirect
    // #region agent log
    localStorage.setItem('checkout_uid', uid.trim());
    fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:592',message:'Saving UID to localStorage before redirect',data:{uid:uid.trim(),saved:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    setProcessing(true);
    try {
      const baseUrl = window.location.origin;
      // Include UID in redirect URL to restore it after redirect
      const redirectUrl = `${baseUrl}/checkout?productId=${product.id}&uid=${encodeURIComponent(uid.trim())}`;
      const cancelUrl = `${baseUrl}/checkout?productId=${product.id}&cancelled=true&uid=${encodeURIComponent(uid.trim())}`;
      const webhookUrl = getBackendWebhookUrl();

      const checkoutRequest = {
        full_name: user.displayName || user.email.split('@')[0] || 'User',
        email: user.email,
        amount: product.price.toString(),
        metadata: {
          user_id: user.uid,
          order_id: `ORDER_${Date.now()}`,
          product_id: product.id,
          product_name: product.name,
          player_id: uid.trim(),
          diamonds: product.diamonds,
          price: product.price,
          payment_type: 'purchase' as const,
        },
        redirect_url: redirectUrl,
        cancel_url: cancelUrl,
        webhook_url: webhookUrl,
      };

      const checkoutResponse = await createUddoktaPayCheckout(checkoutRequest);
      
      if (checkoutResponse.status && checkoutResponse.payment_url) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Checkout.tsx:620',message:'Redirecting to Uddokta Pay',data:{uid:uid.trim(),savedToLocalStorage:!!localStorage.getItem('checkout_uid'),redirectUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        // Redirect to Uddokta Pay payment page
        window.location.href = checkoutResponse.payment_url;
      } else {
        throw new Error(checkoutResponse.message || 'Failed to create payment');
      }
    } catch (err: any) {
      console.error('Uddokta Pay checkout error:', err);
      alert('Payment failed: ' + (err.message || 'Please try again.'));
      setProcessing(false);
    }
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
        playerId: (uid.trim() || localStorage.getItem('checkout_uid') || searchParams.get('uid') || '').trim(),
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
          transactionId: paymentPayload.transactionId,
          productName: product.name,
          paymentMethod: 'Robo Balance',
          ffName: ffName,
          playerId: (uid.trim() || localStorage.getItem('checkout_uid') || searchParams.get('uid') || '').trim(),
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
          transactionId: paymentPayload.transactionId,
          productName: product.name,
          paymentMethod: 'Robo Balance',
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


  const requiredAmount = product.price;

  return (
    <div className="relative max-w-2xl px-4 py-6 mx-auto">
      {/* Payment Verification Modal */}
      {verifyingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="text-center pt-8 pb-6 px-6">
              {verifyingPayment.status === 'verifying' && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <FaSyncAlt className="text-3xl text-blue-600 animate-spin" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying Payment</h2>
                  <p className="text-sm text-slate-600 mb-4">{verifyingPayment.message}</p>
                </>
              )}
              
              {verifyingPayment.status === 'verified' && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                      <FaCheck className="text-3xl text-emerald-600" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Verified!</h2>
                  <p className="text-sm text-slate-600 mb-4">{verifyingPayment.message}</p>
                </>
              )}
              
              {verifyingPayment.status === 'failed' && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h2>
                  <p className="text-sm text-red-600 mb-4">{verifyingPayment.message}</p>
                </>
              )}
              
              {/* Transaction ID Display */}
              <div className="mt-4 mb-4">
                <p className="text-xs text-slate-500 mb-2">Transaction ID</p>
                <div className="flex items-center justify-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-xs font-mono text-slate-700 break-all">
                    {verifyingPayment.invoiceId}
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(verifyingPayment.invoiceId);
                        alert('Transaction ID copied!');
                      } catch (err) {
                        console.error('Failed to copy:', err);
                      }
                    }}
                    className="flex-shrink-0 p-1.5 hover:bg-slate-200 rounded transition-colors"
                    title="Copy Transaction ID"
                  >
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {verifyingPayment.status === 'verifying' && (
                <div className="mt-4">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Please wait while we verify your payment...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Completed Modal - Enhanced UI */}
      {paymentResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header with Success Icon */}
            <div className="text-center pt-8 pb-4 px-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <FaCheck className="text-3xl text-emerald-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Completed!</h2>
              
              {/* Free Fire Player Name Display */}
              {paymentResult.ffName ? (
                <p className="text-sm text-slate-600 mb-1">
                  Player: <span className="font-semibold text-slate-800">{paymentResult.ffName}</span>
                </p>
              ) : paymentResult.playerId ? (
                <p className="text-sm text-slate-600 mb-1">
                  Free Fire ID: <span className="font-semibold text-slate-800">{paymentResult.playerId}</span>
                </p>
              ) : user?.displayName && (
                <p className="text-sm text-slate-600 mb-1">
                  Hello, <span className="font-semibold text-slate-800">{user.displayName}</span>
                </p>
              )}
              
              {/* Transaction ID with Copy */}
              {paymentResult.transactionId && (
                <div className="mt-3 mb-2">
                  <p className="text-xs text-slate-500 mb-1">Transaction ID</p>
                  <div className="flex items-center justify-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-xs font-mono text-slate-700 break-all">
                      {paymentResult.transactionId}
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(paymentResult.transactionId || '');
                          alert('Transaction ID copied!');
                        } catch (err) {
                          console.error('Failed to copy:', err);
                        }
                      }}
                      className="flex-shrink-0 p-1.5 hover:bg-slate-200 rounded transition-colors"
                      title="Copy Transaction ID"
                    >
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Details Section */}
            <div className="px-6 pb-6">
              <div className="space-y-3 border-t border-slate-200 pt-4">
                {/* Selected Product */}
                {paymentResult.productName && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Selected Product</span>
                    <span className="text-sm font-semibold text-slate-800">{paymentResult.productName}</span>
                  </div>
                )}
                
                {/* Game */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Game</span>
                  <span className="text-sm font-semibold text-slate-800">Free Fire</span>
                </div>
                
                {/* Player ID / Free Fire ID */}
                {paymentResult.playerId && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Player ID</span>
                    <span className="text-sm font-semibold text-slate-800">{paymentResult.playerId}</span>
                  </div>
                )}
                
                {/* Payment Method */}
                {paymentResult.paymentMethod && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Payment Method</span>
                    <span className="text-sm font-semibold text-slate-800">{paymentResult.paymentMethod}</span>
                  </div>
                )}
                
                {/* Transaction Time */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Transaction Time</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {new Date().toLocaleString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
              </div>

              {/* Amount Summary */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-700">Paid</span>
                  <span className="text-base font-bold text-slate-900">৳{paymentResult.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">Remaining balance</span>
                  <span className="text-sm font-semibold text-slate-700">৳{paymentResult.remaining.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => {
                  setPaymentResult(null);
                  navigate('/');
                }}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-xl shadow-lg hover:from-purple-600 hover:to-violet-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Back to Home Page
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
            onChange={(e) => {
              const newUid = e.target.value;
              setUid(newUid);
              // Save to localStorage for persistence across redirects
              if (newUid.trim()) {
                localStorage.setItem('checkout_uid', newUid.trim());
              } else {
                localStorage.removeItem('checkout_uid');
              }
            }}
            placeholder="এখানে আপনার গেমের আইডি কোড লিখুন"
            className="w-full px-4 py-3 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-700"
          />
          <div className="mt-2 text-xs text-slate-600">
            {ffNameLoading && (
              <div className="inline-flex items-center gap-2 px-2 py-1 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{ffNameError?.includes('Searching') ? ffNameError : 'UID থেকে নাম খুঁজছি...'}</span>
              </div>
            )}
            {!ffNameLoading && ffName && (
              <div className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                <span className="mr-1.5 text-xs">✅</span>
                <span className="mr-1 text-slate-600 font-normal">Account Name:</span>
                <span className="text-emerald-800">{ffName}</span>
              </div>
            )}
            {!ffNameLoading && !ffName && ffNameError && !ffNameError.includes('Searching') && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 text-[11px] font-medium rounded-full bg-red-50 text-red-600 border border-red-200">
                  {ffNameError}
                </span>
                <button
                  onClick={async () => {
                    // Manual retry
                    setFfNameError(null);
                    setFfNameLoading(true);
                    try {
                      const url = `https://info-ob49.vercel.app/api/account/?uid=${encodeURIComponent(
                        uid.trim()
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
                      setFfNameError(null);
                    } catch (err: any) {
                      setFfNameError(err?.message || 'Failed to fetch name');
                    } finally {
                      setFfNameLoading(false);
                    }
                  }}
                  className="text-[10px] px-2 py-1 text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Retry
                </button>
              </div>
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

        {/* Payment Method Cards */}
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

          {/* Uddokta Pay / Instant Payment */}
          <button
            onClick={() => setPayment('uddokta')}
            className={`relative bg-white border-2 rounded-xl p-4 transition-all ${
              payment === 'uddokta' 
                ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                : 'border-slate-200 hover:border-purple-300'
            }`}
          >
            {payment === 'uddokta' && (
              <div className="absolute flex items-center justify-center w-6 h-6 bg-red-500 rounded-full -top-2 -left-2">
                <FaCheck className="text-xs text-white" />
              </div>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <span className="text-xl font-bold text-white">UP</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-purple-600">Uddokta Pay</p>
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
              handleUddoktaPayPayment();
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
