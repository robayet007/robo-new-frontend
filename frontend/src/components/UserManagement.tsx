import { useState, useEffect } from 'react';
import useUsers, { type UserRole, type AppUser } from '../hooks/useUsers';
import useAuth from '../hooks/useAuth';
import { balanceApi, paymentApi, adminRoleApi, type AdminModerationPermissions } from '../services/api';

function UserManagement() {
  const { users, loading, updateUserRole, refreshUsers, addUser, syncCurrentUser } = useUsers();
  const { user: currentUser } = useAuth();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<AppUser | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceValue, setBalanceValue] = useState<string>('');

  type ModerationPermissions = AdminModerationPermissions;

  type Role = 'user' | 'moderator' | 'admin' | 'reseller';

  type PaymentUserSummary = {
    userId: string;
    userEmail: string;
    userName: string;
    lastBalance: number | null;
    lastPaymentAt: string | null;
    totalOrders: number;
    role?: Role;
    moderationPermissions?: ModerationPermissions;
  };

  const [paymentUsers, setPaymentUsers] = useState<PaymentUserSummary[]>([]);
  const [paymentUsersLoading, setPaymentUsersLoading] = useState(false);

  type BalanceRecord = {
    userId: string;
    userEmail: string;
    balance: number;
  };

  const [balanceRecords, setBalanceRecords] = useState<BalanceRecord[]>([]);
  const [balanceRecordsLoading, setBalanceRecordsLoading] = useState(false);

  const [selectedModerator, setSelectedModerator] = useState<PaymentUserSummary | null>(null);
  const [modPerms, setModPerms] = useState<ModerationPermissions>({
    canAccessDashboard: false,
    canManageProducts: false,
    canManageBanners: false,
    canManageNotices: false,
    canManageGamePackages: false,
    canManageUsers: false,
    canManageOrders: false,
  });

  // Add current user if not in list
  useEffect(() => {
    if (currentUser && !loading) {
      const userExists = users.find(u => u.uid === currentUser.uid);
      if (!userExists) {
        addUser(currentUser);
        setTimeout(() => refreshUsers(), 500);
      }
    }
  }, [currentUser, users, loading, addUser, refreshUsers]);

  useEffect(() => {
    refreshUsers();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Add current user if not in list
  useEffect(() => {
    if (currentUser && !loading) {
      syncCurrentUser(currentUser);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, loading]);

  // Load per-user summary from /api/payments
  useEffect(() => {
    const loadPaymentUsers = async () => {
      try {
        setPaymentUsersLoading(true);
        const resp = await paymentApi.getAll(500);
        if (!resp.success || !Array.isArray(resp.data)) {
          setPaymentUsers([]);
          return;
        }

        // Load roles from backend
        let roleMap = new Map<string, { role: Role; moderationPermissions?: ModerationPermissions }>();
        try {
          const rolesResp = await adminRoleApi.getAll();
          if (rolesResp.success && Array.isArray(rolesResp.data)) {
            roleMap = new Map(
              (rolesResp.data as any[]).map((r) => {
                const key = (r.userId || r.userEmail || '').toString();
                return [
                  key,
                  {
                    role: (r.role as Role) || 'user',
                    moderationPermissions: r.moderationPermissions || {},
                  },
                ];
              })
            );
          }
        } catch {
          // ignore role fetch errors; we'll just default to user
        }

        const byKey = new Map<string, PaymentUserSummary>();

        (resp.data as any[]).forEach((p) => {
          const email: string | undefined = p.userEmail;
          const uid: string | undefined = p.userId;
          if (!email && !uid) return;

          const key = uid || email!;
          const createdTs = new Date(p.verifiedAt || p.createdAt || Date.now()).toISOString();

          const existing = byKey.get(key);
          if (!existing) {
            const roleInfo = roleMap.get(key) || { role: 'user' as Role, moderationPermissions: {} };
            byKey.set(key, {
              userId: uid || email || 'unknown',
              userEmail: email || 'unknown',
              userName: p.userName || '',
              lastBalance:
                typeof p.updatedBalance === 'number' ? Number(p.updatedBalance) : null,
              lastPaymentAt: createdTs,
              totalOrders: 1,
              role: roleInfo.role,
              moderationPermissions: roleInfo.moderationPermissions || {},
            });
          } else {
            existing.totalOrders += 1;

            // update last payment time if newer
            if (
              existing.lastPaymentAt &&
              new Date(createdTs).getTime() > new Date(existing.lastPaymentAt).getTime()
            ) {
              existing.lastPaymentAt = createdTs;
              if (typeof p.updatedBalance === 'number') {
                existing.lastBalance = Number(p.updatedBalance);
              }
            }
          }
        });

        const list = Array.from(byKey.values()).sort((a, b) => {
          const at = a.lastPaymentAt ? new Date(a.lastPaymentAt).getTime() : 0;
          const bt = b.lastPaymentAt ? new Date(b.lastPaymentAt).getTime() : 0;
          return bt - at;
        });

        setPaymentUsers(list);
      } catch (err) {
        // console.error('Error loading payment users:', err);
      } finally {
        setPaymentUsersLoading(false);
      }
    };

    loadPaymentUsers();
  }, []);

  // Load current balances from /api/balance (source of truth)
  useEffect(() => {
    const loadBalances = async () => {
      try {
        setBalanceRecordsLoading(true);
        const resp = await balanceApi.getAllBalances();
        if (!resp.success || !Array.isArray(resp.data)) {
          setBalanceRecords([]);
          return;
        }

        const list: BalanceRecord[] = (resp.data as any[]).map((b) => ({
          userId: b.userId,
          userEmail: b.userEmail,
          balance: typeof b.balance === 'number' ? Number(b.balance) : 0,
        }));

        setBalanceRecords(list);
      } catch (err) {
        // console.error('Error loading balances:', err);
        setBalanceRecords([]);
      } finally {
        setBalanceRecordsLoading(false);
      }
    };

    loadBalances();
  }, []);

  const handleRoleChange = async (userEmail: string, newRole: UserRole) => {
    if (!userEmail) return;

    // Prevent changing own role
    if (userEmail === currentUser?.email) {
      setMessage({ type: 'error', text: 'You cannot change your own role' });
      return;
    }

    updateUserRole(userEmail, newRole);
    setMessage({ 
      type: 'success', 
      text: `User role updated to ${newRole}` 
    });
    setTimeout(() => refreshUsers(), 300);
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(search) ||
      user.displayName?.toLowerCase().includes(search) ||
      user.uid.toLowerCase().includes(search)
    );
  });

  const adminUsers = filteredUsers.filter(u => u.role === 'admin');
  const regularUsers = filteredUsers.filter(u => u.role === 'user');

  // Calculate role counts from paymentUsers (more comprehensive)
  const totalUsers = paymentUsers.length;
  const adminCount = paymentUsers.filter(u => u.role === 'admin').length;
  const resellerCount = paymentUsers.filter(u => u.role === 'reseller').length;
  const moderatorCount = paymentUsers.filter(u => u.role === 'moderator').length;
  const userCount = paymentUsers.filter(u => !u.role || u.role === 'user').length;

  const filteredPaymentUsers = paymentUsers.filter((u) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      u.userEmail.toLowerCase().includes(s) ||
      u.userName.toLowerCase().includes(s) ||
      u.userId.toLowerCase().includes(s)
    );
  });

  const openBalanceForPaymentUser = (u: PaymentUserSummary) => {
    const pseudoUser: AppUser = {
      uid: u.userId,
      email: u.userEmail,
      displayName: u.userName,
      photoURL: null,
      role: 'user',
      createdAt: Date.now(),
      lastLogin: undefined,
    };
    void handleOpenBalanceEditor(pseudoUser);
  };

  const handleOpenBalanceEditor = async (user: AppUser) => {
    try {
      setSelectedUserForBalance(user);
      setBalanceLoading(true);
      setMessage(null);

      let current = 0;

      // Get current balance from balance API (single source of truth)
      if (user.uid) {
        const response = await balanceApi.getUserBalance(user.uid);
        if (response.success && response.data?.balance !== undefined) {
          current = Number(response.data.balance);
        }
      }

      setBalanceValue(current.toString());
    } catch (err: any) {
      // console.error('Error fetching user balance:', err);
      setMessage({ type: 'error', text: 'Failed to load user balance' });
      setBalanceValue('0');
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleSaveBalance = async () => {
    if (!selectedUserForBalance) {
      // console.error('❌ No user selected for balance edit');
      return;
    }
    
    const raw = balanceValue.trim();
    const amount = Number(raw);
    
    // console.log('💾 Saving balance:', {
    //   userId: selectedUserForBalance.uid,
    //   userEmail: selectedUserForBalance.email,
    //   currentValue: balanceValue,
    //   parsedAmount: amount
    // });
    
    if (Number.isNaN(amount)) {
      setMessage({ type: 'error', text: 'Please enter a valid balance amount' });
      return;
    }
    
    if (amount < 0) {
      setMessage({ type: 'error', text: 'Balance cannot be negative. Please enter 0 or greater.' });
      return;
    }

    try {
      setBalanceLoading(true);
      // console.log('📤 Calling balanceApi.sync with:', {
      //   userId: selectedUserForBalance.uid,
      //   userEmail: selectedUserForBalance.email || '',
      //   userName: selectedUserForBalance.displayName || '',
      //   balance: amount,
      // });
      
      const resp = await balanceApi.sync({
        userId: selectedUserForBalance.uid,
        userEmail: selectedUserForBalance.email || '',
        userName: selectedUserForBalance.displayName || '',
        balance: amount,
      });
      
      // console.log('📥 Balance sync response:', resp);

      if (resp.success) {
        setMessage({
          type: 'success',
          text: `Balance updated to ৳${amount.toFixed(2)} for ${selectedUserForBalance.email || 'user'}`,
        });

        // Update local balance records & payment user summaries so UI matches immediately
        setBalanceRecords((prev) =>
          prev.map((b) =>
            b.userId === selectedUserForBalance.uid || b.userEmail === selectedUserForBalance.email
              ? { ...b, balance: amount }
              : b
          )
        );

        setPaymentUsers((prev) =>
          prev.map((u) =>
            u.userId === selectedUserForBalance.uid || u.userEmail === selectedUserForBalance.email
              ? { ...u, lastBalance: amount }
              : u
          )
        );
      } else {
        setMessage({
          type: 'error',
          text: resp.message || 'Failed to update balance',
        });
      }
    } catch (err: any) {
      // console.error('Error updating balance:', err);
      setMessage({
        type: 'error',
        text: err?.message || 'Failed to update balance',
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  // Debug: Log users from Firestore
  useEffect(() => {
    // console.log('📊 Users loaded from Firestore:', users.length);
    // console.log('👥 Users list:', users);
    // console.log('🔐 Current user:', currentUser);
  }, [users, currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-slate-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 pr-4 pb-4 pl-0 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <p className="font-semibold">{message.text}</p>
        </div>
      )}

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1">Total Users</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900">{totalUsers}</p>
            </div>
            <div className="text-2xl sm:text-3xl">👥</div>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-purple-700 mb-1">Admins</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900">{adminCount}</p>
            </div>
            <div className="text-2xl sm:text-3xl">👑</div>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-green-700 mb-1">Resellers</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900">{resellerCount}</p>
            </div>
            <div className="text-2xl sm:text-3xl">🔰</div>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1">Moderators</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-900">{moderatorCount}</p>
            </div>
            <div className="text-2xl sm:text-3xl">🛡️</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">User Management</h3>
          <p className="text-slate-600 text-xs sm:text-sm">
            <span className="font-semibold text-slate-900">Total: {users.length} Firestore users</span>
            {' '}({adminUsers.length} admins, {regularUsers.length} regular)
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
            🔄 Data fetched from Firebase Firestore (Real-time sync)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {currentUser && !users.find(u => u.uid === currentUser.uid) && (
            <button
              onClick={() => {
                if (currentUser) {
                  addUser(currentUser);
                  setTimeout(() => {
                    refreshUsers();
                    setMessage({ type: 'success', text: 'Current user added to list' });
                  }, 300);
                }
              }}
              className="px-3 sm:px-4 py-2 rounded-xl bg-green-500 text-white font-semibold text-xs sm:text-sm hover:bg-green-600 transition-all"
            >
              ➕ Add Current User
            </button>
          )}
          <button
            onClick={() => {
              refreshUsers();
              setMessage({ type: 'success', text: 'User list refreshed' });
            }}
            className="px-3 sm:px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-all"
          >
            🔄 Refresh
          </button>
          <div className="flex-1 sm:max-w-md">
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Moderator permissions editor */}
      {selectedModerator && (
        <div className="p-4 sm:p-5 rounded-xl border border-purple-200 bg-purple-50 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-semibold text-purple-700 mb-1">Moderator permissions</p>
              <p className="text-sm sm:text-base font-bold text-slate-900">
                {selectedModerator.userName || selectedModerator.userEmail}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-600">
                UID: {selectedModerator.userId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedModerator(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px] sm:text-sm">
            {/* Column: Navigation / Overview */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wide mb-1">
                Navigation &amp; overview
              </p>

              {/* Dashboard */}
              <label className="flex items-start gap-2 rounded-lg bg-white/60 px-3 py-2 shadow-sm border border-purple-100">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!modPerms.canAccessDashboard}
                  onChange={(e) =>
                    setModPerms((prev) => ({ ...prev, canAccessDashboard: e.target.checked }))
                  }
                />
                <div>
                  <p className="font-semibold text-slate-900">Dashboard</p>
                  <p className="text-[11px] text-slate-500">
                    See overall stats and quick overview cards.
                  </p>
                </div>
              </label>

              {/* Game Packages / Game Zone */}
              <label className="flex items-start gap-2 rounded-lg bg-white/60 px-3 py-2 shadow-sm border border-purple-100">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!modPerms.canManageGamePackages}
                  onChange={(e) =>
                    setModPerms((prev) => ({ ...prev, canManageGamePackages: e.target.checked }))
                  }
                />
                <div>
                  <p className="font-semibold text-slate-900">Game Packages / Game Zone</p>
                  <p className="text-[11px] text-slate-500">
                    Manage all game related packages and offers.
                  </p>
                </div>
              </label>

              {/* Order History */}
              <label className="flex items-start gap-2 rounded-lg bg-white/60 px-3 py-2 shadow-sm border border-purple-100">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!modPerms.canManageOrders}
                  onChange={(e) =>
                    setModPerms((prev) => ({ ...prev, canManageOrders: e.target.checked }))
                  }
                />
                <div>
                  <p className="font-semibold text-slate-900">Order History</p>
                  <p className="text-[11px] text-slate-500">
                    View and manage all orders placed by users.
                  </p>
                </div>
              </label>
            </div>

            {/* Column: Management modules */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wide mb-1">
                Management modules
              </p>

              {/* Products & Categories */}
              <label className="flex items-start gap-2 rounded-lg bg-white/60 px-3 py-2 shadow-sm border border-purple-100">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!modPerms.canManageProducts}
                  onChange={(e) =>
                    setModPerms((prev) => ({ ...prev, canManageProducts: e.target.checked }))
                  }
                />
                <div>
                  <p className="font-semibold text-slate-900">Products &amp; Categories</p>
                  <p className="text-[11px] text-slate-500">
                    Create, edit and organise products and categories.
                  </p>
                </div>
              </label>

              {/* Banner Management */}
              <label className="flex items-start gap-2 rounded-lg bg-white/60 px-3 py-2 shadow-sm border border-purple-100">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!modPerms.canManageBanners}
                  onChange={(e) =>
                    setModPerms((prev) => ({ ...prev, canManageBanners: e.target.checked }))
                  }
                />
                <div>
                  <p className="font-semibold text-slate-900">Banner Management</p>
                  <p className="text-[11px] text-slate-500">
                    Control homepage banners, images and promo links.
                  </p>
                </div>
              </label>

              {/* Notice Management */}
              <label className="flex items-start gap-2 rounded-lg bg-white/60 px-3 py-2 shadow-sm border border-purple-100">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!modPerms.canManageNotices}
                  onChange={(e) =>
                    setModPerms((prev) => ({ ...prev, canManageNotices: e.target.checked }))
                  }
                />
                <div>
                  <p className="font-semibold text-slate-900">Notice Management</p>
                  <p className="text-[11px] text-slate-500">
                    Publish and update important user notices.
                  </p>
                </div>
              </label>

              {/* User Management */}
              <label className="flex items-start gap-2 rounded-lg bg-white/60 px-3 py-2 shadow-sm border border-purple-100">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!modPerms.canManageUsers}
                  onChange={(e) =>
                    setModPerms((prev) => ({ ...prev, canManageUsers: e.target.checked }))
                  }
                />
                <div>
                  <p className="font-semibold text-slate-900">User Management</p>
                  <p className="text-[11px] text-slate-500">
                    See users, balances and roles for moderation.
                  </p>
                </div>
              </label>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!selectedModerator) return;
              await adminRoleApi.upsert({
                userId: selectedModerator.userId,
                userEmail: selectedModerator.userEmail,
                role: 'moderator',
                moderationPermissions: modPerms,
              });
              setPaymentUsers((prev) =>
                prev.map((p) =>
                  p.userId === selectedModerator.userId && p.userEmail === selectedModerator.userEmail
                    ? { ...p, moderationPermissions: modPerms, role: 'moderator' }
                    : p
                )
              );
              setMessage({ type: 'success', text: 'Moderator permissions updated' });
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs sm:text-sm font-semibold hover:bg-purple-700 transition-all"
          >
            Save Permissions
          </button>
        </div>
      )}

      {/* Balance editor for selected user */}
      {selectedUserForBalance && (
        <div className="p-4 sm:p-5 rounded-xl border border-amber-200 bg-amber-50 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-1">Balance editor</p>
              <p className="text-sm sm:text-base font-bold text-slate-900">
                {selectedUserForBalance.displayName || selectedUserForBalance.email || 'User'}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-600">
                UID: {selectedUserForBalance.uid}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUserForBalance(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              ✕ Close
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Current balance (৳)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={balanceValue}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // console.log('📝 Balance value changed:', newValue);
                  setBalanceValue(newValue);
                }}
                disabled={balanceLoading}
                placeholder="0.00"
                className="w-full px-3 sm:px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
                Manually override this user&apos;s Robo balance. This will sync to the database.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveBalance}
              disabled={balanceLoading}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs sm:text-sm font-semibold hover:bg-amber-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {balanceLoading ? 'Saving...' : 'Save Balance'}
            </button>
          </div>
        </div>
      )}

      {/* Admins Section */}
      {adminUsers.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Administrators ({adminUsers.length})
          </h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 border-b border-slate-200 font-semibold text-xs sm:text-sm text-slate-700 min-w-[760px]">
              <div>User</div>
              <div className="hidden sm:block">Email</div>
              <div>Role</div>
                <div>Balance</div>
              <div>Actions</div>
            </div>
            {adminUsers.map((user) => (
              <div key={user.uid} className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-2 sm:gap-4 p-3 sm:p-4 border-b border-slate-100 items-center hover:bg-slate-50 transition-colors min-w-[760px]">
                <div className="flex items-center gap-2 sm:gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-xs sm:text-sm text-slate-900 truncate">{user.displayName || 'No Name'}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">UID: {user.uid.substring(0, 8)}...</p>
                    <p className="text-[10px] sm:text-xs text-slate-600 sm:hidden truncate">{user.email || '-'}</p>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-slate-700 hidden sm:block truncate">{user.email || '-'}</div>
                <div>
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-green-100 text-green-700 text-[10px] sm:text-xs font-semibold">
                    Admin
                  </span>
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-400">
                    —
                  </p>
                  <p className="text-[10px] text-slate-400 hidden sm:block">
                    (open editor)
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => handleOpenBalanceEditor(user)}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-300 text-[10px] sm:text-xs text-slate-700 hover:bg-slate-100 transition-all whitespace-nowrap"
                  >
                    View / Edit
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => handleRoleChange(user.email || '', 'user')}
                    disabled={user.email === currentUser?.email}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] sm:text-sm font-semibold hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Make User</span>
                    <span className="sm:hidden">User</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Users Section (from payments API summaries) */}
      <div>
        <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          Regular Users ({filteredPaymentUsers.length})
        </h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 border-b border-slate-200 font-semibold text-xs sm:text-sm text-slate-700 min-w-[760px]">
            <div>User</div>
            <div className="hidden sm:block">Email</div>
            <div>Role</div>
            <div>Balance</div>
            <div>Actions</div>
          </div>
          {filteredPaymentUsers.length > 0 ? (
            filteredPaymentUsers.map((u) => (
              <div key={`${u.userId}-${u.userEmail}`} className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-2 sm:gap-4 p-3 sm:p-4 border-b border-slate-100 items-center hover:bg-slate-50 transition-colors min-w-[760px]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                    {u.userName?.[0] || u.userEmail?.[0] || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                      {u.userName || 'No Name'}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-500">
                      UID: {u.userId.substring(0, 12)}...
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-600 sm:hidden truncate">
                      {u.userEmail || '-'}
                    </p>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-slate-700 hidden sm:block truncate">
                  {u.userEmail || '-'}
                </div>
                <div>
                  <select
                    value={u.role || 'user'}
                    onChange={async (e) => {
                      const newRole = e.target.value as Role;
                      if (!u.userId && !u.userEmail) return;
                      await adminRoleApi.upsert({
                        userId: u.userId,
                        userEmail: u.userEmail,
                        role: newRole,
                        moderationPermissions: u.moderationPermissions || {},
                      });
                      setMessage({ type: 'success', text: `Role updated to ${newRole}` });
                      setPaymentUsers((prev) =>
                        prev.map((p) =>
                          p.userId === u.userId && p.userEmail === u.userEmail
                            ? { ...p, role: newRole }
                            : p
                        )
                      );
                    }}
                    className="px-2 py-1 rounded-lg border border-slate-300 text-[10px] sm:text-xs bg-white text-slate-700"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                    <option value="reseller">Reseller</option>
                  </select>
                </div>
                <div>
                  {(() => {
                    const balanceFromApi = balanceRecords.find(
                      (b) =>
                        b.userId === u.userId ||
                        (!!b.userEmail && b.userEmail.toLowerCase() === u.userEmail.toLowerCase())
                    );
                    const displayBalance =
                      balanceFromApi?.balance ??
                      (typeof u.lastBalance === 'number' ? u.lastBalance : null);

                    return (
                      <>
                        <p className="text-[11px] sm:text-xs font-semibold text-slate-900">
                          {typeof displayBalance === 'number'
                            ? `৳${displayBalance.toFixed(2)}`
                            : '—'}
                        </p>
                        <p className="text-[10px] text-slate-400 hidden sm:block">
                          {balanceRecordsLoading ? 'Loading current balance...' : 'Current balance'}
                        </p>
                      </>
                    );
                  })()}
                </div>
                <div className="flex flex-col sm:flex-row gap-1">
                  <button
                    type="button"
                    onClick={() => openBalanceForPaymentUser(u)}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-300 text-[10px] sm:text-xs text-slate-700 hover:bg-slate-100 transition-all whitespace-nowrap"
                  >
                    View / Edit
                  </button>
                  {u.role === 'moderator' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedModerator(u);
                        setModPerms(u.moderationPermissions || {});
                      }}
                      className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-purple-300 bg-purple-50 text-[10px] sm:text-xs text-purple-700 hover:bg-purple-100 transition-all whitespace-nowrap"
                    >
                      Edit Moderation
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500">
              {searchTerm ? (
                'No users found matching your search'
              ) : (
                <div>
                  <p>No regular users yet</p>
                  {currentUser && !users.find(u => u.uid === currentUser.uid) && (
                    <button
                      onClick={() => {
                        if (currentUser) {
                          addUser(currentUser);
                          setTimeout(() => refreshUsers(), 500);
                          setMessage({ type: 'success', text: 'Current user added to list' });
                        }
                      }}
                      className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold hover:from-purple-600 hover:to-violet-700 transition-all"
                    >
                      Add Current User to List
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Users from Payments API (summary) */}
      <div>
        <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Users from Payments API ({paymentUsers.length})
        </h4>
        {paymentUsersLoading ? (
          <div className="flex items-center justify-center py-6 text-sm text-slate-600">
            <div className="w-5 h-5 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mr-2" />
            Loading payment users...
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
            <div className="grid grid-cols-[2fr_1.4fr_1fr_1fr] gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 border-b border-slate-200 font-semibold text-xs sm:text-sm text-slate-700 min-w-[720px]">
              <div>User</div>
              <div>Email</div>
              <div>Last Balance</div>
              <div>Orders</div>
            </div>
            {paymentUsers.length > 0 ? (
              paymentUsers.map((u) => {
                const dateLabel = u.lastPaymentAt
                  ? new Date(u.lastPaymentAt).toLocaleString('bn-BD', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : '-';

                return (
                  <div
                    key={`${u.userId}-${u.userEmail}`}
                    className="grid grid-cols-[2fr_1.4fr_1fr_1fr] gap-2 sm:gap-4 p-3 sm:p-4 border-b border-slate-100 items-center hover:bg-slate-50 transition-colors min-w-[720px]"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                        {u.userName || u.userEmail}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                        UID: {u.userId}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        Last payment: {dateLabel}
                      </p>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-700 truncate">
                      {u.userEmail}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-emerald-700">
                      {typeof u.lastBalance === 'number'
                        ? `৳${u.lastBalance.toFixed(2)}`
                        : '—'}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-700">
                      {u.totalOrders}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                No payment data yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;















































