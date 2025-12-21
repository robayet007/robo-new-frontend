import { useEffect, useState } from "react";
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

  // Initialize UID from localStorage to persist across redirects
  const [uid, setUid] = useState(() => {
    const savedUid = localStorage.getItem("checkout_uid") || "";
    return savedUid;
  });

  const [ffName, setFfName] = useState<string | null>(null);
  const [ffNameLoading, setFfNameLoading] = useState(false);
  const [ffNameError, setFfNameError] = useState<string | null>(null);
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

  // Restore UID from localStorage or URL params on mount and when searchParams change
  useEffect(() => {
    // Priority: URL param > localStorage > current state
    const urlUid = searchParams.get("uid");
    const localUid = localStorage.getItem("checkout_uid");
    const savedUid = urlUid || localUid || "";

    if (savedUid && savedUid !== uid) {
      setUid(savedUid);
      // Also save to localStorage if it came from URL
      if (urlUid) {
        localStorage.setItem("checkout_uid", urlUid);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only run when searchParams change (after redirect)


  // Track if user has manually selected a payment method
  const [paymentManuallySelected, setPaymentManuallySelected] = useState(false);

  useEffect(() => {
    // Only set default payment method on initial load (when payment hasn't been manually selected)
    // Don't override user's manual selection (especially for Uddokta Pay)
    if (paymentManuallySelected) {
      return; // Don't override user's choice
    }

    // Set default payment method based on balance
    // If user has balance and enough for product, default to Robo Pay
    // Otherwise default to Uddokta Pay (better than bKash for online payments)
    const hasEnough =
      typeof hasEnoughBalance === "function" && product
        ? hasEnoughBalance(product.price)
        : false;

    if (user && product && !isNaN(balance) && balance > 0 && hasEnough) {
      setPayment("robo");
    } else {
      // Default to Uddokta Pay instead of bKash for better UX
      setPayment("uddokta");
    }
  }, [user, product, balance, hasEnoughBalance, paymentManuallySelected]);

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

        console.log(
          `🔍 Fetching FF name (Attempt ${
            attempt + 1
          }/${maxRetries}) for UID: ${trimmed}`
        );

        const resp = await fetch(url);

        if (!resp.ok) {
          throw new Error("UID info not found");
        }

        const json = await resp.json();
        const nickname = json?.basicInfo?.nickname;

        if (!nickname) {
          throw new Error("Name not found for this UID");
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
          setFfNameError("Name not found. Please check your UID or try again.");
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

  // ✅ Handle Uddokta Pay checkout
  const handleUddoktaPayPayment = async () => {
    console.log("🔄 Uddokta Pay payment initiated", { payment, user: !!user, uid: uid.trim() });
    
    if (!uid.trim()) {
      alert("Please enter your Free Fire UID");
      return;
    }

    if (!user?.email) {
      alert("Please login to use Uddokta Pay");
      return;
    }

    setProcessing(true);

    try {
      const checkoutData = {
        amount: product.price,
        playerId: uid.trim(),
        productId: product.id,
        productName: product.name || "Product",
        diamonds: product.diamonds || 0,
        price: product.price,
        userEmail: user.email,
        userName: user.displayName || user.email.split("@")[0] || "User",
        userId: user.uid || "",
        fullName: user.displayName || user.email.split("@")[0] || "Customer",
        email: user.email,
        redirectUrl: `${window.location.origin}/checkout?status=success&payment=uddokta`,
        cancelUrl: `${window.location.origin}/checkout?status=cancelled&payment=uddokta`
      };

      console.log("🔄 Creating Uddokta Pay checkout...", checkoutData);

      const response = await paymentApi.uddoktaCheckout(checkoutData);

      console.log("📥 Uddokta Pay response:", response);

      if (response.success && response.data?.paymentUrl) {
        console.log("✅ Checkout created, redirecting to payment page...", response.data.paymentUrl);
        // Redirect to Uddokta Pay payment page
        window.location.href = response.data.paymentUrl;
      } else {
        setProcessing(false);
        const errorMsg = response.message || "Failed to create payment session. Please try again.";
        console.error("❌ Uddokta Pay checkout failed:", errorMsg);
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error("❌ Uddokta Pay checkout error:", error);
      setProcessing(false);
      const errorMsg = error.message || error.response?.data?.message || "Failed to process payment. Please try again.";
      alert(errorMsg);
    }
  };

  // ✅ Handle payment status from URL params (after redirect)
  useEffect(() => {
    const status = searchParams.get("status");
    const invoiceId = searchParams.get("invoice_id");
    const transactionId = searchParams.get("transactionId");

    if (status === "success" && (invoiceId || transactionId)) {
      // Payment successful, verify it
      if (invoiceId) {
        setVerifyingPayment({
          invoiceId: invoiceId,
          status: "verifying",
          message: "Verifying payment..."
        });

        // Verify payment
        paymentApi.uddoktaVerify(invoiceId)
          .then((response) => {
            if (response.success) {
              setVerifyingPayment({
                invoiceId: invoiceId,
                status: "verified",
                message: "Payment verified successfully!"
              });

              // Show success message
              setPaymentResult({
                status: "success",
                message: "Payment successful! Your order is being processed.",
                amount: product.price,
                remaining: balance,
                transactionId: response.data?.payment?.transactionId || transactionId || "",
                productName: product.name,
                paymentMethod: "uddokta",
                ffName: ffName,
                playerId: uid
              });

              // Refresh balance if user is logged in
              if (user) {
                refresh().catch(console.error);
              }

              // Clear URL params
              navigate("/checkout", { replace: true });
            } else {
              setVerifyingPayment({
                invoiceId: invoiceId,
                status: "failed",
                message: response.message || "Verification failed"
              });
            }
          })
          .catch((error) => {
            console.error("Verification error:", error);
            setVerifyingPayment({
              invoiceId: invoiceId,
              status: "failed",
              message: error.message || "Failed to verify payment"
            });
          });
      }
    } else if (status === "cancelled") {
      setProcessing(false);
      alert("Payment was cancelled. Please try again if you want to complete the purchase.");
      // Clear URL params
      navigate("/checkout", { replace: true });
    }
  }, [searchParams, user, product, balance, refresh, navigate, ffName, uid]);

  const handleRoboBalancePayment = async () => {
    if (!uid.trim()) {
      alert("Please enter your Free Fire UID");
      return;
    }

    setProcessing(true);

    // ✅ Refresh balance before purchase to get latest balance
    // This prevents race conditions when same account is open in multiple tabs
    try {
      await refresh();
      // Small delay to ensure state updates
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (refreshError) {
      console.warn("Balance refresh failed:", refreshError);
    }

    // Get fresh balance after refresh - check current balance state
    const currentBalance =
      typeof getCurrentBalance === "function" ? getCurrentBalance() : balance;

    if (currentBalance < product.price) {
      setProcessing(false);
      const shouldAddMoney = confirm(
        `Insufficient balance. You have ৳${currentBalance.toFixed(
          2
        )} but need ৳${product.price.toFixed(
          2
        )}.\n\nDo you want to add money to your Robo Balance?`
      );
      if (shouldAddMoney) {
        navigate("/add-money");
      }
      return;
    }

    if (!hasEnoughBalance(product.price)) {
      setProcessing(false);
      const shouldAddMoney = confirm(
        `Insufficient balance. You have ৳${currentBalance.toFixed(
          2
        )} but need ৳${product.price.toFixed(
          2
        )}.\n\nDo you want to add money to your Robo Balance?`
      );
      if (shouldAddMoney) {
        navigate("/add-money");
      }
      return;
    }

    try {
      // Note: We don't deduct locally anymore - backend handles it atomically
      // But we still update local state optimistically for better UX
      const expectedNewBalance = currentBalance - product.price;

      const paymentPayload = {
        transactionId: `ROBO_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`, // Unique transaction ID
        amount: product.price,
        playerId: (
          uid.trim() ||
          localStorage.getItem("checkout_uid") ||
          searchParams.get("uid") ||
          ""
        ).trim(),
        productId: product.id,
        productName: product.name || "Product",
        diamonds: product.diamonds || 0,
        price: product.price,
        paymentMethod: "robo" as const,
        updatedBalance: expectedNewBalance, // Expected balance (backend will validate and use actual)
        userEmail: user?.email || "",
        userName: user?.displayName || user?.email?.split("@")[0] || "User",
        userId: user?.uid || "",
        timestamp: new Date().toISOString(),
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout

      let response;
      try {
        response = await paymentApi.verify(paymentPayload, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        // Check if backend rejected due to insufficient balance
        if (
          !response.success &&
          (response.message?.includes("Insufficient balance") ||
            response.message?.includes("insufficient"))
        ) {
          await refresh();
          alert(
            "⚠️ Insufficient balance. Your balance may have been used in another tab/device. Please refresh and try again."
          );
          setProcessing(false);
          return;
        }
      } catch (apiError: any) {
        clearTimeout(timeoutId);
        // If backend rejected due to insufficient balance, refresh and show error
        if (
          apiError.message?.includes("Insufficient balance") ||
          apiError.message?.includes("insufficient")
        ) {
          await refresh();
          alert(
            "⚠️ Insufficient balance. Your balance may have been used in another tab/device. Please refresh and try again."
          );
          setProcessing(false);
          return;
        }
        response = {
          success: false,
          message:
            apiError.name === "AbortError"
              ? "Request timeout. Please check your connection and try again."
              : apiError.message || "Payment failed. Please try again.",
        };
      }

      // Refresh balance to get actual balance from backend
      await refresh();
      await new Promise((resolve) => setTimeout(resolve, 200)); // Wait for state update
      const actualBalance =
        typeof getCurrentBalance === "function" ? getCurrentBalance() : balance;

      if (response && response.success) {
        setPaymentResult({
          status: "success",
          message:
            "Your top-up was successful! 💎 Your diamonds will arrive shortly.",
          amount: product.price,
          remaining: actualBalance,
          transactionId: paymentPayload.transactionId,
          productName: product.name,
          paymentMethod: "Robo Balance",
          ffName: ffName,
          playerId: (
            uid.trim() ||
            localStorage.getItem("checkout_uid") ||
            searchParams.get("uid") ||
            ""
          ).trim(),
        });
      } else {
        // Backend rejected the payment
        const errorMessage =
          response?.message || "Payment failed. Please try again.";
        console.error("Payment failed:", {
          response,
          errorMessage,
          actualBalance,
          expectedBalance: currentBalance - product.price,
        });

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

      setProcessing(false);
    } catch (err: any) {
      // Refresh balance on any error
      await refresh();
      alert(
        "⚠️ Payment Error: " +
          (err.message || "Unknown error") +
          "\n\nPlease check your balance and try again."
      );
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

              {/* Transaction ID Display */}
              <div className="mt-4 mb-4">
                <p className="mb-2 text-xs text-slate-500">Transaction ID</p>
                <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
                  <span className="font-mono text-xs break-all text-slate-700">
                    {verifyingPayment.invoiceId}
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          verifyingPayment.invoiceId
                        );
                        alert("Transaction ID copied!");
                      } catch (err) {
                        console.error("Failed to copy:", err);
                      }
                    }}
                    className="flex-shrink-0 p-1.5 hover:bg-slate-200 rounded transition-colors"
                    title="Copy Transaction ID"
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

              {verifyingPayment.status === "verifying" && (
                <div className="mt-4">
                  <div className="w-full h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 bg-blue-600 rounded-full animate-pulse"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Please wait while we verify your payment...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Completed Modal - Enhanced UI */}
      {paymentResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 overflow-hidden bg-white shadow-2xl rounded-2xl">
            {/* Header with Success Icon */}
            <div className="px-6 pt-8 pb-4 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
                  <FaCheck className="text-3xl text-emerald-600" />
                </div>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-slate-900">
                Payment Completed!
              </h2>

              {/* Free Fire Player Name Display */}
              {paymentResult.ffName ? (
                <p className="mb-1 text-sm text-slate-600">
                  Player:{" "}
                  <span className="font-semibold text-slate-800">
                    {paymentResult.ffName}
                  </span>
                </p>
              ) : paymentResult.playerId ? (
                <p className="mb-1 text-sm text-slate-600">
                  Free Fire ID:{" "}
                  <span className="font-semibold text-slate-800">
                    {paymentResult.playerId}
                  </span>
                </p>
              ) : (
                user?.displayName && (
                  <p className="mb-1 text-sm text-slate-600">
                    Hello,{" "}
                    <span className="font-semibold text-slate-800">
                      {user.displayName}
                    </span>
                  </p>
                )
              )}

              {/* Transaction ID with Copy */}
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
                            paymentResult.transactionId || ""
                          );
                          alert("Transaction ID copied!");
                        } catch (err) {
                          console.error("Failed to copy:", err);
                        }
                      }}
                      className="flex-shrink-0 p-1.5 hover:bg-slate-200 rounded transition-colors"
                      title="Copy Transaction ID"
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

            {/* Payment Details Section */}
            <div className="px-6 pb-6">
              <div className="pt-4 space-y-3 border-t border-slate-200">
                {/* Selected Product */}
                {paymentResult.productName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Selected Product
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {paymentResult.productName}
                    </span>
                  </div>
                )}

                {/* Game */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Game</span>
                  <span className="text-sm font-semibold text-slate-800">
                    Free Fire
                  </span>
                </div>

                {/* Player ID / Free Fire ID */}
                {paymentResult.playerId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Player ID</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {paymentResult.playerId}
                    </span>
                  </div>
                )}

                {/* Payment Method */}
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

                {/* Transaction Time */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    Transaction Time
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {new Date().toLocaleString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
              </div>

              {/* Amount Summary */}
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

              {/* Action Button */}
              <button
                type="button"
                onClick={() => {
                  setPaymentResult(null);
                  navigate("/");
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
                localStorage.setItem("checkout_uid", newUid.trim());
              } else {
                localStorage.removeItem("checkout_uid");
              }
            }}
            placeholder="এখানে আপনার গেমের আইডি কোড লিখুন"
            className="w-full px-4 py-3 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-700"
          />
          <div className="mt-2 text-xs text-slate-600">
            {ffNameLoading && (
              <div className="inline-flex items-center gap-2 px-2 py-1 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <svg
                  className="w-3 h-3 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>
                  {ffNameError?.includes("Searching")
                    ? ffNameError
                    : "UID থেকে নাম খুঁজছি..."}
                </span>
              </div>
            )}
            {!ffNameLoading && ffName && (
              <div className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                <span className="mr-1.5 text-xs">✅</span>
                <span className="mr-1 font-normal text-slate-600">
                  Account Name:
                </span>
                <span className="text-emerald-800">{ffName}</span>
              </div>
            )}
            {!ffNameLoading &&
              !ffName &&
              ffNameError &&
              !ffNameError.includes("Searching") && (
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
                          throw new Error("UID info not found");
                        }
                        const json = await resp.json();
                        const nickname = json?.basicInfo?.nickname;
                        if (!nickname) {
                          throw new Error("Name not found for this UID");
                        }
                        setFfName(nickname);
                        setFfNameError(null);
                      } catch (err: any) {
                        setFfNameError(err?.message || "Failed to fetch name");
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
          <h2 className="text-xl font-bold text-slate-800">
            Select one option
          </h2>
        </div>

        {/* Payment Method Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Robo Pay / Wallet Pay */}
          <button
            onClick={() => {
              console.log("🖱️ Robo Pay card clicked, setting payment to 'robo'");
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
                <p className="text-sm font-bold text-purple-600">Robo Top Up</p>
                <p className="text-xs text-slate-500">ওয়ালেট পে</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-600">Wallet Pay</p>
          </button>

          {/* Uddokta Pay */}
          <button
            onClick={() => {
              console.log("🖱️ Uddokta Pay card clicked, setting payment to 'uddokta'");
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
                <p className="text-xs text-slate-500">অনলাইন পেমেন্ট</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-600">Online Payment</p>
          </button>
        </div>

        {/* Balance Information */}
        {user && (
          <div className="p-4 mb-4 border bg-slate-50 rounded-xl border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">ℹ️</span>
                <span className="text-sm text-slate-700">
                  আপনার অ্যাকাউন্ট ব্যালেন্স
                </span>
              </div>
              <button
                onClick={handleRefreshBalance}
                disabled={refreshingBalance}
                className="text-purple-600 transition-colors hover:text-purple-700"
              >
                <FaSyncAlt
                  className={`text-sm ${
                    refreshingBalance ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>
            <p className="mb-3 text-2xl font-bold text-green-600">
              ৳ {balanceLoading ? "Loading..." : balance.toFixed(2)}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">ℹ️</span>
              <span className="text-sm text-slate-700">
                প্রোডাক্ট কিনতে আপনার প্রয়োজন ৳ {requiredAmount}।
              </span>
            </div>
          </div>
        )}

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
              {verifyingPayment.status === "verified" && "✅ Payment verified successfully!"}
              {verifyingPayment.status === "failed" && `❌ ${verifyingPayment.message}`}
            </p>
          </div>
        )}

        {/* Buy Now Button */}
        <button
          onClick={() => {
            console.log("🖱️ Buy Now clicked", { 
              payment, 
              paymentType: typeof payment,
              user: !!user, 
              uid: uid.trim(),
              allPaymentOptions: ["robo", "bkash", "uddokta"]
            });
            
            if (!uid.trim()) {
              alert("Please enter your Free Fire UID");
              return;
            }
            
            // Check payment method and route accordingly
            if (payment === "robo") {
              console.log("✅ Processing Robo Balance payment");
              handleRoboBalancePayment();
            } else if (payment === "uddokta") {
              console.log("✅ Processing Uddokta Pay payment");
              handleUddoktaPayPayment();
            } else if (payment === "bkash") {
              console.log("⚠️ bKash payment selected (manual verification)");
              // bKash payment - handled via manual verification
              alert("bKash payment: Please complete payment and verify manually");
            } else {
              // Fallback for unknown payment method
              console.error("❌ Unknown payment method:", payment, "Type:", typeof payment);
              alert(`Payment method error: ${payment}. Please select a payment method and try again.`);
            }
          }}
          disabled={!uid.trim() || processing || balanceLoading || (payment === "uddokta" && !user)}
          className="w-full px-6 py-4 text-lg font-bold text-white transition-all shadow-lg bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl hover:from-purple-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-purple-500/30"
        >
          {processing ? "Processing..." : payment === "uddokta" && !user ? "Please Login" : "Buy Now"}
        </button>
      </div>
    </div>
  );
}

export default Checkout;
