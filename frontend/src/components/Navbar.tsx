// Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { Tag, Settings, User, CreditCard, Wallet, Send, Package, Gamepad2, LogOut } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useUserRole from '../hooks/useUserRole';
import useReseller from '../hooks/useReseller';
import useRoboBalance from '../hooks/useRoboBalance';
import { useTheme } from '../contexts/ThemeContext';
import { useEffect, useState, useRef } from 'react';
import { getImageUrl } from '../utils/imageUrl';

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isAdmin, isModerator } = useUserRole();
  const { isReseller } = useReseller();
  const { backendBalance, loading, refreshBalance } = useRoboBalance();
  const { navbarLogoUrl } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
  };

  // Balance refresh on mount
  useEffect(() => {
    if (user?.email) {
      refreshBalance();
    }
  }, [user?.email, refreshBalance]);

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user?.uid]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 mb-1 transition-all duration-300 border shadow-lg sm:px-4 md:px-5 sm:py-2.5 sm:mb-1.5 md:mb-2 border-slate-200/40 rounded-xl sm:rounded-2xl backdrop-blur-2xl bg-white/70 shadow-slate-900/10">
      <Link
        to="/"
        className="flex items-center gap-1.5 transition-transform duration-200 sm:gap-2 group hover:scale-[1.02]"
      >
        {navbarLogoUrl ? (
  <img
    src={getImageUrl(navbarLogoUrl)}
    alt="Logo"
    style={{ 
      height: '56px',
      width: 'auto', 
      maxWidth: 'none',
      objectFit: 'contain',
      display: 'block',
      border: 'none',
      outline: 'none',
      boxShadow: 'none',
      backgroundColor: 'transparent'
    }}
  />
) : (
  <span>Logo</span>
)}
      </Link>

      <nav className="flex items-center gap-1 sm:gap-2">
        {user ? (
          <>
            {isReseller && (
              <div
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border shrink-0"
                style={{
                  background: 'var(--theme-primary-light)',
                  borderColor: 'rgba(var(--theme-primary-rgb), 0.35)',
                  color: 'var(--theme-primary)'
                }}
              >
                <Tag className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" style={{ color: 'var(--theme-primary)' }} strokeWidth={2} />
                <span className="text-xs font-bold tracking-tight sm:text-sm" style={{ color: 'var(--theme-primary)', fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}>
                  Reseller
                </span>
              </div>
            )}
            {!isAdmin && !isModerator && !isReseller && (
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-[50px] border-0 shrink-0"
                style={{
                  background: 'var(--theme-primary)',
                  color: 'white'
                }}
              >
                <Wallet className="h-3 w-3 shrink-0 text-white sm:h-3.5 sm:w-3.5" strokeWidth={2} />
                <span className="text-[10px] font-medium sm:text-xs text-white">
                  {loading ? (
                    <span className="inline-block w-6 h-2.5 rounded animate-pulse bg-white/40"></span>
                  ) : (
                    `৳${(backendBalance !== null ? backendBalance : 0).toFixed(2)}`
                  )}
                </span>
              </div>
            )}
            {/* Admin Panel Link - Show for both Admin and Moderator */}
            {(isAdmin || isModerator) && (
              <Link
                to="/admin"
                className="px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm text-slate-700 transition-all duration-200"
                style={{
                  color: 'rgb(51, 65, 85)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--theme-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--theme-primary-light)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgb(51, 65, 85)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span className="hidden sm:inline">Admin</span>
                <span className="sm:hidden"><Settings className="h-4 w-4" strokeWidth={2} /></span>
              </Link>
            )}
            {/* Non-admin specific options are now only inside the profile menu */}
            {/* Profile avatar + dropdown menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((open) => !open)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {user.photoURL && !imageError ? (
                  <img
                    src={getImageUrl(user.photoURL)}
                    alt={user.displayName || 'User'}
                    className="w-4 h-4 rounded-full sm:w-5 sm:h-5"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold"
                    style={{
                      background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`
                    }}
                  >
                    {user.displayName?.[0] || user.email?.[0] || 'U'}
                  </div>
                )}
                <span className="hidden text-xs font-semibold tracking-tight text-slate-700 md:inline sm:text-sm" style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}>
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </button>

              {isProfileMenuOpen && (
                <div
                  className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl"
                  style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}
                >
                  {/* Balance info inside profile dropdown */}
                  {!isAdmin && !isModerator && !isReseller && (
                    <div className="border-b border-slate-100 bg-slate-50/80 px-3.5 py-2.5">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                        {loading ? 'Loading...' : 'Your Balance'}
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <Wallet className="h-4 w-4 shrink-0" style={{ color: 'var(--theme-primary)' }} strokeWidth={2} />
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-primary)' }}>
                            ৳{(backendBalance !== null ? backendBalance : 0).toFixed(2)}
                          </p>
                        </div>
                        {!loading && (
                          <button
                            onClick={() => {
                              refreshBalance();
                            }}
                            className="text-[11px] font-medium shrink-0 hover:opacity-80 transition-opacity"
                            style={{ color: 'var(--theme-primary)' }}
                          >
                            Refresh
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 border-b border-slate-100 px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-slate-700 transition-colors hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/my-account');
                    }}
                    style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}
                  >
                    <Settings className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={2} />
                    Settings
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-slate-700 transition-colors hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/membership');
                    }}
                    style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}
                  >
                    <CreditCard className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={2} />
                    Membership
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-slate-700 transition-colors hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/my-account?tab=wallet');
                    }}
                    style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}
                  >
                    <Wallet className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={2} />
                    Wallet
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-slate-700 transition-colors hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/send-money');
                    }}
                    style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}
                  >
                    <Send className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={2} />
                    Send Money
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-slate-700 transition-colors hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/orders');
                    }}
                    style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}
                  >
                    <Package className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={2} />
                    Order History
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 border-t border-slate-100 px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-slate-700 transition-colors hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/robo-game-zone');
                    }}
                    style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}
                  >
                    <Gamepad2 className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={2} />
                    Robo Game Zone
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 border-t border-slate-200 px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-red-600 transition-colors hover:bg-red-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleLogout();
                    }}
                    style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}
                  >
                    <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link
              to="/service-workflow"
              className="px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-[50px] font-medium text-xs sm:text-sm text-slate-700 transition-colors hover:bg-slate-100"
            >
              Service Workflow
            </Link>
            <Link
              to="/login"
              className="px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-[50px] font-medium text-xs sm:text-sm text-white transition-all duration-200 shadow-lg"
              style={{
                background: `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`,
                boxShadow: `0 10px 30px rgba(var(--theme-primary-rgb), 0.3)`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(to right, var(--theme-primary-hover), var(--theme-secondary-dark))`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`;
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2} />
                Sign In
              </span>
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;