import { useEffect, useState } from 'react';
import { paymentApi } from '../services/api';
import type { BackendPurchase } from '../types';
import { formatTimeAgo } from '../utils/timeUtils';

const normalizedStatus = (order: BackendPurchase): 'completed' | 'pending' | 'processing' | 'failed' => {
  const status = String(order.status || '').toLowerCase();
  if (status === 'processing') return 'processing';
  if (status === 'failed' || status === 'cancelled' || status === 'rejected') return 'failed';
  if (status === 'completed' || status === 'verified' || !!order.verifiedAt) return 'completed';
  return 'pending';
};

const statusBadgeStyle = (status: 'completed' | 'pending' | 'processing' | 'failed') => {
  switch (status) {
    case 'completed': return 'bg-emerald-100 text-emerald-700';
    case 'processing': return 'bg-amber-100 text-amber-700';
    case 'failed': return 'bg-red-100 text-red-700';
    default: return 'bg-slate-100 text-slate-600';
  }
};

const statusDisplayLabel = (status: string) => {
  if (status === 'processing') return 'Processing';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

function LivePurchaseStatement() {
  const [purchases, setPurchases] = useState<BackendPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usernameCache, setUsernameCache] = useState<Record<string, string>>({});
  const [usernamesLoading, setUsernamesLoading] = useState(false);

  const fetchRecentPurchases = async () => {
    try {
      setError(null);
      const response = await paymentApi.getAll(50);
      if (response.success && Array.isArray(response.data)) {
        const filtered = response.data.filter(
          (p: BackendPurchase) => !['add_money', 'balance_transfer'].includes(p.productId || '')
        );
        setPurchases(filtered.slice(0, 10));
      } else {
        setPurchases([]);
        if (response.message) {
          setError(response.message);
        }
      }
    } catch (err: any) {
      console.error('Failed to load recent purchases:', err);
      setError(err.message || 'Failed to load recent purchases');
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentPurchases();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchRecentPurchases();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Fetch usernames for emails found in transfer transactions
  useEffect(() => {
    const fetchUsernames = async () => {
      const emailRegex = /([a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,})/g;
      const emailsToFetch = new Set<string>();

      // Extract all emails from transfer transactions
      purchases.forEach((purchase) => {
        const productName = purchase.productName || '';
        if (productName.includes('Transfer to') || productName.includes('Transfer from')) {
          // Also fetch sender email (purchase.userEmail) for transfer transactions
          if (purchase.userEmail) {
            const normalizedSenderEmail = purchase.userEmail.toLowerCase().trim();
            if (!usernameCache[normalizedSenderEmail]) {
              emailsToFetch.add(normalizedSenderEmail);
            }
          }
          
          // Extract receiver emails from productName
          const emails = productName.match(emailRegex) || [];
          emails.forEach((email) => {
            const normalizedEmail = email.toLowerCase().trim();
            // Only fetch if not already in cache
            if (!usernameCache[normalizedEmail]) {
              emailsToFetch.add(normalizedEmail);
            }
          });
        }
      });

      // Fetch usernames for emails not in cache
      if (emailsToFetch.size > 0) {
        setUsernamesLoading(true);
        try {
          const fetchPromises = Array.from(emailsToFetch).map(async (email) => {
            try {
              const response = await paymentApi.getUsernameByEmail(email);
              if (response.success && response.data && response.data.username && response.data.username.trim()) {
                // Only use username if it's not just the email username part (check if it contains spaces or is different from email prefix)
                const emailPrefix = email.split('@')[0];
                const fetchedUsername = response.data.username.trim();
                // Use fetched username if it's different from email prefix (meaning it's a real username)
                if (fetchedUsername !== emailPrefix || fetchedUsername.includes(' ')) {
                  return { email, username: fetchedUsername };
                }
              }
              // If username is same as email prefix, still use it but log for debugging
              return { email, username: email.split('@')[0] };
            } catch (err) {
              console.error(`Failed to fetch username for ${email}:`, err);
              // Fallback to email username part only if API fails
              return { email, username: email.split('@')[0] };
            }
          });

          const results = await Promise.all(fetchPromises);
          setUsernameCache((prevCache) => {
            const newCache: Record<string, string> = { ...prevCache };
            results.forEach(({ email, username }) => {
              newCache[email] = username;
            });
            return newCache;
          });
        } finally {
          setUsernamesLoading(false);
        }
      } else {
        setUsernamesLoading(false);
      }
    };

    if (purchases.length > 0) {
      fetchUsernames();
    } else {
      setUsernamesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchases]);

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '৳0';
    return `৳${price.toLocaleString('en-BD')}`;
  };

  const getUserDisplayName = (purchase: BackendPurchase) => {
    if (purchase.userName && purchase.userName.trim()) {
      return purchase.userName;
    }
    // If no userName, use email but mask it for privacy
    if (purchase.userEmail) {
      const emailParts = purchase.userEmail.split('@');
      if (emailParts[0].length > 3) {
        return `${emailParts[0].substring(0, 3)}***`;
      }
      return '***';
    }
    return 'Anonymous';
  };

  const getPurchaseDate = (purchase: BackendPurchase) => {
    return purchase.verifiedAt || purchase.createdAt;
  };

  // Format product name for transfer transactions - replace emails with actual usernames from database
  const formatProductName = (purchase: BackendPurchase, cache: Record<string, string>): string => {
    const productName = purchase.productName || '';
    
    // Check if it's a transfer transaction
    if (productName.includes('Transfer to') || productName.includes('Transfer from')) {
      // More robust email regex - matches standard email formats
      const emailRegex = /([a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,})/g;
      
      let formattedName = productName;
      const emails = formattedName.match(emailRegex) || [];
      
      // Replace each email with username from cache or purchase data (ALWAYS replace, never show email)
      emails.forEach((email) => {
        const normalizedEmail = email.toLowerCase().trim();
        // Use cache first, then check if this email matches purchase.userEmail and use purchase.userName
        let username = cache[normalizedEmail];
        if (!username && purchase.userEmail?.toLowerCase().trim() === normalizedEmail && purchase.userName?.trim()) {
          username = purchase.userName.trim();
        }
        // Always replace email - use username from cache/purchase, or fallback to email username part
        if (!username) {
          username = email.split('@')[0];
        }
        // Replace all occurrences of this email (escape special regex characters)
        formattedName = formattedName.replace(new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), username);
      });
      
      // Extract amount and service charge information if present
      const amountMatch = formattedName.match(/\(Amount: (\d+) Tk \+ Service Charge: (\d+) Tk\)/);
      const amountInfo = amountMatch ? ` (Amount: ${amountMatch[1]} Tk + Service Charge: ${amountMatch[2]} Tk)` : '';
      
      // Format: "Transfer to username (Amount: X Tk + Service Charge: Y Tk)" 
      // becomes "senderUsername transfer to username (Amount: X Tk + Service Charge: Y Tk)"
      if (formattedName.includes('Transfer to')) {
        const match = formattedName.match(/Transfer to ([a-zA-Z0-9._-]+)/);
        if (match) {
          // Get sender username from cache (database lookup) - prioritize cache, then purchase.userName
          const senderEmail = purchase.userEmail?.toLowerCase().trim();
          const senderUsername = senderEmail && cache[senderEmail] 
            ? cache[senderEmail] 
            : (purchase.userName && purchase.userName.trim() ? purchase.userName.trim() : getUserDisplayName(purchase));
          
          // Receiver username should already be replaced in formattedName, but verify it's not an email
          // If match[1] contains @, it's still an email, try to get from cache
          let receiverUsername = match[1];
          if (match[1].includes('@')) {
            const receiverEmail = match[1].toLowerCase().trim();
            receiverUsername = cache[receiverEmail] || purchase.userName || match[1].split('@')[0];
          }
          
          return `${senderUsername} transfer to ${receiverUsername}${amountInfo}`;
        }
      } else if (formattedName.includes('Transfer from')) {
        const match = formattedName.match(/Transfer from ([a-zA-Z0-9._-]+)/);
        if (match) {
          // Sender username should already be replaced in formattedName, but verify it's not an email
          let senderUsername = match[1];
          if (match[1].includes('@')) {
            const senderEmail = match[1].toLowerCase().trim();
            senderUsername = cache[senderEmail] || match[1].split('@')[0];
          }
          
          // Get receiver username from cache (database lookup) - prioritize cache, then purchase.userName
          const receiverEmail = purchase.userEmail?.toLowerCase().trim();
          const receiverUsername = receiverEmail && cache[receiverEmail]
            ? cache[receiverEmail]
            : (purchase.userName && purchase.userName.trim() ? purchase.userName.trim() : getUserDisplayName(purchase));
          
          return `${senderUsername} transfer to ${receiverUsername}${amountInfo}`;
        }
      }
      
      // Final cleanup: remove any remaining email patterns using cache or purchase.userName (ALWAYS replace)
      formattedName = formattedName.replace(emailRegex, (email) => {
        const normalizedEmail = email.toLowerCase().trim();
        // Use cache first, then check if this email matches purchase.userEmail and use purchase.userName
        let username = cache[normalizedEmail];
        if (!username && purchase.userEmail?.toLowerCase().trim() === normalizedEmail && purchase.userName?.trim()) {
          username = purchase.userName.trim();
        }
        // Always replace email - use username from cache/purchase, or fallback to email username part
        return username || email.split('@')[0];
      });
      
      return formattedName;
    }
    
    return productName;
  };

  return (
    <section className="mt-4 sm:mt-5 md:mt-7 p-3 sm:p-4 md:p-6 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] bg-white border border-slate-900/6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex-1">
          <div className="inline-block">
            <h2 className="mb-1 text-lg sm:text-xl md:text-2xl text-slate-900">
              Recent Order
            </h2>
            <div className="space-y-1">
              <div
                className="h-0.5 rounded-full"
                style={{ width: '50%', backgroundColor: 'var(--theme-primary)' }}
              />
              <div
                className="h-0.5 rounded-full"
                style={{ width: '70%', backgroundColor: 'var(--theme-primary)' }}
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="w-full py-8">
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="w-full py-8">
            <p className="text-center text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && purchases.length === 0 && (
          <div className="w-full py-8">
            <p className="text-center text-sm text-slate-500">
              No recent purchases to display
            </p>
          </div>
        )}

        {!loading && !error && purchases.length > 0 && (
          <div className="w-full">
            <div className="flex flex-col gap-2 sm:gap-3">
              {purchases.map((purchase) => {
                const isTransfer = purchase.productName?.includes('Transfer to') || purchase.productName?.includes('Transfer from');
                const productNameDisplay = formatProductName(purchase, usernameCache) || 'Unknown Product';
                
                // For transfer transactions, check if we have all usernames needed
                if (isTransfer) {
                  const senderEmail = purchase.userEmail?.toLowerCase().trim();
                  const productName = purchase.productName || '';
                  const emailRegex = /([a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,})/g;
                  const receiverEmails = productName.match(emailRegex) || [];
                  
                  // Check if we have username for sender
                  const hasSenderUsername = senderEmail && (usernameCache[senderEmail] || purchase.userName);
                  
                  // Check if we have username for all receiver emails
                  const hasAllReceiverUsernames = receiverEmails.every(email => {
                    const normalizedEmail = email.toLowerCase().trim();
                    return usernameCache[normalizedEmail];
                  });
                  
                  // Show loading if usernames are still being fetched and we don't have all usernames
                  if (usernamesLoading && (!hasSenderUsername || !hasAllReceiverUsernames)) {
                    return (
                      <div
                        key={purchase._id}
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-slate-50/80 border border-slate-200/60"
                      >
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <p
                            className="font-bold text-sm sm:text-base"
                            style={{ color: 'var(--theme-primary)' }}
                          >
                            {formatPrice(purchase.price || purchase.amount)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatTimeAgo(getPurchaseDate(purchase))}
                          </p>
                        </div>
                      </div>
                    );
                  }
                }
                
                const status = normalizedStatus(purchase);
                const displayName = getUserDisplayName(purchase);
                const initial = displayName.charAt(0).toUpperCase();

                return (
                  <div
                    key={purchase._id}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-slate-50/80 border border-slate-200/60 hover:bg-slate-100/80 transition-colors duration-150"
                  >
                    <div className="relative flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10">
                      {purchase.userPhotoURL ? (
                        <img
                          src={purchase.userPhotoURL}
                          alt={displayName}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-semibold border border-slate-200 ${purchase.userPhotoURL ? 'hidden' : ''}`}
                        style={{ backgroundColor: 'var(--theme-primary)', color: 'white', opacity: 0.9 }}
                      >
                        {initial}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-0.5">
                        <p className="font-semibold text-sm sm:text-base text-slate-900 truncate">
                          {productNameDisplay}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm text-slate-600">
                            {displayName}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeStyle(status)}`}>
                            {statusDisplayLabel(status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      <p
                        className="font-bold text-sm sm:text-base"
                        style={{ color: 'var(--theme-primary)' }}
                      >
                        {formatPrice(purchase.price || purchase.amount)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatTimeAgo(getPurchaseDate(purchase))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default LivePurchaseStatement;
