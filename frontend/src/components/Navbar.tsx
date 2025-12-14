import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useUserRole from '../hooks/useUserRole';
import useRoboBalance from '../hooks/useRoboBalance';

function Navbar() {
  const { user, logout } = useAuth();
  const { isAdmin } = useUserRole();
  const { balance } = useRoboBalance();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-3 sm:px-4 md:px-5 py-3 sm:py-4 mb-3 sm:mb-4 md:mb-5 border border-slate-200/60 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-white/95 shadow-lg shadow-slate-900/5 transition-all duration-300">
      <Link 
        to="/" 
        className="flex items-center gap-2 sm:gap-3 group transition-transform duration-200 hover:scale-105"
      >
        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 grid place-items-center overflow-hidden shadow-lg shadow-sky-500/30 group-hover:shadow-xl group-hover:shadow-sky-500/40 transition-all duration-300">
          <span className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent opacity-70" />
          <span className="relative font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight drop-shadow-sm">R</span>
        </div>
        <div className="hidden xs:block">
          <p className="m-0 font-bold text-base sm:text-lg text-slate-900 group-hover:text-sky-600 transition-colors duration-200">
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
                className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200"
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
                  <p className="text-[10px] sm:text-xs text-slate-600 hidden sm:block">Balance</p>
                  <p className="text-xs sm:text-sm font-bold text-green-600">৳{balance.toFixed(2)}</p>
                </div>
              </>
            )}
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-sky-400 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
                  {user.displayName?.[0] || user.email?.[0] || 'U'}
                </div>
              )}
              <span className="text-xs sm:text-sm font-medium text-slate-700 hidden md:inline">
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
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-sky-400 to-blue-500 text-white hover:from-sky-500 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-sky-500/30"
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

