import { useState, useEffect } from 'react';
import { FaUsers, FaCrown, FaTag, FaShieldAlt, FaSync, FaPlus, FaTimes } from 'react-icons/fa';
import useUsers, { type UserRole, type AppUser } from '../hooks/useUsers';
import useAuth from '../hooks/useAuth';
import { balanceApi, adminRoleApi, userSyncApi, type AdminModerationPermissions } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useUsersQuery, usersQueryKeys } from '../hooks/useUsersQuery';
import { useBalancesQuery, balancesQueryKeys } from '../hooks/useBalancesQuery';
import { useQueryClient } from '@tanstack/react-query';
import { getImageUrl } from '../utils/imageUrl';

function UserManagement() {
  const { users: firestoreUsers, loading: firestoreLoading, updateUserRole, refreshUsers, addUser, syncCurrentUser } = useUsers();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const { data: cachedUsers = [] } = useUsersQuery();
  const { data: balanceRecords = [], isLoading: balanceRecordsLoading } = useBalancesQuery();
  
  const users = firestoreUsers.length > 0 ? firestoreUsers : cachedUsers;
  const loading = firestoreLoading;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<AppUser | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceValue, setBalanceValue] = useState<string>('');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [syncFromAuthLoading, setSyncFromAuthLoading] = useState(false);

  type ModerationPermissions = AdminModerationPermissions;

  type Role = 'user' | 'moderator' | 'admin' | 'reseller';

  const [selectedModerator, setSelectedModerator] = useState<AppUser | null>(null);
  const [modPerms, setModPerms] = useState<ModerationPermissions>({
    canAccessDashboard: false,
    canManageProducts: false,
    canManageDigitalCodes: false,
    canManageSubscriptions: false,
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

  // Add current user if not in list
  useEffect(() => {
    if (currentUser && !loading) {
      syncCurrentUser(currentUser);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, loading]);

  const handleRoleChange = async (userEmail: string, newRole: UserRole) => {
    if (!userEmail) return;

    // Prevent changing own role
    if (userEmail === currentUser?.email) {
      showToast({ type: 'error', text: 'You cannot change your own role' });
      return;
    }

    updateUserRole(userEmail, newRole);
    showToast({ 
      type: 'success', 
      text: `User role updated to ${newRole}` 
    });
    
    queryClient.invalidateQueries({ queryKey: usersQueryKeys.list() });
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

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const resellerCount = users.filter(u => u.role === 'reseller').length;
  const moderatorCount = users.filter(u => u.role === 'moderator').length;

  const regularUsersList = filteredUsers.filter(u => u.role !== 'admin');

  const openBalanceForUser = (user: AppUser) => {
    void handleOpenBalanceEditor(user);
  };

  const handleOpenBalanceEditor = async (user: AppUser) => {
    try {
      setSelectedUserForBalance(user);
      setBalanceLoading(true);
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
      showToast({ type: 'error', text: 'Failed to load user balance' });
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
      showToast({ type: 'error', text: 'Please enter a valid balance amount' });
      return;
    }
    
    if (amount < 0) {
      showToast({ type: 'error', text: 'Balance cannot be negative. Please enter 0 or greater.' });
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
        showToast({
          type: 'success',
          text: `Balance updated to ৳${amount.toFixed(2)} for ${selectedUserForBalance.email || 'user'}`,
        });

        queryClient.invalidateQueries({ queryKey: balancesQueryKeys.list() });
        queryClient.invalidateQueries({ queryKey: usersQueryKeys.list() });
      } else {
        showToast({
          type: 'error',
          text: resp.message || 'Failed to update balance',
        });
      }
    } catch (err: any) {
      // console.error('Error updating balance:', err);
      showToast({
        type: 'error',
        text: err?.message || 'Failed to update balance',
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedModerator) return;
    let cancelled = false;
    adminRoleApi.getAll().then((resp) => {
      if (cancelled || !resp.success || !Array.isArray(resp.data)) return;
      const entry = (resp.data as any[]).find(
        (r) =>
          r.userId === selectedModerator.uid ||
          (r.userEmail && selectedModerator.email && r.userEmail.toLowerCase() === selectedModerator.email.toLowerCase())
      );
      if (!cancelled && entry?.moderationPermissions) {
        setModPerms(entry.moderationPermissions as ModerationPermissions);
      } else if (!cancelled) {
        setModPerms({
          canAccessDashboard: false,
          canManageProducts: false,
          canManageDigitalCodes: false,
          canManageSubscriptions: false,
          canManageBanners: false,
          canManageNotices: false,
          canManageGamePackages: false,
          canManageUsers: false,
          canManageOrders: false,
        });
      }
    });
    return () => { cancelled = true; };
  }, [selectedModerator]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-400 rounded-full border-t-transparent animate-spin"></div>
        <p className="ml-3 text-slate-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="pt-4 pb-4 pl-0 pr-4 space-y-6 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-4 sm:gap-4">
        <div className="p-4 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-medium text-blue-700 sm:text-sm">Total Users</p>
              <p className="text-2xl font-bold text-blue-900 sm:text-3xl">{totalUsers}</p>
            </div>
            <div className="text-2xl sm:text-3xl text-blue-600"><FaUsers /></div>
          </div>
        </div>
        <div className="p-4 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-medium text-purple-700 sm:text-sm">Admins</p>
              <p className="text-2xl font-bold text-purple-900 sm:text-3xl">{adminCount}</p>
            </div>
            <div className="text-2xl sm:text-3xl text-purple-600"><FaCrown /></div>
          </div>
        </div>
        <div className="p-4 border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-medium text-green-700 sm:text-sm">Resellers</p>
              <p className="text-2xl font-bold text-green-900 sm:text-3xl">{resellerCount}</p>
            </div>
            <div className="text-2xl sm:text-3xl text-green-600"><FaTag /></div>
          </div>
        </div>
        <div className="p-4 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-medium text-orange-700 sm:text-sm">Moderators</p>
              <p className="text-2xl font-bold text-orange-900 sm:text-3xl">{moderatorCount}</p>
            </div>
            <div className="text-2xl sm:text-3xl text-orange-600"><FaShieldAlt /></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h3 className="mb-1 text-lg font-bold sm:text-xl text-slate-900">User Management</h3>
          <p className="text-xs text-slate-600 sm:text-sm">
            <span className="font-semibold text-slate-900">Total: {users.length} Firestore users</span>
            {' '}({adminUsers.length} admins, {regularUsers.length} regular)
          </p>
          <p className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 mt-1">
            <FaSync className="w-3 h-3 shrink-0" />
            Data fetched from Firebase Firestore (Real-time sync)
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {currentUser && !users.find(u => u.uid === currentUser.uid) && (
            <button
              onClick={() => {
                if (currentUser) {
                  addUser(currentUser);
                  setTimeout(() => {
                    refreshUsers();
                    showToast({ type: 'success', text: 'Current user added to list' });
                  }, 300);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white transition-all bg-green-500 sm:px-4 rounded-xl sm:text-sm hover:bg-green-600"
            >
              <FaPlus className="w-3.5 h-3.5 shrink-0" />
              Add Current User
            </button>
          )}
          <button
            onClick={async () => {
              setSyncFromAuthLoading(true);
              try {
                const res = await userSyncApi.syncFromAuth();
                if (res.success && res.data != null) {
                  showToast({ type: 'success', text: res.message || `Synced ${res.data.synced} user(s) from Firebase Auth.` });
                  queryClient.invalidateQueries({ queryKey: usersQueryKeys.list() });
                  refreshUsers();
                } else {
                  showToast({ type: 'error', text: (res as { message?: string }).message || 'Sync failed.' });
                }
              } catch (e: any) {
                showToast({ type: 'error', text: e?.message || 'Sync from Auth failed.' });
              } finally {
                setSyncFromAuthLoading(false);
              }
            }}
            disabled={syncFromAuthLoading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white transition-all bg-indigo-600 sm:px-4 rounded-xl sm:text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            <FaSync className="w-3.5 h-3.5 shrink-0" />
            {syncFromAuthLoading ? 'Syncing…' : 'Sync from Firebase Auth'}
          </button>
          <button
            onClick={() => {
              refreshUsers();
              showToast({ type: 'success', text: 'User list refreshed' });
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all border sm:px-4 rounded-xl border-slate-300 text-slate-700 sm:text-sm hover:bg-slate-50"
          >
            <FaSync className="w-3.5 h-3.5 shrink-0" />
            Refresh
          </button>
          <div className="flex-1 sm:max-w-md">
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border sm:px-4 rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>
      </div>

      {/* Moderator permissions editor */}
      {selectedModerator && (
        <div className="p-4 mb-4 border border-purple-200 sm:p-5 rounded-xl bg-purple-50">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="mb-1 text-xs font-semibold text-purple-700">Moderator permissions</p>
              <p className="text-sm font-bold sm:text-base text-slate-900">
                {selectedModerator.displayName || selectedModerator.email}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-600">
                UID: {selectedModerator.uid}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedModerator(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              <FaTimes className="w-3.5 h-3.5 shrink-0" />
              Close
            </button>
          </div>
          <div className="mb-3">
            <p className="mb-2 text-xs font-semibold text-purple-700">
              Select which sidebar sections this moderator can access:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px] sm:text-sm">
            {/* Column 1: Matching sidebar order */}
            <div className="space-y-2">
              {/* Dashboard */}
              <label className="flex items-start gap-2 px-3 py-2 transition-colors border border-purple-100 rounded-lg shadow-sm bg-white/60 hover:bg-white/80">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!modPerms.canAccessDashboard}
                  onChange={(e) =>
                    setModPerms((prev) => ({ ...prev, canAccessDashboard: e.target.checked }))
                  }
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Dashboard</p>
                  <p className="text-[11px] text-slate-500">
                    See overall stats and quick overview cards.
                  </p>
                </div>
              </label>

              {/* Products & Categories */}
              <label className="flex items-start gap-2 px-3 py-2 transition-colors border border-purple-100 rounded-lg shadow-sm bg-white/60 hover:bg-white/80">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!modPerms.canManageProducts}
                  onChange={(e) =>
                    setModPerms((prev) => ({ ...prev, canManageProducts: e.target.checked }))
                  }
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Products &amp; Categories</p>
                  <p className="text-[11px] text-slate-500">
                    Create, edit and organise products and categories.
                  </p>
                </div>
              </label>

              {/* Digital Codes */}
              <label className="flex items-start gap-2 px-3 py-2 transition-colors border border-purple-100 rounded-lg shadow-sm bg-white/60 hover:bg-white/80">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!modPerms.canManageDigitalCodes}
                  onChange={(e) =>
                    setModPerms((prev) => ({ ...prev, canManageDigitalCodes: e.target.checked }))
                  }
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Digital Codes</p>
                  <p className="text-[11px] text-slate-500">
                    Manage digital codes and activation keys for products.
                  </p>
                </div>
              </label>

              {/* Subscriptions */}
              <label className="flex items-start gap-2 px-3 py-2 transition-colors border border-purple-100 rounded-lg shadow-sm bg-white/60 hover:bg-white/80">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!modPerms.canManageSubscriptions}
                  onChange={(e) =>
                    setModPerms((prev) => ({ ...prev, canManageSubscriptions: e.target.checked }))
                  }
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Subscriptions</p>
                  <p className="text-[11px] text-slate-500">
                    Manage subscription plans and recurring product offerings.
                  </p>
                </div>
              </label>

              {/* Banner Management */}
              <label className="flex items-start gap-2 px-3 py-2 transition-colors border border-purple-100 rounded-lg shadow-sm bg-white/60 hover:bg-white/80">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!modPerms.canManageBanners}
                  onChange={(e) =>
                    setModPerms((prev) => ({ ...prev, canManageBanners: e.target.checked }))
                  }
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Banner Management</p>
                  <p className="text-[11px] text-slate-500">
                    Control homepage banners, images and promo links.
                  </p>
                </div>
              </label>
            </div>

            {/* Column 2: Continuing sidebar order */}
            <div className="space-y-2">
              {/* Notice Management */}
              <label className="flex items-start gap-2 px-3 py-2 transition-colors border border-purple-100 rounded-lg shadow-sm bg-white/60 hover:bg-white/80">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!modPerms.canManageNotices}
                  onChange={(e) =>
                    setModPerms((prev) => ({ ...prev, canManageNotices: e.target.checked }))
                  }
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Notice Management</p>
                  <p className="text-[11px] text-slate-500">
                    Publish and update important user notices.
                  </p>
                </div>
              </label>

              {/* Game Packages */}
              <label className="flex items-start gap-2 px-3 py-2 transition-colors border border-purple-100 rounded-lg shadow-sm bg-white/60 hover:bg-white/80">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!modPerms.canManageGamePackages}
                  onChange={(e) =>
                    setModPerms((prev) => ({ ...prev, canManageGamePackages: e.target.checked }))
                  }
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Game Packages</p>
                  <p className="text-[11px] text-slate-500">
                    Manage all game related packages and offers.
                  </p>
                </div>
              </label>

              {/* User Management */}
              <label className="flex items-start gap-2 px-3 py-2 transition-colors border border-purple-100 rounded-lg shadow-sm bg-white/60 hover:bg-white/80">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!modPerms.canManageUsers}
                  onChange={(e) =>
                    setModPerms((prev) => ({ ...prev, canManageUsers: e.target.checked }))
                  }
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">User Management</p>
                  <p className="text-[11px] text-slate-500">
                    See users, balances and roles for moderation.
                  </p>
                </div>
              </label>

              {/* Order History */}
              <label className="flex items-start gap-2 px-3 py-2 transition-colors border border-purple-100 rounded-lg shadow-sm bg-white/60 hover:bg-white/80">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!modPerms.canManageOrders}
                  onChange={(e) =>
                    setModPerms((prev) => ({ ...prev, canManageOrders: e.target.checked }))
                  }
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Order History</p>
                  <p className="text-[11px] text-slate-500">
                    View and manage all orders placed by users.
                  </p>
                </div>
              </label>

              {/* Admin Only Notice */}
              <div className="px-3 py-2 border rounded-lg border-slate-200 bg-slate-50/60">
                <p className="text-[10px] font-semibold text-slate-600 mb-1">
                  Admin Only Sections
                </p>
                <p className="text-[10px] text-slate-500">
                  Reseller Management, Membership Packages, and Store Customize are admin-only and cannot be granted to moderators.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!selectedModerator) return;
              await adminRoleApi.upsert({
                userId: selectedModerator.uid,
                userEmail: selectedModerator.email || '',
                role: 'moderator',
                moderationPermissions: modPerms,
              });
              queryClient.invalidateQueries({ queryKey: usersQueryKeys.list() });
              showToast({ type: 'success', text: 'Moderator permissions updated' });
              refreshUsers();
            }}
            className="px-4 py-2 mt-4 text-xs font-semibold text-white transition-all bg-purple-600 rounded-xl sm:text-sm hover:bg-purple-700"
          >
            Save Permissions
          </button>
        </div>
      )}

      {/* Balance editor for selected user */}
      {selectedUserForBalance && (
        <div className="p-4 mb-4 border sm:p-5 rounded-xl border-amber-200 bg-amber-50">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="mb-1 text-xs font-semibold text-amber-700">Balance editor</p>
              <p className="text-sm font-bold sm:text-base text-slate-900">
                {selectedUserForBalance.displayName || selectedUserForBalance.email || 'User'}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-600">
                UID: {selectedUserForBalance.uid}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUserForBalance(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              <FaTimes className="w-3.5 h-3.5 shrink-0" />
              Close
            </button>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
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
                className="w-full px-3 py-2 text-sm border sm:px-4 rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:bg-slate-100 disabled:cursor-not-allowed"
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
          <h4 className="flex items-center gap-2 mb-3 text-lg font-semibold text-slate-900">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Administrators ({adminUsers.length})
          </h4>
          <div className="overflow-hidden overflow-x-auto border border-slate-200 rounded-xl">
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
                  {user.photoURL && !imageErrors.has(user.uid) ? (
                    <img 
                      src={getImageUrl(user.photoURL)} 
                      alt={user.displayName || 'User'} 
                      className="w-8 h-8 rounded-full sm:w-10 sm:h-10"
                      onError={() => setImageErrors(prev => new Set(prev).add(user.uid))}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-white rounded-full sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 sm:text-sm">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate sm:text-sm text-slate-900">{user.displayName || 'No Name'}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">UID: {user.uid.substring(0, 8)}...</p>
                    <p className="text-[10px] sm:text-xs text-slate-600 sm:hidden truncate">{user.email || '-'}</p>
                  </div>
                </div>
                <div className="hidden text-xs truncate sm:text-sm text-slate-700 sm:block">{user.email || '-'}</div>
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

      {/* Regular Users Section (from Firebase) */}
      <div>
        <h4 className="flex items-center gap-2 mb-3 text-lg font-semibold text-slate-900">
          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
          Regular Users ({regularUsersList.length})
        </h4>
          <div className="overflow-hidden overflow-x-auto border border-slate-200 rounded-xl">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 border-b border-slate-200 font-semibold text-xs sm:text-sm text-slate-700 min-w-[760px]">
            <div>User</div>
            <div className="hidden sm:block">Email</div>
            <div>Role</div>
            <div>Balance</div>
            <div>Actions</div>
          </div>
          {regularUsersList.length > 0 ? (
            regularUsersList.map((u) => {
              const balanceFromApi = balanceRecords.find(
                (b) =>
                  b.userId === u.uid ||
                  (!!b.userEmail && u.email && b.userEmail.toLowerCase() === u.email.toLowerCase())
              );
              const displayBalance = balanceFromApi?.balance ?? null;
              return (
                <div key={u.uid} className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-2 sm:gap-4 p-3 sm:p-4 border-b border-slate-100 items-center hover:bg-slate-50 transition-colors min-w-[760px]">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {u.photoURL && !imageErrors.has(u.uid) ? (
                      <img
                        src={getImageUrl(u.photoURL)}
                        alt={u.displayName || 'User'}
                        className="w-8 h-8 rounded-full sm:w-10 sm:h-10"
                        onError={() => setImageErrors(prev => new Set(prev).add(u.uid))}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-white rounded-full sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-violet-600 sm:text-sm">
                        {u.displayName?.[0] || u.email?.[0] || 'U'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate sm:text-sm text-slate-900">
                        {u.displayName || 'No Name'}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500">
                        UID: {u.uid.substring(0, 12)}...
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-600 sm:hidden truncate">
                        {u.email || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="hidden text-xs truncate sm:text-sm text-slate-700 sm:block">
                    {u.email || '-'}
                  </div>
                  <div>
                    <select
                      value={u.role || 'user'}
                      onChange={async (e) => {
                        const newRole = e.target.value as Role;
                        await adminRoleApi.upsert({
                          userId: u.uid,
                          userEmail: u.email || '',
                          role: newRole,
                          moderationPermissions: {},
                        });
                        showToast({ type: 'success', text: `Role updated to ${newRole}` });
                        queryClient.invalidateQueries({ queryKey: usersQueryKeys.list() });
                        refreshUsers();
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
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-900">
                      {typeof displayBalance === 'number'
                        ? `৳${displayBalance.toFixed(2)}`
                        : '—'}
                    </p>
                    <p className="text-[10px] text-slate-400 hidden sm:block">
                      {balanceRecordsLoading ? 'Loading...' : 'Balance'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => openBalanceForUser(u)}
                      className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-300 text-[10px] sm:text-xs text-slate-700 hover:bg-slate-100 transition-all whitespace-nowrap"
                    >
                      View / Edit
                    </button>
                    {u.role === 'moderator' && (
                      <button
                        type="button"
                        onClick={() => setSelectedModerator(u)}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-purple-300 bg-purple-50 text-[10px] sm:text-xs text-purple-700 hover:bg-purple-100 transition-all whitespace-nowrap"
                      >
                        Edit Moderation
                      </button>
                    )}
                  </div>
                </div>
              );
            })
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
                          showToast({ type: 'success', text: 'Current user added to list' });
                        }
                      }}
                      className="px-4 py-2 mt-4 font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
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
    </div>
  );
}

export default UserManagement;




