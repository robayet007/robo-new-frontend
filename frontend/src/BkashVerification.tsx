import { useState } from "react";
import type { FormEvent } from "react";
import { FaCopy, FaTimes } from "react-icons/fa";

type BkashVerificationProps = {
  onVerify: (businessId: string) => Promise<void>;
  onClose: () => void;
  amount?: number;
};

function BkashVerification({
  onVerify,
  onClose,
  amount,
}: BkashVerificationProps) {
  const [transactionId, setTransactionId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const recipientNumber = "01766325020";

  const validateTransactionId = (trxId: string): boolean => {
    const trxIdRegex = /^C[A-Z0-9]{9,11}$/;
    return trxIdRegex.test(trxId);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedTrxId = transactionId.trim().toUpperCase();

    if (!trimmedTrxId) {
      setError("Transaction ID দিন দয়া করে");
      return;
    }

    if (!validateTransactionId(trimmedTrxId)) {
      setError("সঠিক bKash Transaction ID দিন (10-12 characters starting with C)");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      await onVerify(trimmedTrxId);
      // Success - onVerify will handle navigation and closing
      // Don't set isVerifying to false here - let parent handle it
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Payment verification failed. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(recipientNumber);
      alert('Number copied to clipboard!');
    } catch (err) {
      alert('Failed to copy. Please copy manually: ' + recipientNumber);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              cursor: "pointer",
              color: "#6b7280",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            ←
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>📋</span>
            <span style={{ fontSize: "20px" }}>✕</span>
          </div>
        </div>

        {/* bKash Logo */}
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span style={{ fontSize: "32px" }}>🕊️</span>
            <span style={{ fontSize: "24px", fontWeight: "bold", color: "#e2136e" }}>bKash</span>
          </div>
        </div>

        {/* Payment Summary */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            backgroundColor: "#f9fafb",
            margin: "0 20px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #a855f7, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              R
            </div>
            <span style={{ color: "#6b7280", fontSize: "14px" }}>Robo Top Up</span>
          </div>
          <span style={{ color: "#1f2937", fontSize: "18px", fontWeight: "bold" }}>
            ৳ {amount || 0}
          </span>
        </div>

        {/* Main Content - Scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
          }}
        >
          {/* Instruction Box - Magenta */}
          <div
            style={{
              backgroundColor: "#e2136e",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{
                color: "white",
                fontWeight: "bold",
                fontSize: "18px",
                margin: "0 0 16px 0",
              }}
            >
              ট্রান্সজেকশন আইডি দিন
            </h3>

            {/* Transaction ID Input */}
            <input
              type="text"
              value={transactionId}
              onChange={(e) => {
                setTransactionId(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="ট্রান্সজেকশন আইডি দিন"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "8px",
                border: "none",
                fontSize: "16px",
                marginBottom: "16px",
                boxSizing: "border-box",
              }}
            />

            {/* Instructions List */}
            <div style={{ color: "white", fontSize: "14px", lineHeight: "1.8" }}>
              <p style={{ margin: "0 0 12px 0" }}>
                *247# ডায়াল করে আপনার bKash মোবাইল মেনুতে যান অথবা bKash অ্যাপে যান।
              </p>
              <p style={{ margin: "0 0 12px 0" }}>
                "Send Money" -এ ক্লিক করুন।
              </p>
              <div style={{ margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span>প্রাপক নম্বর হিসেবে এই নম্বরটি লিখুনঃ</span>
                <span style={{ fontWeight: "bold" }}>{recipientNumber}</span>
                <button
                  onClick={handleCopyNumber}
                  style={{
                    background: "white",
                    color: "#e2136e",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <FaCopy size={12} />
                  Copy
                </button>
              </div>
              <p style={{ margin: "0 0 12px 0" }}>
                টাকার পরিমাণঃ <strong>{amount || 0}</strong>
              </p>
              <p style={{ margin: "0 0 12px 0" }}>
                নিশ্চিত করতে এখন আপনার bKash মোবাইল মেনু পিন লিখুন।
              </p>
              <p style={{ margin: "0 0 12px 0" }}>
                সবকিছু ঠিক থাকলে, আপনি bKash থেকে একটি নিশ্চিতকরণ বার্তা পাবেন।
              </p>
              <p style={{ margin: "0" }}>
                এখন উপরের বক্সে আপনার Transaction ID দিন এবং নিচের VERIFY বাটনে ক্লিক করুন।
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "16px",
                color: "#dc2626",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Fixed VERIFY Button */}
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "white",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!transactionId.trim() || isVerifying}
            style={{
              width: "100%",
              padding: "16px",
              background: !transactionId.trim() || isVerifying ? "#d1d5db" : "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: !transactionId.trim() || isVerifying ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              if (transactionId.trim() && !isVerifying) {
                e.currentTarget.style.background = "#b91c1c";
              }
            }}
            onMouseOut={(e) => {
              if (transactionId.trim() && !isVerifying) {
                e.currentTarget.style.background = "#dc2626";
              }
            }}
          >
            {isVerifying ? "Verifying..." : "VERIFY"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BkashVerification;
