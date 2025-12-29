import { useEffect, useState, useRef } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { paymentApi } from "../services/api";
import type { Product } from "../types";
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
  const productId =
    (location.state as { productId?: string } | undefined)?.productId ??
    new URLSearchParams(location.search).get("productId") ??
    "";
  const product = products.find((p) => p.id === productId) ?? products[0];
  const [searchParams] = useSearchParams();

  // ✅ FIX: Use refs for tracking payment state (prevents re-render issues)
  const isPaymentInProgressRef = useRef(false);
  const paymentAttemptsRef = useRef<Set<string>>(new Set());
  const verificationInProgressRef = useRef(false);

  // Initialize UID from localStorage to persist across redirects
  const [uid, setUid] = useState(() => {
    const savedUid = localStorage.getItem("checkout_uid") || "";
    return savedUid;
  });

  const [ffName, setFfName] = useState<string | null>(null);
  const [ffNameLoading, setFfNameLoading] = useState(false);
  const [, setFfNameError] = useState<string | null>(null);
  const [payment, setPayment] = useState<"robo" | "bkash" | "uddokta">("robo");
  const [processing, setProcessing] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
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
    if (!products.length) navigate("/");
  }, [products, navigate]);

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
            // Payment verified
            setVerifyingPayment({
              invoiceId: invoiceId,
              status: "verified",
              message: "Payment verified successfully! ✅"
            });

            // Show success message
            setPaymentResult({
              status: "success",
              message: "Payment verified! Your order is being processed.",
              amount: product.price,
              remaining: balance,
              transactionId: response.data?.payment?.transactionId || transactionId || invoiceId,
              productName: product.name,
              paymentMethod: "uddokta",
              ffName: ffName,
              playerId: uid
            });

            // Refresh balance
            if (user) {
              await refresh();
            }

            // Clear URL params after 2 seconds
            setTimeout(() => {
              navigate("/checkout", { replace: true });
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
    const urlUid = searchParams.get("uid");
    const localUid = localStorage.getItem("checkout_uid");
    const savedUid = urlUid || localUid || "";

    if (savedUid && savedUid !== uid) {
      setUid(savedUid);
      if (urlUid) {
        localStorage.setItem("checkout_uid", urlUid);
      }
    }
  }, [searchParams, uid]);

  // Track if user has manually selected a payment method
  const [paymentManuallySelected, setPaymentManuallySelected] = useState(false);

  useEffect(() => {
    if (paymentManuallySelected) {
      return;
    }

    const hasEnough =
      typeof hasEnoughBalance === "function" && product
        ? hasEnoughBalance(product.price)
        : false;

    if (user && product && !isNaN(balance) && balance > 0 && hasEnough) {
      setPayment("robo");
    } else {
      setPayment("uddokta");
    }
  }, [user, product, balance, hasEnoughBalance, paymentManuallySelected]);

  // Ensure Robo Pay can't stay selected if balance becomes insufficient
  useEffect(() => {
    if (!product) return;

    const hasEnough =
      typeof hasEnoughBalance === "function"
        ? hasEnoughBalance(product.price)
        : balance >= product.price;

    if (!hasEnough && payment === "robo") {
      setPayment("uddokta");
    }
  }, [product, balance, hasEnoughBalance, payment]);

  // Auto-fetch FF name when UID changes
  useEffect(() => {
    const trimmed = uid.trim();
    setFfName(null);
    setFfNameError(null);

    if (!trimmed || trimmed.length < 3) {
      return;
    }

    const maxRetries = 3; // Reduced retries
    let isCancelled = false;

    const fetchFFName = async (attempt: number = 0): Promise<void> => {
      if (isCancelled) return;

      try {
        setFfNameLoading(true);
        const url = `https://info-ob49.vercel.app/api/account/?uid=${encodeURIComponent(trimmed)}&region=BD`;
        const resp = await fetch(url);

        if (!resp.ok) throw new Error("UID info not found");

        const json = await resp.json();
        const nickname = json?.basicInfo?.nickname;

        if (!nickname) throw new Error("Name not found for this UID");

        setFfName(nickname);
        setFfNameError(null);
        setFfNameLoading(false);
      } catch (err: any) {
        if (isCancelled) return;

        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * (attempt + 1), 3000);
          setTimeout(() => fetchFFName(attempt + 1), delay);
        } else {
          setFfName(null);
          setFfNameError("Name not found. Please check your UID or try again.");
          setFfNameLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      fetchFFName(0);
    }, 500);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
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

  // ✅ FIX: Handle Uddokta Pay checkout with strict prevention
  const handleUddoktaPayPayment = async () => {
    // console.log("🔄 Uddokta Pay payment initiated");
    
    if (isPaymentInProgressRef.current) {
      // console.log("⚠️ Payment already in progress");
      return;
    }
    
    if (!uid.trim()) {
      alert("Please enter your Free Fire UID");
      return;
    }

    if (!user?.email) {
      alert("Please login to use Uddokta Pay");
      return;
    }

    isPaymentInProgressRef.current = true;
    setProcessing(true);

    try {
      const checkoutData = {
        amount: product.price,
        playerId: uid.trim(),
        productId: product.id,
        productName: product.name || "Product",
        diamonds: product.diamonds || '',
        price: product.price,
        userEmail: user.email,
        userName: user.displayName || user.email.split("@")[0] || "User",
        userId: user.uid || "",
        fullName: user.displayName || user.email.split("@")[0] || "Customer",
        email: user.email,
        redirectUrl: `${window.location.origin}/checkout?status=completed&payment=uddokta`,
        cancelUrl: `${window.location.origin}/checkout?status=cancelled&payment=uddokta`
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
    
    if (!uid.trim()) {
      alert("Please enter your Free Fire UID");
      return;
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
      if (currentBalance < product.price) {
        const shouldAddMoney = confirm(
          `Insufficient balance. You have ৳${currentBalance.toFixed(2)} but need ৳${product.price.toFixed(2)}.\n\nDo you want to add money?`
        );
        if (shouldAddMoney) {
          navigate("/add-money");
        }
        return;
      }

      // Prepare payment payload
      const paymentPayload = {
        transactionId: transactionId,
        amount: product.price,
        playerId: uid.trim(),
        productId: product.id,
        productName: product.name || "Product",
        diamonds: product.diamonds || '',
        price: product.price,
        paymentMethod: "robo" as const,
        updatedBalance: currentBalance - product.price,
        userEmail: user?.email || "",
        userName: user?.displayName || user?.email?.split("@")[0] || "User",
        userId: user?.uid || "",
        timestamp: new Date().toISOString(),
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
        setPaymentResult({
          status: "success",
          message: "Payment successful! Your diamonds will arrive shortly.",
          amount: product.price,
          remaining: actualBalance,
          transactionId: paymentPayload.transactionId,
          productName: product.name,
          paymentMethod: "Robo Balance",
          ffName: ffName,
          playerId: uid.trim(),
        });
      } else {
        const errorMessage = response?.message || "Payment failed.";
        setPaymentResult({
          status: "warning",
          message: errorMessage,
          amount: product.price,
          remaining: actualBalance,
          transactionId: paymentPayload.transactionId,
          productName: product.name,
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

  const requiredAmount = product.price;

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
                        await navigator.clipboard.writeText(verifyingPayment.invoiceId);
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
                  Player: <span className="font-semibold text-slate-800">{paymentResult.ffName}</span>
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
                          await navigator.clipboard.writeText(paymentResult.transactionId || "");
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
                  <span className="text-sm font-semibold text-slate-800">Free Fire</span>
                </div>

                {paymentResult.paymentMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Payment Method</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {paymentResult.paymentMethod}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Paid</span>
                  <span className="text-base font-bold text-slate-900">
                    ৳{paymentResult.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Remaining balance</span>
                  <span className="text-sm font-semibold text-slate-700">
                    ৳{paymentResult.remaining.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPaymentResult(null);
                  navigate("/");
                }}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-xl shadow-lg hover:from-purple-600 hover:to-violet-700 transition-all transform hover:scale-[1.02]"
              >
                Back to Home Page
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="mb-6">
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
                if (newUid.trim()) {
                  localStorage.setItem("checkout_uid", newUid.trim());
                } else {
                  localStorage.removeItem("checkout_uid");
                }
              }}
              placeholder="Enter your Free Fire UID"
              className="w-full px-4 py-3 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-700"
            />
            <div className="mt-2 text-xs text-slate-600">
              {ffNameLoading && (
                <div className="inline-flex items-center gap-2 px-2 py-1 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <svg className="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading player name...</span>
                </div>
              )}
              {!ffNameLoading && ffName && (
                <div className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                  <span className="mr-1.5 text-xs">✅</span>
                  <span className="mr-1 font-normal text-slate-600">Player:</span>
                  <span className="text-emerald-800">{ffName}</span>
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
            <h2 className="text-xl font-bold text-slate-800">Select Payment Method</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Robo Pay */}
            <button
              onClick={() => {
                const hasEnough = typeof hasEnoughBalance === "function" && product
                  ? hasEnoughBalance(product.price)
                  : balance >= (product?.price || 0);

                if (!hasEnough) {
                  alert(`Your Robo Balance is insufficient. You need ৳${product.price.toFixed(2)}.`);
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
                  <p className="text-sm font-bold text-purple-600">Robo Balance</p>
                  <p className="text-xs text-slate-500">Wallet Payment</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-600">Use your wallet balance</p>
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
              <p className="mt-2 text-xs text-slate-600">Credit/Debit Card, bKash, Nagad</p>
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
                  <FaSyncAlt className={`text-sm ${refreshingBalance ? "animate-spin" : ""}`} />
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

          {/* Buy Now Button */}
          <button
            onClick={() => {
              if (!uid.trim()) {
                alert("Please enter your Free Fire UID");
                return;
              }
              
              if (payment === "robo") {
                handleRoboBalancePayment();
              } else if (payment === "uddokta") {
                handleUddoktaPayPayment();
              }
            }}
            disabled={processing || balanceLoading || (payment === "uddokta" && !user)}
            className="w-full px-6 py-4 text-lg font-bold text-white transition-all shadow-lg bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl hover:from-purple-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-purple-500/30"
          >
            {processing ? "Processing..." : 
             payment === "uddokta" && !user ? "Please Login" : 
             "Buy Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Checkout;