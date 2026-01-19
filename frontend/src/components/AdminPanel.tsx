import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import useCatalog from '../hooks/useCatalog';
import { categoryApi, dealApi, bannerApi, noticeApi, gamePackageApi } from '../services/api';
import type { BackendDeal, BackendBanner, BackendNotice, BackendGamePackage } from '../types';
import UserManagement from './UserManagement';
import AdminOrders from './AdminOrders';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from './AdminDashboard';
import ThemeCustomization from './ThemeCustomization';
import AdminDigitalCodes from './AdminDigitalCodes';
import AdminSubscriptions from './AdminSubscriptions';
import AdminReseller from './AdminReseller';
import AdminMembership from './AdminMembership';
import { useModeratorPermissionsContext } from '../contexts/ModeratorPermissionsContext';

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

type TabType = 'dashboard' | 'products' | 'users' | 'orders' | 'banners' | 'notices' | 'gamePackages' | 'theme' | 'digitalCodes' | 'subscriptions' | 'reseller' | 'membership';

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const { 
    categories, 
    products, 
    loading,
    error,
    addCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    refresh,
    retry 
  } = useCatalog();

  const { role, permissions, loading: permissionsLoading } = useModeratorPermissionsContext();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

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
      banners: 'canManageBanners',
      notices: 'canManageNotices',
      gamePackages: 'canManageGamePackages',
      users: 'canManageUsers',
      orders: 'canManageOrders',
      theme: 'canAccessDashboard', // Theme is admin-only, but uses dashboard permission for check
      digitalCodes: 'canManageDigitalCodes', // Digital codes has its own permission
      subscriptions: 'canManageSubscriptions', // Subscriptions has its own permission
      reseller: 'canAccessDashboard', // Reseller is admin-only, but uses dashboard permission for check
      membership: 'canAccessDashboard', // Membership is admin-only, but uses dashboard permission for check
    };

    // Theme and reseller tabs are admin-only
    if ((activeTab === 'theme' || activeTab === 'reseller' || activeTab === 'membership') && role !== 'admin') {
      const availableTab = (Object.keys(tabPermissions) as TabType[]).find(
        tab => tab !== 'theme' && tab !== 'reseller' && tab !== 'membership' && hasPermission(tabPermissions[tab])
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
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catBadge, setCatBadge] = useState('');
  const [catImage, setCatImage] = useState('');
  const [catDealId, setCatDealId] = useState<string>('');
  const [name, setName] = useState('');
  const [diamonds, setDiamonds] = useState('');
  const [price, setPrice] = useState('');
  const [resellerPrice, setResellerPrice] = useState('');
  const [bonus, setBonus] = useState('');
  const [tag, setTag] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [deals, setDeals] = useState<BackendDeal[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [dealName, setDealName] = useState('');
  const [dealDesc, setDealDesc] = useState('');
  const [dealOrder, setDealOrder] = useState('0');
  const [editingDeal, setEditingDeal] = useState<string | null>(null);
  const [banners, setBanners] = useState<BackendBanner[]>([]);
  const [bannerImage, setBannerImage] = useState('');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerButtonText, setBannerButtonText] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerOrder, setBannerOrder] = useState('0');
  const [editingBanner, setEditingBanner] = useState<string | null>(null);
  const [notices, setNotices] = useState<BackendNotice[]>([]);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeIcon, setNoticeIcon] = useState('FaRobot');
  const [noticeFeatures, setNoticeFeatures] = useState<Array<{ icon?: string; text: string }>>([]);
  const [noticeOrder, setNoticeOrder] = useState('0');
  const [editingNotice, setEditingNotice] = useState<string | null>(null);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [newFeatureIcon, setNewFeatureIcon] = useState('FaShieldAlt');
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

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => {
      // Try numeric comparison first, fallback to string comparison
      const aDiamonds = a.diamonds || '';
      const bDiamonds = b.diamonds || '';
      const aName = a.name || '';
      const bName = b.name || '';
      
      const aNum = Number(aDiamonds);
      const bNum = Number(bDiamonds);
      if (!isNaN(aNum) && !isNaN(bNum) && aDiamonds !== '' && bDiamonds !== '') {
        return aNum - bNum || aName.localeCompare(bName);
      }
      return aDiamonds.localeCompare(bDiamonds) || aName.localeCompare(bName);
    }),
    [products],
  );

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Load all categories (including inactive) for admin
  const loadAllCategories = async () => {
    try {
      const response = await categoryApi.getAllForAdmin();
      if (response.success && Array.isArray(response.data)) {
        setAllCategories(response.data);
      }
    } catch (err) {
      console.error('Failed to load all categories:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') {
      loadAllCategories();
      loadDeals();
    }
    if (activeTab === 'banners' || activeTab === 'products') {
      loadBanners();
    }
    if (activeTab === 'notices') {
      loadNotices();
    }
    if (activeTab === 'gamePackages') {
      loadGamePackages();
    }
  }, [activeTab]);

  // Also load when component mounts
  useEffect(() => {
    loadAllCategories();
    loadDeals();
    loadBanners();
  }, []);

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

  // Load deals
  const loadDeals = async () => {
    try {
      // console.log('Loading deals...');
      const response = await dealApi.getAll();
      // console.log('Deals API response:', response);
      if (response.success && Array.isArray(response.data)) {
        // console.log('Deals loaded:', response.data);
        setDeals(response.data);
      } else {
        console.error('Failed to load deals - API response:', response);
      }
    } catch (err) {
      console.error('Failed to load deals:', err);
    }
  };

  // Load banners
  const loadBanners = async () => {
    try {
      const response = await bannerApi.getAll(true);
      if (response.success && Array.isArray(response.data)) {
        setBanners(response.data);
      }
    } catch (err) {
      console.error('Failed to load banners:', err);
    }
  };

  // Load notices
  const loadNotices = async () => {
    try {
      const response = await noticeApi.getAll(true);
      if (response.success && Array.isArray(response.data)) {
        setNotices(response.data);
      }
    } catch (err) {
      console.error('Failed to load notices:', err);
    }
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setMessage({ type: 'error', text: 'Category name is required' });
      return;
    }

    const result = await addCategory({
      name: catName.trim(),
      description: catDesc.trim() || undefined,
      badge: catBadge.trim() || undefined,
      image: catImage.trim() || undefined,
      dealId: catDealId || undefined,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Category added to database!' });
      setCatName('');
      setCatDesc('');
      setCatBadge('');
      setCatImage('');
      setCatDealId('');
      if (!categoryId) setCategoryId(result.data!.id);
      // Reload all categories to show the new one
      await loadAllCategories();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to add category' });
    }
  };

  const handleRemoveCategory = async (id: string) => {
    if (!window.confirm('Are you sure? This will permanently delete the category and all its products from the database.')) {
      return;
    }

    const result = await deleteCategory(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'Category permanently deleted from database!' });
      // Reload all categories
      await loadAllCategories();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete category' });
    }
  };

  const handleToggleCategoryActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await categoryApi.update(id, { isActive: !currentStatus });
      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: `Category ${!currentStatus ? 'activated' : 'deactivated'} successfully!` 
        });
        // Reload all categories to show updated status
        await loadAllCategories();
        refresh(); // Refresh to update frontend display for regular users
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update category status' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update category status' });
    }
  };

  const handleAddDeal = async (e: FormEvent) => {
    e.preventDefault();
    if (!dealName.trim()) {
      setMessage({ type: 'error', text: 'Deal name is required' });
      return;
    }

    try {
      const dealId = crypto.randomUUID();
      const response = await dealApi.create({
        id: dealId,
        name: dealName.trim(),
        description: dealDesc.trim() || undefined,
        displayOrder: Number(dealOrder) || 0,
        isActive: true,
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Deal created successfully!' });
        setDealName('');
        setDealDesc('');
        setDealOrder('0');
        // Reload deals after creating
        await loadDeals();
        // console.log('Deal created, reloading deals...');
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to create deal' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to create deal' });
    }
  };

  const handleEditDeal = (deal: BackendDeal) => {
    setEditingDeal(deal.id);
    setDealName(deal.name);
    setDealDesc(deal.description || '');
    setDealOrder(deal.displayOrder.toString());
  };

  const handleCancelDealEdit = () => {
    setEditingDeal(null);
    setDealName('');
    setDealDesc('');
    setDealOrder('0');
  };

  const handleUpdateDeal = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingDeal || !dealName.trim()) {
      setMessage({ type: 'error', text: 'Deal name is required' });
      return;
    }

    try {
      const response = await dealApi.update(editingDeal, {
        name: dealName.trim(),
        description: dealDesc.trim() || undefined,
        displayOrder: Number(dealOrder) || 0,
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Deal updated successfully!' });
        handleCancelDealEdit();
        await loadDeals();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update deal' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update deal' });
    }
  };

  const handleRemoveDeal = async (id: string) => {
    if (!window.confirm('Are you sure? Categories in this deal will be unassigned.')) {
      return;
    }

    try {
      const response = await dealApi.delete(id);
      if (response.success) {
        setMessage({ type: 'success', text: 'Deal deleted successfully!' });
        await loadDeals();
        await loadAllCategories();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to delete deal' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to delete deal' });
    }
  };

  // Banner handlers
  const handleAddBanner = async (e: FormEvent) => {
    e.preventDefault();
    if (!bannerImage || !bannerImage.trim()) {
      setMessage({ type: 'error', text: 'Banner image is required. Please upload an image.' });
      return;
    }

    try {
      const bannerId = crypto.randomUUID();
      const imageUrl = bannerImage.trim();
      
      const response = await bannerApi.create({
        id: bannerId,
        image: imageUrl,
        title: bannerTitle.trim() || '',
        subtitle: bannerSubtitle.trim() || '',
        buttonText: bannerButtonText.trim() || '',
        link: bannerLink.trim() || undefined,
        displayOrder: Number(bannerOrder) || 0,
        isActive: true
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Banner added successfully!' });
        setBannerImage('');
        setBannerTitle('');
        setBannerSubtitle('');
        setBannerButtonText('');
        setBannerLink('');
        setBannerOrder('0');
        await loadBanners();
      } else {
        // Debug log
        if (import.meta.env.DEV) {
          console.error('Banner creation failed:', response);
        }
        setMessage({ type: 'error', text: response.message || 'Failed to create banner' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to create banner' });
    }
  };

  const handleEditBanner = (banner: BackendBanner) => {
    setEditingBanner(banner.id);
    setBannerImage(banner.image);
    setBannerTitle(banner.title || '');
    setBannerSubtitle(banner.subtitle || '');
    setBannerButtonText(banner.buttonText || '');
    setBannerLink(banner.link || '');
    setBannerOrder(banner.displayOrder.toString());
  };

  const handleCancelBannerEdit = () => {
    setEditingBanner(null);
    setBannerImage('');
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerButtonText('');
    setBannerLink('');
    setBannerOrder('0');
  };

  const handleUpdateBanner = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !bannerImage.trim()) {
      setMessage({ type: 'error', text: 'Banner image is required' });
      return;
    }

    try {
      const response = await bannerApi.update(editingBanner, {
        image: bannerImage.trim(),
        title: bannerTitle.trim() || '',
        subtitle: bannerSubtitle.trim() || '',
        buttonText: bannerButtonText.trim() || '',
        link: bannerLink.trim() || undefined,
        displayOrder: Number(bannerOrder) || 0
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Banner updated successfully!' });
        handleCancelBannerEdit();
        await loadBanners();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update banner' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update banner' });
    }
  };

  const handleRemoveBanner = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    try {
      const response = await bannerApi.delete(id);
      if (response.success) {
        setMessage({ type: 'success', text: 'Banner deleted successfully!' });
        await loadBanners();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to delete banner' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to delete banner' });
    }
  };

  const handleToggleBannerActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await bannerApi.update(id, { isActive: !currentStatus });
      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: `Banner ${!currentStatus ? 'activated' : 'deactivated'} successfully!` 
        });
        await loadBanners();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update banner status' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update banner status' });
    }
  };

  // Notice handlers
  const handleAddNotice = async (e: FormEvent) => {
    e.preventDefault();
    if (!noticeMessage.trim()) {
      setMessage({ type: 'error', text: 'Notice message is required' });
      return;
    }

    try {
      const noticeId = crypto.randomUUID();
      const response = await noticeApi.create({
        id: noticeId,
        title: noticeTitle.trim() || '',
        message: noticeMessage.trim(),
        icon: noticeIcon,
        features: noticeFeatures,
        displayOrder: Number(noticeOrder) || 0,
        isActive: true
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Notice added successfully!' });
        setNoticeMessage('');
        setNoticeTitle('');
        setNoticeIcon('FaRobot');
        setNoticeFeatures([]);
        setNoticeOrder('0');
        await loadNotices();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to create notice' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to create notice' });
    }
  };

  const handleEditNotice = (notice: BackendNotice) => {
    setEditingNotice(notice.id);
    setNoticeMessage(notice.message);
    setNoticeTitle(notice.title || '');
    setNoticeIcon(notice.icon || 'FaRobot');
    setNoticeFeatures(notice.features || []);
    setNoticeOrder(notice.displayOrder.toString());
  };

  const handleCancelNoticeEdit = () => {
    setEditingNotice(null);
    setNoticeMessage('');
    setNoticeTitle('');
    setNoticeIcon('FaRobot');
    setNoticeFeatures([]);
    setNoticeOrder('0');
    setNewFeatureText('');
    setNewFeatureIcon('FaShieldAlt');
  };

  const handleUpdateNotice = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingNotice || !noticeMessage.trim()) {
      setMessage({ type: 'error', text: 'Notice message is required' });
      return;
    }

    try {
      const response = await noticeApi.update(editingNotice, {
        title: noticeTitle.trim() || '',
        message: noticeMessage.trim(),
        icon: noticeIcon,
        features: noticeFeatures,
        displayOrder: Number(noticeOrder) || 0
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Notice updated successfully!' });
        handleCancelNoticeEdit();
        await loadNotices();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update notice' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update notice' });
    }
  };

  const handleRemoveNotice = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) {
      return;
    }

    try {
      const response = await noticeApi.delete(id);
      if (response.success) {
        setMessage({ type: 'success', text: 'Notice deleted successfully!' });
        await loadNotices();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to delete notice' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to delete notice' });
    }
  };

  const handleToggleNoticeActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await noticeApi.update(id, { isActive: !currentStatus });
      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: `Notice ${!currentStatus ? 'activated' : 'deactivated'} successfully!` 
        });
        await loadNotices();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update notice status' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update notice status' });
    }
  };

  const handleAddFeature = () => {
    if (newFeatureText.trim()) {
      setNoticeFeatures([...noticeFeatures, { icon: newFeatureIcon, text: newFeatureText.trim() }]);
      setNewFeatureText('');
      setNewFeatureIcon('FaShieldAlt');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setNoticeFeatures(noticeFeatures.filter((_, i) => i !== index));
  };

  // Game Package handlers
  const handleAddGamePackage = async (e: FormEvent) => {
    e.preventDefault();
    if (!packageId.trim() || !packageTitle.trim() || !packageImage.trim() || !packageEntryFee || !packageWinnerPrize.trim() || !packageRoomId.trim() || !packageRoomPassword.trim() || !packageStartTime) {
      setMessage({ type: 'error', text: 'Package ID, title, image, entry fee, winner prize, room ID, room password, and start time are required' });
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
        setMessage({ type: 'success', text: 'Game package created successfully!' });
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
        setMessage({ type: 'error', text: response.message || 'Failed to create game package' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to create game package' });
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
      setMessage({ type: 'error', text: 'Title, image, entry fee, winner prize, room ID, room password, and start time are required' });
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
        setMessage({ type: 'success', text: 'Game package updated successfully!' });
        handleCancelGamePackageEdit();
        await loadGamePackages();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update game package' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update game package' });
    }
  };

  const handleRemoveGamePackage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this game package?')) {
      return;
    }

    try {
      const response = await gamePackageApi.delete(id);
      if (response.success) {
        setMessage({ type: 'success', text: 'Game package deleted successfully!' });
        await loadGamePackages();
        if (editingPackage === id) {
          handleCancelGamePackageEdit();
        }
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to delete game package' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to delete game package' });
    }
  };

  const handleToggleGamePackageActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await gamePackageApi.update(id, { isActive: !currentStatus });
      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: `Game package ${!currentStatus ? 'activated' : 'deactivated'} successfully!` 
        });
        await loadGamePackages();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update game package status' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update game package status' });
    }
  };

  const handleAssignCategoryToDeal = async (categoryId: string, dealId: string | null) => {
    try {
      const response = await categoryApi.update(categoryId, { dealId });
      if (response.success) {
        setMessage({ type: 'success', text: 'Category assigned to deal successfully!' });
        await loadAllCategories();
        refresh();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to assign category' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to assign category' });
    }
  };

  const handleEditCategory = (cat: any) => {
    setEditingCategory(cat.id);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setCatBadge(cat.badge || '');
    setCatImage(cat.image || '');
    setCatDealId(cat.dealId || '');
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setCatBadge('');
    setCatImage('');
    setCatDealId('');
  };

  const handleUpdateCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !catName.trim()) {
      setMessage({ type: 'error', text: 'Category name is required' });
      return;
    }

    try {
      const response = await categoryApi.update(editingCategory, {
        name: catName.trim(),
        description: catDesc.trim() || undefined,
        badge: catBadge.trim() || undefined,
        image: catImage.trim() || undefined,
        dealId: catDealId || undefined,
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Category updated successfully!' });
        handleCancelCategoryEdit();
        await loadAllCategories();
        refresh();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update category' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update category' });
    }
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !price || !categoryId) {
      setMessage({ type: 'error', text: 'Product name, price and category are required' });
      return;
    }

    const result = await addProduct({
      name: name.trim(),
      categoryId,
      diamonds: diamonds.trim() || '',
      price: Number(price),
      resellerPrice: resellerPrice ? Number(resellerPrice) : undefined,
      bonus: bonus.trim() || undefined,
      tag: tag.trim() || undefined,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Product added to database!' });
      setName('');
      setDiamonds('');
      setPrice('');
      setResellerPrice('');
      setBonus('');
      setTag('');
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to add product' });
    }
  };

  const handleEditProduct = (product: typeof products[0]) => {
    setEditingProduct(product.id);
    setName(product.name);
    setDiamonds(product.diamonds);
    setPrice(product.price.toString());
    setResellerPrice(product.resellerPrice?.toString() || '');
    setBonus(product.bonus || '');
    setTag(product.tag || '');
    setCategoryId(product.categoryId);
    // Scroll to form
    setTimeout(() => {
      document.querySelector('.product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setName('');
    setDiamonds('');
    setPrice('');
    setResellerPrice('');
    setBonus('');
    setTag('');
    setCategoryId(categories[0]?.id ?? '');
  };

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !name || !price || !categoryId) {
      setMessage({ type: 'error', text: 'Product name, price and category are required' });
      return;
    }

    const result = await updateProduct(editingProduct, {
      name: name.trim(),
      categoryId,
      diamonds: diamonds.trim() || '',
      price: Number(price),
      resellerPrice: resellerPrice ? Number(resellerPrice) : undefined,
      bonus: bonus.trim() || undefined,
      tag: tag.trim() || undefined,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Product updated in database!' });
      handleCancelEdit();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update product' });
    }
  };

  const handleRemoveProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    const result = await deleteProduct(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'Product deleted from database!' });
      if (editingProduct === id) {
        handleCancelEdit();
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete product' });
    }
  };

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div 
            className="w-12 h-12 mx-auto mb-4 border-4 rounded-full border-t-transparent animate-spin"
            style={{ borderColor: 'var(--theme-primary)' }}
          ></div>
          <p className="text-slate-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={onLogout} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <div className="p-0">
          {/* Header */}
          <div className="pt-4 pb-4 pl-0 pr-4 mb-4 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl text-slate-900">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'products' && 'Products & Categories'}
              {activeTab === 'banners' && 'Banner Management'}
              {activeTab === 'notices' && 'Notice Management'}
              {activeTab === 'gamePackages' && 'Game Packages'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'orders' && 'Order History'}
              {activeTab === 'digitalCodes' && 'Digital Codes'}
              {activeTab === 'subscriptions' && 'Subscriptions'}
              {activeTab === 'reseller' && 'Reseller Management'}
              {activeTab === 'membership' && 'Membership Packages'}
              {activeTab === 'theme' && 'Store Customize'}
            </h1>
            <p className="text-sm text-slate-600">
              {activeTab === 'dashboard' && 'Overview of your business metrics and analytics'}
              {activeTab === 'products' && 'Manage products and categories'}
              {activeTab === 'banners' && 'Manage carousel banners and images'}
              {activeTab === 'notices' && 'Manage site notices and announcements'}
              {activeTab === 'gamePackages' && 'Manage RoboGameZone packages and room credentials'}
              {activeTab === 'users' && 'Manage users and their balances'}
              {activeTab === 'orders' && 'View and manage all orders'}
              {activeTab === 'digitalCodes' && 'Manage digital codes, categories, products, and deals'}
              {activeTab === 'subscriptions' && 'Manage subscription categories and products'}
              {activeTab === 'reseller' && 'Manage reseller prices for all products'}
              {activeTab === 'membership' && 'Create and manage membership packages for users'}
              {activeTab === 'theme' && 'Customize your store theme colors and branding'}
            </p>
            {error && (
              <div className="p-3 mt-3 border border-red-200 rounded-lg bg-red-50">
                <p className="text-sm text-red-600">{error}</p>
                <button 
                  className="px-3 py-1 mt-2 text-sm font-semibold text-red-700 transition-all bg-red-100 rounded-lg hover:bg-red-200" 
                  onClick={retry}
                >
                  Retry Connection
                </button>
              </div>
            )}
          </div>

          {message && (
            <div className={`p-4 rounded-xl mb-4 mr-4 sm:mr-5 md:mr-6 ml-0 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <p className="font-semibold">{message.text}</p>
            </div>
          )}

          {/* Tab Content */}
          <div className="px-0">
            {activeTab === 'theme' && role === 'admin' ? (
              <ThemeCustomization />
            ) : activeTab === 'reseller' && role === 'admin' ? (
              <AdminReseller />
            ) : activeTab === 'membership' && role === 'admin' ? (
              <AdminMembership />
            ) : activeTab === 'digitalCodes' && hasPermission('canManageDigitalCodes') ? (
              <AdminDigitalCodes />
            ) : activeTab === 'subscriptions' && hasPermission('canManageSubscriptions') ? (
              <AdminSubscriptions />
            ) : activeTab === 'dashboard' && hasPermission('canAccessDashboard') ? (
              <AdminDashboard />
            ) : activeTab === 'users' && hasPermission('canManageUsers') ? (
              <UserManagement />
            ) : activeTab === 'orders' && hasPermission('canManageOrders') ? (
              <AdminOrders />
            ) : activeTab === 'banners' && hasPermission('canManageBanners') ? (
              <div className="pt-4 pb-4 pl-0 pr-4 space-y-6 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
                {/* Banner Management Section */}
                <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
                  <h3 className="mb-4 text-lg font-bold text-slate-900">Banner Management</h3>
                  
                  {/* Add/Edit Banner Form */}
                  <form 
                    className="p-4 mb-6 border rounded-lg bg-slate-50 border-slate-200" 
                    onSubmit={editingBanner ? handleUpdateBanner : handleAddBanner}
                  >
                    <h4 className="mb-3 text-base font-semibold text-slate-700">
                      {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="block">
                          <span className="block mb-2 text-sm font-semibold text-slate-700">Banner Image URL *</span>
                          <input
                            required
                            value={bannerImage}
                            onChange={(e) => setBannerImage(e.target.value)}
                            placeholder="https://example.com/banner.jpg"
                            className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                          />
                          {bannerImage && (
                            <div className="mt-2">
                              <img
                                src={bannerImage}
                                alt="Preview"
                                className="w-full max-w-xs h-32 object-cover rounded-lg border-2 border-slate-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </label>
                      </div>
                      <label className="block">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Title (optional)</span>
                        <input
                          value={bannerTitle}
                          onChange={(e) => setBannerTitle(e.target.value)}
                          placeholder="Banner Title"
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
                      </label>
                      <label className="block">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Subtitle (optional)</span>
                        <input
                          value={bannerSubtitle}
                          onChange={(e) => setBannerSubtitle(e.target.value)}
                          placeholder="Banner Subtitle"
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
                      </label>
                      <label className="block">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Button Text (optional)</span>
                        <input
                          value={bannerButtonText}
                          onChange={(e) => setBannerButtonText(e.target.value)}
                          placeholder="Click Here"
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Link (optional)</span>
                        <input
                          type="url"
                          value={bannerLink}
                          onChange={(e) => setBannerLink(e.target.value)}
                          placeholder="https://example.com or /category/123"
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
                        <p className="mt-1 text-xs text-slate-500">When user clicks on banner, they will be redirected to this link</p>
                      </label>
                      <label className="block">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Display Order</span>
                        <input
                          type="number"
                          value={bannerOrder}
                          onChange={(e) => setBannerOrder(e.target.value)}
                          placeholder="0"
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
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
                        {editingBanner ? 'Update Banner' : 'Add Banner'}
                      </button>
                      {editingBanner && (
                        <button 
                          type="button"
                          onClick={handleCancelBannerEdit}
                          className="px-4 py-2 font-semibold transition-all bg-slate-200 rounded-xl text-slate-700 hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Banners List */}
                  <div>
                    <h4 className="mb-3 text-base font-semibold text-slate-700">
                      Existing Banners ({banners.length})
                    </h4>
                    <div className="space-y-2">
                      {banners.length > 0 ? (
                        banners.map((banner) => {
                          const isActive = banner.isActive !== false;
                          return (
                            <div key={banner.id} className={`p-4 transition-colors border rounded-lg ${
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
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                      Order: {banner.displayOrder}
                                    </span>
                                  </div>
                                  <div className="mb-2">
                                    <img 
                                      src={banner.image} 
                                      alt={banner.title || 'Banner'}
                                      className="object-cover w-full h-32 max-w-md border rounded-lg border-slate-300"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                  {banner.title && (
                                    <p className="mb-1 text-sm font-semibold text-slate-900">{banner.title}</p>
                                  )}
                                  {banner.subtitle && (
                                    <p className="mb-1 text-sm text-slate-600">{banner.subtitle}</p>
                                  )}
                                  {banner.buttonText && (
                                    <p className="text-xs text-slate-500">Button: {banner.buttonText}</p>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={() => handleToggleBannerActive(banner.id, isActive)}
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
                                    onClick={() => handleEditBanner(banner)}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-all" 
                                    onClick={() => handleRemoveBanner(banner.id)}
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
                          No banners yet. Add your first banner.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'gamePackages' && hasPermission('canManageGamePackages') ? (
              <div className="pt-4 pb-4 pl-0 pr-4 space-y-6 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
                {/* Game Package Management Section */}
                <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
                  <h3 className="mb-4 text-lg font-bold text-slate-900">Game Package Management</h3>
                  
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
                      <label className="block md:col-span-2">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Image URL *</span>
                        <input
                          required
                          type="url"
                          value={packageImage}
                          onChange={(e) => setPackageImage(e.target.value)}
                          placeholder="https://example.com/package.jpg"
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
                        {packageImage && (
                          <div className="mt-2">
                            <img 
                              src={packageImage} 
                              alt="Preview" 
                              className="object-cover w-full h-32 max-w-md border rounded-lg border-slate-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </label>
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
                                      src={pkg.image} 
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
            ) : activeTab === 'notices' && hasPermission('canManageNotices') ? (
              <div className="pt-4 pb-4 pl-0 pr-4 space-y-6 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
                {/* Notice Management Section */}
                <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
                  <h3 className="mb-4 text-lg font-bold text-slate-900">Notice Management</h3>
                  
                  {/* Add/Edit Notice Form */}
                  <form 
                    className="p-4 mb-6 border rounded-lg bg-slate-50 border-slate-200" 
                    onSubmit={editingNotice ? handleUpdateNotice : handleAddNotice}
                  >
                    <h4 className="mb-3 text-base font-semibold text-slate-700">
                      {editingNotice ? 'Edit Notice' : 'Add New Notice'}
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="block md:col-span-2">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Message *</span>
                        <textarea
                          required
                          value={noticeMessage}
                          onChange={(e) => setNoticeMessage(e.target.value)}
                          placeholder="🚀 আমাদের সিস্টেম AI দ্বারা নিয়ন্ত্রিত..."
                          rows={3}
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
                      </label>
                      <label className="block">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Title (optional)</span>
                        <input
                          value={noticeTitle}
                          onChange={(e) => setNoticeTitle(e.target.value)}
                          placeholder="Notice Title"
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
                      </label>
                      <label className="block">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Icon</span>
                        <select
                          value={noticeIcon}
                          onChange={(e) => setNoticeIcon(e.target.value)}
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        >
                          <option value="FaRobot">Robot</option>
                          <option value="FaShieldAlt">Shield</option>
                          <option value="FaBolt">Bolt</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Display Order</span>
                        <input
                          type="number"
                          value={noticeOrder}
                          onChange={(e) => setNoticeOrder(e.target.value)}
                          placeholder="0"
                          className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        />
                      </label>
                      
                      {/* Features Section */}
                      <div className="block md:col-span-2">
                        <span className="block mb-2 text-sm font-semibold text-slate-700">Features (optional)</span>
                        <div className="mb-2 space-y-2">
                          {noticeFeatures.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-white border rounded-lg border-slate-200">
                              <span className="flex-1 text-sm">{feature.text}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFeature(index)}
                                className="px-2 py-1 text-xs text-red-700 bg-red-100 rounded hover:bg-red-200"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newFeatureText}
                            onChange={(e) => setNewFeatureText(e.target.value)}
                            placeholder="Feature text"
                            className="flex-1 px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                          />
                          <select
                            value={newFeatureIcon}
                            onChange={(e) => setNewFeatureIcon(e.target.value)}
                            className="px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                          >
                            <option value="FaShieldAlt">Shield</option>
                            <option value="FaBolt">Bolt</option>
                            <option value="FaRobot">Robot</option>
                          </select>
                          <button
                            type="button"
                            onClick={handleAddFeature}
                            className="px-4 py-2 text-blue-700 bg-blue-100 rounded-xl hover:bg-blue-200"
                          >
                            Add Feature
                          </button>
                        </div>
                      </div>
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
                        {editingNotice ? 'Update Notice' : 'Add Notice'}
                      </button>
                      {editingNotice && (
                        <button 
                          type="button"
                          onClick={handleCancelNoticeEdit}
                          className="px-4 py-2 font-semibold transition-all bg-slate-200 rounded-xl text-slate-700 hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Notices List */}
                  <div>
                    <h4 className="mb-3 text-base font-semibold text-slate-700">
                      Existing Notices ({notices.length})
                    </h4>
                    <div className="space-y-2">
                      {notices.length > 0 ? (
                        notices.map((notice) => {
                          const isActive = notice.isActive !== false;
                          return (
                            <div key={notice.id} className={`p-4 transition-colors border rounded-lg ${
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
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                      Order: {notice.displayOrder}
                                    </span>
                                  </div>
                                  {notice.title && (
                                    <p className="mb-1 text-sm font-semibold text-slate-900">{notice.title}</p>
                                  )}
                                  <p className="mb-2 text-sm text-slate-700">{notice.message}</p>
                                  {notice.features && notice.features.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {notice.features.map((feature, index) => (
                                        <span key={index} className="px-2 py-1 text-xs rounded text-slate-600 bg-slate-100">
                                          {feature.text}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={() => handleToggleNoticeActive(notice.id, isActive)}
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
                                    onClick={() => handleEditNotice(notice)}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-all" 
                                    onClick={() => handleRemoveNotice(notice.id)}
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
                          No notices yet. Add your first notice.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'products' && hasPermission('canManageProducts') ? (
        <div className="pt-4 pb-4 pl-0 pr-4 space-y-6 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">

          {/* Deal Management Section */}
          <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Deal Management</h3>
            
            {/* Add/Edit Deal Form */}
            <form 
              className="p-4 mb-6 border rounded-lg bg-slate-50 border-slate-200" 
              onSubmit={editingDeal ? handleUpdateDeal : handleAddDeal}
            >
              <h4 className="mb-3 text-base font-semibold text-slate-700">
                {editingDeal ? 'Edit Deal' : 'Add New Deal'}
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="block mb-2 text-sm font-semibold text-slate-700">Deal Name *</span>
                  <input
                    required
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                    placeholder="Regular Offers"
                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                  />
                </label>
                <label className="block">
                  <span className="block mb-2 text-sm font-semibold text-slate-700">Description (optional)</span>
                  <input
                    value={dealDesc}
                    onChange={(e) => setDealDesc(e.target.value)}
                    placeholder="Regular top-up offers"
                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                  />
                </label>
                <label className="block">
                  <span className="block mb-2 text-sm font-semibold text-slate-700">Display Order</span>
                  <input
                    type="number"
                    value={dealOrder}
                    onChange={(e) => setDealOrder(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                  />
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
                  {editingDeal ? 'Update Deal' : 'Add Deal'}
                </button>
                {editingDeal && (
                  <button 
                    type="button"
                    onClick={handleCancelDealEdit}
                    className="px-4 py-2 font-semibold transition-all bg-slate-200 rounded-xl text-slate-700 hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Deals List */}
            <div>
              <h4 className="mb-3 text-base font-semibold text-slate-700">
                Existing Deals ({deals.length})
              </h4>
              <div className="space-y-2">
                {deals.length > 0 ? (
                  deals.map((deal) => (
                    <div key={deal.id} className="p-4 transition-colors border rounded-lg border-slate-200 hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <strong className="text-slate-900">{deal.name}</strong>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                              Order: {deal.displayOrder}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{deal.description || 'No description'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-semibold hover:bg-blue-200 transition-all" 
                            onClick={() => handleEditDeal(deal)}
                          >
                            Edit
                          </button>
                          <button 
                            className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-all" 
                            onClick={() => handleRemoveDeal(deal.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    No deals yet. Create your first deal.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products & Categories Content */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 sm:gap-6">
            <form className="p-4 border sm:p-5 md:p-6 rounded-xl border-slate-200 bg-slate-50" onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}>
              <h3 className="mb-4 text-lg font-bold text-slate-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <div className="space-y-4">
                <label className="block">
                  <span className="block mb-2 text-sm font-semibold text-slate-700">Name *</span>
                  <input
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Diamond TopUp"
                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                  />
                </label>
                <label className="block">
                  <span className="block mb-2 text-sm font-semibold text-slate-700">Badge (optional)</span>
                  <input
                    value={catBadge}
                    onChange={(e) => setCatBadge(e.target.value)}
                    placeholder="Hot"
                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                  />
                </label>
                <label className="block">
                  <span className="block mb-2 text-sm font-semibold text-slate-700">Description (optional)</span>
                  <input
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="Fast delivery packs"
                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                  />
                </label>
                <label className="block">
                  <span className="block mb-2 text-sm font-semibold text-slate-700">Category Image URL (optional)</span>
                  <input
                    value={catImage}
                    onChange={(e) => setCatImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                  />
                  {catImage && (
                    <div className="mt-2">
                      <img
                        src={catImage}
                        alt="Preview"
                        className="w-full max-w-xs h-32 object-cover rounded-lg border-2 border-slate-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </label>
                <label className="block">
                  <span className="block mb-2 text-sm font-semibold text-slate-700">Deal (optional)</span>
                  <select
                    value={catDealId}
                    onChange={(e) => setCatDealId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                  >
                    <option value="">Select a Deal</option>
                    {deals.map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  className="flex-1 px-4 py-3 font-semibold text-white transition-all shadow-lg rounded-xl" 
                  style={{
                    background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`,
                    boxShadow: `0 10px 15px -3px rgba(var(--theme-primary-rgb), 0.3), 0 4px 6px -2px rgba(var(--theme-primary-rgb), 0.2)`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `linear-gradient(135deg, var(--theme-primary-hover), var(--theme-secondary-dark))`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`;
                  }}
                  type="submit"
                >
                  {editingCategory ? 'Update Category' : 'Add Category to Database'}
                </button>
                {editingCategory && (
                  <button 
                    type="button"
                    onClick={handleCancelCategoryEdit}
                    className="px-4 py-3 font-semibold transition-all bg-slate-200 rounded-xl text-slate-700 hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
              <h3 className="mb-3 text-base font-bold sm:text-lg text-slate-900 sm:mb-4">Categories List</h3>
              <div className="space-y-2">
                {allCategories.length > 0 ? (
                  allCategories.map((cat) => {
                    const isActive = cat.isActive !== false; // Default to true if not set
                    return (
                      <div key={cat.id} className={`p-4 transition-colors border rounded-lg ${
                        isActive ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-50'
                      } hover:bg-slate-50`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <strong className={isActive ? 'text-slate-900' : 'text-slate-700'}>
                                {cat.name}
                              </strong>
                              {cat.badge && (
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                                  {cat.badge}
                                </span>
                              )}
                              {!isActive && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-semibold">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className={`text-sm ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                              {cat.description || 'No description'}
                            </p>
                            {cat.image && (
                              <div className="mt-2">
                                <img 
                                  src={cat.image} 
                                  alt={cat.name}
                                  className="object-cover w-16 h-16 border rounded-lg border-slate-300"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {/* Deal Assignment */}
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-semibold text-slate-600">Deal:</label>
                              <select
                                value={cat.dealId || ''}
                                onChange={(e) => handleAssignCategoryToDeal(cat.id, e.target.value || null)}
                                className="px-2 py-1 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2"
                              >
                                <option value="">Select a Deal</option>
                                {deals.map((deal) => (
                                  <option key={deal.id} value={deal.id}>
                                    {deal.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Toggle Switch and Delete */}
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col items-center gap-1">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={() => handleToggleCategoryActive(cat.id, isActive)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                                <span className="text-[10px] text-slate-500">
                                  {isActive ? 'ON' : 'OFF'}
                                </span>
                              </div>
                              <button 
                                className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-semibold hover:bg-blue-200 transition-all" 
                                onClick={() => handleEditCategory(cat)}
                              >
                                Edit
                              </button>
                              <button 
                                className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-all" 
                                onClick={() => handleRemoveCategory(cat.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    No categories yet. Add your first category.
                  </div>
                )}
              </div>
            </div>
          </div>

          <form className="p-4 border product-form sm:p-5 md:p-6 rounded-xl border-slate-200 bg-slate-50" onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base font-bold sm:text-lg text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              {editingProduct && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Category *</span>
                <select 
                  required 
                  value={categoryId} 
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Product Name *</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="50 Diamonds"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Diamonds</span>
                <input
                  type="text"
                  min="0"
                  value={diamonds}
                  onChange={(e) => setDiamonds(e.target.value)}
                  placeholder="80"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Price (৳) *</span>
                <input
                  required
                  type="number"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="45"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Reseller Price (৳) (optional)</span>
                <input
                  type="number"
                  min="1"
                  value={resellerPrice}
                  onChange={(e) => setResellerPrice(e.target.value)}
                  placeholder="40"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Bonus (optional)</span>
                <input
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  placeholder="+10 bonus"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Tag (optional)</span>
                <input
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Hot"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
            </div>
            <button 
              className="w-full px-4 py-3 mt-4 font-semibold text-white transition-all shadow-lg rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 shadow-sky-500/30" 
              type="submit"
            >
              {editingProduct ? 'Update Product in Database' : 'Add Product to Database'}
            </button>
          </form>

          <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
            <h3 className="mb-3 text-base font-bold sm:text-lg text-slate-900 sm:mb-4">Products List</h3>
            <div className="space-y-2">
              {sortedProducts.length > 0 ? (
                sortedProducts.map((item) => (
                  <div key={item.id} className="p-4 transition-colors border rounded-lg border-slate-200 hover:bg-slate-50">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <strong className="text-slate-900">{item.name}</strong>
                          {item.tag && (
                            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold">
                              {item.tag}
                            </span>
                          )}
                          {item.bonus && (
                            <span className="text-xs font-semibold text-violet-600">({item.bonus})</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm sm:gap-4 text-slate-600">
                          <span>Category: {categories.find(c => c.id === item.categoryId)?.name || '-'}</span>
                          <span>Diamonds: {item.diamonds || 'Special'}</span>
                          <span className="font-bold text-slate-900">Price: ৳{item.price}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end flex-shrink-0 w-full gap-2 sm:w-auto sm:justify-start">
                        <button 
                          className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-white transition-all rounded-lg shadow-md whitespace-nowrap" 
                          style={{
                            background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `linear-gradient(135deg, var(--theme-primary-hover), var(--theme-secondary-dark))`;
                            e.currentTarget.style.boxShadow = `0 10px 15px -3px rgba(var(--theme-primary-rgb), 0.4)`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`;
                            e.currentTarget.style.boxShadow = `0 4px 6px -1px rgba(var(--theme-primary-rgb), 0.1)`;
                          }}
                          onClick={() => handleEditProduct(item)}
                          type="button"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-white transition-all bg-red-500 rounded-lg shadow-md hover:bg-red-600 hover:shadow-lg whitespace-nowrap" 
                          onClick={() => handleRemoveProduct(item.id)}
                          type="button"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No products yet. Add your first product.
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border sm:p-5 md:p-6 rounded-xl border-slate-200 bg-gradient-to-r from-slate-50 to-purple-50">
            <h4 className="mb-3 text-base font-bold sm:text-lg text-slate-900 sm:mb-4">Database Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-sm text-slate-600">Categories</p>
                <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-slate-600">Products</p>
                <p className="text-2xl font-bold text-slate-900">{products.length}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              All data is stored in MongoDB. Changes are automatically saved.
            </p>
          </div>
        </div>
            ) : (
              <div className="pt-4 pb-4 pl-0 pr-4 space-y-6 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
                <div className="p-8 text-center bg-white border rounded-xl border-slate-200">
                  <p className="text-lg font-semibold text-slate-700">Access Denied</p>
                  <p className="mt-2 text-sm text-slate-500">
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

