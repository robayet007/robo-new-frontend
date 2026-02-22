// Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { FaTag, FaCog, FaUser, FaIdCard, FaWallet, FaPaperPlane, FaBox, FaGamepad, FaSignOutAlt } from 'react-icons/fa';
import useAuth from '../hooks/useAuth';
import useUserRole from '../hooks/useUserRole';
import useReseller from '../hooks/useReseller';
import useRoboBalance from '../hooks/useRoboBalance';
import { useTheme } from '../contexts/ThemeContext';
import { useEffect, useState, useRef } from 'react';

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
    src={navbarLogoUrl}
    alt="Logo"
    style={{ 
      height: '40px', 
      width: 'auto', 
      maxWidth: '130px',
      objectFit: 'contain'
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
                <FaTag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" style={{ color: 'var(--theme-primary)' }} />
                <span className="text-xs font-bold sm:text-sm" style={{ color: 'var(--theme-primary)' }}>
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
                <FaWallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-white" />
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
                <span className="sm:hidden"><FaCog className="w-4 h-4" /></span>
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
                    src={user.photoURL}
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
                <span className="hidden text-xs font-medium sm:text-sm text-slate-700 md:inline">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 z-20 mt-2 overflow-hidden bg-white border shadow-lg w-52 rounded-xl border-slate-200">
                  {/* Balance info inside profile dropdown */}
                  {!isAdmin && !isModerator && !isReseller && (
                    <div className="px-3 py-2 text-xs border-b bg-slate-50">
                      <p className="text-[10px] text-slate-500">
                        {loading ? 'Balance loading...' : 'Your Balance'}
                      </p>
                      <div className="flex items-center justify-between mt-0.5 gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FaWallet className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-primary)' }} />
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
                    className="flex items-center w-full px-3 py-2 text-xs font-semibold text-left border-b text-slate-700 hover:bg-slate-50 border-slate-100"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/my-account');
                    }}
                  >
                    <FaUser className="w-4 h-4 mr-2 text-slate-600 shrink-0" />
                    Settings
                  </button>
                  <button
                    type="button"
                    className="flex items-center w-full px-3 py-2 text-xs font-semibold text-left text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/membership');
                    }}
                  >
                    <FaIdCard className="w-4 h-4 mr-2 text-slate-600 shrink-0" />
                    Membership
                  </button>
                  <button
                    type="button"
                    className="flex items-center w-full px-3 py-2 text-xs font-semibold text-left text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/my-account?tab=wallet');
                    }}
                  >
                    <FaWallet className="w-4 h-4 mr-2 text-slate-600 shrink-0" />
                    Wallet
                  </button>
                  <button
                    type="button"
                    className="flex items-center w-full px-3 py-2 text-xs font-semibold text-left text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/send-money');
                    }}
                  >
                    <FaPaperPlane className="w-4 h-4 mr-2 text-slate-600 shrink-0" />
                    Send Money
                  </button>
                  <button
                    type="button"
                    className="flex items-center w-full px-3 py-2 text-xs font-semibold text-left text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/orders');
                    }}
                  >
                    <FaBox className="w-4 h-4 mr-2 text-slate-600 shrink-0" />
                    Order History
                  </button>
                  <button
                    type="button"
                    className="flex items-center w-full px-3 py-2 text-xs font-semibold text-left border-t text-slate-700 hover:bg-slate-50 border-slate-200"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/robo-game-zone');
                    }}
                  >
                    <FaGamepad className="w-4 h-4 mr-2 text-slate-600 shrink-0" />
                    Robo Game Zone
                  </button>
                  <button
                    type="button"
                    className="flex items-center w-full px-3 py-2 text-xs font-semibold text-left text-red-600 border-t hover:bg-red-50 border-slate-200"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <FaSignOutAlt className="w-4 h-4 mr-2 shrink-0" />
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
                <FaUser className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
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