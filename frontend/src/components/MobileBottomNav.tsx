import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, CirclePlus, UserCircle } from 'lucide-react';

function MobileBottomNav() {
  const location = useLocation();

  const items = [
    { to: '/', label: 'Home', Icon: Home },
    { to: '/orders', label: 'My Orders', Icon: ShoppingBag },
    { to: '/add-money', label: 'Add Money', Icon: CirclePlus },
    { to: '/my-account', label: 'My Account', Icon: UserCircle },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl sm:hidden"
      style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="mx-auto grid max-w-[1380px] grid-cols-4">
        {items.map(({ to, label, Icon }) => {
          const isActive =
            to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);

          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-semibold tracking-tight transition-colors ${
                isActive ? 'text-indigo-600' : 'text-slate-500'
              }`}
            >
              <div className={`rounded-xl p-2 ${isActive ? 'bg-indigo-50' : ''}`}>
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;

