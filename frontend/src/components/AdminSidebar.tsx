import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  History,
  LogOut,
  Gamepad2,
  Palette,
  Calendar,
  Store,
  Crown,
  Ticket,
} from 'lucide-react';
import { useModeratorPermissionsContext } from '../contexts/ModeratorPermissionsContext';
import { useTheme } from '../contexts/ThemeContext';
import { getImageUrl } from '../utils/imageUrl';

type SidebarProps = {
  activeTab: 'dashboard' | 'products' | 'users' | 'orders' | 'gamePackages' | 'theme' | 'subscriptions' | 'reseller' | 'membership' | 'voucher';
  onTabChange: (tab: 'dashboard' | 'products' | 'users' | 'orders' | 'gamePackages' | 'theme' | 'subscriptions' | 'reseller' | 'membership' | 'voucher') => void;
  onLogout: () => void;
};

function AdminSidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { role, permissions } = useModeratorPermissionsContext();
  const { navbarLogoUrl } = useTheme();

  const allMenuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, permission: 'canAccessDashboard', adminOnly: false },
    { id: 'products' as const, label: 'Products & Categories', icon: Package, permission: 'canManageProducts', adminOnly: false },
    { id: 'subscriptions' as const, label: 'Subscriptions', icon: Calendar, permission: 'canManageSubscriptions', adminOnly: false },
    { id: 'theme' as const, label: 'Store Customize & Key Integration', icon: Palette, permission: 'canAccessDashboard', adminOnly: true },
    { id: 'gamePackages' as const, label: 'Game Packages', icon: Gamepad2, permission: 'canManageGamePackages', adminOnly: false },
    { id: 'users' as const, label: 'User Management', icon: Users, permission: 'canManageUsers', adminOnly: false },
    { id: 'orders' as const, label: 'Order History', icon: History, permission: 'canManageOrders', adminOnly: false },
    { id: 'reseller' as const, label: 'Reseller Management', icon: Store, permission: 'canAccessDashboard', adminOnly: true },
    { id: 'membership' as const, label: 'Membership Packages', icon: Crown, permission: 'canAccessDashboard', adminOnly: true },
    { id: 'voucher' as const, label: 'Voucher', icon: Ticket, permission: 'canAccessDashboard', adminOnly: true },
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
        className="fixed top-4 left-4 z-50 rounded-lg bg-white p-2 shadow-lg ring-1 ring-slate-200/80 lg:hidden"
      >
        <svg className="h-6 w-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - White premium */}
      <div
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200/80 bg-white shadow-xl transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}
      >
        {/* Logo/Header */}
        <div className="border-b border-slate-100 p-5">
          <Link
            to="/"
            className="group flex items-center transition-transform duration-200 hover:scale-[1.01]"
          >
            {navbarLogoUrl ? (
              <img
                src={getImageUrl(navbarLogoUrl)}
                alt="Admin logo"
                style={{
                  height: '56px',
                  width: 'auto',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  backgroundColor: 'transparent',
                }}
              />
            ) : (
              <h2 className="m-0 text-base font-bold tracking-tight text-slate-900">
                Admin Panel
              </h2>
            )}
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`,
                        boxShadow: `0 4px 12px rgba(var(--theme-primary-rgb), 0.25)`,
                      }
                    : {}
                }
              >
                <Icon
                  className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`}
                  strokeWidth={2}
                />
                <span className="text-sm font-semibold tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl border border-red-200/80 bg-red-50/80 px-3.5 py-2.5 text-red-600 transition-all duration-200 hover:bg-red-100/80 hover:text-red-700"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
            <span className="text-sm font-semibold tracking-tight">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default AdminSidebar;

