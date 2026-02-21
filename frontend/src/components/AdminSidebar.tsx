import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaBox, FaUsers, FaHistory, FaSignOutAlt, FaChartLine, FaGamepad, FaPalette, FaKey, FaCalendarAlt, FaStore, FaCrown } from 'react-icons/fa';
import { useModeratorPermissionsContext } from '../contexts/ModeratorPermissionsContext';

type SidebarProps = {
  activeTab: 'dashboard' | 'products' | 'users' | 'orders' | 'gamePackages' | 'theme' | 'digitalCodes' | 'subscriptions' | 'reseller' | 'membership';
  onTabChange: (tab: 'dashboard' | 'products' | 'users' | 'orders' | 'gamePackages' | 'theme' | 'digitalCodes' | 'subscriptions' | 'reseller' | 'membership') => void;
  onLogout: () => void;
};

function AdminSidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { role, permissions } = useModeratorPermissionsContext();

  const allMenuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: FaHome, permission: 'canAccessDashboard', adminOnly: false },
    { id: 'products' as const, label: 'Products & Categories', icon: FaBox, permission: 'canManageProducts', adminOnly: false },
    { id: 'digitalCodes' as const, label: 'Digital Codes', icon: FaKey, permission: 'canManageDigitalCodes', adminOnly: false },
    { id: 'subscriptions' as const, label: 'Subscriptions', icon: FaCalendarAlt, permission: 'canManageSubscriptions', adminOnly: false },
    { id: 'theme' as const, label: 'Store Customize & Logo', icon: FaPalette, permission: 'canAccessDashboard', adminOnly: true },
    { id: 'gamePackages' as const, label: 'Game Packages', icon: FaGamepad, permission: 'canManageGamePackages', adminOnly: false },
    { id: 'users' as const, label: 'User Management', icon: FaUsers, permission: 'canManageUsers', adminOnly: false },
    { id: 'orders' as const, label: 'Order History', icon: FaHistory, permission: 'canManageOrders', adminOnly: false },
    { id: 'reseller' as const, label: 'Reseller Management', icon: FaStore, permission: 'canAccessDashboard', adminOnly: true },
    { id: 'membership' as const, label: 'Membership Packages', icon: FaCrown, permission: 'canAccessDashboard', adminOnly: true },
  ];

  // Filter menu items based on permissions
  const menuItems = allMenuItems.filter(item => {
    // Theme customization and reseller management are admin-only
    if (item.adminOnly && role !== 'admin') return false;
    // Admins see everything
    if (role === 'admin') return true;
    // Moderators only see items they have permission for
    if (role === 'moderator') {
      return permissions[item.permission as keyof typeof permissions] === true;
    }
    // Regular users see nothing (shouldn't be here anyway)
    return false;
  });

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
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg theme-gradient"
            style={{ background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))` }}
          >
            <FaChartLine className="text-white text-lg" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-white mb-0.5">Admin Panel</h2>
            <p
              className="m-0 text-sm font-extrabold tracking-tight text-transparent bg-clip-text drop-shadow-sm"
              style={{ 
                fontFamily: "var(--theme-font-family), sans-serif", 
                letterSpacing: '0.5px',
                backgroundImage: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary), var(--theme-primary))`
              }}
            >
              Robo Top Up Zone
            </p>
            <div className="mt-0.5 flex items-center gap-1">
              <span 
                className="inline-block h-[2px] w-8 rounded-full"
                style={{ background: `linear-gradient(to right, var(--theme-primary), #0ea5e9, #10b981)` }}
              />
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
                  ? 'text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
              style={isActive ? {
                background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`,
                boxShadow: `0 10px 15px -3px rgba(var(--theme-primary-rgb), 0.3), 0 4px 6px -2px rgba(var(--theme-primary-rgb), 0.2)`
              } : {}}
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

