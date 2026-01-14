import { useEffect, useState, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import useRoboBalance from '../hooks/useRoboBalance';
import { balanceTransferApi, balanceApi } from '../services/api';
import { FaCheckCircle, FaWallet, FaSyncAlt } from 'react-icons/fa';

// Service charge per transaction
const SERVICE_CHARGE = 5;

function SendMoney() {
  const { user } = useAuth();
  const { backendBalance, loading: balanceLoading, refreshBalance, updateBalanceOptimistically } = useRoboBalance();
  const [transferEmail, setTransferEmail] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferMessage, setTransferMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);
  const emailSelectedFromSuggestionRef = useRef(false);

  // Email autocomplete search
  useEffect(() => {
    // Skip autocomplete if email was selected from suggestions
    if (emailSelectedFromSuggestionRef.current) {
      emailSelectedFromSuggestionRef.current = false;
      setShowSuggestions(false);
      setEmailSuggestions([]);
      return;
    }

    const searchEmails = async () => {
      const emailInput = transferEmail.trim();
      
      // Show suggestions only if user has typed at least 5 characters
      if (emailInput.length < 5) {
        setEmailSuggestions([]);
        setShowSuggestions(false);
        setIsEmailValid(false);
        return;
      }
      
      // Don't show suggestions if email is already complete and valid (user selected from suggestions)
      if (isEmailValid && emailInput.includes('@') && emailInput.includes('.')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(emailInput.toLowerCase())) {
          setShowSuggestions(false);
          return;
        }
      }

      try {
        const response = await balanceApi.searchEmails(emailInput);
        if (response.success && Array.isArray(response.data)) {
          // Filter out current user's email
          const filtered = response.data.filter(
            email => email.toLowerCase() !== user?.email?.toLowerCase()
          );
          setEmailSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
          
          // Check if the entered email (if complete) exists in the results
          const normalizedInput = emailInput.toLowerCase();
          const emailExists = filtered.some(
            email => email.toLowerCase() === normalizedInput
          );
          setIsEmailValid(emailExists);
        } else {
          setEmailSuggestions([]);
          setShowSuggestions(false);
          setIsEmailValid(false);
        }
      } catch (error) {
        console.error('Error searching emails:', error);
        setEmailSuggestions([]);
        setShowSuggestions(false);
        setIsEmailValid(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchEmails, 300);
    return () => clearTimeout(timeoutId);
  }, [transferEmail, user?.email, isEmailValid]);

  // Validate email when user finishes typing (on blur or when email is selected)
  useEffect(() => {
    const validateEmail = async () => {
      const emailInput = transferEmail.trim().toLowerCase();
      
      // Basic email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput)) {
        setIsEmailValid(false);
        return;
      }

      // Don't validate if it's the current user's email
      if (emailInput === user?.email?.toLowerCase()) {
        setIsEmailValid(false);
        return;
      }

      try {
        // Search for exact email match
        const response = await balanceApi.searchEmails(emailInput);
        if (response.success && Array.isArray(response.data)) {
          const emailExists = response.data.some(
            email => email.toLowerCase() === emailInput
          );
          setIsEmailValid(emailExists);
        } else {
          setIsEmailValid(false);
        }
      } catch (error) {
        console.error('Error validating email:', error);
        setIsEmailValid(false);
      }
    };

    // Validate when email changes and looks complete
    if (transferEmail.trim().includes('@') && transferEmail.trim().includes('.')) {
      const timeoutId = setTimeout(validateEmail, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setIsEmailValid(false);
    }
  }, [transferEmail, user?.email]);

  // Handle keyboard navigation in suggestions
  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || emailSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < emailSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      emailSelectedFromSuggestionRef.current = true;
      setTransferEmail(emailSuggestions[selectedSuggestionIndex]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      setEmailSuggestions([]); // Clear suggestions to prevent them from showing again
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (email: string) => {
    emailSelectedFromSuggestionRef.current = true;
    setTransferEmail(email);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setEmailSuggestions([]); // Clear suggestions to prevent them from showing again
    setIsEmailValid(true); // Email from suggestions is always valid
    emailInputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        emailInputRef.current &&
        !emailInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double-click/double-submission
    if (isProcessingRef.current) {
      return;
    }

    if (!user?.uid || !user.email) {
      setTransferMessage({ type: 'error', text: 'You must be logged in to send money.' });
      return;
    }

    const email = transferEmail.trim().toLowerCase();
    const amountNum = Number(transferAmount);
    const currentBalance = backendBalance !== null ? backendBalance : 0;

    if (!email) {
      setTransferMessage({ type: 'error', text: 'Please enter receiver email.' });
      return;
    }

    if (email === user.email.toLowerCase()) {
      setTransferMessage({ type: 'error', text: 'You cannot send money to your own email.' });
      return;
    }

    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setTransferMessage({ type: 'error', text: 'Please enter a valid amount greater than 0.' });
      return;
    }

    // Check if balance is sufficient for transfer amount + service charge
    const totalRequired = amountNum + SERVICE_CHARGE;
    if (totalRequired > currentBalance) {
      setTransferMessage({ 
        type: 'error', 
        text: `Insufficient balance. You need ${totalRequired.toFixed(2)} Tk (including ${SERVICE_CHARGE} Tk service charge).` 
      });
      return;
    }

    try {
      isProcessingRef.current = true;
      setTransferLoading(true);
      setTransferMessage(null);
      
      // Optimistic update: update balance immediately for instant UI feedback
      // Socket.IO event will correct any discrepancies
      // Deduct transfer amount + service charge
      updateBalanceOptimistically(amountNum + SERVICE_CHARGE);
      
      const resp = await balanceTransferApi.send({
        senderUserId: user.uid,
        senderEmail: user.email,
        receiverEmail: email,
        amount: amountNum,
        note: transferNote.trim() || undefined,
      });

      if (resp.success) {
        setTransferMessage({ type: 'success', text: `Money sent successfully. ${SERVICE_CHARGE} Tk service charge applied.` });
        setTransferAmount('');
        setTransferEmail('');
        setTransferNote('');
        setIsEmailValid(false);
        // Balance already updated optimistically, Socket.IO event will confirm/correct
      } else {
        // Transfer failed - revert optimistic update by refreshing balance
        await refreshBalance();
        setTransferMessage({
          type: 'error',
          text: resp.message || 'Failed to send money. Please try again.',
        });
      }
    } catch (err: any) {
      // Transfer failed - revert optimistic update by refreshing balance
      await refreshBalance();
      setTransferMessage({
        type: 'error',
        text: err?.message || 'Failed to send money. Please try again.',
      });
    } finally {
      isProcessingRef.current = false;
      setTransferLoading(false);
    }
  };

  return (
    <div 
      className="max-w-3xl mx-auto mt-4 sm:mt-6 md:mt-8 p-4 sm:p-6 min-h-screen"
      style={{
        background: `radial-gradient(circle at 20% 20%, rgba(var(--theme-primary-rgb), 0.08), transparent 28%), radial-gradient(circle at 80% 0%, rgba(var(--theme-secondary-rgb), 0.08), transparent 24%), #ffffff`
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Send Money</h2>
          <p className="text-sm text-slate-600">Transfer money to other Robo users instantly</p>
        </div>

        {/* Available Balance Card */}
        <div className="max-w-md mx-auto mb-4">
          <div 
            className="p-5 rounded-xl bg-white border-2 shadow-sm"
            style={{ borderColor: 'rgba(var(--theme-primary-rgb), 0.3)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--theme-primary-light)' }}
                >
                  <FaWallet className="text-sm" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Available Balance</p>
                  <p className="text-lg font-bold text-slate-900">
                    {balanceLoading ? (
                      <span className="inline-block w-16 h-5 bg-slate-200 rounded animate-pulse"></span>
                    ) : (
                      `${(backendBalance !== null ? backendBalance : 0).toFixed(2)} Tk`
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={refreshBalance}
                disabled={balanceLoading}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh Balance"
              >
                <FaSyncAlt className={`text-slate-600 text-sm ${balanceLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Send Money Form */}
        <div className="max-w-md mx-auto">
          <div 
            id="send-money" 
            className="p-5 rounded-xl bg-white border-2 shadow-sm"
            style={{ borderColor: 'rgba(var(--theme-primary-rgb), 0.3)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-blue-500 text-xl" />
                <p className="text-base font-bold text-slate-900">Send Money</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                Instant transfer
              </span>
            </div>
            {transferMessage && (
              <div
                className={`mb-2 rounded-lg px-2.5 py-1.5 text-[11px] ${
                  transferMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {transferMessage.text}
              </div>
            )}
            <form onSubmit={handleSendMoney} className="space-y-2">
              <div className="relative">
                <input
                  ref={emailInputRef}
                  type="email"
                  value={transferEmail}
                  onChange={(e) => {
                    setTransferEmail(e.target.value);
                    setSelectedSuggestionIndex(-1);
                    // Reset validation when email changes
                    if (!e.target.value.trim()) {
                      setIsEmailValid(false);
                    }
                  }}
                  onKeyDown={handleEmailKeyDown}
                  onFocus={() => {
                    // Don't show suggestions if email is already valid (selected from suggestions)
                    if (!isEmailValid && emailSuggestions.length > 0 && transferEmail.trim().length >= 5) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Receiver email"
                  disabled={transferLoading}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    '--tw-ring-color': 'var(--theme-primary)'
                  } as React.CSSProperties}
                />
                {showSuggestions && emailSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    style={{ borderColor: 'rgba(var(--theme-primary-rgb), 0.3)' }}
                  >
                    {emailSuggestions.map((email, index) => (
                      <div
                        key={email}
                        onClick={() => handleSuggestionClick(email)}
                        className={`px-3 py-2 text-xs cursor-pointer transition-colors ${
                          index === selectedSuggestionIndex
                            ? 'text-slate-900'
                            : 'text-slate-700'
                        }`}
                        style={{
                          backgroundColor: index === selectedSuggestionIndex 
                            ? 'var(--theme-primary-light)' 
                            : 'transparent',
                          color: index === selectedSuggestionIndex 
                            ? 'var(--theme-primary)' 
                            : 'rgb(51, 65, 85)'
                        }}
                        onMouseEnter={(e) => {
                          if (index !== selectedSuggestionIndex) {
                            e.currentTarget.style.backgroundColor = 'var(--theme-primary-light)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (index !== selectedSuggestionIndex) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {email}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {isEmailValid && (
                <>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="Amount"
                      disabled={transferLoading}
                      className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        '--tw-ring-color': 'var(--theme-primary)'
                      } as React.CSSProperties}
                    />
                    <input
                      type="text"
                      value={transferNote}
                      onChange={(e) => setTransferNote(e.target.value)}
                      placeholder="Refer"
                      disabled={transferLoading}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        '--tw-ring-color': 'var(--theme-primary)'
                      } as React.CSSProperties}
                    />
                  </div>
                  {transferAmount && Number(transferAmount) > 0 && (
                    <div className="px-2 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-[10px] text-amber-700">
                        <span className="font-semibold">Service Charge:</span> {SERVICE_CHARGE} Tk | <span className="font-semibold">Total:</span> {(Number(transferAmount) + SERVICE_CHARGE).toFixed(2)} Tk
                      </p>
                    </div>
                  )}
                </>
              )}
              {isEmailValid && (
                <button
                  type="submit"
                  disabled={transferLoading || balanceLoading || !user}
                  className="mt-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed w-full"
                  style={{
                    background: `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`
                  }}
                  onMouseEnter={(e) => {
                    if (!transferLoading && !balanceLoading && user) {
                      e.currentTarget.style.background = `linear-gradient(to right, var(--theme-primary-hover), var(--theme-secondary-dark))`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!transferLoading && !balanceLoading && user) {
                      e.currentTarget.style.background = `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`;
                    }
                  }}
                >
                  {transferLoading ? 'Sending...' : 'Send Money'}
                </button>
              )}
              <p className="mt-1 text-[10px] text-slate-500">
                যাকে টাকা পাঠাবেন তার email address দিন
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SendMoney;
