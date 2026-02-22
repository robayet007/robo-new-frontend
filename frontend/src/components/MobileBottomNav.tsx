import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaRegUserCircle } from 'react-icons/fa';
import { FaCirclePlus } from 'react-icons/fa6';
import { MdOutlineShoppingBag } from 'react-icons/md';

function MobileBottomNav() {
  const location = useLocation();

  const items = [
    { to: '/', label: 'Home', Icon: FaHome },
    { to: '/orders', label: 'My Orders', Icon: MdOutlineShoppingBag },
    { to: '/add-money', label: 'Add Money', Icon: FaCirclePlus },
    { to: '/my-account', label: 'My Account', Icon: FaRegUserCircle },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur-xl border-slate-200 sm:hidden">
      <div className="grid grid-cols-4 max-w-[1380px] mx-auto">
        {items.map(({ to, label, Icon }) => {
          const isActive =
            to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);

          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-indigo-600' : 'text-slate-500'
              }`}
            >
              <div
                className={`rounded-xl p-2 ${isActive ? 'bg-indigo-50' : ''}`}
              >
                <Icon className="w-5 h-5" />
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

