// Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useUserRole from '../hooks/useUserRole';
import useRoboBalance from '../hooks/useRoboBalance';
import { useEffect, useState } from 'react'; // useEffect, useState import করুন

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isAdmin } = useUserRole();
  const { backendBalance, loading, refreshBalance } = useRoboBalance(); // শুধু backendBalance ব্যবহার করুন
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  // Balance refresh on mount
  useEffect(() => {
    if (user?.email) {
      refreshBalance();
    }
  }, [user?.email, refreshBalance]);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-3 py-3 mb-3 transition-all duration-300 border shadow-lg sm:px-4 md:px-5 sm:py-4 sm:mb-4 md:mb-5 border-slate-200/60 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-white/95 shadow-slate-900/5">
      <Link 
        to="/" 
        className="flex items-center gap-2 transition-transform duration-200 sm:gap-3 group hover:scale-[1.02]"
      >
        <div className="flex flex-col">
          <p
            className="m-0 text-lg sm:text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-violet-600 to-fuchsia-500 drop-shadow-sm"
            style={{ fontFamily: "'Poppins', 'Inter', system-ui", letterSpacing: '0.5px' }}
          >
            Robo Top Up
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
            <div className="relative">
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
                <div className="absolute right-0 z-20 w-52 mt-2 overflow-hidden bg-white border rounded-xl shadow-lg border-slate-200">
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
                    className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-400 hover:bg-slate-50 cursor-not-allowed opacity-60"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      alert('🔧 Add Money service is currently under maintenance. Please try again later.');
                    }}
                    title="Under Maintenance"
                  >
                    💰 Add Money <span className="text-[10px] text-amber-600">(Maintenance)</span>
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/change-password');
                    }}
                  >
                    🔑 Change Password
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/orders');
                    }}
                  >
                    📦 Order History
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/ff-info');
                    }}
                  >
                    🔍 FF ID Info
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">🚪</span>
            </button>
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