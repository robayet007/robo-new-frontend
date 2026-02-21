import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useRoboBalance from '../hooks/useRoboBalance';
import useReseller from '../hooks/useReseller';
import useCatalog from '../hooks/useCatalog';
import { membershipApi } from '../services/api';
import type { BackendMembershipPackage, BackendMembershipPurchase } from '../types';
import { FaCrown, FaCheckCircle, FaClock, FaTag, FaWallet } from 'react-icons/fa';

function Membership() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { backendBalance, refreshBalance } = useRoboBalance();
  const { refreshReseller } = useReseller();
  const { refresh: refreshCatalog } = useCatalog();
  const [packages, setPackages] = useState<BackendMembershipPackage[]>([]);
  const [myMembership, setMyMembership] = useState<BackendMembershipPurchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [confirmPurchase, setConfirmPurchase] = useState<{ packageId: string; price: number; packageName: string } | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) {
      return;
    }
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    // Clear any previous error messages at the start
    setMessage(null);
    setLoading(true);
    
    let packagesRes: any = null;
    let membershipRes: any = null;
    let networkErrorOccurred = false;
    
    try {
      // Make API calls - handle network errors separately
      [packagesRes, membershipRes] = await Promise.all([
        membershipApi.getPackages(),
        membershipApi.getMyMembership(user?.uid, user?.email || undefined)
      ]);
    } catch (networkError: any) {
      // Network/connection errors - mark that an error occurred but don't show message yet
      console.error('Network error loading membership data:', networkError);
      networkErrorOccurred = true;
      // Don't set error message here - wait until finally block to check if we actually failed
    }

    try {
      // Check packages response - this is critical, show error only if it fails
      if (packagesRes?.success && Array.isArray(packagesRes.data)) {
        setPackages(packagesRes.data);
        // Successfully loaded packages - ensure no error message
        setMessage(null);
      } else if (packagesRes && !packagesRes.success) {
        // API returned success: false - will handle in finally block
        // Don't set error here - wait for loading to complete
      } else if (!packagesRes && networkErrorOccurred) {
        // Network error occurred and no response - will handle in finally block
        // Don't set error here - wait for loading to complete
      }
      // If packagesRes.data is empty array (success: true but empty), don't show error - just show empty state

      // Check membership status response - this is optional, fail silently
      if (membershipRes?.success && membershipRes.data) {
        setMyMembership(membershipRes.data);
      }
      // Don't show error for membership status failure - it's optional information
      
    } catch (error: any) {
      // Fallback for any unexpected errors during response processing
      // Error is handled in finally block - no need to log
      // Don't set error here - wait for finally block
    } finally {
      setLoading(false);
      // After loading completes, check if we need to show any errors
      // Only show error if packages actually failed to load
      if (packagesRes?.success && Array.isArray(packagesRes.data)) {
        // Success - clear any error messages
        setMessage(null);
      } else if (networkErrorOccurred && !packagesRes) {
        // Network error and no response received
        setMessage({ type: 'error', text: 'Network error. Please check your connection and try again.' });
      } else if (packagesRes && !packagesRes.success) {
        // API returned success: false
        const errorMsg = packagesRes.message || 'Failed to load membership packages';
        setMessage({ type: 'error', text: errorMsg });
      } else if (!packagesRes) {
        // No response received (shouldn't happen, but handle it)
        setMessage({ type: 'error', text: 'Failed to load membership packages. Please try again.' });
      }
    }
  };

  const handlePurchaseClick = (packageId: string, price: number, packageName: string) => {
    if (!user?.uid || !user?.email) {
      setMessage({ type: 'error', text: 'Please login to purchase membership' });
      navigate('/login');
      return;
    }

    // Check balance
    if (backendBalance === null || backendBalance < price) {
      setMessage({ type: 'error', text: `Insufficient balance. Required: ৳${price.toFixed(2)}, Available: ৳${(backendBalance || 0).toFixed(2)}` });
      return;
    }

    // Show confirmation pop-up
    setConfirmPurchase({ packageId, price, packageName });
  };

  const handleConfirmPurchase = async () => {
    if (!confirmPurchase || !user?.uid || !user?.email) return;

    const { packageId } = confirmPurchase;
    setConfirmPurchase(null); // Close pop-up

    try {
      setPurchasing(packageId);
      setMessage(null);

      const response = await membershipApi.purchaseMembership(
        packageId,
        user.uid,
        user.email,
        user.displayName || undefined
      );

      // Check if response exists and has success property
      if (response && response.success && response.data) {
        setMessage({ 
          type: 'success', 
          text: `Membership purchased successfully! Your Reseller role is active until ${new Date(response.data.expiresAt).toLocaleDateString()}` 
        });
        // Refresh data, balance, reseller status, and catalog (for reseller prices) immediately
        await Promise.all([loadData(), refreshBalance(), refreshReseller(), refreshCatalog()]);
      } else {
        // Handle error response from API
        const errorMessage = response?.message || 'Failed to purchase membership';
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error: any) {
      // Handle different types of errors
      let errorMessage = 'Failed to purchase membership';
      
      if (error?.message) {
        if (error.message.includes('JSON') || error.message.includes('parse')) {
          errorMessage = 'Invalid response from server. Please check your connection and try again.';
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setPurchasing(null);
    }
  };

  const handleCancelPurchase = () => {
    setConfirmPurchase(null);
  };

  if (loading) {
    return (
      <div className="max-w-6xl p-4 mx-auto mt-4 sm:mt-6 md:mt-8 sm:p-6">
        <div className="flex items-center justify-center py-12">
          <div
            className="w-12 h-12 border-4 rounded-full border-t-transparent animate-spin"
            style={{ borderColor: 'var(--theme-primary)' }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Confirmation Pop-up Modal */}
      {confirmPurchase && (
        <>
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            .modal-backdrop {
              animation: fadeIn 0.2s ease-in-out;
            }
            .modal-content {
              animation: fadeIn 0.2s ease-in-out;
            }
          `}</style>
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 modal-backdrop"
            style={{ 
              zIndex: 9999,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={handleCancelPurchase}
          >
            <div 
              className="relative w-full max-w-md bg-white border-2 border-purple-200 shadow-2xl rounded-2xl modal-content"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Modal Header */}
            <div className="p-6 border-b-2 border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <FaCrown className="text-2xl text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Confirm Purchase</h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="mb-2 text-lg font-semibold text-slate-900">
                  Purchase membership for <span className="text-purple-600">{confirmPurchase.packageName}</span>?
                </p>
                <div className="p-4 border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                  <p className="mb-1 text-sm text-slate-600">Total Amount</p>
                  <p className="text-3xl font-extrabold text-slate-900">
                    ৳{confirmPurchase.price.toFixed(2)}
                  </p>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  This will deduct <span className="font-semibold text-red-600">৳{confirmPurchase.price.toFixed(2)}</span> from your Robo balance.
                </p>
                {backendBalance !== null && (
                  <p className="mt-2 text-xs text-slate-500">
                    Remaining balance: <span className="font-semibold text-green-600">৳{(backendBalance - confirmPurchase.price).toFixed(2)}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t-2 border-slate-100 rounded-b-2xl">
              <button
                onClick={handleCancelPurchase}
                className="flex-1 px-4 py-3 font-semibold transition-colors duration-200 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
                className="flex-1 px-4 py-3 font-bold text-white rounded-xl transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`,
                  boxShadow: `0 10px 25px -5px rgba(var(--theme-primary-rgb), 0.3)`
                }}
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      <div className="max-w-6xl p-4 mx-auto mt-4 sm:mt-6 md:mt-8 sm:p-6">
        <div className="space-y-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="flex items-center gap-2 mb-2 text-3xl font-bold sm:text-4xl text-slate-900">
            <FaTag className="w-8 h-8 sm:w-9 sm:h-9 text-purple-600 shrink-0" />
            Membership Packages
          </h1>
          <p className="text-slate-600">
            Purchase Reseller membership to get access to reseller prices
          </p>
        </div>

        {/* Message - Only show when not loading and not initial load */}
        {message && !loading && (
          <div className={`p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <p className="font-semibold">{message.text}</p>
          </div>
        )}

        {/* Current Membership Status */}
        {myMembership && myMembership.isActive && (
          <div className="p-6 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <FaCrown className="text-2xl text-purple-600" />
              <h2 className="text-xl font-bold text-slate-900">Active Membership</h2>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-slate-700">
                <span className="font-semibold">Package:</span> {myMembership.packageName}
              </p>
              <p className="text-slate-700">
                <span className="font-semibold">Expires:</span> {new Date(myMembership.expiresAt).toLocaleDateString()}
              </p>
              {myMembership.daysRemaining !== undefined && (
                <p className="font-semibold text-purple-600">
                  <FaClock className="inline mr-1" />
                  {myMembership.daysRemaining} days remaining
                </p>
              )}
            </div>
          </div>
        )}

        {/* Balance Info - Beautiful Card */}
        <div className="relative p-6 overflow-hidden border-2 border-green-200 shadow-lg bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center p-3 shadow-sm bg-white/80 rounded-xl">
                <FaWallet className="text-2xl text-green-600" />
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-slate-600">Available Balance</p>
                <p className="text-3xl font-extrabold text-green-700 sm:text-4xl">
                  ৳{(backendBalance !== null ? backendBalance : 0).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="px-4 py-2 border border-green-200 rounded-lg bg-white/80">
              <p className="text-xs font-semibold tracking-wide uppercase text-slate-600">Robo Balance</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 -mt-16 -mr-16 rounded-full bg-green-200/20"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 -mb-12 -ml-12 rounded-full bg-emerald-200/20"></div>
        </div>

        {/* Packages Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Available Packages</h2>
          <span className="text-sm text-slate-500">{packages.length} {packages.length === 1 ? 'package' : 'packages'}</span>
        </div>

        {/* Packages Grid */}
        {packages.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed bg-slate-50 rounded-2xl border-slate-300">
            <FaCrown className="mx-auto mb-3 text-4xl text-slate-400" />
            <p className="font-medium text-slate-600">No membership packages available at the moment.</p>
            <p className="mt-1 text-sm text-slate-500">Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => {
              const canAfford = backendBalance !== null && backendBalance >= pkg.price;
              const isPurchasing = purchasing === pkg.id;

              return (
                <div
                  key={pkg.id}
                  className={`group relative flex flex-col overflow-hidden transition-all duration-300 bg-white rounded-2xl border-2 ${
                    canAfford && !isPurchasing
                      ? 'border-purple-200 hover:border-purple-400 hover:shadow-2xl hover:-translate-y-1'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Card Header with Gradient */}
                  <div className="relative p-6 border-b-2 border-purple-100 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <FaCrown className="text-xl text-purple-600" />
                        </div>
                        <div>
                          <h3 className="mb-1 text-xl font-bold text-slate-900">{pkg.name}</h3>
                          {pkg.description && (
                            <p className="text-xs leading-relaxed text-slate-600">{pkg.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {!pkg.isActive && (
                      <div className="absolute px-2 py-1 rounded-md top-4 right-4 bg-slate-200">
                        <span className="text-xs font-semibold text-slate-600">Inactive</span>
                      </div>
                    )}
                  </div>

                  {/* Package Content */}
                  <div className="flex flex-col flex-grow p-6">
                    {/* Package Details */}
                    <div className="flex-grow mb-6 space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                        <FaCheckCircle className="flex-shrink-0 text-green-500" />
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-0.5">Role</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {pkg.role.charAt(0).toUpperCase() + pkg.role.slice(1)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                        <FaClock className="flex-shrink-0 text-blue-500" />
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-0.5">Duration</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {pkg.durationDays} {pkg.durationDays === 1 ? 'day' : 'days'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Price Section */}
                    <div className="p-4 mb-6 border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                      <div className="text-center">
                        <p className="mb-1 text-xs font-medium tracking-wide uppercase text-slate-600">Price</p>
                        <p className="mb-1 text-4xl font-extrabold text-slate-900">
                          ৳{pkg.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">One-time payment</p>
                      </div>
                    </div>

                    {/* Buy Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePurchaseClick(pkg.id, pkg.price, pkg.name);
                      }}
                      disabled={!canAfford || isPurchasing || !!purchasing || !pkg.isActive}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-white transition-all duration-200 ${
                        !canAfford || !pkg.isActive
                          ? 'bg-slate-300 cursor-not-allowed'
                          : isPurchasing
                          ? 'bg-slate-400 cursor-wait'
                          : 'hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                      style={
                        canAfford && !isPurchasing && pkg.isActive
                          ? {
                              background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`,
                              boxShadow: `0 10px 25px -5px rgba(var(--theme-primary-rgb), 0.3)`
                            }
                          : {}
                      }
                    >
                      {isPurchasing ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                          Processing...
                        </span>
                      ) : !pkg.isActive ? (
                        'Not Available'
                      ) : !canAfford ? (
                        <span className="flex items-center justify-center gap-2">
                          <span>Insufficient Balance</span>
                          <span className="text-xs opacity-75">(Need ৳{(pkg.price - (backendBalance || 0)).toFixed(2)} more)</span>
                        </span>
                      ) : (
                        'Buy Now'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default Membership;
