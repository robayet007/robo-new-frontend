import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaCheck, FaSearch, FaSyncAlt } from "react-icons/fa";
import { digitalCodeApi, paymentApi, subscriptionApi } from "../services/api";
import useRoboBalance from "../hooks/useRoboBalance";
import useAuth from "../hooks/useAuth";
import type { BackendDigitalCodeProduct, BackendSubscriptionProduct, Product } from "../types";

type PurchaseMode = "regular" | "digital" | "subscription";

type SelectableProduct = Product | BackendDigitalCodeProduct | BackendSubscriptionProduct;
type ProductInputField = {
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
};

type PaymentResult = {
  status: "success" | "warning";
  message: string;
  amount: number;
  remaining: number;
  transactionId?: string;
  productName?: string;
  paymentMethod?: string;
  playerId?: string;
};

interface InlinePurchasePanelProps {
  mode: PurchaseMode;
  selectedProduct: SelectableProduct;
  originPath: string;
  onClose?: () => void;
}

const HOLD_DURATION = 2500;
const STORAGE_KEY = "inline_purchase_pending_by_invoice";
const INSTANT_PAY_LOGO = "/bkashroketnogod.png";

function readPendingInvoiceMap(): Record<string, Record<string, string>> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writePendingInvoiceMap(value: Record<string, Record<string, string>>) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function buildCleanPath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function InlinePurchasePanel({
  mode,
  selectedProduct,
  originPath,
  onClose,
}: InlinePurchasePanelProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { balance, hasEnoughBalance, refresh, getCurrentBalance, loading: balanceLoading, ucTopupStatus } = useRoboBalance();

  const [uid, setUid] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [playerError, setPlayerError] = useState("");

  const [inputFields, setInputFields] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"robo" | "uddokta">("robo");
  const [paymentManuallySelected, setPaymentManuallySelected] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [walletInfoPopup, setWalletInfoPopup] = useState<string | null>(null);

  const [showRoboPaymentModal, setShowRoboPaymentModal] = useState(false);
  const [modalHolding, setModalHolding] = useState(false);
  const [modalHoldProgress, setModalHoldProgress] = useState(0);

  const [verifyingPayment, setVerifyingPayment] = useState<{
    invoiceId: string;
    status: "verifying" | "verified" | "failed";
    message?: string;
  } | null>(null);

  const uidFetchRef = useRef<string | null>(null);
  const modalHoldIntervalRef = useRef<number | null>(null);
  const modalHoldStartTimeRef = useRef<number | null>(null);

  const verificationInProgressRef = useRef(false);
  const isPaymentInProgressRef = useRef(false);
  const paymentAttemptsRef = useRef<Set<string>>(new Set());

  const normalizedOriginPath = useMemo(() => buildCleanPath(originPath), [originPath]);

  const product = useMemo(
    () => ({
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      diamonds: "diamonds" in selectedProduct
        ? ((selectedProduct as { ucCategory?: string; diamonds?: string }).ucCategory || selectedProduct.diamonds || "")
        : "",
      inputFields:
        mode === "regular"
          ? []
          : Array.isArray((selectedProduct as BackendDigitalCodeProduct | BackendSubscriptionProduct).inputFields)
            ? ((selectedProduct as BackendDigitalCodeProduct | BackendSubscriptionProduct).inputFields as ProductInputField[]) || []
            : [],
    }),
    [selectedProduct, mode],
  );

  useEffect(() => {
    if (mode === "regular") return;
    const next: Record<string, string> = {};
    product.inputFields.forEach((field) => {
      next[field.name] = "";
    });
    setInputFields(next);
  }, [mode, product.id, product.inputFields]);

  useEffect(() => {
    if (paymentManuallySelected) return;
    const canUseWallet =
      user && typeof hasEnoughBalance === "function"
        ? hasEnoughBalance(product.price)
        : false;
    setPaymentMethod(canUseWallet ? "robo" : "uddokta");
  }, [user, hasEnoughBalance, product.price, paymentManuallySelected]);

  useEffect(() => {
    if (paymentMethod !== "robo") return;
    const canUseWallet =
      typeof hasEnoughBalance === "function"
        ? hasEnoughBalance(product.price)
        : balance >= product.price;
    if (!canUseWallet) {
      setPaymentMethod("uddokta");
    }
  }, [balance, hasEnoughBalance, paymentMethod, product.price]);

  const handleCheckPlayerId = async () => {
    const trimmedUid = uid.trim();
    if (!trimmedUid) {
      setPlayerName("");
      setPlayerError("Please enter Player ID first");
      return;
    }

    uidFetchRef.current = trimmedUid;
    setPlayerError("");
    setLoadingPlayer(true);
    setPlayerName("");

    try {
      const backendBase = "http://localhost:5000";
      const url = `${backendBase}/api/player-nickname?uid=${encodeURIComponent(trimmedUid)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (uidFetchRef.current !== trimmedUid) return;

      if (res.ok && data?.success && data?.player_info?.nickname != null) {
        setPlayerName(String(data.player_info.nickname));
        setPlayerError("");
      } else {
        setPlayerName("");
        setPlayerError("Player not found");
      }
    } catch {
      if (uidFetchRef.current !== trimmedUid) return;
      setPlayerName("");
      setPlayerError("Failed to fetch player");
    } finally {
      if (uidFetchRef.current === trimmedUid) setLoadingPlayer(false);
    }
  };

  const clearUrlParams = () => {
    navigate(normalizedOriginPath, { replace: true });
  };

  const validateInputs = (): { isValid: boolean; errorMessage?: string } => {
    if (mode === "regular") {
      if (!uid.trim()) {
        return { isValid: false, errorMessage: "Please enter your Player ID" };
      }
      return { isValid: true };
    }

    for (const field of product.inputFields) {
      if (field.required && !inputFields[field.name]?.trim()) {
        return {
          isValid: false,
          errorMessage: `Please fill in the required field: ${field.name}`,
        };
      }
    }
    return { isValid: true };
  };

  const assignPostPaymentProduct = async (transactionId: string, invoiceId?: string) => {
    if (!user?.uid || !user?.email) return;

    let values = inputFields;
    if ((mode === "digital" || mode === "subscription") && invoiceId) {
      const pendingMap = readPendingInvoiceMap();
      if (pendingMap[invoiceId]) {
        values = pendingMap[invoiceId];
        delete pendingMap[invoiceId];
        writePendingInvoiceMap(pendingMap);
      }
    }

    if (mode === "digital") {
      await digitalCodeApi.purchase({
        productId: product.id,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email.split("@")[0] || "User",
        transactionId,
        inputFieldValues: values,
      });
      return;
    }

    if (mode === "subscription") {
      await subscriptionApi.purchase({
        productId: product.id,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email.split("@")[0] || "User",
        transactionId,
        inputFieldValues: values,
      });
    }
  };

  useEffect(() => {
    const status = searchParams.get("status");
    const invoiceId = searchParams.get("invoice_id");
    const returnedProductId = searchParams.get("productId");

    if (!status || !returnedProductId) return;
    if (returnedProductId !== product.id) return;

    if (status === "cancelled") {
      setPaymentResult({
        status: "warning",
        message: "Payment cancelled.",
        amount: product.price,
        remaining: balance,
        productName: product.name,
      });
      clearUrlParams();
      return;
    }

    if ((status !== "success" && status !== "completed") || !invoiceId) return;
    if (verificationInProgressRef.current || paymentAttemptsRef.current.has(invoiceId)) return;

    verificationInProgressRef.current = true;
    paymentAttemptsRef.current.add(invoiceId);
    setVerifyingPayment({
      invoiceId,
      status: "verifying",
      message: "Verifying payment...",
    });

    const verify = async () => {
      try {
        const response = await paymentApi.uddoktaVerify(invoiceId);
        if (!response.success) {
          setVerifyingPayment({
            invoiceId,
            status: "failed",
            message: response.message || "Verification failed",
          });
          return;
        }

        const transactionId =
          response.data?.payment?.transactionId || searchParams.get("transactionId") || invoiceId;

        await assignPostPaymentProduct(transactionId, invoiceId);
        await refresh();

        setVerifyingPayment({
          invoiceId,
          status: "verified",
          message: "Payment verified successfully!",
        });
        setPaymentResult({
          status: "success",
          message: "Payment verified! Your order is being processed.",
          amount: product.price,
          remaining: getCurrentBalance?.() ?? balance,
          transactionId,
          productName: product.name,
          paymentMethod: "Instant Pay",
          playerId: mode === "regular" ? uid.trim() : "",
        });
        clearUrlParams();
      } catch (error: any) {
        setVerifyingPayment({
          invoiceId,
          status: "failed",
          message: error?.message || "Failed to verify payment",
        });
      } finally {
        verificationInProgressRef.current = false;
        setTimeout(() => setVerifyingPayment(null), 2500);
      }
    };

    verify();
  }, [searchParams, product.id]);

  const handleRefreshBalance = async () => {
    setRefreshingBalance(true);
    await refresh();
    setRefreshingBalance(false);
  };

  const stopModalHoldProgress = () => {
    if (modalHoldIntervalRef.current !== null) {
      window.clearInterval(modalHoldIntervalRef.current);
      modalHoldIntervalRef.current = null;
    }
    setModalHolding(false);
    setModalHoldProgress(0);
    modalHoldStartTimeRef.current = null;
  };

  const triggerModalHoldProgress = (onComplete: () => void) => {
    setModalHolding(true);
    setModalHoldProgress(0);
    modalHoldStartTimeRef.current = Date.now();

    const interval = window.setInterval(() => {
      if (!modalHoldStartTimeRef.current) return;
      const elapsed = Date.now() - modalHoldStartTimeRef.current;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setModalHoldProgress(progress);
      if (progress >= 100) {
        window.clearInterval(interval);
        modalHoldIntervalRef.current = null;
        setModalHolding(false);
        setModalHoldProgress(0);
        onComplete();
      }
    }, 16);

    modalHoldIntervalRef.current = interval;
  };

  const handleRoboBalancePayment = async () => {
    if (isPaymentInProgressRef.current) return;
    const validation = validateInputs();
    if (!validation.isValid) {
      alert(validation.errorMessage || "Please fill all required fields");
      return;
    }

    isPaymentInProgressRef.current = true;
    setProcessing(true);

    const transactionId = `ROBO_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    try {
      await refresh();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const currentBalance = getCurrentBalance?.() ?? balance;

      if (currentBalance < product.price) {
        const shouldAddMoney = confirm(
          `Insufficient balance. You have ৳${currentBalance.toFixed(2)} but need ৳${product.price.toFixed(2)}.\n\nDo you want to add money?`,
        );
        if (shouldAddMoney) {
          navigate("/add-money");
        }
        return;
      }

      const response = await paymentApi.verify({
        transactionId,
        amount: product.price,
        playerId: mode === "regular" ? uid.trim() : "",
        productId: product.id,
        productName: product.name,
        diamonds: product.diamonds,
        price: product.price,
        paymentMethod: "robo",
        updatedBalance: currentBalance - product.price,
        userEmail: user?.email || "",
        userName: user?.displayName || user?.email?.split("@")[0] || "User",
        userId: user?.uid || "",
        timestamp: new Date().toISOString(),
        inputFieldValues: mode === "regular" ? undefined : inputFields,
      });

      await assignPostPaymentProduct(transactionId);
      await refresh();
      const actualBalance = getCurrentBalance?.() ?? balance;

      if (response.success) {
        setPaymentResult({
          status: "success",
          message:
            mode === "regular"
              ? "Payment successful! Your order is being processed."
              : "Payment successful! Your order has been placed.",
          amount: product.price,
          remaining: actualBalance,
          transactionId,
          productName: product.name,
          paymentMethod: "Wallet Pay",
          playerId: mode === "regular" ? uid.trim() : "",
        });
      } else {
        setPaymentResult({
          status: "warning",
          message: response.message || "Payment failed",
          amount: product.price,
          remaining: actualBalance,
          transactionId,
          productName: product.name,
          paymentMethod: "Wallet Pay",
        });
      }
    } catch (error: any) {
      alert(error?.message || "Payment failed");
    } finally {
      isPaymentInProgressRef.current = false;
      setProcessing(false);
    }
  };

  const handleInstantPay = async () => {
    if (isPaymentInProgressRef.current) return;
    const validation = validateInputs();
    if (!validation.isValid) {
      alert(validation.errorMessage || "Please fill all required fields");
      return;
    }

    if (!user?.email) {
      alert("Please login to use Instant Pay");
      return;
    }

    isPaymentInProgressRef.current = true;
    setProcessing(true);

    try {
      const query = new URLSearchParams({
        status: "completed",
        payment: "uddokta",
        mode,
        productId: product.id,
      });
      if (mode === "regular" && uid.trim()) {
        query.set("uid", uid.trim());
      }

      const response = await paymentApi.uddoktaCheckout({
        amount: product.price,
        playerId: mode === "regular" ? uid.trim() : "",
        productId: product.id,
        productName: product.name,
        diamonds: product.diamonds,
        price: product.price,
        userEmail: user.email,
        userName: user.displayName || user.email.split("@")[0] || "User",
        userId: user.uid || "",
        fullName: user.displayName || user.email.split("@")[0] || "Customer",
        email: user.email,
        redirectUrl: `${window.location.origin}${normalizedOriginPath}?${query.toString()}`,
        cancelUrl: `${window.location.origin}${normalizedOriginPath}?status=cancelled&payment=uddokta&mode=${mode}&productId=${product.id}`,
        inputFieldValues: mode === "regular" ? undefined : inputFields,
      });

      if (response.success && response.data?.paymentUrl) {
        if (response.data.invoiceId && mode !== "regular") {
          const map = readPendingInvoiceMap();
          map[response.data.invoiceId] = inputFields;
          writePendingInvoiceMap(map);
        }
        window.location.href = response.data.paymentUrl;
        return;
      }

      alert(response.message || "Failed to create payment session.");
    } catch (error: any) {
      alert(error?.message || "Failed to process payment");
    } finally {
      isPaymentInProgressRef.current = false;
      setProcessing(false);
    }
  };

  const handleWalletPayClick = () => {
    const validation = validateInputs();
    if (!validation.isValid) {
      alert(validation.errorMessage || "Please fill all required fields");
      return;
    }

    const currentBalance = getCurrentBalance?.() ?? balance;
    if (currentBalance < product.price) {
      setWalletInfoPopup(
        `Your wallet balance is insufficient. You need ৳${product.price.toFixed(2)}.`,
      );
      return;
    }

    setShowRoboPaymentModal(true);
  };

  const requiredAmount = product.price;
  const canUseWallet = typeof hasEnoughBalance === "function" ? hasEnoughBalance(product.price) : balance >= product.price;
  const canSubmit = !processing && !!user?.uid && !balanceLoading && validateInputs().isValid;
  const estimatedNewBalance = Math.max((getCurrentBalance?.() ?? balance) - product.price, 0);

  return (
    <div className="relative max-w-2xl px-4 py-6 mx-auto mt-6 border border-slate-200 rounded-2xl bg-white/90">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Complete Purchase</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        )}
      </div>

      {verifyingPayment && (
        <div className="p-3 mb-4 text-sm border rounded-xl bg-slate-50 border-slate-200">
          <p className="font-semibold text-slate-800">
            {verifyingPayment.status === "verifying"
              ? "Verifying payment..."
              : verifyingPayment.status === "verified"
                ? "Payment verified"
                : "Verification failed"}
          </p>
          <p className="mt-1 text-xs text-slate-600">{verifyingPayment.message}</p>
        </div>
      )}

      {paymentResult && (
        <div className="p-4 mb-4 border rounded-xl bg-slate-50 border-slate-200">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Order Summary</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-slate-600">Product</span>
              <span className="font-medium text-slate-900">{paymentResult.productName}</span>
              {paymentResult.playerId && (
                <>
                  <span className="text-slate-600">Player ID</span>
                  <span className="font-mono text-slate-900">{paymentResult.playerId}</span>
                </>
              )}
              <span className="text-slate-600">Amount</span>
              <span className="font-semibold text-rose-600">৳{paymentResult.amount?.toFixed(2)}</span>
              <span className="text-slate-600">Transaction ID</span>
              <span className="font-mono text-xs text-slate-700">{paymentResult.transactionId}</span>
              <span className="text-slate-600">Status</span>
              <span className={`font-semibold ${
                ucTopupStatus?.transactionId === paymentResult.transactionId
                  ? ucTopupStatus.status === "completed"
                    ? "text-emerald-600"
                    : ucTopupStatus.status === "failed"
                      ? "text-red-600"
                      : "text-blue-600"
                  : product.diamonds && paymentResult.status === "success"
                    ? "text-blue-600"
                    : paymentResult.status === "success"
                      ? "text-emerald-600"
                      : "text-amber-600"
              }`}>
                {ucTopupStatus?.transactionId === paymentResult.transactionId
                  ? ucTopupStatus.status === "processing"
                    ? "⏳ Processing"
                    : ucTopupStatus.status === "completed"
                      ? "✅ Completed"
                      : ucTopupStatus.status === "failed"
                        ? "❌ Failed"
                        : "Verified"
                  : product.diamonds && paymentResult.status === "success"
                    ? "⏳ Processing"
                    : paymentResult.status === "success"
                      ? "✅ Verified"
                      : "⚠️ " + (paymentResult.status || "Unknown")}
              </span>
            </div>
            <p className={`mt-2 text-sm ${
              ucTopupStatus?.transactionId === paymentResult.transactionId
                ? ucTopupStatus.status === "completed"
                  ? "text-emerald-700"
                  : ucTopupStatus.status === "failed"
                    ? "text-red-600"
                    : "text-blue-600"
                : "text-slate-600"
            }`}>
              {ucTopupStatus?.transactionId === paymentResult.transactionId
                ? ucTopupStatus.status === "processing"
                  ? (ucTopupStatus.message || "UC top-up is being processed. Waiting for response...")
                  : ucTopupStatus.status === "completed"
                    ? (ucTopupStatus.message || "UC top-up completed successfully!")
                    : ucTopupStatus.status === "failed"
                      ? (ucTopupStatus.message || "UC top-up failed.")
                      : paymentResult.message
                : product.diamonds
                  ? "Payment successful! UC top-up is being processed..."
                  : paymentResult.message}
            </p>
          </div>
        </div>
      )}

      {walletInfoPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]">
          <div className="w-full max-w-sm p-5 bg-white border shadow-2xl rounded-2xl border-slate-100">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-xl rounded-full bg-amber-100">⚠️</div>
              <div className="flex-1">
                <p className="text-base font-bold text-slate-900">Insufficient Wallet Balance</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{walletInfoPopup}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWalletInfoPopup(null)}
              className="w-full px-4 py-2.5 mt-4 text-sm font-semibold text-white rounded-xl"
              style={{ background: "linear-gradient(to right, var(--theme-primary), var(--theme-secondary))" }}
            >
              OK, Got it
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-7 h-7 text-xs font-bold text-white rounded-full bg-gradient-to-br from-pink-500 to-rose-600">1</div>
          <h4 className="font-semibold text-slate-800">Select Package</h4>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{product.name}</p>
            <p className="text-xs text-slate-500">Selected package</p>
          </div>
          <p className="text-sm font-bold text-rose-600">৳{product.price.toFixed(2)}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-7 h-7 text-xs font-bold text-white rounded-full bg-gradient-to-br from-pink-500 to-rose-600">2</div>
          <h4 className="font-semibold text-slate-800">{mode === "subscription" ? "User Details" : "Order Details"}</h4>
        </div>
        <div className="p-4 bg-white border rounded-xl border-slate-200">
          {mode === "regular" ? (
            <>
              <input
                type="text"
                value={uid}
                onChange={(e) => {
                  setUid(e.target.value);
                  setPlayerName("");
                  setPlayerError("");
                }}
                placeholder="Enter Player ID"
                className="w-full px-4 py-3 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={handleCheckPlayerId}
                disabled={loadingPlayer || !uid.trim()}
                className={`flex items-center justify-center w-full gap-2 px-4 py-2.5 mt-3 text-sm font-semibold border rounded-xl disabled:opacity-60 disabled:cursor-not-allowed ${
                  playerName
                    ? "text-white border-transparent"
                    : playerError
                      ? "text-red-700 border-red-200 bg-red-50"
                      : "border-slate-300 text-slate-800 hover:bg-slate-50"
                }`}
                style={playerName ? { background: "linear-gradient(to right, var(--theme-primary), var(--theme-secondary))" } : undefined}
              >
                <FaSearch className="text-xs" />
                {loadingPlayer
                  ? "Checking Player..."
                  : playerName
                    ? playerName
                    : playerError
                      ? playerError
                      : "Check Player ID Here"}
              </button>
            </>
          ) : (
            <div className="space-y-3">
              {product.inputFields.map((field) => (
                <div key={field.name}>
                  <label className="block mb-1 text-sm font-medium text-slate-700">
                    {field.name}
                    {field.required && <span className="ml-1 text-red-500">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      rows={4}
                      value={inputFields[field.name] || ""}
                      onChange={(e) =>
                        setInputFields((prev) => ({
                          ...prev,
                          [field.name]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder || `Enter ${field.name}`}
                      className="w-full px-4 py-3 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      value={inputFields[field.name] || ""}
                      onChange={(e) =>
                        setInputFields((prev) => ({
                          ...prev,
                          [field.name]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder || `Enter ${field.name}`}
                      className="w-full px-4 py-3 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-7 h-7 text-xs font-bold text-white rounded-full bg-gradient-to-br from-pink-500 to-rose-600">3</div>
          <h4 className="font-semibold text-slate-800">Select Payment Method</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => {
              setPaymentManuallySelected(true);
              if (!canUseWallet) {
                setWalletInfoPopup(`Your wallet balance is insufficient. You need ৳${product.price.toFixed(2)} to pay with Wallet.`);
                setPaymentMethod("uddokta");
                return;
              }
              setWalletInfoPopup(null);
              setPaymentResult(null);
              setPaymentMethod("robo");
            }}
            className={`relative bg-white border-2 rounded-xl p-4 transition-all ${
              paymentMethod === "robo" ? "border-purple-500 shadow-lg shadow-purple-500/20" : "border-slate-200 hover:border-purple-300"
            }`}
          >
            {paymentMethod === "robo" && (
              <div className="absolute flex items-center justify-center w-6 h-6 bg-red-500 rounded-full -top-2 -left-2">
                <FaCheck className="text-xs text-white" />
              </div>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white rounded-lg bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-600">R</div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-purple-600">Wallet Pay</p>
                <p className="text-xs text-slate-500">Wallet Balance</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setPaymentManuallySelected(true);
              setPaymentMethod("uddokta");
            }}
            className={`relative bg-white border-2 rounded-xl p-4 transition-all ${
              paymentMethod === "uddokta" ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-slate-200 hover:border-blue-300"
            }`}
          >
            {paymentMethod === "uddokta" && (
              <div className="absolute flex items-center justify-center w-6 h-6 bg-red-500 rounded-full -top-2 -left-2">
                <FaCheck className="text-xs text-white" />
              </div>
            )}
            <div className="mb-2 text-left">
              <p className="text-sm font-bold text-blue-600">Instant Pay</p>
            </div>
            <div className="mt-2">
              <img
                src={INSTANT_PAY_LOGO}
                alt="bKash Nagad Rocket"
                loading="lazy"
                className="object-contain w-full h-8 p-1 bg-white border rounded-md border-slate-200"
              />
            </div>
          </button>
        </div>

        {user && (
          <div className="p-4 mb-4 border bg-slate-50 rounded-xl border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-700">Your Balance</span>
              <button type="button" onClick={handleRefreshBalance} disabled={refreshingBalance} className="text-purple-600 hover:text-purple-700">
                <FaSyncAlt className={`text-sm ${refreshingBalance ? "animate-spin" : ""}`} />
              </button>
            </div>
            <p className="mb-2 text-2xl font-bold text-green-600">৳ {balanceLoading ? "Loading..." : balance.toFixed(2)}</p>
            <p className="text-sm text-slate-700">Required amount: ৳{requiredAmount.toFixed(2)}</p>
          </div>
        )}

        <button
          type="button"
          disabled={!canSubmit || (paymentMethod === "uddokta" && !user)}
          onClick={() => {
            if (paymentMethod === "robo") {
              handleWalletPayClick();
              return;
            }
            if (paymentMethod === "uddokta") {
              handleInstantPay();
            }
          }}
          className="relative w-full px-6 py-4 overflow-hidden text-lg font-bold text-white transition-all shadow-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(to right, var(--theme-primary), var(--theme-secondary))",
            boxShadow: "0 10px 30px rgba(var(--theme-primary-rgb), 0.3)",
          }}
        >
          <span className="relative z-10">
            {processing
              ? "Processing..."
              : paymentMethod === "robo"
                ? "Pay"
                : "Pay"}
          </span>
        </button>
      </div>

      {showRoboPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 overflow-hidden bg-white shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Confirm Wallet Payment</h2>
              <button
                type="button"
                onClick={() => {
                  setShowRoboPaymentModal(false);
                  stopModalHoldProgress();
                }}
                className="p-2 text-slate-600 hover:text-slate-900"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Product</span>
                  <span className="font-semibold text-slate-900">{product.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Pay amount</span>
                  <span className="font-semibold text-slate-900">৳{product.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current balance</span>
                  <span className="font-semibold text-slate-900">৳{balance.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-600">New balance</span>
                  <span className="text-base font-bold text-emerald-600">৳{estimatedNewBalance.toFixed(2)}</span>
                </div>
                {mode === "regular" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">UID</span>
                      <span className="font-semibold text-slate-900">{uid.trim() || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Nickname</span>
                      <span className="font-semibold text-slate-900">{playerName || "-"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="px-4 pb-4">
              <button
                type="button"
                onMouseDown={() =>
                  triggerModalHoldProgress(() => {
                    setShowRoboPaymentModal(false);
                    handleRoboBalancePayment();
                  })
                }
                onMouseUp={stopModalHoldProgress}
                onMouseLeave={stopModalHoldProgress}
                onTouchStart={() =>
                  triggerModalHoldProgress(() => {
                    setShowRoboPaymentModal(false);
                    handleRoboBalancePayment();
                  })
                }
                onTouchEnd={stopModalHoldProgress}
                className="relative w-full px-6 py-4 overflow-hidden text-white bg-slate-800 rounded-xl"
              >
                {modalHolding && (
                  <div className="absolute inset-0 transition-all duration-75 bg-gradient-to-r from-green-500 to-emerald-600" style={{ width: `${modalHoldProgress}%` }} />
                )}
                <span className="relative z-10">
                  {modalHolding ? `Hold... ${Math.round(modalHoldProgress)}%` : "Tap & Hold to confirm"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InlinePurchasePanel;
