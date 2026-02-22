import { useState, useEffect, type FormEvent } from 'react';
import { FaPalette, FaImage, FaList, FaPlug, FaBullhorn } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import useAuth from '../hooks/useAuth';
import ImageUpload from './ImageUpload';
import { bannerApi, noticeApi } from '../services/api';
import type { BackendBanner, BackendNotice } from '../types';

type ThemeTab = 'brand' | 'content' | 'integrations' | 'banners' | 'notices';

const themeBtnStyle = {
  background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`,
};

function ThemeCustomization() {
  const { primaryColor, secondaryColor, livePurchaseStatementEnabled, topUpCategoriesEnabled, subscriptionsEnabled, reviewSectionEnabled, topUpCategoriesBadge, topUpCategoriesHeading, subscriptionsBadge, subscriptionsHeading, navbarLogoUrl, fontFamily, fontSizeBase, navbarSearchPlaceholder, navbarSearchEnabled, supportWhatsAppUrl, supportMessengerUrl, supportTelegramUrl, uddoktaBaseUrl, uddoktaConfigured, uddoktaGatewayConfig, isLoaded, updateTheme } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [localPrimary, setLocalPrimary] = useState<string>('#a855f7');
  const [localSecondary, setLocalSecondary] = useState<string>('#8b5cf6');
  const [localLivePurchaseEnabled, setLocalLivePurchaseEnabled] = useState<boolean>(true);
  const [localTopUpCategoriesEnabled, setLocalTopUpCategoriesEnabled] = useState<boolean>(true);
  const [localTopUpCategoriesBadge, setLocalTopUpCategoriesBadge] = useState<string>('Top-up categories');
  const [localTopUpCategoriesHeading, setLocalTopUpCategoriesHeading] = useState<string>('Browse Categories');
  const [localSubscriptionsEnabled, setLocalSubscriptionsEnabled] = useState<boolean>(true);
  const [localSubscriptionsBadge, setLocalSubscriptionsBadge] = useState<string>('Subscriptions');
  const [localSubscriptionsHeading, setLocalSubscriptionsHeading] = useState<string>('Subscription Plans');
  const [localReviewSectionEnabled, setLocalReviewSectionEnabled] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savingLogo, setSavingLogo] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [localNavbarLogoUrl, setLocalNavbarLogoUrl] = useState<string>('');
  const [localFontFamily, setLocalFontFamily] = useState<string>('Plus Jakarta Sans');
  const [localFontSizeBase, setLocalFontSizeBase] = useState<number>(16);
  const [localNavbarSearchPlaceholder, setLocalNavbarSearchPlaceholder] = useState<string>('Search games...');
  const [localNavbarSearchEnabled, setLocalNavbarSearchEnabled] = useState<boolean>(true);
  const [localSupportWhatsAppUrl, setLocalSupportWhatsAppUrl] = useState<string>('');
  const [localSupportMessengerUrl, setLocalSupportMessengerUrl] = useState<string>('');
  const [localSupportTelegramUrl, setLocalSupportTelegramUrl] = useState<string>('');
  const [localUddoktaBaseUrl, setLocalUddoktaBaseUrl] = useState<string>('');
  const [localUddoktaApiKey, setLocalUddoktaApiKey] = useState<string>('');
  const [localUddoktaCheckoutPath, setLocalUddoktaCheckoutPath] = useState<string>('');
  const [localUddoktaVerifyPath, setLocalUddoktaVerifyPath] = useState<string>('');

  // Banners (image-only)
  const [banners, setBanners] = useState<BackendBanner[]>([]);
  const [bannerImage, setBannerImage] = useState('');
  const [editingBanner, setEditingBanner] = useState<string | null>(null);

  // Notices
  const [notices, setNotices] = useState<BackendNotice[]>([]);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeIcon, setNoticeIcon] = useState('FaRobot');
  const [noticeFeatures, setNoticeFeatures] = useState<Array<{ icon?: string; text: string }>>([]);
  const [noticeOrder, setNoticeOrder] = useState('0');
  const [editingNotice, setEditingNotice] = useState<string | null>(null);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [newFeatureIcon, setNewFeatureIcon] = useState('FaShieldAlt');

  const [activeTab, setActiveTab] = useState<ThemeTab>('brand');

  const themeTabs: { id: ThemeTab; label: string; icon: typeof FaPalette }[] = [
    { id: 'brand', label: 'Brand & Logo', icon: FaPalette },
    { id: 'content', label: 'Content Sections', icon: FaList },
    { id: 'integrations', label: 'Integrations', icon: FaPlug },
    { id: 'banners', label: 'Banners', icon: FaImage },
    { id: 'notices', label: 'Notices', icon: FaBullhorn },
  ];

  // Initialize local state from theme context
  useEffect(() => {
    if (isLoaded) {
      setLocalPrimary(primaryColor);
      setLocalSecondary(secondaryColor);
      setLocalLivePurchaseEnabled(livePurchaseStatementEnabled);
      setLocalTopUpCategoriesEnabled(topUpCategoriesEnabled);
      setLocalTopUpCategoriesBadge(topUpCategoriesBadge);
      setLocalTopUpCategoriesHeading(topUpCategoriesHeading);
      setLocalSubscriptionsEnabled(subscriptionsEnabled);
      setLocalSubscriptionsBadge(subscriptionsBadge);
      setLocalSubscriptionsHeading(subscriptionsHeading);
      setLocalReviewSectionEnabled(reviewSectionEnabled);
      setLocalNavbarLogoUrl(navbarLogoUrl || '');
      setLocalFontFamily(fontFamily || 'Plus Jakarta Sans');
      setLocalFontSizeBase(fontSizeBase ?? 16);
      setLocalNavbarSearchPlaceholder(navbarSearchPlaceholder ?? 'Search games...');
      setLocalNavbarSearchEnabled(navbarSearchEnabled ?? true);
      setLocalSupportWhatsAppUrl(supportWhatsAppUrl ?? '');
      setLocalSupportMessengerUrl(supportMessengerUrl ?? '');
      setLocalSupportTelegramUrl(supportTelegramUrl ?? '');
      setLocalUddoktaBaseUrl(uddoktaBaseUrl ?? '');
      setLocalUddoktaApiKey('');
      setLocalUddoktaCheckoutPath(uddoktaGatewayConfig?.checkoutPath ?? '');
      setLocalUddoktaVerifyPath(uddoktaGatewayConfig?.verifyPath ?? '');
    }
  }, [isLoaded, primaryColor, secondaryColor, livePurchaseStatementEnabled, topUpCategoriesEnabled, subscriptionsEnabled, reviewSectionEnabled, topUpCategoriesBadge, topUpCategoriesHeading, subscriptionsBadge, subscriptionsHeading, navbarLogoUrl, fontFamily, fontSizeBase, navbarSearchPlaceholder, navbarSearchEnabled, supportWhatsAppUrl, supportMessengerUrl, supportTelegramUrl, uddoktaBaseUrl, uddoktaGatewayConfig]);

  // Apply preview colors
  useEffect(() => {
    if (previewMode) {
      const root = document.documentElement;
      const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : null;
      };

      const primaryRgb = hexToRgb(localPrimary);
      const secondaryRgb = hexToRgb(localSecondary);

      if (primaryRgb) {
        root.style.setProperty('--theme-primary', localPrimary);
        root.style.setProperty('--theme-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
        root.style.setProperty('--theme-primary-light', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.14)`);
        root.style.setProperty('--theme-primary-dark', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.8)`);
        root.style.setProperty('--theme-primary-hover', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.9)`);
      }

      if (secondaryRgb) {
        root.style.setProperty('--theme-secondary', localSecondary);
        root.style.setProperty('--theme-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
        const darkerR = Math.max(0, secondaryRgb.r - 20);
        const darkerG = Math.max(0, secondaryRgb.g - 20);
        const darkerB = Math.max(0, secondaryRgb.b - 20);
        root.style.setProperty('--theme-secondary-dark', `rgb(${darkerR}, ${darkerG}, ${darkerB})`);
      }
    }
  }, [previewMode, localPrimary, localSecondary]);

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

  useEffect(() => {
    loadBanners();
    loadNotices();
  }, []);

  const handleAddBanner = async (e: FormEvent) => {
    e.preventDefault();
    if (!bannerImage?.trim()) {
      showToast({ type: 'error', text: 'Banner image is required. Please upload an image.' });
      return;
    }
    try {
      const response = await bannerApi.create({
        id: crypto.randomUUID(),
        image: bannerImage.trim(),
        title: '',
        subtitle: '',
        buttonText: '',
        link: undefined,
        displayOrder: 0,
        isActive: true
      });
      if (response.success) {
        showToast({ type: 'success', text: 'Banner added successfully!' });
        setBannerImage('');
        await loadBanners();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to create banner' });
      }
    } catch (err: unknown) {
      showToast({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create banner' });
    }
  };

  const handleEditBanner = (b: BackendBanner) => {
    setEditingBanner(b.id);
    setBannerImage(b.image);
  };

  const handleCancelBannerEdit = () => {
    setEditingBanner(null);
    setBannerImage('');
  };

  const handleUpdateBanner = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !bannerImage?.trim()) {
      showToast({ type: 'error', text: 'Banner image is required' });
      return;
    }
    try {
      const response = await bannerApi.update(editingBanner, {
        image: bannerImage.trim(),
        title: '',
        subtitle: '',
        buttonText: '',
        link: undefined,
        displayOrder: 0
      });
      if (response.success) {
        showToast({ type: 'success', text: 'Banner updated successfully!' });
        handleCancelBannerEdit();
        await loadBanners();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to update banner' });
      }
    } catch (err: unknown) {
      showToast({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update banner' });
    }
  };

  const handleRemoveBanner = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      const response = await bannerApi.delete(id);
      if (response.success) {
        showToast({ type: 'success', text: 'Banner deleted successfully!' });
        await loadBanners();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to delete banner' });
      }
    } catch (err: unknown) {
      showToast({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete banner' });
    }
  };

  const handleToggleBannerActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await bannerApi.update(id, { isActive: !currentStatus });
      if (response.success) {
        showToast({ type: 'success', text: `Banner ${!currentStatus ? 'activated' : 'deactivated'} successfully!` });
        await loadBanners();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to update banner status' });
      }
    } catch (err: unknown) {
      showToast({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update banner status' });
    }
  };

  const handleAddNotice = async (e: FormEvent) => {
    e.preventDefault();
    if (!noticeMessage.trim()) {
      showToast({ type: 'error', text: 'Notice message is required' });
      return;
    }
    try {
      const response = await noticeApi.create({
        id: crypto.randomUUID(),
        title: noticeTitle.trim() || '',
        message: noticeMessage.trim(),
        icon: noticeIcon,
        features: noticeFeatures,
        displayOrder: Number(noticeOrder) || 0,
        isActive: true
      });
      if (response.success) {
        showToast({ type: 'success', text: 'Notice added successfully!' });
        setNoticeMessage('');
        setNoticeTitle('');
        setNoticeIcon('FaRobot');
        setNoticeFeatures([]);
        setNoticeOrder('0');
        await loadNotices();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to create notice' });
      }
    } catch (err: unknown) {
      showToast({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create notice' });
    }
  };

  const handleEditNotice = (n: BackendNotice) => {
    setEditingNotice(n.id);
    setNoticeMessage(n.message);
    setNoticeTitle(n.title || '');
    setNoticeIcon(n.icon || 'FaRobot');
    setNoticeFeatures(n.features || []);
    setNoticeOrder(String(n.displayOrder));
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
      showToast({ type: 'error', text: 'Notice message is required' });
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
        showToast({ type: 'success', text: 'Notice updated successfully!' });
        handleCancelNoticeEdit();
        await loadNotices();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to update notice' });
      }
    } catch (err: unknown) {
      showToast({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update notice' });
    }
  };

  const handleRemoveNotice = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      const response = await noticeApi.delete(id);
      if (response.success) {
        showToast({ type: 'success', text: 'Notice deleted successfully!' });
        await loadNotices();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to delete notice' });
      }
    } catch (err: unknown) {
      showToast({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete notice' });
    }
  };

  const handleToggleNoticeActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await noticeApi.update(id, { isActive: !currentStatus });
      if (response.success) {
        showToast({ type: 'success', text: `Notice ${!currentStatus ? 'activated' : 'deactivated'} successfully!` });
        await loadNotices();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to update notice status' });
      }
    } catch (err: unknown) {
      showToast({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update notice status' });
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

  const handleSaveLogo = async () => {
    setSavingLogo(true);
    try {
      await updateTheme(primaryColor, secondaryColor, user?.email || 'admin', livePurchaseStatementEnabled, topUpCategoriesEnabled, topUpCategoriesBadge, topUpCategoriesHeading, subscriptionsEnabled, subscriptionsBadge, subscriptionsHeading, reviewSectionEnabled, localNavbarLogoUrl, fontFamily, fontSizeBase, navbarSearchPlaceholder, navbarSearchEnabled, supportWhatsAppUrl, supportMessengerUrl, supportTelegramUrl, uddoktaBaseUrl);
      showToast({ type: 'success', text: 'Logo saved.' });
    } catch (error: any) {
      showToast({ type: 'error', text: error?.message || 'Failed to save logo.' });
    } finally {
      setSavingLogo(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate colors
    if (!/^#([A-Fa-f0-9]{6})$/.test(localPrimary)) {
      showToast({ type: 'error', text: 'Invalid primary color format' });
      return;
    }
    
    if (!/^#([A-Fa-f0-9]{6})$/.test(localSecondary)) {
      showToast({ type: 'error', text: 'Invalid secondary color format' });
      return;
    }

    setIsSaving(true);
    try {
      await updateTheme(localPrimary, localSecondary, user?.email || 'admin', localLivePurchaseEnabled, localTopUpCategoriesEnabled, localTopUpCategoriesBadge, localTopUpCategoriesHeading, localSubscriptionsEnabled, localSubscriptionsBadge, localSubscriptionsHeading, localReviewSectionEnabled, localNavbarLogoUrl, localFontFamily, localFontSizeBase, localNavbarSearchPlaceholder, localNavbarSearchEnabled, localSupportWhatsAppUrl, localSupportMessengerUrl, localSupportTelegramUrl, localUddoktaBaseUrl, localUddoktaApiKey.trim() || undefined, {
        baseUrl: localUddoktaBaseUrl.trim(),
        checkoutPath: localUddoktaCheckoutPath.trim(),
        verifyPath: localUddoktaVerifyPath.trim(),
      });
      setLocalUddoktaApiKey('');
      showToast({ 
        type: 'success', 
        text: 'Theme updated successfully! Changes are live now and saved to MongoDB.' 
      });
      setPreviewMode(false);
    } catch (error: any) {
      console.error('Theme update error:', error);
      const errorMessage = error.message || 'Failed to update theme';
      showToast({ 
        type: 'error', 
        text: `Failed to save theme: ${errorMessage}. Please check your connection and try again.` 
      });
      // Keep preview mode active so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalPrimary('#a855f7');
    setLocalSecondary('#8b5cf6');
    setPreviewMode(false);
  };

  const handlePreview = () => {
    setPreviewMode(true);
  };

  const handleCancelPreview = () => {
    setPreviewMode(false);
    // Restore original colors
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', primaryColor);
    root.style.setProperty('--theme-secondary', secondaryColor);
    // Re-apply theme to restore all variables
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    };
    const primaryRgb = hexToRgb(primaryColor);
    const secondaryRgb = hexToRgb(secondaryColor);
    if (primaryRgb) {
      root.style.setProperty('--theme-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
      root.style.setProperty('--theme-primary-light', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.14)`);
      root.style.setProperty('--theme-primary-dark', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.8)`);
      root.style.setProperty('--theme-primary-hover', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.9)`);
    }
    if (secondaryRgb) {
      root.style.setProperty('--theme-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
      const darkerR = Math.max(0, secondaryRgb.r - 20);
      const darkerG = Math.max(0, secondaryRgb.g - 20);
      const darkerB = Math.max(0, secondaryRgb.b - 20);
      root.style.setProperty('--theme-secondary-dark', `rgb(${darkerR}, ${darkerG}, ${darkerB})`);
    }
  };

  // Preset colors that work well with white background
  const presetColors = [
    { name: 'Purple (Default)', primary: '#a855f7', secondary: '#8b5cf6' },
    { name: 'Game Shop (Red/Orange)', primary: '#dc2626', secondary: '#ea580c' },
    { name: 'Blue', primary: '#3b82f6', secondary: '#2563eb' },
    { name: 'Green', primary: '#10b981', secondary: '#059669' },
    { name: 'Pink', primary: '#ec4899', secondary: '#db2777' },
    { name: 'Orange', primary: '#f97316', secondary: '#ea580c' },
    { name: 'Teal', primary: '#14b8a6', secondary: '#0d9488' },
    { name: 'Indigo', primary: '#6366f1', secondary: '#4f46e5' },
    { name: 'Red', primary: '#ef4444', secondary: '#dc2626' },
  ];

  const inputRingStyle = { '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties;

  return (
    <div className="pt-4 pb-4 pl-0 pr-4 space-y-6 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-8 h-8 rounded-lg border border-slate-300 shadow-sm" style={{ backgroundColor: primaryColor }} />
              <div className="w-8 h-8 rounded-lg border border-slate-300 shadow-sm" style={{ backgroundColor: secondaryColor }} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Current Theme</p>
              <p className="text-sm font-semibold text-slate-700">Primary · Secondary</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {navbarLogoUrl ? (
              <img src={navbarLogoUrl} alt="Logo" className="h-10 w-auto object-contain rounded" />
            ) : (
              <div className="h-10 w-20 rounded bg-slate-100 flex items-center justify-center">
                <span className="text-xs text-slate-400">No logo</span>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-slate-500">Navbar Logo</p>
              <p className="text-sm font-semibold text-slate-700">{navbarLogoUrl ? 'Set' : 'Not set'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Banners</p>
            <p className="text-xl font-bold text-slate-900">{banners.length}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Notices</p>
            <p className="text-xl font-bold text-slate-900">{notices.length}</p>
          </div>
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {themeTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === t.id ? 'text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
              style={activeTab === t.id ? themeBtnStyle : undefined}
            >
              <t.icon className="w-4 h-4 shrink-0" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {previewMode && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">Preview Mode Active</p>
              <p className="text-sm text-blue-700">You are previewing theme changes. Click "Save Theme" to apply or "Cancel Preview" to revert.</p>
            </div>
            <button
              onClick={handleCancelPreview}
              className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-all"
            >
              Cancel Preview
            </button>
          </div>
        </div>
      )}

      <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900">Store Theme Customization</h3>
          <p className="mt-1 text-sm text-slate-600">
            Customize your store brand, colors, content sections, and integrations. Changes apply site-wide.
          </p>
        </div>

        {['brand', 'content', 'integrations'].includes(activeTab) && (
          <form id="theme-form" onSubmit={handleSave} className="space-y-6">
            {/* Brand & Logo tab */}
            <div className={activeTab !== 'brand' ? 'hidden' : 'space-y-6'}>
              <div className="p-4 border rounded-xl bg-slate-50 border-slate-200 shadow-sm">
            <span className="block mb-3 text-sm font-semibold text-slate-700">Store logo (navbar)</span>
            <p className="mb-4 text-xs text-slate-500">Upload an image to show in the navbar instead of text. Recommended size: height 40–48px. Display size is fixed in the navbar.</p>
            <div className="max-w-xs">
              {localNavbarLogoUrl && (
                <div className="mb-2">
                  <img src={localNavbarLogoUrl} alt="Navbar logo preview" className="max-h-12 w-auto object-contain" />
                </div>
              )}
              <ImageUpload
                label="Navbar Logo"
                value={localNavbarLogoUrl}
                uploadEndpoint="/upload/navbar-logo"
                onChange={(url) => setLocalNavbarLogoUrl(url)}
              />
              <button
                type="button"
                onClick={handleSaveLogo}
                disabled={savingLogo}
                className="mt-3 px-4 py-2 text-sm font-semibold text-white transition-all rounded-xl bg-slate-700 hover:bg-slate-800 disabled:opacity-50"
              >
                {savingLogo ? 'Saving…' : 'Save logo'}
              </button>
            </div>
          </div>

          {/* Color Pickers - Brand tab */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-xl bg-slate-50 border-slate-200 shadow-sm">
              <label className="block mb-3">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Primary Color *</span>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={localPrimary}
                    onChange={(e) => {
                      setLocalPrimary(e.target.value);
                      if (previewMode) {
                        setPreviewMode(false);
                        setTimeout(() => setPreviewMode(true), 10);
                      }
                    }}
                    className="w-20 h-20 rounded-lg border-2 border-slate-300 cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={localPrimary}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^#[A-Fa-f0-9]{0,6}$/.test(value)) {
                          setLocalPrimary(value.length === 6 ? `#${value}` : value);
                          if (previewMode && value.length === 7) {
                            setPreviewMode(false);
                            setTimeout(() => setPreviewMode(true), 10);
                          }
                        }
                      }}
                      placeholder="#a855f7"
                      className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 font-mono"
                      style={inputRingStyle}
                    />
                    <p className="mt-1 text-xs text-slate-500">Used for buttons, links, and primary accents</p>
                  </div>
                </div>
              </label>
            </div>
            <div className="p-4 border rounded-xl bg-slate-50 border-slate-200 shadow-sm">
              <label className="block mb-3">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Secondary Color *</span>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={localSecondary}
                    onChange={(e) => {
                      setLocalSecondary(e.target.value);
                      if (previewMode) {
                        setPreviewMode(false);
                        setTimeout(() => setPreviewMode(true), 10);
                      }
                    }}
                    className="w-20 h-20 rounded-lg border-2 border-slate-300 cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={localSecondary}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^#[A-Fa-f0-9]{0,6}$/.test(value)) {
                          setLocalSecondary(value.length === 6 ? `#${value}` : value);
                          if (previewMode && value.length === 7) {
                            setPreviewMode(false);
                            setTimeout(() => setPreviewMode(true), 10);
                          }
                        }
                      }}
                      placeholder="#8b5cf6"
                      className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 font-mono"
                      style={inputRingStyle}
                    />
                    <p className="mt-1 text-xs text-slate-500">Used for gradients and secondary accents</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Color Preview - Brand tab */}
          <div className="p-4 border rounded-xl bg-slate-50 border-slate-200 shadow-sm">
            <span className="block mb-3 text-sm font-semibold text-slate-700">Color Preview</span>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-24 h-24 rounded-lg border-2 border-slate-300 shadow-md"
                  style={{ background: `linear-gradient(135deg, ${localPrimary}, ${localSecondary})` }}
                />
                <span className="text-xs text-slate-600">Gradient</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-24 h-24 rounded-lg border-2 border-slate-300 shadow-md"
                  style={{ backgroundColor: localPrimary }}
                />
                <span className="text-xs text-slate-600">Primary</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-24 h-24 rounded-lg border-2 border-slate-300 shadow-md"
                  style={{ backgroundColor: localSecondary }}
                />
                <span className="text-xs text-slate-600">Secondary</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  className="px-6 py-3 rounded-lg text-white font-semibold shadow-md transition-all"
                  style={{ background: `linear-gradient(135deg, ${localPrimary}, ${localSecondary})` }}
                >
                  Sample Button
                </button>
                <span className="text-xs text-slate-600">Button Style</span>
              </div>
            </div>
          </div>

          {/* Typography & Navbar - Brand tab */}
          <div className="p-4 border rounded-xl bg-slate-50 border-slate-200 shadow-sm">
            <span className="block mb-3 text-sm font-semibold text-slate-700">Typography & Navbar</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">Font family</label>
                <select
                  value={localFontFamily}
                  onChange={(e) => setLocalFontFamily(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                  style={inputRingStyle}
                >
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  <option value="Inter">Inter</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Roboto">Roboto</option>
                  <option value="system-ui">system-ui</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">Font size (base)</label>
                <input
                  type="number"
                  min={14}
                  max={20}
                  value={localFontSizeBase}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!Number.isNaN(n) && n >= 14 && n <= 20) setLocalFontSizeBase(n);
                  }}
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                  style={inputRingStyle}
                />
                <p className="mt-1 text-xs text-slate-500">14–20 px, applied site-wide</p>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span className="block mb-1 text-sm font-semibold text-slate-700">Show search box in navbar</span>
                  <p className="text-xs text-slate-500">Display a search input and button in the navbar</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={localNavbarSearchEnabled}
                    onChange={(e) => setLocalNavbarSearchEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                    localNavbarSearchEnabled ? 'bg-blue-600' : 'bg-slate-300'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      localNavbarSearchEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`}></div>
                  </div>
                </label>
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">Search placeholder</label>
                <input
                  type="text"
                  value={localNavbarSearchPlaceholder}
                  onChange={(e) => setLocalNavbarSearchPlaceholder(e.target.value)}
                  placeholder="Search games..."
                  className="w-full max-w-md px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                  style={inputRingStyle}
                />
              </div>
            </div>
          </div>

          {/* Quick Presets - Brand tab */}
          <div className="p-4 border rounded-xl bg-slate-50 border-slate-200 shadow-sm">
            <span className="block mb-3 text-sm font-semibold text-slate-700">Quick Presets</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {presetColors.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setLocalPrimary(preset.primary);
                    setLocalSecondary(preset.secondary);
                    if (previewMode) {
                      setPreviewMode(false);
                      setTimeout(() => setPreviewMode(true), 10);
                    }
                  }}
                  className="p-3 border rounded-lg bg-white border-slate-200 hover:border-slate-300 transition-all text-left shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded border border-slate-300"
                      style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                    />
                    <span className="text-sm font-semibold text-slate-700">{preset.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <div
                      className="w-4 h-4 rounded border border-slate-300"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded border border-slate-300"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
            </div>

            {/* Content Sections tab */}
            <div className={activeTab !== 'content' ? 'hidden' : 'space-y-6'}>
            {/* Section Visibility Toggles */}
            <div className="space-y-4">
              <div className="p-4 border rounded-xl bg-slate-50 border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="block mb-1 text-sm font-semibold text-slate-700">Live Purchase Statement</span>
                    <p className="text-xs text-slate-500">Show or hide the live purchase statement section on the home page</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={localLivePurchaseEnabled}
                      onChange={(e) => setLocalLivePurchaseEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                      localLivePurchaseEnabled ? 'bg-blue-600' : 'bg-slate-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                        localLivePurchaseEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}></div>
                    </div>
                  </label>
                </div>
              </div>
              <div className="p-4 border rounded-xl bg-slate-50 border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="block mb-1 text-sm font-semibold text-slate-700">Top-up Categories</span>
                    <p className="text-xs text-slate-500">Show or hide the top-up categories section on the home page</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={localTopUpCategoriesEnabled}
                      onChange={(e) => setLocalTopUpCategoriesEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                      localTopUpCategoriesEnabled ? 'bg-blue-600' : 'bg-slate-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                        localTopUpCategoriesEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}></div>
                    </div>
                  </label>
                </div>
              </div>
              <div className="p-4 border rounded-xl bg-slate-50 border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="block mb-1 text-sm font-semibold text-slate-700">Subscriptions</span>
                    <p className="text-xs text-slate-500">Show or hide the subscriptions section on the home page</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={localSubscriptionsEnabled}
                      onChange={(e) => setLocalSubscriptionsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                      localSubscriptionsEnabled ? 'bg-blue-600' : 'bg-slate-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                        localSubscriptionsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}></div>
                    </div>
                  </label>
                </div>
              </div>
              <div className="p-4 border rounded-xl bg-slate-50 border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="block mb-1 text-sm font-semibold text-slate-700">Review Section</span>
                    <p className="text-xs text-slate-500">Show or hide the customer reviews section on the home page</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={localReviewSectionEnabled}
                      onChange={(e) => setLocalReviewSectionEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                      localReviewSectionEnabled ? 'bg-blue-600' : 'bg-slate-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                        localReviewSectionEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            {/* Section Titles Customization */}
            <div className="p-4 border rounded-xl bg-slate-50 border-slate-200 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-900">Section Titles</h3>
              <p className="mb-6 text-sm text-slate-600">
                Customize the badge and heading text for each section on the home page. You can include emojis and special characters.
              </p>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-700">Top-up Categories Section</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-slate-700">Badge Text</label>
                      <input
                        type="text"
                        value={localTopUpCategoriesBadge}
                        onChange={(e) => setLocalTopUpCategoriesBadge(e.target.value)}
                        placeholder="Top-up categories"
                        className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        style={inputRingStyle}
                      />
                      <p className="mt-1 text-xs text-slate-500">Small badge text displayed above the heading</p>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-slate-700">Heading Text</label>
                      <input
                        type="text"
                        value={localTopUpCategoriesHeading}
                        onChange={(e) => setLocalTopUpCategoriesHeading(e.target.value)}
                        placeholder="Browse Categories"
                        className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        style={inputRingStyle}
                      />
                      <p className="mt-1 text-xs text-slate-500">Main heading text for the section</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-700">Subscriptions Section</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-slate-700">Badge Text</label>
                      <input
                        type="text"
                        value={localSubscriptionsBadge}
                        onChange={(e) => setLocalSubscriptionsBadge(e.target.value)}
                        placeholder="Subscriptions"
                        className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        style={inputRingStyle}
                      />
                      <p className="mt-1 text-xs text-slate-500">Small badge text displayed above the heading</p>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-slate-700">Heading Text</label>
                      <input
                        type="text"
                        value={localSubscriptionsHeading}
                        onChange={(e) => setLocalSubscriptionsHeading(e.target.value)}
                        placeholder="Subscription Plans"
                        className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        style={inputRingStyle}
                      />
                      <p className="mt-1 text-xs text-slate-500">Main heading text for the section</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Integrations tab */}
            <div className={activeTab !== 'integrations' ? 'hidden' : 'space-y-6'}>
          {/* Support links */}
          <div className="p-4 border rounded-xl bg-slate-50 border-slate-200 shadow-sm">
            <span className="block mb-3 text-sm font-semibold text-slate-700">Support Links</span>
            <p className="mb-4 text-xs text-slate-500">URLs for the Support section on the landing page (WhatsApp, Messenger, Telegram). Leave empty to hide that card.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-600">WhatsApp URL</label>
                <input
                  type="url"
                  value={localSupportWhatsAppUrl}
                  onChange={(e) => setLocalSupportWhatsAppUrl(e.target.value)}
                  placeholder="https://wa.me/..."
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2"
                  style={inputRingStyle}
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-600">Messenger (Facebook) URL</label>
                <input
                  type="url"
                  value={localSupportMessengerUrl}
                  onChange={(e) => setLocalSupportMessengerUrl(e.target.value)}
                  placeholder="https://m.me/..."
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2"
                  style={inputRingStyle}
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-600">Telegram URL</label>
                <input
                  type="url"
                  value={localSupportTelegramUrl}
                  onChange={(e) => setLocalSupportTelegramUrl(e.target.value)}
                  placeholder="https://t.me/..."
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2"
                  style={inputRingStyle}
                />
              </div>
            </div>
          </div>

          {/* Payment Gateway (Uddokta Pay) */}
          <div className="p-4 border rounded-xl bg-slate-50 border-slate-200 shadow-sm">
            <span className="block mb-3 text-sm font-semibold text-slate-700">Payment Gateway (Uddokta Pay)</span>
            <p className="mb-4 text-xs text-slate-500">
              Add gateway base URL and API key from admin panel. After saving, Instant Pay will start using this config dynamically.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-600">Gateway Base URL</label>
                <input
                  type="url"
                  value={localUddoktaBaseUrl}
                  onChange={(e) => setLocalUddoktaBaseUrl(e.target.value)}
                  placeholder="https://robotopupzone.paymently.io/api"
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-600">Checkout Path</label>
                <input
                  type="text"
                  value={localUddoktaCheckoutPath}
                  onChange={(e) => setLocalUddoktaCheckoutPath(e.target.value)}
                  placeholder="https://.../checkout-v2 or /checkout-v2"
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-600">Verify Path</label>
                <input
                  type="text"
                  value={localUddoktaVerifyPath}
                  onChange={(e) => setLocalUddoktaVerifyPath(e.target.value)}
                  placeholder="https://.../verify-payment or /verify-payment"
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-medium text-slate-600">Gateway API Key</label>
                <input
                  type="password"
                  value={localUddoktaApiKey}
                  onChange={(e) => setLocalUddoktaApiKey(e.target.value)}
                  placeholder="Paste new API key"
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  {uddoktaConfigured ? 'API key is configured. Leave empty to keep current key.' : 'No API key configured yet.'}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">Header key used: RT-UDDOKTAPAY-API-KEY</p>
              </div>
            </div>
          </div>
            </div>

            {/* Sticky action bar */}
            <div className="sticky top-4 z-10 flex flex-wrap gap-3 pt-4 pb-2 bg-white/95 backdrop-blur-sm -mx-1 px-1 rounded-lg">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 font-semibold text-white transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.background = `linear-gradient(135deg, var(--theme-primary-hover), var(--theme-secondary-dark))`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.background = `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`;
                }
              }}
            >
              {isSaving ? 'Saving...' : 'Save Theme'}
            </button>
            <button
              type="button"
              onClick={handlePreview}
              disabled={isSaving || previewMode}
              className="px-6 py-3 font-semibold transition-all bg-blue-100 rounded-xl text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Preview Changes
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="px-6 py-3 font-semibold transition-all bg-slate-200 rounded-xl text-slate-700 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset to Default
            </button>
          </div>
        </form>
        )}

        {activeTab === 'banners' && (
        <div className="p-4 border rounded-xl bg-slate-50 border-slate-200 shadow-sm sm:p-5 md:p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Banner Management</h3>
          <form
            className="p-4 mb-6 border rounded-lg bg-slate-50 border-slate-200"
            onSubmit={editingBanner ? handleUpdateBanner : handleAddBanner}
          >
            <h4 className="mb-3 text-base font-semibold text-slate-700">
              {editingBanner ? 'Edit Banner' : 'Add New Banner'}
            </h4>
            <div className="max-w-md">
              <ImageUpload
                label="Banner Image *"
                value={bannerImage}
                onChange={setBannerImage}
                uploadEndpoint="/upload/banner-image"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="px-4 py-2 font-semibold text-white transition-all rounded-xl"
                style={{ background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, var(--theme-primary-hover), var(--theme-secondary-dark))`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`;
                }}
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
          <div>
            <h4 className="mb-3 text-base font-semibold text-slate-700">Existing Banners ({banners.length})</h4>
            <div className="space-y-2">
              {banners.length > 0 ? (
                banners.map((banner) => {
                  const isActive = banner.isActive !== false;
                  return (
                    <div
                      key={banner.id}
                      className={`p-4 transition-colors border rounded-lg ${isActive ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-50'} hover:bg-slate-50`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {!isActive && (
                            <span className="inline-block px-2 py-0.5 mb-2 rounded-full bg-slate-200 text-slate-600 text-xs font-semibold">
                              Inactive
                            </span>
                          )}
                          <div className="mb-2">
                            <img
                              src={banner.image}
                              alt="Banner"
                              className="object-cover w-full h-32 max-w-md border rounded-lg border-slate-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
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
                                style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                              />
                            </label>
                            <span className="text-[10px] text-slate-500">{isActive ? 'ON' : 'OFF'}</span>
                          </div>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-semibold hover:bg-blue-200 transition-all"
                            onClick={() => handleEditBanner(banner)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
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
                <div className="p-8 text-center text-slate-500">No banners yet. Add your first banner.</div>
              )}
            </div>
          </div>
        </div>
        )}

        {activeTab === 'notices' && (
        <div className="p-4 border rounded-xl bg-slate-50 border-slate-200 shadow-sm sm:p-5 md:p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Notice Management</h3>
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
                  placeholder="Notice message..."
                  rows={3}
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Title (optional)</span>
                <input
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="Notice Title"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Icon</span>
                <select
                  value={noticeIcon}
                  onChange={(e) => setNoticeIcon(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
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
                  style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                />
              </label>
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
                    style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                  />
                  <select
                    value={newFeatureIcon}
                    onChange={(e) => setNewFeatureIcon(e.target.value)}
                    className="px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
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
                type="submit"
                className="px-4 py-2 font-semibold text-white transition-all rounded-xl"
                style={{ background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, var(--theme-primary-hover), var(--theme-secondary-dark))`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`;
                }}
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
          <div>
            <h4 className="mb-3 text-base font-semibold text-slate-700">Existing Notices ({notices.length})</h4>
            <div className="space-y-2">
              {notices.length > 0 ? (
                notices.map((notice) => {
                  const isActive = notice.isActive !== false;
                  return (
                    <div
                      key={notice.id}
                      className={`p-4 transition-colors border rounded-lg ${isActive ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-50'} hover:bg-slate-50`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {!isActive && (
                            <span className="inline-block px-2 py-0.5 mb-2 rounded-full bg-slate-200 text-slate-600 text-xs font-semibold">
                              Inactive
                            </span>
                          )}
                          <span className="inline-block px-2 py-0.5 mb-2 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                            Order: {notice.displayOrder}
                          </span>
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
                                style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                              />
                            </label>
                            <span className="text-[10px] text-slate-500">{isActive ? 'ON' : 'OFF'}</span>
                          </div>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-semibold hover:bg-blue-200 transition-all"
                            onClick={() => handleEditNotice(notice)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
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
                <div className="p-8 text-center text-slate-500">No notices yet. Add your first notice.</div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default ThemeCustomization;
