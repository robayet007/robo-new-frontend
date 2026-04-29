import { useState, useEffect } from 'react';
import { Users, Crown, Tag, Shield, RefreshCw, Plus, X, Mail, Send } from 'lucide-react';
import useUsers, { type UserRole, type AppUser } from '../hooks/useUsers';
import useAuth from '../hooks/useAuth';
import { balanceApi, adminRoleApi, userSyncApi, userMailApi, type AdminModerationPermissions } from '../services/api';
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
  const [roleMap, setRoleMap] = useState<Map<string, Role>>(new Map());
  const [mailMode, setMailMode] = useState<'all' | 'selected'>('selected');
  const [selectedMailUser, setSelectedMailUser] = useState<AppUser | null>(null);
  const [mailSubject, setMailSubject] = useState('');
  const [mailMessage, setMailMessage] = useState('');
  const [mailSending, setMailSending] = useState(false);

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

  const resolveRole = (u: AppUser): Role => {
    const byUid = roleMap.get(u.uid);
    if (byUid) return byUid;
    const byEmail = u.email ? roleMap.get(u.email.toLowerCase()) : undefined;
    if (byEmail) return byEmail;
    return (u.role || 'user') as Role;
  };

  const usersWithRoles = users.map((u) => ({ ...u, role: resolveRole(u) }));

  const handleRoleChange = async (targetUser: AppUser, newRole: Role) => {
    if (!targetUser.uid && !targetUser.email) return;

    // Prevent changing own role
    if (
      targetUser.uid === currentUser?.uid ||
      (!!targetUser.email && targetUser.email === currentUser?.email)
    ) {
      showToast({ type: 'error', text: 'You cannot change your own role' });
      return;
    }

    try {
      const resp = await adminRoleApi.upsert({
        userId: targetUser.uid,
        userEmail: targetUser.email || '',
        role: newRole,
        moderationPermissions: newRole === 'moderator' ? modPerms : {},
      });
    
      if (!resp.success) {
        showToast({ type: 'error', text: resp.message || 'Failed to update role' });
        return;
      }

      // Keep Firestore role in sync for legacy views.
      if (targetUser.email) {
        await updateUserRole(targetUser.email, newRole as UserRole);
      }

      showToast({
        type: 'success',
        text: `User role updated to ${newRole}`,
      });
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.list() });
      setTimeout(() => refreshUsers(), 300);
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to update role' });
    }
  };

  const filteredUsers = usersWithRoles.filter(user => {
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
  const emailableUsersMap = new Map<string, AppUser>();

  usersWithRoles.forEach((user) => {
    const normalizedEmail = user.email?.trim().toLowerCase();
    if (normalizedEmail && !emailableUsersMap.has(normalizedEmail)) {
      emailableUsersMap.set(normalizedEmail, user);
    }
  });

  const emailableUsers = Array.from(emailableUsersMap.values());
  const allRecipientEmails = emailableUsers
    .map((user) => user.email?.trim().toLowerCase() || '')
    .filter(Boolean);
  const selectedRecipientEmails = selectedMailUser?.email
    ? [selectedMailUser.email.trim().toLowerCase()]
    : [];
  const activeRecipientEmails = mailMode === 'all' ? allRecipientEmails : selectedRecipientEmails;

  const openBalanceForUser = (user: AppUser) => {
    void handleOpenBalanceEditor(user);
  };

  const openMailComposerForUser = (user: AppUser) => {
    if (!user.email) {
      showToast({ type: 'error', text: 'This user does not have an email address.' });
      return;
    }

    setMailMode('selected');
    setSelectedMailUser(user);
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

  const handleSendMail = async () => {
    const cleanedSubject = mailSubject.trim();
    const cleanedMessage = mailMessage.trim();

    if (!cleanedSubject) {
      showToast({ type: 'error', text: 'Please enter an email subject.' });
      return;
    }

    if (!cleanedMessage) {
      showToast({ type: 'error', text: 'Please enter your email message.' });
      return;
    }

    if (activeRecipientEmails.length === 0) {
      showToast({
        type: 'error',
        text: mailMode === 'all' ? 'No user emails found to send.' : 'Please select a user first.',
      });
      return;
    }

    try {
      setMailSending(true);
      const response = await userMailApi.send({
        subject: cleanedSubject,
        message: cleanedMessage,
        recipientEmails: activeRecipientEmails,
      });

      if (!response.success) {
        showToast({
          type: 'error',
          text: response.message || 'Failed to send email.',
        });
        return;
      }

      const failedCount = response.data?.failedCount ?? 0;
      const firstFailedEmail = response.data?.failed?.[0]?.email;

      showToast({
        type: failedCount > 0 ? 'error' : 'success',
        text:
          failedCount > 0
            ? `${response.message || 'Some emails failed.'}${firstFailedEmail ? ` First failed: ${firstFailedEmail}` : ''}`
            : response.message || 'Email sent successfully.',
      });

      if (failedCount === 0) {
        setMailSubject('');
        setMailMessage('');
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        text: error?.message || 'Failed to send email.',
      });
    } finally {
      setMailSending(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    adminRoleApi.getAll().then((resp) => {
      if (cancelled || !resp.success || !Array.isArray(resp.data)) return;
      const nextMap = new Map<string, Role>();
      for (const entry of resp.data as any[]) {
        const role = (entry.role || 'user') as Role;
        if (entry.userId) nextMap.set(String(entry.userId), role);
        if (entry.userEmail) nextMap.set(String(entry.userEmail).toLowerCase(), role);
      }
      if (!cancelled) setRoleMap(nextMap);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.uid, queryClient]);

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
        <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin" />
        <p className="ml-3 text-sm font-medium text-slate-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 pb-4 pl-0 pr-4 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0" style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}>

      {/* Role Summary Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50 to-blue-100/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-700 sm:text-sm">Total Users</p>
              <p className="text-xl font-bold tracking-tight text-blue-900 sm:text-2xl">{totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600 sm:h-9 sm:w-9" strokeWidth={2} />
          </div>
        </div>
        <div className="rounded-xl border border-purple-200/80 bg-gradient-to-br from-purple-50 to-purple-100/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-purple-700 sm:text-sm">Admins</p>
              <p className="text-xl font-bold tracking-tight text-purple-900 sm:text-2xl">{adminCount}</p>
            </div>
            <Crown className="h-8 w-8 text-purple-600 sm:h-9 sm:w-9" strokeWidth={2} />
          </div>
        </div>
        <div className="rounded-xl border border-green-200/80 bg-gradient-to-br from-green-50 to-green-100/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-green-700 sm:text-sm">Resellers</p>
              <p className="text-xl font-bold tracking-tight text-green-900 sm:text-2xl">{resellerCount}</p>
            </div>
            <Tag className="h-8 w-8 text-green-600 sm:h-9 sm:w-9" strokeWidth={2} />
          </div>
        </div>
        <div className="rounded-xl border border-orange-200/80 bg-gradient-to-br from-orange-50 to-orange-100/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-orange-700 sm:text-sm">Moderators</p>
              <p className="text-xl font-bold tracking-tight text-orange-900 sm:text-2xl">{moderatorCount}</p>
            </div>
            <Shield className="h-8 w-8 text-orange-600 sm:h-9 sm:w-9" strokeWidth={2} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h3 className="mb-1 text-lg font-bold tracking-tight sm:text-xl text-slate-900">User Management</h3>
          <p className="text-xs font-medium text-slate-600 sm:text-sm">
            <span className="font-semibold text-slate-900">Total: {users.length} Firestore users</span>
            {' '}({adminUsers.length} admins, {regularUsers.length} regular)
          </p>
          <p className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 mt-1">
            <RefreshCw className="h-3 w-3 shrink-0" strokeWidth={2} />
            Data fetched from Firebase Firestore (Real-time sync)
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              setMailMode('all');
              setSelectedMailUser(null);
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white transition-all bg-sky-600 sm:px-4 rounded-xl sm:text-sm hover:bg-sky-700"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            Mail All Users
          </button>
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
              <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
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
            <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${syncFromAuthLoading ? 'animate-spin' : ''}`} strokeWidth={2} />
            {syncFromAuthLoading ? 'Syncing…' : 'Sync from Firebase Auth'}
          </button>
          <button
            onClick={() => {
              refreshUsers();
              showToast({ type: 'success', text: 'User list refreshed' });
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all border sm:px-4 rounded-xl border-slate-300 text-slate-700 sm:text-sm hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
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

      <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Email Broadcast</p>
            <h4 className="text-base font-bold text-slate-900 sm:text-lg">Send Gmail from admin panel</h4>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              Individual user select করতে row-এর <span className="font-semibold text-slate-900">Email User</span> button use করুন, অথবা একসাথে সব email-এ পাঠাতে <span className="font-semibold text-slate-900">All Users</span> mode নিন।
            </p>
          </div>
          <div className="flex rounded-xl border border-sky-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setMailMode('selected')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${mailMode === 'selected' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-sky-50'}`}
            >
              Selected User
            </button>
            <button
              type="button"
              onClick={() => {
                setMailMode('all');
                setSelectedMailUser(null);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${mailMode === 'all' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-sky-50'}`}
            >
              All Users
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-sky-100 bg-white/80 p-3 sm:p-4">
          <p className="text-xs font-semibold text-slate-700 sm:text-sm">Recipients</p>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            {mailMode === 'all'
              ? `${activeRecipientEmails.length} user email selected.`
              : selectedMailUser?.email
                ? `${selectedMailUser.displayName || 'Selected user'} • ${selectedMailUser.email}`
                : 'No user selected yet. নিচের list থেকে Email User চাপুন।'}
          </p>
        </div>

        <div className="mt-4 grid gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm">
              Subject
            </label>
            <input
              type="text"
              value={mailSubject}
              onChange={(e) => setMailSubject(e.target.value)}
              placeholder="Example: Important update from Robo TopUp"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 sm:px-4"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm">
              Message
            </label>
            <textarea
              value={mailMessage}
              onChange={(e) => setMailMessage(e.target.value)}
              rows={6}
              placeholder="Write the message you want to send..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 sm:px-4"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-slate-500 sm:text-xs">
              Gmail delivery works after backend env সেট করা থাকবে: <span className="font-semibold text-slate-700">GMAIL_USER</span> and <span className="font-semibold text-slate-700">GMAIL_APP_PASSWORD</span>.
            </p>
            <button
              type="button"
              onClick={handleSendMail}
              disabled={mailSending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              <Send className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              {mailSending ? 'Sending...' : `Send Email${mailMode === 'all' ? ` (${activeRecipientEmails.length})` : ''}`}
            </button>
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
              <X className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
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
                  Reseller Management, Membership Packages, and Store Customize &amp; Key Integration are admin-only and cannot be granted to moderators.
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
              <X className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
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
                <div className="flex flex-col gap-1 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleOpenBalanceEditor(user)}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-300 text-[10px] sm:text-xs text-slate-700 hover:bg-slate-100 transition-all whitespace-nowrap"
                  >
                    View / Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => openMailComposerForUser(user)}
                    disabled={!user.email}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-sky-300 bg-sky-50 text-[10px] sm:text-xs text-sky-700 hover:bg-sky-100 transition-all whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Email User
                  </button>
                  <button
                    onClick={() => handleRoleChange(user, 'user')}
                    disabled={user.uid === currentUser?.uid || user.email === currentUser?.email}
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
                        await handleRoleChange(u, newRole);
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
                    <button
                      type="button"
                      onClick={() => openMailComposerForUser(u)}
                      disabled={!u.email}
                      className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-sky-300 bg-sky-50 text-[10px] sm:text-xs text-sky-700 hover:bg-sky-100 transition-all whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Email User
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
