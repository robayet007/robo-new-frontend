// Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useUserRole from '../hooks/useUserRole';
import useRoboBalance from '../hooks/useRoboBalance';
import { useRoboGameZone } from '../contexts/RoboGameZoneContext';
import { useEffect, useState, useRef } from 'react';

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isAdmin } = useUserRole();
  const { backendBalance, loading, refreshBalance } = useRoboBalance(); // শুধু backendBalance ব্যবহার করুন
  const { isRoboGameZoneEnabled, setIsRoboGameZoneEnabled } = useRoboGameZone();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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
    <header className="sticky top-0 z-10 flex items-center justify-between px-3 py-3 mb-3 transition-all duration-300 border shadow-lg sm:px-4 md:px-5 sm:py-4 sm:mb-4 md:mb-5 border-slate-200/40 rounded-xl sm:rounded-2xl backdrop-blur-2xl bg-white/70 shadow-slate-900/10">
      <Link 
        to="/" 
        className="flex items-center gap-2 transition-transform duration-200 sm:gap-3 group hover:scale-[1.02]"
      >
        <div className="flex flex-col">
          <p
            className="m-0 text-lg font-extrabold tracking-tight text-transparent sm:text-2xl bg-clip-text bg-gradient-to-r from-purple-500 via-violet-600 to-fuchsia-500 drop-shadow-sm"
            style={{ fontFamily: "'Poppins', 'Inter', system-ui", letterSpacing: '0.5px' }}
          >
            Robo Top Up Zone
          </p>
          <div className="mt-0.5 flex items-center gap-1">
            <span className="inline-block h-[3px] w-10 rounded-full bg-gradient-to-r from-purple-400 via-sky-400 to-emerald-400" />
            <span className="text-[10px] sm:text-xs font-medium text-slate-500">
              Free Fire Diamonds
            </span>
          </div>
        </div>
      </Link>
      <nav className="flex items-center gap-1 sm:gap-2">
        {user ? (
          <>
            {!isAdmin && (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                <span className="text-xs font-bold text-green-600 sm:text-sm">
                  {loading ? (
                    <span className="inline-block w-8 h-3 bg-green-200 rounded animate-pulse"></span>
                  ) : (
                    `৳${(backendBalance !== null ? backendBalance : 0).toFixed(2)}`
                  )}
                </span>
              </div>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm text-slate-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
              >
                <span className="hidden sm:inline">Admin</span>
                <span className="sm:hidden">⚙️</span>
              </Link>
            )}
            {/* Non-admin specific options are now only inside the profile menu */}
            {/* Profile avatar + dropdown menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((open) => !open)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-5 h-5 rounded-full sm:w-6 sm:h-6"
                  />
                ) : (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
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
                  {!isAdmin && (
                    <div className="px-3 py-2 text-xs border-b bg-slate-50">
                      <p className="text-[10px] text-slate-500">
                        {loading ? 'Balance loading...' : 'Your Balance'}
                      </p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-sm font-bold text-green-600">
                          ৳{(backendBalance !== null ? backendBalance : 0).toFixed(2)}
                        </p>
                        {!loading && (
                          <button
                            onClick={() => {
                              refreshBalance();
                            }}
                            className="text-[11px] font-medium text-green-600 hover:text-green-700"
                          >
                            Refresh
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-xs font-semibold text-left border-b text-slate-700 hover:bg-slate-50 border-slate-100"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/my-account');
                    }}
                  >
                    👤 My Account
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-xs font-semibold text-left text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/add-money');
                    }}
                  >
                    💰 Add Money
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-xs font-semibold text-left text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/my-account#send-money');
                    }}
                  >
                    📤 Send Money
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-xs font-semibold text-left text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/change-password');
                    }}
                  >
                    🔑 Change Password
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-xs font-semibold text-left text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/orders');
                    }}
                  >
                    📦 Order History
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-xs font-semibold text-left text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/ff-info');
                    }}
                  >
                    🔍 FF ID Info
                  </button>
                  <div className="block w-full px-3 py-2 text-xs font-semibold text-left border-t text-slate-700 hover:bg-slate-50 border-slate-200">
                    <div className="flex items-center justify-between">
                      <span>🎮 Robo Game Zone</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isRoboGameZoneEnabled}
                          onChange={(e) => {
                            setIsRoboGameZoneEnabled(e.target.checked);
                            setIsProfileMenuOpen(false);
                            if (e.target.checked) {
                              navigate('/robo-game-zone');
                            } else {
                              navigate('/');
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-xs font-semibold text-left text-red-600 border-t hover:bg-red-50 border-slate-200"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    ⬅️ Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm text-slate-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:from-purple-600 hover:to-violet-700 transition-all duration-200 shadow-lg shadow-purple-500/30"
            >
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;