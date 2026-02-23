import { useEffect, useState } from 'react';
import { FaCheck } from 'react-icons/fa';
import { gamePackageApi } from '../services/api';
import type { BackendGamePackage, BackendGamePackagePurchase } from '../types';
import useAuth from '../hooks/useAuth';
import useRoboBalance from '../hooks/useRoboBalance';
import { getImageUrl } from '../utils/imageUrl';

// Helper function to calculate time remaining
const getTimeRemaining = (expiresAt: string | undefined): { minutes: number; seconds: number; expired: boolean } => {
  if (!expiresAt) return { minutes: 0, seconds: 0, expired: true };
  
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const difference = expiry - now;
  
  if (difference <= 0) {
    return { minutes: 0, seconds: 0, expired: true };
  }
  
  const minutes = Math.floor(difference / 1000 / 60);
  const seconds = Math.floor((difference / 1000) % 60);
  
  return { minutes, seconds, expired: false };
};

// Helper function to calculate tournament time status and countdown
const getTournamentTimeStatus = (startTime: string, endTime?: string): {
  status: 'not_started' | 'active';
  timeRemaining: { days: number; hours: number; minutes: number; seconds: number };
  targetTime: Date;
} => {
  const now = new Date().getTime();
  const start = new Date(startTime).getTime();
  
  let status: 'not_started' | 'active';
  let targetTime: Date;
  
  if (now < start) {
    status = 'not_started';
    targetTime = new Date(start);
  } else {
    status = 'active';
    // If no endTime, tournament continues indefinitely
    targetTime = endTime ? new Date(endTime) : new Date(now + 1000 * 60 * 60 * 24 * 365); // Far future if no end
  }
  
  const difference = targetTime.getTime() - now;
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);
  
  return {
    status,
    timeRemaining: { days, hours, minutes, seconds },
    targetTime
  };
};

// Helper function to format Bangladesh time for display
const formatBDTime = (utcTimeString: string): string => {
  const date = new Date(utcTimeString);
  // Add 6 hours to convert from UTC to GMT+6
  const bdDate = new Date(date.getTime() + 6 * 60 * 60 * 1000);
  return bdDate.toLocaleString('en-BD', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

function RoboGameZone() {
  const { user } = useAuth();
  const { balance, refreshBalance } = useRoboBalance();
  const [packages, setPackages] = useState<BackendGamePackage[]>([]);
  const [purchasedPackages, setPurchasedPackages] = useState<BackendGamePackagePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPurchased, setShowPurchased] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, { minutes: number; seconds: number; expired: boolean }>>({});
  const [tournamentTimeStatus, setTournamentTimeStatus] = useState<Record<string, {
    status: 'not_started' | 'active';
    timeRemaining: { days: number; hours: number; minutes: number; seconds: number };
  }>>({});

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    loadPackages();
    if (user) {
      loadPurchasedPackages();
    }
  }, [user]);

  // Update countdown timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      // Update credential expiration timers
      const updates: Record<string, { minutes: number; seconds: number; expired: boolean }> = {};
      purchasedPackages.forEach(purchase => {
        if (purchase.credentialExpiresAt) {
          updates[purchase._id] = getTimeRemaining(purchase.credentialExpiresAt);
        }
      });
      setTimeRemaining(updates);
      
      // Update tournament time status
      const tournamentUpdates: Record<string, {
        status: 'not_started' | 'active';
        timeRemaining: { days: number; hours: number; minutes: number; seconds: number };
      }> = {};
      packages.forEach(pkg => {
        if (pkg.startTime) {
          const status = getTournamentTimeStatus(pkg.startTime, pkg.endTime);
          tournamentUpdates[pkg.id] = {
            status: status.status,
            timeRemaining: status.timeRemaining
          };
        }
      });
      setTournamentTimeStatus(tournamentUpdates);
    }, 1000);

    // Initial update
    const updates: Record<string, { minutes: number; seconds: number; expired: boolean }> = {};
    purchasedPackages.forEach(purchase => {
      if (purchase.credentialExpiresAt) {
        updates[purchase._id] = getTimeRemaining(purchase.credentialExpiresAt);
      }
    });
    setTimeRemaining(updates);
    
    const tournamentUpdates: Record<string, {
      status: 'not_started' | 'active';
      timeRemaining: { days: number; hours: number; minutes: number; seconds: number };
    }> = {};
    packages.forEach(pkg => {
      if (pkg.startTime) {
        const status = getTournamentTimeStatus(pkg.startTime, pkg.endTime);
        tournamentUpdates[pkg.id] = {
          status: status.status,
          timeRemaining: status.timeRemaining
        };
      }
    });
    setTournamentTimeStatus(tournamentUpdates);

    return () => clearInterval(interval);
  }, [purchasedPackages, packages]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await gamePackageApi.getAll();
      if (response.success && Array.isArray(response.data)) {
        setPackages(response.data);
      }
    } catch (err) {
      console.error('Failed to load packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPurchasedPackages = async () => {
    if (!user?.uid) return;
    try {
      const response = await gamePackageApi.getUserPurchases(user.uid);
      if (response.success && Array.isArray(response.data)) {
        setPurchasedPackages(response.data);
      }
    } catch (err) {
      console.error('Failed to load purchased packages:', err);
    }
  };

  const handlePurchase = async (packageId: string) => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please login to purchase packages' });
      return;
    }

    if (!user.uid || !user.email) {
      setMessage({ type: 'error', text: 'User information missing' });
      return;
    }

    const package_ = packages.find(p => p.id === packageId);
    if (!package_) {
      setMessage({ type: 'error', text: 'Package not found' });
      return;
    }

    if (balance < package_.entryFee) {
      setMessage({ type: 'error', text: `Insufficient balance. Required: ৳${package_.entryFee}, Available: ৳${balance}` });
      return;
    }

    if (package_.purchaseCount >= package_.maxPurchases) {
      setMessage({ type: 'error', text: 'Package purchase limit reached' });
      return;
    }

    // Allow users to purchase multiple times - no restriction on existing purchases

    try {
      setPurchasing(packageId);
      const response = await gamePackageApi.purchase(packageId, {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || undefined
      });

      if (response.success && response.data) {
        setMessage({ type: 'success', text: 'Package purchased successfully! Check your purchased packages for room credentials.' });
        // Refresh balance
        await refreshBalance();
        // Reload packages and purchased packages
        await loadPackages();
        await loadPurchasedPackages();
        // Show purchased section
        setShowPurchased(true);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to purchase package' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to purchase package' });
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4">
        <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600">Loading packages...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
              boxShadow: '0 10px 40px rgba(var(--theme-primary-rgb), 0.35)'
            }}
          >
            <span className="text-4xl">🎮</span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text mb-2"
            style={{ background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))' }}
          >
            Robo Game Zone
          </h1>
          <p className="text-slate-600">Join tournaments and win amazing prizes!</p>
          {user && (
            <div
              className="mt-4 inline-block px-4 py-2 rounded-lg"
              style={{ background: 'var(--theme-primary-light)', color: 'var(--theme-primary)' }}
            >
              <span className="text-sm text-slate-600">Your Balance: </span>
              <span className="text-lg font-bold" style={{ color: 'var(--theme-primary)' }}>৳{balance}</span>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <p className="font-semibold">{message.text}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-200">
          <button
            onClick={() => setShowPurchased(false)}
            className={`px-4 py-2 font-semibold transition-colors ${
              !showPurchased
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Available Packages
          </button>
          {user && (
            <button
              onClick={() => setShowPurchased(true)}
              className={`px-4 py-2 font-semibold transition-colors ${
                showPurchased
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Purchases ({purchasedPackages.length})
            </button>
          )}
        </div>

        {/* Purchased Packages */}
        {showPurchased && user ? (
          <div>
            {purchasedPackages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchasedPackages.map((purchase) => {
                  const isExpired = purchase.isExpired || (purchase.credentialExpiresAt ? getTimeRemaining(purchase.credentialExpiresAt).expired : true);
                  const timeLeft = purchase.credentialExpiresAt ? (timeRemaining[purchase._id] || getTimeRemaining(purchase.credentialExpiresAt)) : { minutes: 0, seconds: 0, expired: true };
                  
                  return (
                    <div key={purchase._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <img 
                        src={getImageUrl(purchase.image) || '/placeholder.jpg'} 
                        alt={purchase.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.jpg';
                        }}
                      />
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{purchase.title}</h3>
                        <p className="text-sm text-slate-600 mb-4">{purchase.description}</p>
                        
                        {/* Expiration Status */}
                        {isExpired ? (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                            <p className="text-sm font-semibold text-red-700 mb-2">Credentials Expired</p>
                            <p className="text-xs text-red-600">Your access has expired.</p>
                          </div>
                        ) : (
                          <>
                            {/* Room Credentials */}
                            <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200 mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Room Credentials</p>
                                <div className="text-xs font-semibold text-purple-600">
                                  {timeLeft.minutes}:{timeLeft.seconds.toString().padStart(2, '0')} remaining
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-xs text-slate-600">Room ID:</span>
                                  <p className="text-lg font-mono font-bold text-purple-900">{purchase.roomId}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-slate-600">Password:</span>
                                  <p className="text-lg font-mono font-bold text-purple-900">{purchase.roomPassword}</p>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Winner Prize:</span>
                          <span className="font-bold text-purple-600">{purchase.winnerPrize}</span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Purchased: {new Date(purchase.purchasedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600 mb-4">You haven't purchased any packages yet.</p>
                <button
                  onClick={() => setShowPurchased(false)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Browse Packages
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Available Packages */
          <div>
            {packages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => {
                  const existingPurchase = purchasedPackages.find(p => p.packageId === pkg.id);
                  const isPurchased = !!existingPurchase;
                  const isExpired = existingPurchase ? (existingPurchase.isExpired || (existingPurchase.credentialExpiresAt ? getTimeRemaining(existingPurchase.credentialExpiresAt).expired : true)) : false;
                  const tournamentStatus = pkg.startTime ? tournamentTimeStatus[pkg.id] : null;
                  const canPurchase = user && balance >= pkg.entryFee && pkg.purchaseCount < pkg.maxPurchases;
                  const isLimitReached = pkg.purchaseCount >= pkg.maxPurchases;
                  
                  return (
                    <div key={pkg.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <img 
                        src={getImageUrl(pkg.image)} 
                        alt={pkg.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.jpg';
                        }}
                      />
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{pkg.title}</h3>
                        {pkg.description && (
                          <p className="text-sm text-slate-600 mb-4">{pkg.description}</p>
                        )}
                        
                        {/* Tournament Time Status */}
                        {tournamentStatus && (
                          <div className={`p-3 rounded-lg mb-4 border ${
                            tournamentStatus.status === 'not_started' 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-green-50 border-green-200'
                          }`}>
                            {tournamentStatus.status === 'not_started' && (
                              <>
                                <p className="text-sm font-semibold text-blue-700 mb-1">⏰ Starting Soon</p>
                                <p className="text-xs text-blue-600 mb-2">Starts: {formatBDTime(pkg.startTime)}</p>
                                <div className="text-xs font-mono font-bold text-blue-800">
                                  {tournamentStatus.timeRemaining.days > 0 && `${tournamentStatus.timeRemaining.days}d `}
                                  {tournamentStatus.timeRemaining.hours > 0 && `${tournamentStatus.timeRemaining.hours}h `}
                                  {tournamentStatus.timeRemaining.minutes}m {tournamentStatus.timeRemaining.seconds}s
                                </div>
                              </>
                            )}
                            {tournamentStatus.status === 'active' && (
                              <>
                                <p className="flex items-center gap-1.5 text-sm font-semibold text-green-700 mb-1"><FaCheck className="w-3.5 h-3.5 shrink-0" /> Tournament Active</p>
                                <p className="text-xs text-green-600">Started: {formatBDTime(pkg.startTime)}</p>
                              </>
                            )}
                          </div>
                        )}
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Entry Fee:</span>
                            <span className="text-lg font-bold text-purple-600">৳{pkg.entryFee}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Winner Prize:</span>
                            <span className="text-sm font-semibold text-slate-900">{pkg.winnerPrize}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Purchases:</span>
                            <span>{pkg.purchaseCount}/{pkg.maxPurchases}</span>
                          </div>
                        </div>

                        {isPurchased && !isExpired ? (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center mb-3">
                            <p className="text-sm font-semibold text-green-700">✓ Active Access</p>
                            <button
                              onClick={() => setShowPurchased(true)}
                              className="mt-2 text-xs text-green-600 hover:text-green-700 underline"
                            >
                              View Credentials
                            </button>
                          </div>
                        ) : null}
                        {isLimitReached ? (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                            <p className="text-sm font-semibold text-red-700">Sold Out</p>
                          </div>
                        ) : !user ? (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                            <p className="text-sm text-slate-600 mb-2">Login to purchase</p>
                            <a
                              href="/login"
                              className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                            >
                              Login →
                            </a>
                          </div>
                        ) : balance < pkg.entryFee ? (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                            <p className="text-sm font-semibold text-yellow-700">Insufficient Balance</p>
                            <a
                              href="/add-money"
                              className="mt-2 text-xs text-yellow-600 hover:text-yellow-700 underline"
                            >
                              Add Money →
                            </a>
                          </div>
                        ) : canPurchase ? (
                          <button
                            onClick={() => handlePurchase(pkg.id)}
                            disabled={purchasing === pkg.id}
                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {purchasing === pkg.id ? 'Processing...' : `Purchase for ৳${pkg.entryFee}`}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600">No packages available at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RoboGameZone;
