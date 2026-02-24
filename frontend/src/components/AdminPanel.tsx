import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import useCatalog from '../hooks/useCatalog';
import { gamePackageApi } from '../services/api';
import type { BackendGamePackage } from '../types';
import UserManagement from './UserManagement';
import AdminOrders from './AdminOrders';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from './AdminDashboard';
import ThemeCustomization from './ThemeCustomization';
import AdminSubscriptions from './AdminSubscriptions';
import AdminReseller from './AdminReseller';
import AdminMembership from './AdminMembership';
import AdminVoucher from './AdminVoucher';
import AdminProducts from './AdminProducts';
import ImageUpload from './ImageUpload';
import { useModeratorPermissionsContext } from '../contexts/ModeratorPermissionsContext';
import { useToast } from '../contexts/ToastContext';
import { getImageUrl } from '../utils/imageUrl';

// Helper function to convert UTC to Bangladesh time (GMT+6) for datetime-local input
function utcToBDTimeForInput(utcDateString: string): string {
  if (!utcDateString) return '';
  const date = new Date(utcDateString);
  // Add 6 hours to convert from UTC to GMT+6
  const bdDate = new Date(date.getTime() + 6 * 60 * 60 * 1000);
  // Format as datetime-local string (YYYY-MM-DDTHH:mm)
  const year = bdDate.getFullYear();
  const month = String(bdDate.getMonth() + 1).padStart(2, '0');
  const day = String(bdDate.getDate()).padStart(2, '0');
  const hours = String(bdDate.getHours()).padStart(2, '0');
  const minutes = String(bdDate.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

type TabType = 'dashboard' | 'products' | 'users' | 'orders' | 'gamePackages' | 'theme' | 'subscriptions' | 'reseller' | 'membership' | 'voucher';

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const { 
    loading,
    error,
    retry 
  } = useCatalog();

  const { role, permissions, loading: permissionsLoading } = useModeratorPermissionsContext();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const validTabs: TabType[] = ['dashboard', 'products', 'users', 'orders', 'gamePackages', 'theme', 'subscriptions', 'reseller', 'membership', 'voucher'];
  const tabFromUrl = searchParams.get('tab');
  const initialTab: TabType = validTabs.includes(tabFromUrl as TabType) ? (tabFromUrl as TabType) : 'dashboard';

  const [activeTab, setActiveTabState] = useState<TabType>(initialTab);

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    setSearchParams({ tab }, { replace: true });
  };

  // Sync activeTab from URL when URL changes (e.g. browser back/forward)
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && validTabs.includes(urlTab as TabType) && urlTab !== activeTab) {
      setActiveTabState(urlTab as TabType);
    }
  }, [searchParams, activeTab]);

  // Permission check helper
  const hasPermission = (permission: keyof typeof permissions): boolean => {
    if (role === 'admin') return true;
    if (role === 'moderator') return permissions[permission] === true;
    return false;
  };

  // Redirect to first available tab if current tab is not accessible
  useEffect(() => {
    if (loading || permissionsLoading || role === 'user') return;

    const tabPermissions: Record<TabType, keyof typeof permissions> = {
      dashboard: 'canAccessDashboard',
      products: 'canManageProducts',
      gamePackages: 'canManageGamePackages',
      users: 'canManageUsers',
      orders: 'canManageOrders',
      theme: 'canAccessDashboard', // Theme is admin-only, but uses dashboard permission for check
      subscriptions: 'canManageSubscriptions', // Subscriptions has its own permission
      reseller: 'canAccessDashboard', // Reseller is admin-only, but uses dashboard permission for check
      membership: 'canAccessDashboard', // Membership is admin-only, but uses dashboard permission for check
      voucher: 'canAccessDashboard', // Voucher is admin-only, but uses dashboard permission for check
    };

    // Theme and reseller tabs are admin-only
    if ((activeTab === 'theme' || activeTab === 'reseller' || activeTab === 'membership' || activeTab === 'voucher') && role !== 'admin') {
      const availableTab = (Object.keys(tabPermissions) as TabType[]).find(
        tab => tab !== 'theme' && tab !== 'reseller' && tab !== 'membership' && tab !== 'voucher' && hasPermission(tabPermissions[tab])
      );
      if (availableTab) {
        setActiveTab(availableTab);
      }
      return;
    }
    
    if (!hasPermission(tabPermissions[activeTab])) {
      // Find first available tab
      const availableTab = (Object.keys(tabPermissions) as TabType[]).find(
        tab => hasPermission(tabPermissions[tab])
      );
      if (availableTab) {
        setActiveTab(availableTab);
      }
    }
  }, [role, permissions, activeTab, loading, permissionsLoading]);

  const [gamePackages, setGamePackages] = useState<BackendGamePackage[]>([]);
  const [packageId, setPackageId] = useState('');
  const [packageTitle, setPackageTitle] = useState('');
  const [packageImage, setPackageImage] = useState('');
  const [packageEntryFee, setPackageEntryFee] = useState('');
  const [packageWinnerPrize, setPackageWinnerPrize] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [packageRoomId, setPackageRoomId] = useState('');
  const [packageRoomPassword, setPackageRoomPassword] = useState('');
  const [packageMaxPurchases, setPackageMaxPurchases] = useState('100');
  const [packageStartTime, setPackageStartTime] = useState('');
  const [editingPackage, setEditingPackage] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'gamePackages') {
      loadGamePackages();
    }
  }, [activeTab]);

  // Load game packages
  const loadGamePackages = async () => {
    try {
      const response = await gamePackageApi.getAllForAdmin();
      if (response.success && Array.isArray(response.data)) {
        setGamePackages(response.data);
      }
    } catch (err) {
      console.error('Failed to load game packages:', err);
    }
  };

  // Game Package handlers
  const handleAddGamePackage = async (e: FormEvent) => {
    e.preventDefault();
    if (!packageId.trim() || !packageTitle.trim() || !packageImage.trim() || !packageEntryFee || !packageWinnerPrize.trim() || !packageRoomId.trim() || !packageRoomPassword.trim() || !packageStartTime) {
      showToast({ type: 'error', text: 'Package ID, title, image, entry fee, winner prize, room ID, room password, and start time are required' });
      return;
    }

    try {
      const response = await gamePackageApi.create({
        id: packageId.trim(),
        title: packageTitle.trim(),
        image: packageImage.trim(),
        entryFee: Number(packageEntryFee),
        winnerPrize: packageWinnerPrize.trim(),
        description: packageDescription.trim() || undefined,
        roomId: packageRoomId.trim(),
        roomPassword: packageRoomPassword.trim(),
        maxPurchases: Number(packageMaxPurchases) || 100,
        startTime: packageStartTime,
        isActive: true
      });

      if (response.success) {
        showToast({ type: 'success', text: 'Game package created successfully!' });
        setPackageId('');
        setPackageTitle('');
        setPackageImage('');
        setPackageEntryFee('');
        setPackageWinnerPrize('');
        setPackageDescription('');
        setPackageRoomId('');
        setPackageRoomPassword('');
        setPackageMaxPurchases('100');
        setPackageStartTime('');
        await loadGamePackages();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to create game package' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to create game package' });
    }
  };

  const handleEditGamePackage = (pkg: BackendGamePackage) => {
    setEditingPackage(pkg.id);
    setPackageId(pkg.id);
    setPackageTitle(pkg.title);
    setPackageImage(pkg.image);
    setPackageEntryFee(pkg.entryFee.toString());
    setPackageWinnerPrize(pkg.winnerPrize);
    setPackageDescription(pkg.description || '');
    setPackageRoomId(pkg.roomId || '');
    setPackageRoomPassword(pkg.roomPassword || '');
    setPackageMaxPurchases(pkg.maxPurchases.toString());
    setPackageStartTime(utcToBDTimeForInput(pkg.startTime));
  };

  const handleCancelGamePackageEdit = () => {
    setEditingPackage(null);
    setPackageId('');
    setPackageTitle('');
    setPackageImage('');
    setPackageEntryFee('');
    setPackageWinnerPrize('');
    setPackageDescription('');
    setPackageRoomId('');
    setPackageRoomPassword('');
    setPackageMaxPurchases('100');
    setPackageStartTime('');
  };

  const handleUpdateGamePackage = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPackage || !packageTitle.trim() || !packageImage.trim() || !packageEntryFee || !packageWinnerPrize.trim() || !packageRoomId.trim() || !packageRoomPassword.trim() || !packageStartTime) {
      showToast({ type: 'error', text: 'Title, image, entry fee, winner prize, room ID, room password, and start time are required' });
      return;
    }

    try {
      const response = await gamePackageApi.update(editingPackage, {
        title: packageTitle.trim(),
        image: packageImage.trim(),
        entryFee: Number(packageEntryFee),
        winnerPrize: packageWinnerPrize.trim(),
        description: packageDescription.trim() || undefined,
        roomId: packageRoomId.trim(),
        roomPassword: packageRoomPassword.trim(),
        maxPurchases: Number(packageMaxPurchases) || 100,
        startTime: packageStartTime
      });

      if (response.success) {
        showToast({ type: 'success', text: 'Game package updated successfully!' });
        handleCancelGamePackageEdit();
        await loadGamePackages();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to update game package' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to update game package' });
    }
  };

  const handleRemoveGamePackage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this game package?')) {
      return;
    }

    try {
      const response = await gamePackageApi.delete(id);
      if (response.success) {
        showToast({ type: 'success', text: 'Game package deleted successfully!' });
        await loadGamePackages();
        if (editingPackage === id) {
          handleCancelGamePackageEdit();
        }
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to delete game package' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to delete game package' });
    }
  };

  const handleToggleGamePackageActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await gamePackageApi.update(id, { isActive: !currentStatus });
      if (response.success) {
        showToast({ 
          type: 'success', 
          text: `Game package ${!currentStatus ? 'activated' : 'deactivated'} successfully!` 
        });
        await loadGamePackages();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to update game package status' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to update game package status' });
    }
  };

  if (loading || permissionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}>
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin"
          />
          <p className="text-sm font-medium text-slate-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/80" style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}>
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={onLogout} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <div className="p-0">
          {/* Header */}
          <div className="mb-4 pt-4 pb-4 pl-0 pr-4 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
            <h1 className="mb-1.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'products' && 'Products & Categories'}
              {activeTab === 'gamePackages' && 'Game Packages'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'orders' && 'Order History'}
              {activeTab === 'subscriptions' && 'Subscriptions'}
              {activeTab === 'reseller' && 'Reseller Management'}
              {activeTab === 'membership' && 'Membership Packages'}
              {activeTab === 'voucher' && 'Voucher'}
              {activeTab === 'theme' && 'Store Customize & Key Integration'}
            </h1>
            <p className="text-sm font-medium text-slate-500">
              {activeTab === 'dashboard' && 'Overview of your business metrics and analytics'}
              {activeTab === 'products' && 'Manage products and categories'}
              {activeTab === 'gamePackages' && 'Manage RoboGameZone packages and room credentials'}
              {activeTab === 'users' && 'Manage users and their balances'}
              {activeTab === 'orders' && 'View and manage all orders'}
              {activeTab === 'subscriptions' && 'Manage subscription categories and products'}
              {activeTab === 'reseller' && 'Manage reseller prices for all products'}
              {activeTab === 'membership' && 'Create and manage membership packages for users'}
              {activeTab === 'voucher' && 'Manage voucher settings and workflow'}
              {activeTab === 'theme' && 'Upload navbar logo and customize theme colors and branding'}
            </p>
            {error && (
              <div className="mt-3 rounded-xl border border-red-200/80 bg-red-50/80 p-3">
                <p className="text-sm font-medium text-red-700">{error}</p>
                <button
                  className="mt-2 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-200"
                  onClick={retry}
                >
                  Retry Connection
                </button>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="px-0">
            {activeTab === 'theme' && role === 'admin' ? (
              <ThemeCustomization />
            ) : activeTab === 'reseller' && role === 'admin' ? (
              <AdminReseller />
            ) : activeTab === 'membership' && role === 'admin' ? (
              <AdminMembership />
            ) : activeTab === 'voucher' && role === 'admin' ? (
              <AdminVoucher />
            ) : activeTab === 'subscriptions' && hasPermission('canManageSubscriptions') ? (
              <AdminSubscriptions />
            ) : activeTab === 'dashboard' && hasPermission('canAccessDashboard') ? (
              <AdminDashboard />
            ) : activeTab === 'users' && hasPermission('canManageUsers') ? (
              <UserManagement />
            ) : activeTab === 'orders' && hasPermission('canManageOrders') ? (
              <AdminOrders />
            ) : activeTab === 'gamePackages' && hasPermission('canManageGamePackages') ? (
              <div className="space-y-6 pt-4 pb-4 pl-0 pr-4 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
                {/* Game Package Management Section */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 md:p-6">
                  <h3 className="mb-4 text-lg font-bold tracking-tight text-slate-900">Game Package Management</h3>
                  
                  {/* Add/Edit Package Form */}
                  <form 
                    className="p-4 mb-6 border rounded-lg bg-slate-50 border-slate-200" 
                    onSubmit={editingPackage ? handleUpdateGamePackage : handleAddGamePackage}
                  >
                    <h4 className="mb-3 text-base font-semibold text-slate-700">
                      {editingPackage ? 'Edit Game Package' : 'Add New Game Package'}
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Package ID *</span>
                        <input
                          required
                          value={packageId}
                          onChange={(e) => setPackageId(e.target.value)}
                          placeholder="package-001"
                          disabled={!!editingPackage}
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 disabled:bg-slate-100"
                        />
                      </label>
                      <label className="block">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Title *</span>
                        <input
                          required
                          value={packageTitle}
                          onChange={(e) => setPackageTitle(e.target.value)}
                          placeholder="Tournament Package"
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
                      </label>
                      <div className="md:col-span-2">
                        <ImageUpload
                          label="Image *"
                          value={packageImage}
                          onChange={setPackageImage}
                          uploadEndpoint="/upload/package-image"
                        />
                      </div>
                      <label className="block">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Entry Fee (৳) *</span>
                        <input
                          required
                          type="number"
                          min="0"
                          value={packageEntryFee}
                          onChange={(e) => setPackageEntryFee(e.target.value)}
                          placeholder="50"
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
                      </label>
                      <label className="block">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Winner Prize *</span>
                        <input
                          required
                          value={packageWinnerPrize}
                          onChange={(e) => setPackageWinnerPrize(e.target.value)}
                          placeholder="500 Diamonds"
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
                      </label>
                      <label className="block">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Room ID *</span>
                        <input
                          required
                          value={packageRoomId}
                          onChange={(e) => setPackageRoomId(e.target.value)}
                          placeholder="123456"
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
                      </label>
                      <label className="block">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Room Password *</span>
                        <input
                          required
                          type="password"
                          autoComplete="password"
                          value={packageRoomPassword}
                          onChange={(e) => setPackageRoomPassword(e.target.value)}
                          placeholder="password123"
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
                      </label>
                      <label className="block">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Max Purchases *</span>
                        <input
                          required
                          type="number"
                          min="1"
                          value={packageMaxPurchases}
                          onChange={(e) => setPackageMaxPurchases(e.target.value)}
                          placeholder="100"
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Description (optional)</span>
                        <textarea
                          value={packageDescription}
                          onChange={(e) => setPackageDescription(e.target.value)}
                          placeholder="Package description..."
                          rows={3}
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
                      </label>
                      <label className="block">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Tournament Start Time (Bangladesh Time) *</span>
                        <input
                          required
                          type="datetime-local"
                          value={packageStartTime}
                          onChange={(e) => setPackageStartTime(e.target.value)}
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
                        <p className="mt-1 text-xs text-slate-500">Set when the tournament will start</p>
                      </label>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button 
                        className="px-4 py-2 font-semibold text-white transition-all rounded-xl" 
                        style={{
                          background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `linear-gradient(135deg, var(--theme-primary-hover), var(--theme-secondary-dark))`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`;
                        }}
                        type="submit"
                      >
                        {editingPackage ? 'Update Package' : 'Add Package'}
                      </button>
                      {editingPackage && (
                        <button 
                          type="button"
                          onClick={handleCancelGamePackageEdit}
                          className="px-4 py-2 font-semibold transition-all bg-slate-200 rounded-xl text-slate-700 hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Packages List */}
                  <div>
                    <h4 className="mb-3 text-base font-semibold text-slate-700">
                      Existing Packages ({gamePackages.length})
                    </h4>
                    <div className="space-y-2">
                      {gamePackages.length > 0 ? (
                        gamePackages.map((pkg) => {
                          const isActive = pkg.isActive !== false;
                          return (
                            <div key={pkg.id} className={`p-4 transition-colors border rounded-lg ${
                              isActive ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-50'
                            } hover:bg-slate-50`}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    {!isActive && (
                                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-semibold">
                                        Inactive
                                      </span>
                                    )}
                                    <span 
                                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                      style={{
                                        backgroundColor: 'var(--theme-primary-light)',
                                        color: 'var(--theme-primary)'
                                      }}
                                    >
                                      Purchases: {pkg.purchaseCount}/{pkg.maxPurchases}
                                    </span>
                                  </div>
                                  <div className="mb-2">
                                    <img 
                                      src={getImageUrl(pkg.image)} 
                                      alt={pkg.title}
                                      className="object-cover w-full h-32 max-w-md border rounded-lg border-slate-300"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                  <p className="mb-1 text-sm font-semibold text-slate-900">{pkg.title}</p>
                                  <p className="mb-1 text-sm text-slate-600">Entry Fee: ৳{pkg.entryFee}</p>
                                  <p className="mb-1 text-sm text-slate-600">Winner Prize: {pkg.winnerPrize}</p>
                                  {pkg.description && (
                                    <p className="mb-1 text-xs text-slate-500">{pkg.description}</p>
                                  )}
                                  <div className="p-2 mt-2 text-xs rounded bg-slate-100">
                                    <p className="text-slate-600"><strong>Room ID:</strong> {pkg.roomId}</p>
                                    <p className="text-slate-600"><strong>Password:</strong> {pkg.roomPassword}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={() => handleToggleGamePackageActive(pkg.id, isActive)}
                                        className="sr-only peer"
                                      />
                                      <div 
                                        className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"
                                        style={{
                                          '--tw-ring-color': 'var(--theme-primary)'
                                        } as React.CSSProperties}
                                      ></div>
                                    </label>
                                    <span className="text-[10px] text-slate-500">
                                      {isActive ? 'ON' : 'OFF'}
                                    </span>
                                  </div>
                                  <button 
                                    className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-semibold hover:bg-blue-200 transition-all" 
                                    onClick={() => handleEditGamePackage(pkg)}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-all" 
                                    onClick={() => handleRemoveGamePackage(pkg.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center text-slate-500">
                          No game packages yet. Add your first package.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'products' && hasPermission('canManageProducts') ? (
              <AdminProducts />
            ) : (
              <div className="pt-4 pb-4 pl-0 pr-4 space-y-6 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
                <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
                  <p className="text-lg font-semibold tracking-tight text-slate-700">Access Denied</p>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    You don't have permission to access this section.
                  </p>
                </div>
              </div>
            )
          }
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;

