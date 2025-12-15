// Navbar.jsx
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useUserRole from '../hooks/useUserRole';
import useRoboBalance from '../hooks/useRoboBalance';
import { useEffect } from 'react'; // useEffect import করুন

function Navbar() {
  const { user, logout } = useAuth();
  const { isAdmin } = useUserRole();
  const { backendBalance, loading, refreshBalance } = useRoboBalance(); // শুধু backendBalance ব্যবহার করুন

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
        className="flex items-center gap-2 transition-transform duration-200 sm:gap-3 group hover:scale-105"
      >
        <div className="relative px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-600 overflow-hidden shadow-lg shadow-purple-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 transition-all duration-300">
          <span className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent opacity-70" />
          <span className="relative text-sm font-extrabold tracking-tight text-white sm:text-base drop-shadow-sm whitespace-nowrap" style={{ fontFamily: "'Inter', 'Poppins', sans-serif", letterSpacing: "0.5px" }}>Robo Top Up</span>
        </div>
        <div className="hidden xs:block">
          <p className="m-0 text-base font-bold transition-colors duration-200 sm:text-lg text-slate-900 group-hover:text-purple-600">
            Robo Top Up
          </p>
          <p className="m-0 text-slate-500 text-[10px] sm:text-xs font-medium">
            Free Fire Diamonds
          </p>
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
            {!isAdmin && (
              <>
                <Link
                  to="/add-money"
                  className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold text-[10px] sm:text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md"
                >
                  <span className="hidden sm:inline">💰 Add Money</span>
                  <span className="sm:hidden">💰</span>
                </Link>
                <div className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                  <p className="text-[10px] sm:text-xs text-slate-600 hidden sm:block">
                    {loading ? 'Loading...' : 'Balance'}
                  </p>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-green-600 sm:text-sm">
                      ৳{(backendBalance !== null ? backendBalance : 0).toFixed(2)}
                    </p>
                    {!loading && (
                      <button
                        onClick={refreshBalance}
                        className="p-1 text-green-600 hover:text-green-700"
                        title="Refresh balance"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500 truncate max-w-[100px]">
                    {user.email}
                  </p>
                </div>
              </>
            )}
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100">
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