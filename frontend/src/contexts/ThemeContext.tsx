import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { themeApi, SmartAPIManager } from '../services/api';
import { getImageUrl } from '../utils/imageUrl';

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  livePurchaseStatementEnabled: boolean;
  topUpCategoriesEnabled: boolean;
  topUpCategoriesBadge: string;
  topUpCategoriesHeading: string;
  subscriptionsEnabled: boolean;
  subscriptionsBadge: string;
  subscriptionsHeading: string;
  reviewSectionEnabled: boolean;
  navbarLogoUrl: string;
  fontFamily: string;
  fontSizeBase: number;
  navbarSearchPlaceholder: string;
  navbarSearchEnabled: boolean;
  supportWhatsAppUrl: string;
  supportMessengerUrl: string;
  supportTelegramUrl: string;
  uddoktaBaseUrl: string;
  uddoktaConfigured: boolean;
  uddoktaGatewayConfig: {
    baseUrl: string;
    checkoutPath: string;
    checkoutV2Path: string;
    verifyPath: string;
    refundPath: string;
    apiKeyHeader: string;
  };
  sweetnoteEnabled: boolean;
  sweetnoteImageUrl: string;
  sweetnoteHeading: string;
  sweetnoteText: string;
  sweetnoteButtonText: string;
  sweetnoteButtonUrl: string;
  pwaAppName: string;
  isLoaded: boolean;
  updateTheme: (primaryColor: string, secondaryColor: string, options?: UpdateThemeOptions) => Promise<void>;
}

interface UpdateThemeOptions {
  updatedBy?: string;
  livePurchaseStatementEnabled?: boolean;
  topUpCategoriesEnabled?: boolean;
  topUpCategoriesBadge?: string;
  topUpCategoriesHeading?: string;
  subscriptionsEnabled?: boolean;
  subscriptionsBadge?: string;
  subscriptionsHeading?: string;
  reviewSectionEnabled?: boolean;
  navbarLogoUrl?: string;
  fontFamily?: string;
  fontSizeBase?: number;
  navbarSearchPlaceholder?: string;
  navbarSearchEnabled?: boolean;
  supportWhatsAppUrl?: string;
  supportMessengerUrl?: string;
  supportTelegramUrl?: string;
  uddoktaBaseUrl?: string;
  uddoktaApiKey?: string;
  uddoktaGatewayConfig?: {
    baseUrl?: string;
    checkoutPath?: string;
    checkoutV2Path?: string;
    verifyPath?: string;
    refundPath?: string;
    apiKeyHeader?: string;
  };
  sweetnoteEnabled?: boolean;
  sweetnoteImageUrl?: string;
  sweetnoteHeading?: string;
  sweetnoteText?: string;
  sweetnoteButtonText?: string;
  sweetnoteButtonUrl?: string;
  pwaAppName?: string;
}

// Default values
const DEFAULTS = {
  PRIMARY: '#F05656',
  SECONDARY: '#e04a4a',
  TOP_UP_BADGE: 'Top-up categories',
  TOP_UP_HEADING: 'Browse Categories',
  SUBSCRIPTIONS_BADGE: 'Subscriptions',
  SUBSCRIPTIONS_HEADING: 'Subscription Plans',
  FONT_FAMILY: 'Plus Jakarta Sans',
  FONT_SIZE_BASE: 16,
  NAVBAR_SEARCH_PLACEHOLDER: 'Search games...',
  NAVBAR_SEARCH_ENABLED: true,
  PWA_APP_NAME: 'Robo Top Up Zone',
  SWEETNOTE_BUTTON_TEXT: 'Join Now',
  LIVE_PURCHASE_ENABLED: true,
  TOP_UP_CATEGORIES_ENABLED: true,
  SUBSCRIPTIONS_ENABLED: true,
  REVIEW_SECTION_ENABLED: true,
  SWEETNOTE_ENABLED: false,
};

const THEME_CHANNEL = 'robo-theme-updated';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper function to convert hex to RGB
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

// Helper to apply theme CSS variables
const applyThemeVariables = (primary: string, secondary: string, fontFamily?: string, fontSizeBase?: number) => {
  const root = document.documentElement;
  const primaryRgb = hexToRgb(primary);
  const secondaryRgb = hexToRgb(secondary);

  root.style.setProperty('--theme-primary', primary);
  root.style.setProperty('--theme-secondary', secondary);

  if (primaryRgb) {
    root.style.setProperty('--theme-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    root.style.setProperty('--theme-primary-light', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.14)`);
    root.style.setProperty('--theme-primary-dark', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.8)`);
    root.style.setProperty('--theme-primary-hover', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.9)`);
    root.style.setProperty('--theme-border', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.3)`);
  }

  if (secondaryRgb) {
    root.style.setProperty('--theme-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
    // Calculate darker shade
    const darkerR = Math.max(0, secondaryRgb.r - 20);
    const darkerG = Math.max(0, secondaryRgb.g - 20);
    const darkerB = Math.max(0, secondaryRgb.b - 20);
    root.style.setProperty('--theme-secondary-dark', `rgb(${darkerR}, ${darkerG}, ${darkerB})`);
  }

  if (fontFamily) {
    root.style.setProperty('--theme-font-family', fontFamily);
  }

  if (fontSizeBase) {
    root.style.setProperty('--theme-font-size-base', `${fontSizeBase}px`);
  }
};

// Helper to apply PWA branding
const applyPwaBranding = (logoPath: string, appName: string, versionToken?: string) => {
  const safeName = (appName || DEFAULTS.PWA_APP_NAME).trim() || DEFAULTS.PWA_APP_NAME;
  const iconUrl = getImageUrl(logoPath) || '/logo-robo.png';
  const cacheBustedIcon = `${iconUrl}${iconUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(versionToken || Date.now().toString())}`;
  const baseURL = SmartAPIManager.getBackendBaseURL();
  const manifestUrl = `${baseURL}/api/theme/manifest.json?v=${encodeURIComponent(versionToken || Date.now().toString())}`;

  const setLink = (rel: string, href: string, sizes?: string) => {
    const selector = sizes ? `link[rel="${rel}"][sizes="${sizes}"]` : `link[rel="${rel}"]:not([sizes])`;
    let link = document.head.querySelector(selector) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      if (sizes) link.sizes = sizes;
      document.head.appendChild(link);
    }
    link.href = href;
  };

  setLink('manifest', manifestUrl);
  setLink('icon', cacheBustedIcon);
  setLink('icon', cacheBustedIcon, '16x16');
  setLink('icon', cacheBustedIcon, '32x32');
  setLink('icon', cacheBustedIcon, '192x192');
  setLink('icon', cacheBustedIcon, '512x512');
  setLink('apple-touch-icon', cacheBustedIcon);
  setLink('apple-touch-icon', cacheBustedIcon, '180x180');
  setLink('apple-touch-icon', cacheBustedIcon, '192x192');
  setLink('apple-touch-icon', cacheBustedIcon, '512x512');

  let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;
  if (!appleTitleMeta) {
    appleTitleMeta = document.createElement('meta');
    appleTitleMeta.setAttribute('name', 'apple-mobile-web-app-title');
    document.head.appendChild(appleTitleMeta);
  }
  appleTitleMeta.setAttribute('content', safeName);
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  // State definitions
  const [primaryColor, setPrimaryColor] = useState<string>(DEFAULTS.PRIMARY);
  const [secondaryColor, setSecondaryColor] = useState<string>(DEFAULTS.SECONDARY);
  const [livePurchaseStatementEnabled, setLivePurchaseStatementEnabled] = useState<boolean>(DEFAULTS.LIVE_PURCHASE_ENABLED);
  const [topUpCategoriesEnabled, setTopUpCategoriesEnabled] = useState<boolean>(DEFAULTS.TOP_UP_CATEGORIES_ENABLED);
  const [topUpCategoriesBadge, setTopUpCategoriesBadge] = useState<string>(DEFAULTS.TOP_UP_BADGE);
  const [topUpCategoriesHeading, setTopUpCategoriesHeading] = useState<string>(DEFAULTS.TOP_UP_HEADING);
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState<boolean>(DEFAULTS.SUBSCRIPTIONS_ENABLED);
  const [subscriptionsBadge, setSubscriptionsBadge] = useState<string>(DEFAULTS.SUBSCRIPTIONS_BADGE);
  const [subscriptionsHeading, setSubscriptionsHeading] = useState<string>(DEFAULTS.SUBSCRIPTIONS_HEADING);
  const [reviewSectionEnabled, setReviewSectionEnabled] = useState<boolean>(DEFAULTS.REVIEW_SECTION_ENABLED);
  const [navbarLogoUrl, setNavbarLogoUrl] = useState<string>('');
  const [fontFamily, setFontFamily] = useState<string>(DEFAULTS.FONT_FAMILY);
  const [fontSizeBase, setFontSizeBase] = useState<number>(DEFAULTS.FONT_SIZE_BASE);
  const [navbarSearchPlaceholder, setNavbarSearchPlaceholder] = useState<string>(DEFAULTS.NAVBAR_SEARCH_PLACEHOLDER);
  const [navbarSearchEnabled, setNavbarSearchEnabled] = useState<boolean>(DEFAULTS.NAVBAR_SEARCH_ENABLED);
  const [supportWhatsAppUrl, setSupportWhatsAppUrl] = useState<string>('');
  const [supportMessengerUrl, setSupportMessengerUrl] = useState<string>('');
  const [supportTelegramUrl, setSupportTelegramUrl] = useState<string>('');
  const [uddoktaBaseUrl, setUddoktaBaseUrl] = useState<string>('');
  const [uddoktaConfigured, setUddoktaConfigured] = useState<boolean>(false);
  const [uddoktaGatewayConfig, setUddoktaGatewayConfig] = useState({
    baseUrl: '',
    checkoutPath: '',
    checkoutV2Path: '',
    verifyPath: '',
    refundPath: '',
    apiKeyHeader: '',
  });
  const [sweetnoteEnabled, setSweetnoteEnabled] = useState<boolean>(DEFAULTS.SWEETNOTE_ENABLED);
  const [sweetnoteImageUrl, setSweetnoteImageUrl] = useState<string>('');
  const [sweetnoteHeading, setSweetnoteHeading] = useState<string>('');
  const [sweetnoteText, setSweetnoteText] = useState<string>('');
  const [sweetnoteButtonText, setSweetnoteButtonText] = useState<string>(DEFAULTS.SWEETNOTE_BUTTON_TEXT);
  const [sweetnoteButtonUrl, setSweetnoteButtonUrl] = useState<string>('');
  const [pwaAppName, setPwaAppName] = useState<string>(DEFAULTS.PWA_APP_NAME);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Ref to prevent multiple simultaneous loads
  const isLoadingRef = useRef(false);

  // Apply default theme on mount
  useEffect(() => {
    applyThemeVariables(DEFAULTS.PRIMARY, DEFAULTS.SECONDARY, DEFAULTS.FONT_FAMILY, DEFAULTS.FONT_SIZE_BASE);
  }, []);

  // Load theme from API
  const loadTheme = useCallback(async () => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      const response = await themeApi.get();

      if (response.success && response.data) {
        const data = response.data;

        // Update all states at once
        setPrimaryColor(data.primaryColor || DEFAULTS.PRIMARY);
        setSecondaryColor(data.secondaryColor || DEFAULTS.SECONDARY);
        setLivePurchaseStatementEnabled(data.livePurchaseStatementEnabled ?? DEFAULTS.LIVE_PURCHASE_ENABLED);
        setTopUpCategoriesEnabled(data.topUpCategoriesEnabled ?? DEFAULTS.TOP_UP_CATEGORIES_ENABLED);
        setTopUpCategoriesBadge(data.topUpCategoriesBadge || DEFAULTS.TOP_UP_BADGE);
        setTopUpCategoriesHeading(data.topUpCategoriesHeading || DEFAULTS.TOP_UP_HEADING);
        setSubscriptionsEnabled(data.subscriptionsEnabled ?? DEFAULTS.SUBSCRIPTIONS_ENABLED);
        setSubscriptionsBadge(data.subscriptionsBadge || DEFAULTS.SUBSCRIPTIONS_BADGE);
        setSubscriptionsHeading(data.subscriptionsHeading || DEFAULTS.SUBSCRIPTIONS_HEADING);
        setReviewSectionEnabled(data.reviewSectionEnabled ?? DEFAULTS.REVIEW_SECTION_ENABLED);
        setNavbarLogoUrl(data.navbarLogoUrl || '');
        setFontFamily(data.fontFamily ?? DEFAULTS.FONT_FAMILY);
        setFontSizeBase(data.fontSizeBase ?? DEFAULTS.FONT_SIZE_BASE);
        setNavbarSearchPlaceholder(data.navbarSearchPlaceholder ?? DEFAULTS.NAVBAR_SEARCH_PLACEHOLDER);
        setNavbarSearchEnabled(data.navbarSearchEnabled ?? DEFAULTS.NAVBAR_SEARCH_ENABLED);
        setSupportWhatsAppUrl(data.supportWhatsAppUrl || '');
        setSupportMessengerUrl(data.supportMessengerUrl || '');
        setSupportTelegramUrl(data.supportTelegramUrl || '');
        setUddoktaBaseUrl(data.uddoktaBaseUrl || '');
        setUddoktaConfigured(data.uddoktaConfigured || false);
        setUddoktaGatewayConfig({
          baseUrl: data.uddoktaGatewayConfig?.baseUrl || '',
          checkoutPath: data.uddoktaGatewayConfig?.checkoutPath || '',
          checkoutV2Path: data.uddoktaGatewayConfig?.checkoutV2Path || '',
          verifyPath: data.uddoktaGatewayConfig?.verifyPath || '',
          refundPath: data.uddoktaGatewayConfig?.refundPath || '',
          apiKeyHeader: data.uddoktaGatewayConfig?.apiKeyHeader || '',
        });
        setSweetnoteEnabled(data.sweetnoteEnabled === true);
        setSweetnoteImageUrl(data.sweetnoteImageUrl || '');
        setSweetnoteHeading(data.sweetnoteHeading || '');
        setSweetnoteText(data.sweetnoteText || '');
        setSweetnoteButtonText(data.sweetnoteButtonText || DEFAULTS.SWEETNOTE_BUTTON_TEXT);
        setSweetnoteButtonUrl(data.sweetnoteButtonUrl || '');
        setPwaAppName(data.pwaAppName || DEFAULTS.PWA_APP_NAME);

        // Apply theme and PWA branding
        applyThemeVariables(
          data.primaryColor || DEFAULTS.PRIMARY,
          data.secondaryColor || DEFAULTS.SECONDARY,
          data.fontFamily || DEFAULTS.FONT_FAMILY,
          data.fontSizeBase || DEFAULTS.FONT_SIZE_BASE
        );

        applyPwaBranding(
          data.navbarLogoUrl || '',
          data.pwaAppName || DEFAULTS.PWA_APP_NAME,
          data.updatedAt
        );
      } else {
        console.warn('⚠️ Theme API returned unsuccessful response, using defaults');
      }
    } catch (error: any) {
      console.error('❌ Error loading theme:', error.message);
    } finally {
      setIsLoaded(true);
      isLoadingRef.current = false;
    }
  }, []);

  // Update theme function
  const updateTheme = useCallback(async (primary: string, secondary: string, options: UpdateThemeOptions = {}) => {
    try {
      const response = await themeApi.update({
        primaryColor: primary,
        secondaryColor: secondary,
        ...options,
        updatedBy: options.updatedBy || 'admin'
      });

      if (response.success && response.data) {
        const data = response.data;

        // Update all states
        setPrimaryColor(data.primaryColor || primary);
        setSecondaryColor(data.secondaryColor || secondary);
        setLivePurchaseStatementEnabled(data.livePurchaseStatementEnabled ?? options.livePurchaseStatementEnabled ?? livePurchaseStatementEnabled);
        setTopUpCategoriesEnabled(data.topUpCategoriesEnabled ?? options.topUpCategoriesEnabled ?? topUpCategoriesEnabled);
        setTopUpCategoriesBadge(data.topUpCategoriesBadge || options.topUpCategoriesBadge || topUpCategoriesBadge);
        setTopUpCategoriesHeading(data.topUpCategoriesHeading || options.topUpCategoriesHeading || topUpCategoriesHeading);
        setSubscriptionsEnabled(data.subscriptionsEnabled ?? options.subscriptionsEnabled ?? subscriptionsEnabled);
        setSubscriptionsBadge(data.subscriptionsBadge || options.subscriptionsBadge || subscriptionsBadge);
        setSubscriptionsHeading(data.subscriptionsHeading || options.subscriptionsHeading || subscriptionsHeading);
        setReviewSectionEnabled(data.reviewSectionEnabled ?? options.reviewSectionEnabled ?? reviewSectionEnabled);
        setNavbarLogoUrl(data.navbarLogoUrl ?? options.navbarLogoUrl ?? navbarLogoUrl);
        setFontFamily(data.fontFamily ?? options.fontFamily ?? fontFamily);
        setFontSizeBase(data.fontSizeBase ?? options.fontSizeBase ?? fontSizeBase);
        setNavbarSearchPlaceholder(data.navbarSearchPlaceholder ?? options.navbarSearchPlaceholder ?? navbarSearchPlaceholder);
        setNavbarSearchEnabled(data.navbarSearchEnabled ?? options.navbarSearchEnabled ?? navbarSearchEnabled);
        setSupportWhatsAppUrl(data.supportWhatsAppUrl ?? options.supportWhatsAppUrl ?? supportWhatsAppUrl);
        setSupportMessengerUrl(data.supportMessengerUrl ?? options.supportMessengerUrl ?? supportMessengerUrl);
        setSupportTelegramUrl(data.supportTelegramUrl ?? options.supportTelegramUrl ?? supportTelegramUrl);
        setUddoktaBaseUrl(data.uddoktaBaseUrl ?? options.uddoktaBaseUrl ?? uddoktaBaseUrl);
        setUddoktaConfigured(data.uddoktaConfigured ?? uddoktaConfigured);
        setUddoktaGatewayConfig({
          baseUrl: data.uddoktaGatewayConfig?.baseUrl ?? options.uddoktaGatewayConfig?.baseUrl ?? uddoktaGatewayConfig.baseUrl,
          checkoutPath: data.uddoktaGatewayConfig?.checkoutPath ?? options.uddoktaGatewayConfig?.checkoutPath ?? uddoktaGatewayConfig.checkoutPath,
          checkoutV2Path: data.uddoktaGatewayConfig?.checkoutV2Path ?? options.uddoktaGatewayConfig?.checkoutV2Path ?? uddoktaGatewayConfig.checkoutV2Path,
          verifyPath: data.uddoktaGatewayConfig?.verifyPath ?? options.uddoktaGatewayConfig?.verifyPath ?? uddoktaGatewayConfig.verifyPath,
          refundPath: data.uddoktaGatewayConfig?.refundPath ?? options.uddoktaGatewayConfig?.refundPath ?? uddoktaGatewayConfig.refundPath,
          apiKeyHeader: data.uddoktaGatewayConfig?.apiKeyHeader ?? options.uddoktaGatewayConfig?.apiKeyHeader ?? uddoktaGatewayConfig.apiKeyHeader,
        });
        setSweetnoteEnabled(data.sweetnoteEnabled === true);
        setSweetnoteImageUrl(data.sweetnoteImageUrl ?? options.sweetnoteImageUrl ?? sweetnoteImageUrl);
        setSweetnoteHeading(data.sweetnoteHeading ?? options.sweetnoteHeading ?? sweetnoteHeading);
        setSweetnoteText(data.sweetnoteText ?? options.sweetnoteText ?? sweetnoteText);
        setSweetnoteButtonText(data.sweetnoteButtonText ?? options.sweetnoteButtonText ?? sweetnoteButtonText);
        setSweetnoteButtonUrl(data.sweetnoteButtonUrl ?? options.sweetnoteButtonUrl ?? sweetnoteButtonUrl);
        setPwaAppName(data.pwaAppName ?? options.pwaAppName ?? pwaAppName);

        // Apply theme and PWA branding
        applyThemeVariables(
          data.primaryColor || primary,
          data.secondaryColor || secondary,
          data.fontFamily || options.fontFamily || fontFamily,
          data.fontSizeBase || options.fontSizeBase || fontSizeBase
        );

        applyPwaBranding(
          data.navbarLogoUrl || options.navbarLogoUrl || navbarLogoUrl,
          data.pwaAppName || options.pwaAppName || pwaAppName,
          data.updatedAt
        );

        // Notify other tabs
        if (typeof BroadcastChannel !== 'undefined') {
          new BroadcastChannel(THEME_CHANNEL).postMessage('updated');
        }
      } else {
        throw new Error(response.message || 'Failed to update theme');
      }
    } catch (error: any) {
      console.error('❌ Error updating theme:', error.message);
      throw error;
    }
  }, [
    livePurchaseStatementEnabled, topUpCategoriesEnabled, topUpCategoriesBadge, topUpCategoriesHeading,
    subscriptionsEnabled, subscriptionsBadge, subscriptionsHeading, reviewSectionEnabled,
    navbarLogoUrl, fontFamily, fontSizeBase, navbarSearchPlaceholder, navbarSearchEnabled,
    supportWhatsAppUrl, supportMessengerUrl, supportTelegramUrl, uddoktaBaseUrl,
    uddoktaConfigured, uddoktaGatewayConfig, sweetnoteEnabled, sweetnoteImageUrl,
    sweetnoteHeading, sweetnoteText, sweetnoteButtonText, sweetnoteButtonUrl, pwaAppName
  ]);

  // Load theme on mount and set up listeners
  useEffect(() => {
    loadTheme();

    // Broadcast channel for cross-tab sync
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(THEME_CHANNEL);
      channel.onmessage = () => loadTheme();
    }

    // Visibility change handler
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadTheme();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Polling as fallback (every 30 seconds instead of 5)
    const pollInterval = setInterval(loadTheme, 30000);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      channel?.close();
    };
  }, [loadTheme]);

  return (
    <ThemeContext.Provider
      value={{
        primaryColor,
        secondaryColor,
        livePurchaseStatementEnabled,
        topUpCategoriesEnabled,
        topUpCategoriesBadge,
        topUpCategoriesHeading,
        subscriptionsEnabled,
        subscriptionsBadge,
        subscriptionsHeading,
        reviewSectionEnabled,
        navbarLogoUrl,
        fontFamily,
        fontSizeBase,
        navbarSearchPlaceholder,
        navbarSearchEnabled,
        supportWhatsAppUrl,
        supportMessengerUrl,
        supportTelegramUrl,
        uddoktaBaseUrl,
        uddoktaConfigured,
        uddoktaGatewayConfig,
        sweetnoteEnabled,
        sweetnoteImageUrl,
        sweetnoteHeading,
        sweetnoteText,
        sweetnoteButtonText,
        sweetnoteButtonUrl,
        pwaAppName,
        isLoaded,
        updateTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}