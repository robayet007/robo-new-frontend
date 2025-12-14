import { useState, useEffect } from 'react';
import useUsers, { type UserRole } from '../hooks/useUsers';
import useAuth from '../hooks/useAuth';

function UserManagement() {
  const { users, loading, updateUserRole, refreshUsers, addUser, syncCurrentUser } = useUsers();
  const { user: currentUser } = useAuth();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Debug: Log users from Firestore
  useEffect(() => {
    console.log('📊 Users loaded from Firestore:', users.length);
    console.log('👥 Users list:', users);
    console.log('🔐 Current user:', currentUser);
  }, [users, currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-slate-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <p className="font-semibold">{message.text}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">User Management</h3>
          <p className="text-slate-600 text-xs sm:text-sm">
            <span className="font-semibold text-slate-900">Total: {users.length} users</span> 
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
              className="w-full px-3 sm:px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Admins Section */}
      {adminUsers.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Administrators ({adminUsers.length})
          </h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 border-b border-slate-200 font-semibold text-xs sm:text-sm text-slate-700 min-w-[600px]">
              <div>User</div>
              <div className="hidden sm:block">Email</div>
              <div>Role</div>
              <div>Actions</div>
            </div>
            {adminUsers.map((user) => (
              <div key={user.uid} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 sm:gap-4 p-3 sm:p-4 border-b border-slate-100 items-center hover:bg-slate-50 transition-colors min-w-[600px]">
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

      {/* Regular Users Section */}
      <div>
        <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Regular Users ({regularUsers.length})
        </h4>
        <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 border-b border-slate-200 font-semibold text-xs sm:text-sm text-slate-700 min-w-[600px]">
            <div>User</div>
            <div className="hidden sm:block">Email</div>
            <div>Role</div>
            <div>Actions</div>
          </div>
          {regularUsers.length > 0 ? (
            regularUsers.map((user) => (
              <div key={user.uid} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 sm:gap-4 p-3 sm:p-4 border-b border-slate-100 items-center hover:bg-slate-50 transition-colors min-w-[600px]">
                <div className="flex items-center gap-2 sm:gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold">
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
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-blue-100 text-blue-700 text-[10px] sm:text-xs font-semibold">
                    User
                  </span>
                </div>
                <div>
                  <button
                    onClick={() => handleRoleChange(user.email || '', 'admin')}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] sm:text-sm font-semibold hover:from-green-600 hover:to-emerald-700 transition-all whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Make Admin</span>
                    <span className="sm:hidden">Admin</span>
                  </button>
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
                      className="mt-4 px-4 py-2 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-600 transition-all"
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

