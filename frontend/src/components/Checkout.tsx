import { useEffect, useState, useRef } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { paymentApi, digitalCodeApi, subscriptionApi } from "../services/api";
import type { Product, BackendDigitalCodeProduct, BackendSubscriptionProduct } from "../types";
import useRoboBalance from "../hooks/useRoboBalance";
import useAuth from "../hooks/useAuth";
import { FaCheck, FaSyncAlt } from "react-icons/fa";

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
  const [searchParams] = useSearchParams();
  const locationState = location.state as { productId?: string; isDigitalCode?: boolean; subscriptionProductId?: string } | undefined;
  const productId =
    locationState?.productId ??
    new URLSearchParams(location.search).get("productId") ??
    "";
  const subscriptionProductId = locationState?.subscriptionProductId ?? searchParams.get("subscriptionProductId") ?? null;
  // Check both location.state and URL params for isDigitalCode (URL params persist through external redirects)
  const isDigitalCodeFromUrl = searchParams.get("isDigitalCode") === "true";
  const isDigitalCode = locationState?.isDigitalCode ?? isDigitalCodeFromUrl ?? false;
  const isSubscription = !!subscriptionProductId;
  
  // Debug logging
  useEffect(() => {
    if (isSubscription) {
      console.log('🔍 Checkout - isSubscription:', isSubscription);
      console.log('🔍 Checkout - subscriptionProductId:', subscriptionProductId);
      console.log('🔍 Checkout - locationState:', locationState);
    }
  }, [isSubscription, subscriptionProductId, locationState]);
  const product = products.find((p) => p.id === productId) ?? products[0];

  // uid name setup

  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uid, setUid] = useState("");

  useEffect(() => {
  if (!uid) {
    setPlayerName('');
    return;
  }

  const trimmedUid = uid.trim();

  const fetchName = async () => {
    try {
      setLoading(true);
      setError('');

      const url = `https://info-ob49.vercel.app/api/account/?uid=${encodeURIComponent(
        trimmedUid
      )}&region=BD`;

      const res = await fetch(url);
      const data = await res.json();

      // 🔥 এখানেই nickname
      if (data?.basicInfo?.nickname) {
        setPlayerName(data.basicInfo.nickname);
      } else {
        setError("Player not found");
      }
    } catch (err) {
      setError("Failed to fetch player");
    } finally {
      setLoading(false);
    }
  };

  fetchName();
}, [uid]);

  
  // Digital code product state
  const [digitalCodeProduct, setDigitalCodeProduct] = useState<BackendDigitalCodeProduct | null>(null);
  const [digitalCodeInputFields, setDigitalCodeInputFields] = useState<Record<string, string>>({});
  const [loadingDigitalCodeProduct, setLoadingDigitalCodeProduct] = useState(false);
  
  // Subscription product state
  const [subscriptionProduct, setSubscriptionProduct] = useState<BackendSubscriptionProduct | null>(null);
  const [subscriptionInputFields, setSubscriptionInputFields] = useState<Record<string, string>>({});
  const [loadingSubscriptionProduct, setLoadingSubscriptionProduct] = useState(false);

  // ✅ FIX: Use refs for tracking payment state (prevents re-render issues)
  const isPaymentInProgressRef = useRef(false);
  const paymentAttemptsRef = useRef<Set<string>>(new Set());
  const verificationInProgressRef = useRef(false);

  // Initialize UID (no localStorage persistence)

  // Player name state (kept for payment result display, but loading removed - always null)
  const ffName: string | null = null;
  const [payment, setPayment] = useState<"robo" | "bkash" | "uddokta">("robo");
  const [processing, setProcessing] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdDuration = 2500; // 2.5 seconds
  const holdIntervalRef = useRef<number | null>(null);
  const holdStartTimeRef = useRef<number | null>(null);
  const [showRoboPaymentModal, setShowRoboPaymentModal] = useState(false);
  const [modalHolding, setModalHolding] = useState(false);
  const [modalHoldProgress, setModalHoldProgress] = useState(0);
  const modalHoldIntervalRef = useRef<number | null>(null);
  const modalHoldStartTimeRef = useRef<number | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState<{
    invoiceId: string;
    status: "verifying" | "verified" | "failed";
    message?: string;
  } | null>(null);
  const [paymentResult, setPaymentResult] = useState<{
    status: "success" | "warning";
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
    if (!products.length && !isDigitalCode && !isSubscription) navigate("/");
  }, [products, navigate, isDigitalCode, isSubscription]);

  // Load digital code product if needed
  useEffect(() => {
    const loadDigitalCodeProduct = async () => {
      if (!isDigitalCode || !productId) return;
      
      try {
        setLoadingDigitalCodeProduct(true);
        const response = await digitalCodeApi.getProductById(productId);
        if (response.success && response.data) {
          setDigitalCodeProduct(response.data);
          // Initialize input fields
          const initialFields: Record<string, string> = {};
          if (response.data.inputFields) {
            response.data.inputFields.forEach(field => {
              initialFields[field.name] = '';
            });
          }
          setDigitalCodeInputFields(initialFields);
        } else {
          alert('Digital code product not found');
          navigate('/');
        }
      } catch (err: any) {
        console.error('Failed to load digital code product:', err);
        alert('Failed to load product details');
        navigate('/');
      } finally {
        setLoadingDigitalCodeProduct(false);
      }
    };
    
    loadDigitalCodeProduct();
  }, [isDigitalCode, productId, navigate]);

  // Load subscription product if needed
  useEffect(() => {
    const loadSubscriptionProduct = async () => {
      if (!isSubscription || !subscriptionProductId) return;
      
      try {
        setLoadingSubscriptionProduct(true);
        const response = await subscriptionApi.getProductById(subscriptionProductId);
        console.log('📦 Subscription product API response:', response);
        if (response.success && response.data) {
          console.log('✅ Subscription product loaded:', response.data);
          console.log('📝 Input fields:', response.data.inputFields);
          setSubscriptionProduct(response.data);
          // Initialize input fields
          const initialFields: Record<string, string> = {};
          if (response.data.inputFields && Array.isArray(response.data.inputFields)) {
            response.data.inputFields.forEach(field => {
              initialFields[field.name] = '';
            });
            console.log('🔧 Initialized input fields:', initialFields);
          } else {
            console.warn('⚠️ No inputFields found in product data');
          }
          setSubscriptionInputFields(initialFields);
        } else {
          console.error('❌ Subscription product not found:', response);
          alert('Subscription product not found');
          navigate('/');
        }
      } catch (err: any) {
        console.error('❌ Failed to load subscription product:', err);
        alert('Failed to load product details');
        navigate('/');
      } finally {
        setLoadingSubscriptionProduct(false);
      }
    };
    
    loadSubscriptionProduct();
  }, [isSubscription, subscriptionProductId, navigate]);

  // ✅ FIX: Handle URL params with strict duplicate prevention
  useEffect(() => {
    const status = searchParams.get("status");
    const invoiceId = searchParams.get("invoice_id");
    const transactionId = searchParams.get("transactionId");

    // console.log("🔍 URL params detected:", { status, invoiceId, transactionId });

    // Skip if no relevant params
    if (!status || !(invoiceId || transactionId)) {
      return;
    }

    // Prevent duplicate processing
    if (invoiceId && paymentAttemptsRef.current.has(invoiceId)) {
      // console.log(`ℹ️ Invoice ${invoiceId} already processed, clearing URL...`);
      // Clear URL params immediately
      navigate("/checkout", { replace: true });
      return;
    }

    // Mark this as being processed
    if (invoiceId) {
      paymentAttemptsRef.current.add(invoiceId);
    }

    // Handle Uddokta Pay return
    if ((status === "success" || status === "completed") && invoiceId) {
      // Check if already verifying
      if (verificationInProgressRef.current) {
        // console.log("⚠️ Verification already in progress, skipping...");
        return;
      }

      verificationInProgressRef.current = true;

      setVerifyingPayment({
        invoiceId: invoiceId,
        status: "verifying",
        message: "Verifying payment..."
      });

      const verifyPayment = async () => {
        try {
          // console.log(`🔍 Verifying payment for invoice: ${invoiceId}`);
          const response = await paymentApi.uddoktaVerify(invoiceId);
          
          // console.log(`✅ Verification response:`, response);
          
          if (response.success) {
            // ✅ Check if userId exists in response - required for payment processing
            const responseUserId = response.data?.payment?.userId;
            if (!responseUserId) {
              setVerifyingPayment({
                invoiceId: invoiceId,
                status: "failed",
                message: "Payment verification failed: User ID not found. Please contact support."
              });
              return;
            }

            // Payment verified
            setVerifyingPayment({
              invoiceId: invoiceId,
              status: "verified",
              message: "Payment verified successfully! ✅"
            });

            // Show success message
            const transactionIdForResult = response.data?.payment?.transactionId || transactionId || invoiceId;
            
            // If digital code product, assign code after payment
            if (isDigitalCode && digitalCodeProduct && user && user.email) {
              try {
                await digitalCodeApi.purchase({
                  productId: digitalCodeProduct.id,
                  userId: user.uid,
                  userEmail: user.email,
                  userName: user.displayName || user.email.split('@')[0] || 'User',
                  transactionId: transactionIdForResult,
                  inputFieldValues: digitalCodeInputFields,
                });
              } catch (err: any) {
                console.error('Failed to assign digital code:', err);
                // Still show success message, but log error
              }
            }
            
            // If subscription product, create purchase record
            if (isSubscription && subscriptionProduct && user && user.email) {
              try {
                await subscriptionApi.purchase({
                  productId: subscriptionProduct.id,
                  userId: user.uid,
                  userEmail: user.email,
                  userName: user.displayName || user.email.split('@')[0] || 'User',
                  transactionId: transactionIdForResult,
                  inputFieldValues: subscriptionInputFields,
                });
              } catch (err: any) {
                console.error('Failed to create subscription purchase:', err);
                // Still show success message, but log error
              }
            }
            
            setPaymentResult({
              status: "success",
              message: "Payment verified! Your order is being processed.",
              amount: displayProduct.price,
              remaining: balance,
              transactionId: transactionIdForResult,
              productName: displayProduct.name,
              paymentMethod: "uddokta",
              ffName: ffName,
              playerId: uid
            });

            // Refresh balance
            if (user) {
              await refresh();
            }

            // Redirect based on product type
            // Use isDigitalCode from URL params (persists through external redirect) or state
            const shouldRedirectToDigitalCodes = isDigitalCode || isDigitalCodeFromUrl;
            setTimeout(() => {
              if (shouldRedirectToDigitalCodes) {
                // Redirect digital code purchases to order history
                navigate("/orders?tab=digitalCodes", { replace: true });
              } else {
                // Regular products stay on checkout
                navigate("/checkout", { replace: true });
              }
            }, 2000);
          } else {
            setVerifyingPayment({
              invoiceId: invoiceId,
              status: "failed",
              message: response.message || "Verification failed"
            });
          }
        } catch (error: any) {
          // console.error(`❌ Verification error:`, error);
          setVerifyingPayment({
            invoiceId: invoiceId,
            status: "failed",
            message: error.message || "Failed to verify payment"
          });
        } finally {
          // Allow new verifications after 5 seconds
          setTimeout(() => {
            verificationInProgressRef.current = false;
            setVerifyingPayment(null);
          }, 5000);
        }
      };

      verifyPayment();
    } else if (status === "cancelled") {
      alert("Payment was cancelled. Please try again if you want to complete the purchase.");
      navigate("/checkout", { replace: true });
    }

    // Cleanup function
    return () => {
      // No cleanup needed
    };
  }, [searchParams, navigate]); // Only depend on searchParams and navigate

  // Restore UID from URL params
  useEffect(() => {
    // Only load UID from URL parameter (no localStorage)
    const urlUid = searchParams.get("uid");
    if (urlUid && urlUid !== uid) {
      setUid(urlUid);
    }
  }, [searchParams]);

  // Use subscription product if available, then digital code product, otherwise use regular product
  // Calculate this early so it can be used in useEffect hooks
  const displayProduct = isSubscription && subscriptionProduct ? {
    id: subscriptionProduct.id,
    name: subscriptionProduct.name,
    price: subscriptionProduct.price,
    diamonds: '',
    categoryId: '',
  } : (isDigitalCode && digitalCodeProduct ? {
    id: digitalCodeProduct.id,
    name: digitalCodeProduct.name,
    price: digitalCodeProduct.price,
    diamonds: '',
    categoryId: digitalCodeProduct.categoryId || '',
  } : (product || null));

  // Track if user has manually selected a payment method
  const [paymentManuallySelected, setPaymentManuallySelected] = useState(false);

  useEffect(() => {
    if (paymentManuallySelected || !displayProduct) {
      return;
    }

    const hasEnough =
      typeof hasEnoughBalance === "function" && displayProduct
        ? hasEnoughBalance(displayProduct.price)
        : false;

    if (user && displayProduct && !isNaN(balance) && balance > 0 && hasEnough) {
      setPayment("robo");
    } else {
      setPayment("uddokta");
    }
  }, [user, displayProduct, balance, hasEnoughBalance, paymentManuallySelected]);

  // Ensure Robo Pay can't stay selected if balance becomes insufficient
  useEffect(() => {
    if (!displayProduct) return;

    const hasEnough =
      typeof hasEnoughBalance === "function"
        ? hasEnoughBalance(displayProduct.price)
        : balance >= displayProduct.price;

    if (!hasEnough && payment === "robo") {
      setPayment("uddokta");
    }
  }, [displayProduct, balance, hasEnoughBalance, payment]);

  // Player name loading removed - users can pay without waiting for name to load

  if (!product && !digitalCodeProduct && !subscriptionProduct) {
    return <Navigate to="/" replace />;
  }

  if (!displayProduct) {
    return <Navigate to="/" replace />;
  }

  // Early return check - displayProduct is already declared above

  const handleRefreshBalance = async () => {
    setRefreshingBalance(true);
    await refresh();
    setRefreshingBalance(false);
  };

  // Validate digital code input fields
  const validateDigitalCodeInputs = (): { isValid: boolean; errorMessage?: string } => {
    if (!isDigitalCode || !digitalCodeProduct || !digitalCodeProduct.inputFields) {
      return { isValid: true }; // No validation needed if no input fields
    }
    
    const requiredFields = digitalCodeProduct.inputFields.filter(f => f.required);
    for (const field of requiredFields) {
      const value = digitalCodeInputFields[field.name];
      if (!value || value.trim() === '') {
        return { 
          isValid: false, 
          errorMessage: `Please fill in the required field: ${field.name}` 
        };
      }
    }
    
    return { isValid: true };
  };

  // Validate subscription input fields
  const validateSubscriptionInputs = (): { isValid: boolean; errorMessage?: string } => {
    if (!isSubscription || !subscriptionProduct || !subscriptionProduct.inputFields) {
      return { isValid: true }; // No validation needed if no input fields
    }
    
    const requiredFields = subscriptionProduct.inputFields.filter(f => f.required);
    for (const field of requiredFields) {
      const value = subscriptionInputFields[field.name];
      if (!value || value.trim() === '') {
        return { 
          isValid: false, 
          errorMessage: `Please fill in the required field: ${field.name}` 
        };
      }
    }
    
    return { isValid: true };
  };

  // ✅ FIX: Handle Uddokta Pay checkout with strict prevention
  // Handle tap and hold for payment
  const handleMouseDown = () => {
    // For digital codes and subscriptions, validate input fields
    if (isDigitalCode) {
      const validation = validateDigitalCodeInputs();
      if (processing || !validation.isValid) return;
    } else if (isSubscription) {
      const validation = validateSubscriptionInputs();
      if (processing || !validation.isValid) return;
    } else {
      // For regular products, only check if processing
      if (processing) return;
    }
    
    // For Robo Pay, show modal instead of direct payment
    if (payment === "robo") {
      setShowRoboPaymentModal(true);
      return;
    }
    
    setIsHolding(true);
    setHoldProgress(0);
    holdStartTimeRef.current = Date.now();
    
    const interval = window.setInterval(() => {
      if (holdStartTimeRef.current) {
        const elapsed = Date.now() - holdStartTimeRef.current;
        const progress = Math.min((elapsed / holdDuration) * 100, 100);
        setHoldProgress(progress);
        
        if (progress >= 100) {
          window.clearInterval(interval);
          holdIntervalRef.current = null;
          setIsHolding(false);
          setHoldProgress(0);
          
          // Trigger payment
          if (payment === "bkash") {
            handleBkashPayment();
          }
        }
      }
    }, 16); // ~60fps
    
    holdIntervalRef.current = interval;
  };

  // Handle modal tap and hold
  const handleModalMouseDown = () => {
    if (processing) return;
    
    setModalHolding(true);
    setModalHoldProgress(0);
    modalHoldStartTimeRef.current = Date.now();
    
    const interval = window.setInterval(() => {
      if (modalHoldStartTimeRef.current) {
        const elapsed = Date.now() - modalHoldStartTimeRef.current;
        const progress = Math.min((elapsed / holdDuration) * 100, 100);
        setModalHoldProgress(progress);
        
        if (progress >= 100) {
          window.clearInterval(interval);
          modalHoldIntervalRef.current = null;
          setModalHolding(false);
          setModalHoldProgress(0);
          setShowRoboPaymentModal(false);
          
          // Trigger Robo payment
          handleRoboBalancePayment();
        }
      }
    }, 16); // ~60fps
    
    modalHoldIntervalRef.current = interval;
  };

  const handleModalMouseUp = () => {
    if (modalHoldIntervalRef.current !== null) {
      window.clearInterval(modalHoldIntervalRef.current);
      modalHoldIntervalRef.current = null;
    }
    setModalHolding(false);
    setModalHoldProgress(0);
    modalHoldStartTimeRef.current = null;
  };

  const handleModalMouseLeave = () => {
    handleModalMouseUp();
  };

  const handleMouseUp = () => {
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
    holdStartTimeRef.current = null;
  };

  // Handle bKash payment
  const handleBkashPayment = async () => {
    if (isPaymentInProgressRef.current) return;
    
    // For digital codes and subscriptions, validate input fields instead of UID
    if (isDigitalCode) {
      const validation = validateDigitalCodeInputs();
      if (!validation.isValid) {
        alert(validation.errorMessage || "Please fill in all required fields");
        return;
      }
    } else if (isSubscription) {
      const validation = validateSubscriptionInputs();
      if (!validation.isValid) {
        alert(validation.errorMessage || "Please fill in all required fields");
        return;
      }
    } else {
      // For regular products, validate UID only
      if (!uid.trim()) {
        alert("Please enter your Free Fire UID");
        return;
      }
    }

    isPaymentInProgressRef.current = true;
    setProcessing(true);

    const transactionId = `BKASH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    paymentAttemptsRef.current.add(transactionId);

    try {
      const paymentPayload = {
        transactionId: transactionId,
        amount: displayProduct.price,
        playerId: isDigitalCode ? "" : uid.trim(), // Empty for digital codes
        productId: displayProduct.id,
        productName: displayProduct.name || "Product",
        diamonds: displayProduct.diamonds || '',
        price: displayProduct.price,
        paymentMethod: "bkash" as const,
        userEmail: user?.email || "",
        userName: user?.displayName || user?.email?.split("@")[0] || "User",
        userId: user?.uid || "",
        timestamp: new Date().toISOString(),
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let response;
      try {
        response = await paymentApi.verify(paymentPayload, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
          throw new Error("Payment request timeout. Please try again.");
        }
        throw err;
      }

      if (response.success) {
        // If digital code product, assign code after payment
        if (isDigitalCode && digitalCodeProduct && user && user.email) {
          try {
            await digitalCodeApi.purchase({
              productId: digitalCodeProduct.id,
              userId: user.uid,
              userEmail: user.email,
              userName: user.displayName || user.email.split('@')[0] || 'User',
              transactionId: transactionId,
              inputFieldValues: digitalCodeInputFields,
            });
          } catch (err: any) {
            console.error('Failed to assign digital code:', err);
            // Still show success message, but log error
          }
        }
        
        // If subscription product, create purchase record
        if (isSubscription && subscriptionProduct && user && user.email) {
          try {
            await subscriptionApi.purchase({
              productId: subscriptionProduct.id,
              userId: user.uid,
              userEmail: user.email,
              userName: user.displayName || user.email.split('@')[0] || 'User',
              transactionId: transactionId,
              inputFieldValues: subscriptionInputFields,
            });
          } catch (err: any) {
            console.error('Failed to create subscription purchase:', err);
            // Still show success message, but log error
          }
        }
        
        setPaymentResult({
          status: "success",
          message: "Payment successful! Your order is being processed.",
          amount: displayProduct.price,
          remaining: balance,
          transactionId: transactionId,
          productName: displayProduct.name,
          paymentMethod: "bKash",
          ffName: isDigitalCode ? null : ffName,
          playerId: isDigitalCode ? "" : uid.trim(),
        });
      } else {
        throw new Error(response.message || "Payment failed");
      }
    } catch (err: any) {
      alert("Payment Error: " + (err.message || "Unknown error"));
    } finally {
      isPaymentInProgressRef.current = false;
      setProcessing(false);
    }
  };

  const handleUddoktaPayPayment = async () => {
    // console.log("🔄 Uddokta Pay payment initiated");
    
    if (isPaymentInProgressRef.current) {
      // console.log("⚠️ Payment already in progress");
      return;
    }
    
    // For digital codes and subscriptions, validate input fields instead of UID
    if (isDigitalCode) {
      const validation = validateDigitalCodeInputs();
      if (!validation.isValid) {
        alert(validation.errorMessage || "Please fill in all required fields");
        return;
      }
    } else if (isSubscription) {
      const validation = validateSubscriptionInputs();
      if (!validation.isValid) {
        alert(validation.errorMessage || "Please fill in all required fields");
        return;
      }
    } else {
      // For regular products, validate UID
      if (!uid.trim()) {
        alert("Please enter your Free Fire UID");
        return;
      }
    }

    if (!user?.email) {
      alert("Please login to use Uddokta Pay");
      return;
    }

    isPaymentInProgressRef.current = true;
    setProcessing(true);

    try {
      const checkoutData = {
        amount: displayProduct.price,
        playerId: (isDigitalCode || isSubscription) ? "" : uid.trim(), // Empty for digital codes and subscriptions
        productId: displayProduct.id,
        productName: displayProduct.name || "Product",
        diamonds: displayProduct.diamonds || '',
        price: displayProduct.price,
        userEmail: user.email,
        userName: user.displayName || user.email.split("@")[0] || "User",
        userId: user.uid || "",
        fullName: user.displayName || user.email.split("@")[0] || "Customer",
        email: user.email,
        redirectUrl: `${window.location.origin}/checkout?status=completed&payment=uddokta&isDigitalCode=${isDigitalCode}&subscriptionProductId=${isSubscription ? subscriptionProductId : ''}&productId=${displayProduct.id}`,
        cancelUrl: `${window.location.origin}/checkout?status=cancelled&payment=uddokta`,
        inputFieldValues: isSubscription ? subscriptionInputFields : (isDigitalCode ? digitalCodeInputFields : undefined)
      };

      // console.log("🔄 Creating Uddokta Pay checkout...");
      const response = await paymentApi.uddoktaCheckout(checkoutData);
      // console.log("📥 Uddokta Pay response:", response);

      if (response.success && response.data?.paymentUrl) {
        // console.log("✅ Redirecting to payment page...");
        
        // Store invoice ID to prevent duplicate processing
        if (response.data.invoiceId) {
          paymentAttemptsRef.current.add(response.data.invoiceId);
        }
        
        // Clear UID input and localStorage before redirect (only for regular products)
        if (!isDigitalCode && !isSubscription) {
          setUid('');
          localStorage.removeItem("checkout_uid");
        }
        
        // Redirect immediately
        window.location.href = response.data.paymentUrl;
        return; // Stop execution
      } else {
        const errorMsg = response.message || "Failed to create payment session.";
        alert(errorMsg);
      }
    } catch (error: any) {
      // console.error("❌ Uddokta Pay checkout error:", error);
      alert(error.message || "Failed to process payment.");
    } finally {
      isPaymentInProgressRef.current = false;
      setProcessing(false);
    }
  };

  // ✅ FIX: Handle Robo Balance Payment with atomic approach
  const handleRoboBalancePayment = async () => {
    if (isPaymentInProgressRef.current) {
      // console.log("⚠️ Payment already in progress");
      return;
    }
    
    // For digital codes and subscriptions, validate input fields instead of UID
    if (isDigitalCode) {
      const validation = validateDigitalCodeInputs();
      if (!validation.isValid) {
        alert(validation.errorMessage || "Please fill in all required fields");
        return;
      }
    } else if (isSubscription) {
      const validation = validateSubscriptionInputs();
      if (!validation.isValid) {
        alert(validation.errorMessage || "Please fill in all required fields");
        return;
      }
    } else {
      // For regular products, validate UID
      if (!uid.trim()) {
        alert("Please enter your Free Fire UID");
        return;
      }
    }

    isPaymentInProgressRef.current = true;
    setProcessing(true);

    // Generate unique transaction ID
    const transactionId = `ROBO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if already processed
    if (paymentAttemptsRef.current.has(transactionId)) {
      // console.log(`⚠️ Transaction ${transactionId} already processed`);
      setProcessing(false);
      isPaymentInProgressRef.current = false;
      return;
    }

    paymentAttemptsRef.current.add(transactionId);

    try {
      // Refresh balance first
      await refresh();
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const currentBalance = typeof getCurrentBalance === "function" 
        ? getCurrentBalance() 
        : balance;

      // Check balance
      if (currentBalance < displayProduct.price) {
        const shouldAddMoney = confirm(
          `Insufficient balance. You have ৳${currentBalance.toFixed(2)} but need ৳${displayProduct.price.toFixed(2)}.\n\nDo you want to add money?`
        );
        if (shouldAddMoney) {
          navigate("/add-money");
        }
        return;
      }

      // Prepare payment payload
      const paymentPayload = {
        transactionId: transactionId,
        amount: displayProduct.price,
        playerId: (isDigitalCode || isSubscription) ? "" : uid.trim(), // Empty for digital codes and subscriptions
        productId: displayProduct.id,
        productName: displayProduct.name || "Product",
        diamonds: displayProduct.diamonds || '',
        price: displayProduct.price,
        paymentMethod: "robo" as const,
        updatedBalance: currentBalance - displayProduct.price,
        userEmail: user?.email || "",
        userName: user?.displayName || user?.email?.split("@")[0] || "User",
        userId: user?.uid || "",
        timestamp: new Date().toISOString(),
        inputFieldValues: isSubscription ? subscriptionInputFields : (isDigitalCode ? digitalCodeInputFields : undefined)
      };

      // console.log(`🔍 Sending Robo Balance payment:`, paymentPayload.transactionId);

      // Send payment request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let response;
      try {
        response = await paymentApi.verify(paymentPayload, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        // Handle insufficient balance
        if (!response.success && response.message?.toLowerCase().includes("insufficient")) {
          await refresh();
          alert("Insufficient balance. Please refresh and try again.");
          return;
        }
      } catch (apiError: any) {
        clearTimeout(timeoutId);
        response = {
          success: false,
          message: apiError.name === "AbortError"
            ? "Request timeout. Please try again."
            : apiError.message || "Payment failed.",
        };
      }

      // Refresh balance after payment
      await refresh();
      await new Promise((resolve) => setTimeout(resolve, 200));
      const actualBalance = typeof getCurrentBalance === "function" 
        ? getCurrentBalance() 
        : balance;

      if (response && response.success) {
        // If digital code product, assign code after payment
        if (isDigitalCode && digitalCodeProduct && user && user.email) {
          try {
            await digitalCodeApi.purchase({
              productId: digitalCodeProduct.id,
              userId: user.uid,
              userEmail: user.email,
              userName: user.displayName || user.email.split('@')[0] || 'User',
              transactionId: paymentPayload.transactionId,
              inputFieldValues: digitalCodeInputFields,
            });
          } catch (err: any) {
            console.error('Failed to assign digital code:', err);
            // Still show success message, but log error
          }
        }
        
        // If subscription product, create purchase record
        if (isSubscription && subscriptionProduct && user && user.email) {
          try {
            await subscriptionApi.purchase({
              productId: subscriptionProduct.id,
              userId: user.uid,
              userEmail: user.email,
              userName: user.displayName || user.email.split('@')[0] || 'User',
              transactionId: paymentPayload.transactionId,
              inputFieldValues: subscriptionInputFields,
            });
          } catch (err: any) {
            console.error('Failed to create subscription purchase:', err);
            // Still show success message, but log error
          }
        }
        
        // Clear UID input and localStorage on successful payment
        setUid('');
        localStorage.removeItem("checkout_uid");
        
        setPaymentResult({
          status: "success",
          message: isDigitalCode ? "Payment successful! Your digital code will be available in order history." : "Payment successful! Your diamonds will arrive shortly.",
          amount: displayProduct.price,
          remaining: actualBalance,
          transactionId: paymentPayload.transactionId,
          productName: displayProduct.name,
          paymentMethod: "Robo Balance",
          ffName: isDigitalCode ? null : ffName,
          playerId: isDigitalCode ? "" : uid.trim(),
        });
      } else {
        const errorMessage = response?.message || "Payment failed.";
        setPaymentResult({
          status: "warning",
          message: errorMessage,
          amount: displayProduct.price,
          remaining: actualBalance,
          transactionId: paymentPayload.transactionId,
          productName: displayProduct.name,
          paymentMethod: "Robo Balance",
        });
      }

    } catch (err: any) {
      await refresh();
      alert("Payment Error: " + (err.message || "Unknown error"));
    } finally {
      isPaymentInProgressRef.current = false;
      setProcessing(false);
    }
  };

  const requiredAmount = displayProduct.price;

  return (
    <div className="relative max-w-2xl px-4 py-6 mx-auto">
      {/* Payment Verification Modal */}
      {verifyingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 overflow-hidden bg-white shadow-2xl rounded-2xl">
            <div className="px-6 pt-8 pb-6 text-center">
              {verifyingPayment.status === "verifying" && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                      <FaSyncAlt className="text-3xl text-blue-600 animate-spin" />
                    </div>
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-slate-900">
                    Verifying Payment
                  </h2>
                  <p className="mb-4 text-sm text-slate-600">
                    {verifyingPayment.message}
                  </p>
                </>
              )}

              {verifyingPayment.status === "verified" && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
                      <FaCheck className="text-3xl text-emerald-600" />
                    </div>
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-slate-900">
                    Payment Verified!
                  </h2>
                  <p className="mb-4 text-sm text-slate-600">
                    {verifyingPayment.message}
                  </p>
                </>
              )}

              {verifyingPayment.status === "failed" && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                      <svg
                        className="w-8 h-8 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-slate-900">
                    Verification Failed
                  </h2>
                  <p className="mb-4 text-sm text-red-600">
                    {verifyingPayment.message}
                  </p>
                </>
              )}

              <div className="mt-4 mb-4">
                <p className="mb-2 text-xs text-slate-500">Invoice ID</p>
                <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
                  <span className="font-mono text-xs break-all text-slate-700">
                    {verifyingPayment.invoiceId}
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          verifyingPayment.invoiceId,
                        );
                        alert("Invoice ID copied!");
                      } catch (err) {
                        // console.error("Failed to copy:", err);
                      }
                    }}
                    className="flex-shrink-0 p-1.5 hover:bg-slate-200 rounded transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-slate-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Completed Modal */}
      {paymentResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 overflow-hidden bg-white shadow-2xl rounded-2xl">
            <div className="px-6 pt-8 pb-4 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
                  <FaCheck className="text-3xl text-emerald-600" />
                </div>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-slate-900">
                Payment Completed!
              </h2>

              {paymentResult.ffName && (
                <p className="mb-1 text-sm text-slate-600">
                  Player:{" "}
                  <span className="inline-block px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold text-sm shadow-sm">
                    {paymentResult.ffName}
                  </span>
                </p>
              )}

              {paymentResult.transactionId && (
                <div className="mt-3 mb-2">
                  <p className="mb-1 text-xs text-slate-500">Transaction ID</p>
                  <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
                    <span className="font-mono text-xs break-all text-slate-700">
                      {paymentResult.transactionId}
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            paymentResult.transactionId || "",
                          );
                          alert("Transaction ID copied!");
                        } catch (err) {
                          // console.error("Failed to copy:", err);
                        }
                      }}
                      className="flex-shrink-0 p-1.5 hover:bg-slate-200 rounded transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-slate-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6">
              <div className="pt-4 space-y-3 border-t border-slate-200">
                {paymentResult.productName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Product</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {paymentResult.productName}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Game</span>
                  <span className="text-sm font-semibold text-slate-800">
                    Free Fire
                  </span>
                </div>

                {paymentResult.paymentMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Payment Method
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {paymentResult.paymentMethod}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Paid
                  </span>
                  <span className="text-base font-bold text-slate-900">
                    ৳{paymentResult.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">
                    Remaining balance
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    ৳{paymentResult.remaining.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPaymentResult(null);
                  if (isDigitalCode && digitalCodeProduct) {
                    navigate("/orders?tab=digitalCodes");
                  } else {
                    navigate("/");
                  }
                }}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-xl shadow-lg hover:from-purple-600 hover:to-violet-700 transition-all transform hover:scale-[1.02]"
              >
                {isDigitalCode && digitalCodeProduct
                  ? "View Order History"
                  : "Back to Home Page"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mb-6">
        {/* Section 2: Account Info / Product Details */}
        {!isSubscription && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-gradient-to-br from-purple-500 to-violet-600">
                2
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                {isDigitalCode ? "Product Details" : "Account Info"}
              </h2>
            </div>

            <div className="p-4 bg-white border rounded-xl border-slate-200">
              {!isDigitalCode && (
                <>
                  <input
                    type="text"
                    value={uid}
                    onChange={(e) => {
                      setUid(e.target.value);
                    }}
                    placeholder="Enter your Free Fire UID"
                    className="w-full px-4 py-3 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-700"
                  />
                  {loading && (
                    <p className="mt-2 text-sm text-slate-500">
                      Checking player...
                    </p>
                  )}

                  {playerName && (
                    <p className="mt-2 font-semibold text-purple-600">
                      Player Name: {playerName}
                    </p>
                  )}

                  {error && (
                    console.log(error)
                  )}
                </>
              )}

              {/* Digital Code Input Fields */}
              {isDigitalCode &&
                digitalCodeProduct &&
                digitalCodeProduct.inputFields &&
                digitalCodeProduct.inputFields.length > 0 && (
                  <div className="space-y-3">
                    {digitalCodeProduct.inputFields.map((field) => (
                      <div key={field.name}>
                        <label className="block mb-1 text-sm font-medium text-slate-700">
                          {field.name}
                          {field.required && (
                            <span className="ml-1 text-red-500">*</span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={digitalCodeInputFields[field.name] || ""}
                          onChange={(e) => {
                            setDigitalCodeInputFields((prev) => ({
                              ...prev,
                              [field.name]: e.target.value,
                            }));
                          }}
                          placeholder={
                            field.placeholder || `Enter ${field.name}`
                          }
                          required={field.required}
                          className="w-full px-4 py-3 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-700"
                        />
                      </div>
                    ))}
                  </div>
                )}

              {isDigitalCode && loadingDigitalCodeProduct && (
                <div className="py-4 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                  <p className="mt-2 text-sm text-slate-600">
                    Loading product details...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 2: User Details (for Subscription Products) */}
        {isSubscription && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-gradient-to-br from-purple-500 to-violet-600">
                2
              </div>
              <h2 className="text-xl font-bold text-slate-800">User Details</h2>
            </div>

            <div className="p-4 bg-white border rounded-xl border-slate-200">
              {loadingSubscriptionProduct ? (
                <div className="py-4 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                  <p className="mt-2 text-sm text-slate-600">
                    Loading product details...
                  </p>
                </div>
              ) : subscriptionProduct &&
                subscriptionProduct.inputFields &&
                Array.isArray(subscriptionProduct.inputFields) &&
                subscriptionProduct.inputFields.length > 0 ? (
                <div className="space-y-3">
                  {subscriptionProduct.inputFields.map((field) => (
                    <div key={field.name}>
                      <label className="block mb-1 text-sm font-medium text-slate-700">
                        {field.name}
                        {field.required && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          value={subscriptionInputFields[field.name] || ""}
                          onChange={(e) => {
                            setSubscriptionInputFields((prev) => ({
                              ...prev,
                              [field.name]: e.target.value,
                            }));
                          }}
                          placeholder={
                            field.placeholder || `Enter ${field.name}`
                          }
                          required={field.required}
                          rows={4}
                          className="w-full px-4 py-3 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-700"
                        />
                      ) : (
                        <input
                          type={
                            field.type === "email"
                              ? "email"
                              : field.type === "number"
                                ? "number"
                                : field.type === "phone"
                                  ? "tel"
                                  : "text"
                          }
                          value={subscriptionInputFields[field.name] || ""}
                          onChange={(e) => {
                            setSubscriptionInputFields((prev) => ({
                              ...prev,
                              [field.name]: e.target.value,
                            }));
                          }}
                          placeholder={
                            field.placeholder || `Enter ${field.name}`
                          }
                          required={field.required}
                          className="w-full px-4 py-3 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-700"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : subscriptionProduct ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-slate-500">
                    No input fields configured for this product.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Section 3: Select Payment Method */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-gradient-to-br from-purple-500 to-violet-600">
              3
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              Select Payment Method
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Robo Pay */}
            <button
              onClick={() => {
                const hasEnough =
                  typeof hasEnoughBalance === "function" && displayProduct
                    ? hasEnoughBalance(displayProduct.price)
                    : balance >= (displayProduct?.price || 0);

                if (!hasEnough) {
                  alert(
                    `Your Robo Balance is insufficient. You need ৳${displayProduct.price.toFixed(2)}.`,
                  );
                  setPaymentManuallySelected(true);
                  setPayment("uddokta");
                  return;
                }
                setPaymentManuallySelected(true);
                setPayment("robo");
              }}
              className={`relative bg-white border-2 rounded-xl p-4 transition-all ${
                payment === "robo"
                  ? "border-purple-500 shadow-lg shadow-purple-500/20"
                  : "border-slate-200 hover:border-purple-300"
              }`}
            >
              {payment === "robo" && (
                <div className="absolute flex items-center justify-center w-6 h-6 bg-red-500 rounded-full -top-2 -left-2">
                  <FaCheck className="text-xs text-white" />
                </div>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white rounded-lg bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-600">
                  R
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-purple-600">
                    Robo Balance
                  </p>
                  <p className="text-xs text-slate-500">Wallet Payment</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Use your wallet balance
              </p>
            </button>

            {/* Uddokta Pay */}
            <button
              onClick={() => {
                setPaymentManuallySelected(true);
                setPayment("uddokta");
              }}
              className={`relative bg-white border-2 rounded-xl p-4 transition-all ${
                payment === "uddokta"
                  ? "border-blue-500 shadow-lg shadow-blue-500/20"
                  : "border-slate-200 hover:border-blue-300"
              }`}
            >
              {payment === "uddokta" && (
                <div className="absolute flex items-center justify-center w-6 h-6 bg-red-500 rounded-full -top-2 -left-2">
                  <FaCheck className="text-xs text-white" />
                </div>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white rounded-lg bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
                  U
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-blue-600">Uddokta Pay</p>
                  <p className="text-xs text-slate-500">Online Payment</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Credit/Debit Card, bKash, Nagad
              </p>
            </button>
          </div>

          {/* Balance Information */}
          {user && (
            <div className="p-4 mb-4 border bg-slate-50 rounded-xl border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">ℹ️</span>
                  <span className="text-sm text-slate-700">Your Balance</span>
                </div>
                <button
                  onClick={handleRefreshBalance}
                  disabled={refreshingBalance}
                  className="text-purple-600 transition-colors hover:text-purple-700"
                >
                  <FaSyncAlt
                    className={`text-sm ${refreshingBalance ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
              <p className="mb-3 text-2xl font-bold text-green-600">
                ৳ {balanceLoading ? "Loading..." : balance.toFixed(2)}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">ℹ️</span>
                <span className="text-sm text-slate-700">
                  Required amount: ৳ {requiredAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Pay Button with Tap and Hold */}
          <div className="relative">
            <button
              onMouseDown={
                payment === "robo" || payment === "bkash"
                  ? handleMouseDown
                  : undefined
              }
              onMouseUp={
                payment === "robo" || payment === "bkash"
                  ? handleMouseUp
                  : undefined
              }
              onTouchStart={
                payment === "robo" || payment === "bkash"
                  ? handleMouseDown
                  : undefined
              }
              onTouchEnd={
                payment === "robo" || payment === "bkash"
                  ? handleMouseUp
                  : undefined
              }
              onClick={() => {
                if (payment === "uddokta") {
                  // Validation is handled in handleUddoktaPayPayment
                  handleUddoktaPayPayment();
                }
              }}
              disabled={(() => {
                // Base conditions
                if (
                  processing ||
                  balanceLoading ||
                  (payment === "uddokta" && !user)
                )
                  return true;

                // ✅ Check if user is logged in (userId required for payment)
                if (!user || !user.uid) return true;

                // For digital codes, check input field validation
                if (isDigitalCode) {
                  if (loadingDigitalCodeProduct) return true;
                  const validation = validateDigitalCodeInputs();
                  return !validation.isValid;
                }

                // For subscriptions, check input field validation
                if (isSubscription) {
                  if (loadingSubscriptionProduct) return true;
                  const validation = validateSubscriptionInputs();
                  return !validation.isValid;
                }

                // For regular products, check UID only (no name loading required)
                return false;
              })()}
              className="relative w-full px-6 py-4 overflow-hidden text-lg font-bold text-white transition-all shadow-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`,
                boxShadow: `0 10px 30px rgba(var(--theme-primary-rgb), 0.3)`,
              }}
              onMouseEnter={(e) => {
                const canHover =
                  !processing &&
                  !balanceLoading &&
                  !(payment === "uddokta" && !user);
                if (isDigitalCode) {
                  const validation = validateDigitalCodeInputs();
                  if (canHover && validation.isValid) {
                    e.currentTarget.style.background = `linear-gradient(to right, var(--theme-primary-hover), var(--theme-secondary-dark))`;
                  }
                } else if (isSubscription) {
                  const validation = validateSubscriptionInputs();
                  if (canHover && validation.isValid) {
                    e.currentTarget.style.background = `linear-gradient(to right, var(--theme-primary-hover), var(--theme-secondary-dark))`;
                  }
                } else {
                  if (canHover) {
                    e.currentTarget.style.background = `linear-gradient(to right, var(--theme-primary-hover), var(--theme-secondary-dark))`;
                  }
                }
              }}
              onMouseLeave={(e) => {
                // Handle tap-and-hold mouse leave
                if (payment === "robo" || payment === "bkash") {
                  if (holdIntervalRef.current !== null) {
                    window.clearInterval(holdIntervalRef.current);
                    holdIntervalRef.current = null;
                  }
                  setIsHolding(false);
                  setHoldProgress(0);
                  holdStartTimeRef.current = null;
                }
                // Handle style reset
                const canReset =
                  !processing &&
                  !balanceLoading &&
                  !(payment === "uddokta" && !user);
                if (isDigitalCode) {
                  const validation = validateDigitalCodeInputs();
                  if (canReset && validation.isValid) {
                    e.currentTarget.style.background = `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`;
                  }
                } else if (isSubscription) {
                  const validation = validateSubscriptionInputs();
                  if (canReset && validation.isValid) {
                    e.currentTarget.style.background = `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`;
                  }
                } else {
                  if (canReset) {
                    e.currentTarget.style.background = `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`;
                  }
                }
              }}
            >
              {/* Progress bar */}
              {isHolding && (
                <div
                  className="absolute inset-0 transition-all duration-75 bg-gradient-to-r from-green-500 to-emerald-600"
                  style={{ width: `${holdProgress}%` }}
                />
              )}

              {/* Bird flying animation */}
              {isHolding && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="text-4xl animate-bounce"
                    style={{ animationDuration: "0.5s" }}
                  >
                    🐦
                  </div>
                </div>
              )}

              {/* Button text */}
              <span className="relative z-10">
                {processing
                  ? "Processing..."
                  : payment === "uddokta" && !user
                    ? "Please Login"
                    : isDigitalCode && loadingDigitalCodeProduct
                      ? "Loading Product..."
                      : isHolding
                        ? `Hold... ${Math.round(holdProgress)}%`
                        : payment === "robo" || payment === "bkash"
                          ? "Tap & Hold to Pay"
                          : "Pay"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Robo Payment Confirmation Modal */}
      {showRoboPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 overflow-hidden bg-white shadow-2xl rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                মার্চেন্ট পেমেন্ট নিশ্চিত করুন
              </h2>
              <button
                onClick={() => {
                  setShowRoboPaymentModal(false);
                  handleModalMouseUp();
                }}
                className="p-2 transition-colors text-slate-600 hover:text-slate-900"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Merchant Info */}
            <div className="p-4">
              <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-300">
                  <svg
                    className="w-6 h-6 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Merchant</p>
                  <p className="text-sm font-semibold text-slate-900">
                    Robo Top Up Zone
                  </p>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-4 mt-4 bg-slate-100 rounded-xl">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="mb-1 text-xs text-slate-500">সর্বমোট</p>
                    <p className="text-lg font-bold text-slate-900">
                      ৳{displayProduct.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-600">
                      ৳{displayProduct.price.toFixed(2)} + ৳0.0
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 text-xs text-slate-500">
                      নতুন ব্যালেন্স
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      ৳{(balance - displayProduct.price).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-200">
                  <p className="mb-1 text-xs text-slate-500">রেফারেন্স</p>
                  <p className="font-mono text-sm text-slate-700">
                    {uid.trim() || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tap and Hold Button */}
            <div className="px-4 pb-4">
              <button
                onMouseDown={handleModalMouseDown}
                onMouseUp={handleModalMouseUp}
                onMouseLeave={handleModalMouseLeave}
                onTouchStart={handleModalMouseDown}
                onTouchEnd={handleModalMouseUp}
                disabled={processing}
                className="relative w-full px-6 py-4 overflow-hidden text-white bg-slate-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Progress bar */}
                {modalHolding && (
                  <div
                    className="absolute inset-0 transition-all duration-75 bg-gradient-to-r from-green-500 to-emerald-600"
                    style={{ width: `${modalHoldProgress}%` }}
                  />
                )}

                {/* Bird icon */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {modalHolding
                      ? `Hold... ${Math.round(modalHoldProgress)}%`
                      : "মার্চেন্ট পেমেন্ট করতে ট্যাপ করে ধরে রাখুন"}
                  </span>
                  <span className="text-2xl">🐦</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;