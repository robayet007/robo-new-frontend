// BkashVerification.tsx - Fixed Version
import { useState } from "react";
import type { FormEvent } from "react";

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
  const [showSuccess, setShowSuccess] = useState(false);

  const validateTransactionId = (trxId: string): boolean => {
    const trxIdRegex = /^[A-Z0-9]{10,12}$/;
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
      setError("সঠিক bKash Transaction ID দিন (10-12 characters)");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      // Call onVerify which is async
      await onVerify(trimmedTrxId);
      
      // If successful, show success message
      setShowSuccess(true);
      
      // Auto close after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Payment verification failed. Please try again.');
      setIsVerifying(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTransactionId(text.trim().toUpperCase());
        setError("");
      }
    } catch (err) {
      setError("Clipboard access not available. Please type manually.");
    }
  };

  const clearInput = () => {
    setTransactionId("");
    setError("");
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
        padding: "0",
        backdropFilter: "blur(4px)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0",
          width: "100%",
          height: "100vh",
          maxWidth: "100%",
          maxHeight: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "none",
          position: "relative",
        }}
      >
        {/* Header - Fixed */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid #eef2f7",
            background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1.25rem",
              color: "#1e293b",
              fontWeight: "700",
            }}
          >
            bKash Payment
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              fontSize: "20px",
              cursor: "pointer",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#e2e8f0";
              e.currentTarget.style.color = "#475569";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            ×
          </button>
        </div>

        {/* Main Content - Scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            paddingBottom: "80px", // Extra padding for button
          }}
        >
          {/* Payment Instructions Card */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid #e2e8f0",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
                background: "linear-gradient(135deg, #e2136e, #d70270)",
                color: "white",
                padding: "14px",
                borderRadius: "12px",
              }}
            >
              <span
                style={{
                  background: "white",
                  color: "#e2136e",
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "16px",
                  flexShrink: 0,
                }}
              >
                bK
              </span>
              <p
                style={{
                  margin: 0,
                  fontWeight: "600",
                  fontSize: "1rem",
                  flex: 1,
                }}
              >
                bKash Payment Verification
              </p>
            </div>

            {/* Payment Details - Compact */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                  Amount:
                </span>
                <span
                  style={{
                    color: "#1e293b",
                    fontWeight: "700",
                    fontSize: "1.1rem",
                    background: "#f0f9ff",
                    padding: "6px 12px",
                    borderRadius: "8px",
                  }}
                >
                  ৳{amount || 0}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                }}
              >
                <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                  Send to:
                </span>
                <span
                  style={{
                    color: "#e2136e",
                    fontWeight: "700",
                    fontSize: "1rem",
                    backgroundColor: "#fff1f8",
                    padding: "6px 12px",
                    borderRadius: "8px",
                  }}
                >
                  01766325020
                </span>
              </div>
            </div>

            {/* Instructions - Compact */}
            <div style={{ marginBottom: "20px" }}>
              <h4
                style={{
                  margin: "0 0 12px 0",
                  color: "#1e293b",
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>📋</span>
                <span>Payment Steps:</span>
              </h4>
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "10px",
                  padding: "16px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        background: "#e2136e",
                        color: "white",
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "bold",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      1
                    </span>
                    <span style={{ color: "#475569", fontSize: "0.9rem" }}>
                      Open <strong>bKash app</strong>
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        background: "#e2136e",
                        color: "white",
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "bold",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      2
                    </span>
                    <span style={{ color: "#475569", fontSize: "0.9rem" }}>
                      screen <strong>দেখানো নম্বরে Send Money করুন 💸</strong>
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        background: "#e2136e",
                        color: "white",
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "bold",
                        marginTop: "2px",
                      }}
                    >
                      3
                    </span>
                    <span style={{ color: "#475569", fontSize: "0.9rem" }}>
                      Enter:{" "}
                      <strong style={{ color: "#e2136e" }}>01766325020</strong>
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        background: "#e2136e",
                        color: "white",
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "bold",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      4
                    </span>
                    <span style={{ color: "#475569", fontSize: "0.9rem" }}>
                      Amount: <strong>৳{amount || 0}</strong>
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        background: "#e2136e",
                        color: "white",
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "bold",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      5
                    </span>
                    <span style={{ color: "#475569", fontSize: "0.9rem" }}>
                      🔢 আপনার <strong>PIN</strong> দিন এবং প্রদর্শিত{" "}
                      <strong>TrxID</strong> কপি করে নিন 📋
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Message - Compact */}
            <div
              style={{
                backgroundColor: "#f0f9ff",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontWeight: "600",
                  color: "#475569",
                  marginBottom: "10px",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>💬</span>
                {/* <span>Example bKash message:</span> */}
              </div>
              <div
                style={{
                  backgroundColor: "white",
                  padding: "14px",
                  borderRadius: "8px",
                  borderLeft: "4px solid #e2136e",
                  fontSize: "0.85rem",
                  lineHeight: "1.5",
                  color: "#334155",
                  wordBreak: "break-all",
                }}
              >
                {/* <strong>bKash:</strong> Payment of Tk {amount} to 01766325020 successful.  */}
                <div style={{ marginTop: "6px" }}>
                  <strong>TrxID:</strong>{" "}
                  <span
                    style={{
                      color: "#e2136e",
                      backgroundColor: "#fff1f8",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontWeight: "700",
                      display: "inline-block",
                      marginTop: "4px",
                    }}
                  >
                    C7H9J2K4L5M
                  </span>
                </div>
              </div>
              <div
                style={{
                  color: "#64748b",
                  fontSize: "0.8rem",
                  marginTop: "10px",
                  padding: "8px",
                  background: "#f8fafc",
                  borderRadius: "6px",
                  border: "1px dashed #cbd5e1",
                }}
              >
                📥 Copy করুন: <strong>TrxID</strong> — তারপর সেটি নিচের বক্সে
                পেস্ট করে সাবমিট করুন ✔️
              </div>
            </div>

            {/* Transaction ID Input - Mobile Optimized */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <label
                    htmlFor="transactionId"
                    style={{
                      fontWeight: "600",
                      color: "#475569",
                      fontSize: "0.95rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>🔑</span>
                    <span>Transaction ID (TrxID)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handlePaste}
                    style={{
                      background: "linear-gradient(135deg, #e2136e, #d70270)",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "500",
                      fontSize: "0.8rem",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      flexShrink: 0,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, #c91163, #b6025f)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, #e2136e, #d70270)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    📋 Paste
                  </button>
                </div>

                <div style={{ position: "relative", marginBottom: "8px" }}>
                  <input
                    id="transactionId"
                    type="text"
                    value={transactionId}
                    onChange={(e) => {
                      setTransactionId(e.target.value.toUpperCase());
                      setError("");
                    }}
                    placeholder="Enter TrxID (e.g., C7H9J2K4L5M)"
                    disabled={isVerifying}
                    style={{
                      width: "100%",
                      padding: "16px",
                      paddingRight: transactionId ? "50px" : "16px",
                      border: error ? "2px solid #ef4444" : "2px solid #cbd5e1",
                      borderRadius: "12px",
                      fontSize: "1rem",
                      fontWeight: "400",
                      letterSpacing: "1px",
                      color: "#1e293b",
                      backgroundColor: isVerifying ? "#f1f5f9" : "white",
                      boxSizing: "border-box",
                      transition: "all 0.3s ease",
                      WebkitAppearance: "none",
                    }}
                    onFocus={(e) => {
                      if (!isVerifying) {
                        e.target.style.borderColor = "#e2136e";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(226, 19, 110, 0.1)";
                      }
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = error
                        ? "#ef4444"
                        : "#cbd5e1";
                      e.target.style.boxShadow = "none";
                    }}
                    autoFocus
                  />

                  {transactionId && (
                    <button
                      type="button"
                      onClick={clearInput}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "#f1f5f9",
                        color: "#64748b",
                        border: "none",
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#e2e8f0";
                        e.currentTarget.style.color = "#475569";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#f1f5f9";
                        e.currentTarget.style.color = "#64748b";
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>

                {error && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "8px",
                      padding: "12px",
                      backgroundColor: "#fef2f2",
                      borderRadius: "8px",
                      borderLeft: "4px solid #ef4444",
                    }}
                  >
                    <span
                      style={{
                        color: "#ef4444",
                        fontSize: "1.2rem",
                        flexShrink: 0,
                      }}
                    >
                      ⚠
                    </span>
                    <span
                      style={{
                        color: "#dc2626",
                        fontSize: "0.85rem",
                        fontWeight: "500",
                        lineHeight: "1.4",
                      }}
                    >
                      {error}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "12px",
                    padding: "12px",
                    backgroundColor: "#f0f9ff",
                    borderRadius: "8px",
                    borderLeft: "4px solid #0ea5e9",
                  }}
                >
                  <span
                    style={{
                      color: "#0ea5e9",
                      fontSize: "1rem",
                      flexShrink: 0,
                    }}
                  >
                    💡
                  </span>
                  <span
                    style={{
                      color: "#0369a1",
                      fontSize: "0.8rem",
                      lineHeight: "1.4",
                    }}
                  >
                    TrxID is 10-12 characters, only letters & numbers
                  </span>
                </div>
              </div>

              {/* Important Notes */}
              <div
                style={{
                  backgroundColor: "#fffbeb",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "20px",
                  border: "1px solid #fbbf24",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      color: "#d97706",
                      fontSize: "1.2rem",
                      flexShrink: 0,
                    }}
                  >
                    ⚠️
                  </span>
                  <div>
                    <strong style={{ color: "#92400e", fontSize: "0.9rem" }}>
                      গুরুত্বপূর্ণ নির্দেশনা:
                    </strong>
                    <ul
                      style={{
                        margin: "8px 0 0 0",
                        paddingLeft: "18px",
                        color: "#92400e",
                        fontSize: "0.85rem",
                        lineHeight: "1.5",
                      }}
                    >
                      <li>
                        সঠিক পরিমাণ পাঠান: <strong>৳{amount || 0}</strong>
                      </li>
                      <li>
                        যে নম্বরে পাঠাতে হবে: <strong>01766325020</strong>
                      </li>
                      {/* <li>ডেলিভারি: যাচাইয়ের পর ৬০ সেকেন্ডের মধ্যে</li> */}
                    </ul>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Fixed Confirm Button at Bottom */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "16px 20px",
            backgroundColor: "white",
            borderTop: "1px solid #e2e8f0",
            boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.05)",
            zIndex: 10,
          }}
        >
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!transactionId.trim() || isVerifying}
            style={{
              width: "100%",
              padding: "18px",
              background:
                !transactionId.trim() || isVerifying
                  ? "#cbd5e1"
                  : "linear-gradient(135deg, #e2136e, #d70270)",
              color: "white",
              border: "none",
              borderRadius: "14px",
              fontSize: "1.1rem",
              fontWeight: "700",
              cursor:
                !transactionId.trim() || isVerifying ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow:
                !transactionId.trim() || isVerified
                  ? "none"
                  : "0 6px 20px rgba(226, 19, 110, 0.3)",
              letterSpacing: "0.5px",
            }}
            onMouseOver={(e) => {
              if (transactionId.trim() && !isVerifying) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(226, 19, 110, 0.4)";
              }
            }}
            onMouseOut={(e) => {
              if (transactionId.trim() && !isVerifying) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(226, 19, 110, 0.3)";
              }
            }}
          >
            {isVerifying ? (
              <>
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    border: "3px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "50%",
                    borderTopColor: "white",
                    animation: "spin 1s linear infinite",
                  }}
                ></span>
                Verifying Payment...
              </>
            ) : (
              <>
                <span style={{ fontSize: "1.2rem" }}>✅</span>
                Confirm Payment
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Popup - Full Screen Mobile */}
      {showSuccess && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1001,
            padding: "20px",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "400px",
              textAlign: "center",
              animation: "popIn 0.5s ease",
            }}
          >
            <div
              style={{
                width: "100px",
                height: "100px",
                backgroundColor: "#10b981",
                color: "white",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "48px",
                fontWeight: "bold",
                margin: "0 auto 30px",
                boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)",
              }}
            >
              ✓
            </div>

            <h3
              style={{
                margin: "0 0 20px 0",
                color: "#065f46",
                fontSize: "1.8rem",
                fontWeight: "700",
              }}
            >
              Payment Successful!
            </h3>

            <div
              style={{
                backgroundColor: "#f0fdf4",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "30px",
                border: "2px solid #a7f3d0",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: "1px solid #d1fae5",
                }}
              >
                <span style={{ color: "#475569", fontSize: "0.95rem" }}>
                  Transaction ID:
                </span>
                <strong
                  style={{
                    color: "#065f46",
                    fontSize: "1rem",
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {transactionId}
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: "1px solid #d1fae5",
                }}
              >
                <span style={{ color: "#475569", fontSize: "0.95rem" }}>
                  Amount:
                </span>
                <strong style={{ color: "#065f46", fontSize: "1.1rem" }}>
                  ৳{amount || 0}
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                }}
              >
                <span style={{ color: "#475569", fontSize: "0.95rem" }}>
                  Time:
                </span>
                <strong style={{ color: "#065f46", fontSize: "0.95rem" }}>
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#d1fae5",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "30px",
              }}
            >
              <p
                style={{
                  color: "#065f46",
                  margin: "0 0 10px 0",
                  fontWeight: "600",
                  fontSize: "1rem",
                }}
              >
                ✅ Payment verified successfully!
              </p>
              <p
                style={{
                  color: "#059669",
                  margin: "0",
                  fontSize: "0.9rem",
                  lineHeight: "1.5",
                }}
              >
                Your diamonds will be delivered to your Free Fire account within
                60 seconds.
              </p>
            </div>

            <div
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: "#e5e7eb",
                borderRadius: "4px",
                overflow: "hidden",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#10b981",
                  animation: "progress 3s linear forwards",
                }}
              ></div>
            </div>

            <p
              style={{
                color: "#64748b",
                fontSize: "0.9rem",
                margin: 0,
              }}
            >
              Redirecting in 3 seconds...
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalAppear {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        /* Hide scrollbar but keep functionality */
        div::-webkit-scrollbar {
          width: 4px;
        }
        
        div::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 2px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Mobile optimizations */
        @media (max-width: 480px) {
          input, button {
            font-size: 16px !important; /* Prevents zoom on iOS */
          }
        }
      `}</style>
    </div>
  );
}

export default BkashVerification;
