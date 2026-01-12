import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaBox, FaUsers, FaHistory, FaSignOutAlt, FaChartLine, FaImages, FaBell, FaGamepad, FaEnvelope } from 'react-icons/fa';

type SidebarProps = {
  activeTab: 'dashboard' | 'products' | 'users' | 'orders' | 'banners' | 'notices' | 'gamePackages' | 'notifications';
  onTabChange: (tab: 'dashboard' | 'products' | 'users' | 'orders' | 'banners' | 'notices' | 'gamePackages' | 'notifications') => void;
  onLogout: () => void;
};

function AdminSidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: FaHome },
    { id: 'products' as const, label: 'Products & Categories', icon: FaBox },
    { id: 'banners' as const, label: 'Banner Management', icon: FaImages },
    { id: 'notices' as const, label: 'Notice Management', icon: FaBell },
    { id: 'gamePackages' as const, label: 'Game Packages', icon: FaGamepad },
    { id: 'notifications' as const, label: 'User Notifications', icon: FaEnvelope },
    { id: 'users' as const, label: 'User Management', icon: FaUsers },
    { id: 'orders' as const, label: 'Order History', icon: FaHistory },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900 text-white lg:hidden shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl z-40 flex flex-col transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
      {/* Logo/Header */}
      <div className="p-6 border-b border-slate-700">
        <Link 
          to="/" 
          className="flex items-center gap-3 transition-transform duration-200 group hover:scale-[1.02]"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
            <FaChartLine className="text-white text-lg" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-white mb-0.5">Admin Panel</h2>
            <p
              className="m-0 text-sm font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-violet-600 to-fuchsia-500 drop-shadow-sm"
              style={{ fontFamily: "'Poppins', 'Inter', system-ui", letterSpacing: '0.5px' }}
            >
              Robo Top Up Zone
            </p>
            <div className="mt-0.5 flex items-center gap-1">
              <span className="inline-block h-[2px] w-8 rounded-full bg-gradient-to-r from-purple-400 via-sky-400 to-emerald-400" />
              <span className="text-[9px] font-medium text-slate-400">
                Free Fire Diamonds
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <Icon className={`text-lg ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-all duration-200 border border-red-600/30"
        >
          <FaSignOutAlt className="text-lg" />
            <span className="font-semibold text-sm">Logout</span>
        </button>
      </div>
    </div>
    </>
  );
}

export default AdminSidebar;

