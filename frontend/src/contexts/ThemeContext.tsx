import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { themeApi } from '../services/api';

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  livePurchaseStatementEnabled: boolean;
  topUpCategoriesEnabled: boolean;
  digitalCodesEnabled: boolean;
  topUpCategoriesBadge: string;
  topUpCategoriesHeading: string;
  digitalCodesBadge: string;
  digitalCodesHeading: string;
  subscriptionsEnabled: boolean;
  subscriptionsBadge: string;
  subscriptionsHeading: string;
  navbarLogoUrl: string;
  fontFamily: string;
  fontSizeBase: number;
  navbarSearchPlaceholder: string;
  navbarSearchEnabled: boolean;
  supportWhatsAppUrl: string;
  supportMessengerUrl: string;
  supportTelegramUrl: string;
  isLoaded: boolean;
  updateTheme: (primaryColor: string, secondaryColor: string, updatedBy?: string, livePurchaseStatementEnabled?: boolean, topUpCategoriesEnabled?: boolean, digitalCodesEnabled?: boolean, topUpCategoriesBadge?: string, topUpCategoriesHeading?: string, digitalCodesBadge?: string, digitalCodesHeading?: string, subscriptionsEnabled?: boolean, subscriptionsBadge?: string, subscriptionsHeading?: string, navbarLogoUrl?: string, fontFamily?: string, fontSizeBase?: number, navbarSearchPlaceholder?: string, navbarSearchEnabled?: boolean, supportWhatsAppUrl?: string, supportMessengerUrl?: string, supportTelegramUrl?: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default colors (red theme #F05656)
const DEFAULT_PRIMARY = '#F05656';
const DEFAULT_SECONDARY = '#e04a4a';
const DEFAULT_TOP_UP_BADGE = 'Top-up categories';
const DEFAULT_TOP_UP_HEADING = 'Browse Categories';
const DEFAULT_DIGITAL_CODES_BADGE = 'Digital Codes';
const DEFAULT_DIGITAL_CODES_HEADING = 'Digital Codes Categories';
const DEFAULT_SUBSCRIPTIONS_BADGE = 'Subscriptions';
const DEFAULT_SUBSCRIPTIONS_HEADING = 'Subscription Plans';
const DEFAULT_FONT_FAMILY = 'Plus Jakarta Sans';
const DEFAULT_FONT_SIZE_BASE = 16;
const DEFAULT_NAVBAR_SEARCH_PLACEHOLDER = 'Search games...';
const DEFAULT_NAVBAR_SEARCH_ENABLED = true;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_PRIMARY);
  const [secondaryColor, setSecondaryColor] = useState<string>(DEFAULT_SECONDARY);
  const [livePurchaseStatementEnabled, setLivePurchaseStatementEnabled] = useState<boolean>(true);
  const [topUpCategoriesEnabled, setTopUpCategoriesEnabled] = useState<boolean>(true);
  const [digitalCodesEnabled, setDigitalCodesEnabled] = useState<boolean>(true);
  const [topUpCategoriesBadge, setTopUpCategoriesBadge] = useState<string>(DEFAULT_TOP_UP_BADGE);
  const [topUpCategoriesHeading, setTopUpCategoriesHeading] = useState<string>(DEFAULT_TOP_UP_HEADING);
  const [digitalCodesBadge, setDigitalCodesBadge] = useState<string>(DEFAULT_DIGITAL_CODES_BADGE);
  const [digitalCodesHeading, setDigitalCodesHeading] = useState<string>(DEFAULT_DIGITAL_CODES_HEADING);
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState<boolean>(true);
  const [subscriptionsBadge, setSubscriptionsBadge] = useState<string>(DEFAULT_SUBSCRIPTIONS_BADGE);
  const [subscriptionsHeading, setSubscriptionsHeading] = useState<string>(DEFAULT_SUBSCRIPTIONS_HEADING);
  const [navbarLogoUrl, setNavbarLogoUrl] = useState<string>('');
  const [fontFamily, setFontFamily] = useState<string>(DEFAULT_FONT_FAMILY);
  const [fontSizeBase, setFontSizeBase] = useState<number>(DEFAULT_FONT_SIZE_BASE);
  const [navbarSearchPlaceholder, setNavbarSearchPlaceholder] = useState<string>(DEFAULT_NAVBAR_SEARCH_PLACEHOLDER);
  const [navbarSearchEnabled, setNavbarSearchEnabled] = useState<boolean>(DEFAULT_NAVBAR_SEARCH_ENABLED);
  const [supportWhatsAppUrl, setSupportWhatsAppUrl] = useState<string>('');
  const [supportMessengerUrl, setSupportMessengerUrl] = useState<string>('');
  const [supportTelegramUrl, setSupportTelegramUrl] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Apply CSS variables to root element (colors + typography)
  const applyTheme = (primary: string, secondary: string, font?: string, fontSize?: number) => {
    const root = document.documentElement;
    
    // Convert hex to RGB for rgba usage
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

    const primaryRgb = hexToRgb(primary);
    const secondaryRgb = hexToRgb(secondary);

    // Set CSS variables
    root.style.setProperty('--theme-primary', primary);
    root.style.setProperty('--theme-secondary', secondary);
    
    if (primaryRgb) {
      root.style.setProperty('--theme-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
      root.style.setProperty('--theme-primary-light', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.14)`);
      root.style.setProperty('--theme-primary-dark', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.8)`);
      root.style.setProperty('--theme-primary-hover', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.9)`);
    }
    
    if (secondaryRgb) {
      root.style.setProperty('--theme-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
    }

    // Calculate darker shade for secondary
    if (secondaryRgb) {
      const darkerR = Math.max(0, secondaryRgb.r - 20);
      const darkerG = Math.max(0, secondaryRgb.g - 20);
      const darkerB = Math.max(0, secondaryRgb.b - 20);
      root.style.setProperty('--theme-secondary-dark', `rgb(${darkerR}, ${darkerG}, ${darkerB})`);
    }

    // Typography (use passed args when provided, else current state)
    const fontVal = font !== undefined ? font : fontFamily;
    const fontSizeVal = fontSize !== undefined ? fontSize : fontSizeBase;
    root.style.setProperty('--theme-font-family', fontVal);
    root.style.setProperty('--theme-font-size-base', `${fontSizeVal}px`);
  };

  // Apply default theme immediately on mount (before API loads)
  useEffect(() => {
    applyTheme(DEFAULT_PRIMARY, DEFAULT_SECONDARY, DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE_BASE);
  }, []);

  // Load theme from MongoDB backend
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const response = await themeApi.get();
        if (response.success && response.data) {
          const primary = response.data.primaryColor || DEFAULT_PRIMARY;
          const secondary = response.data.secondaryColor || DEFAULT_SECONDARY;
          const livePurchaseEnabled = response.data.livePurchaseStatementEnabled !== undefined ? response.data.livePurchaseStatementEnabled : true;
          const topUpCategoriesEnabled = response.data.topUpCategoriesEnabled !== undefined ? response.data.topUpCategoriesEnabled : true;
          const digitalCodesEnabled = response.data.digitalCodesEnabled !== undefined ? response.data.digitalCodesEnabled : true;
          const topUpBadge = response.data.topUpCategoriesBadge || DEFAULT_TOP_UP_BADGE;
          const topUpHeading = response.data.topUpCategoriesHeading || DEFAULT_TOP_UP_HEADING;
          const digitalCodesBadgeValue = response.data.digitalCodesBadge || DEFAULT_DIGITAL_CODES_BADGE;
          const digitalCodesHeadingValue = response.data.digitalCodesHeading || DEFAULT_DIGITAL_CODES_HEADING;
          const subscriptionsEnabledValue = response.data.subscriptionsEnabled !== undefined ? response.data.subscriptionsEnabled : true;
          const subscriptionsBadgeValue = response.data.subscriptionsBadge || DEFAULT_SUBSCRIPTIONS_BADGE;
          const subscriptionsHeadingValue = response.data.subscriptionsHeading || DEFAULT_SUBSCRIPTIONS_HEADING;
          const navbarLogoUrlValue = response.data.navbarLogoUrl || '';
          const fontFamilyValue = response.data.fontFamily ?? DEFAULT_FONT_FAMILY;
          const fontSizeBaseValue = response.data.fontSizeBase ?? DEFAULT_FONT_SIZE_BASE;
          const navbarSearchPlaceholderValue = response.data.navbarSearchPlaceholder ?? DEFAULT_NAVBAR_SEARCH_PLACEHOLDER;
          const navbarSearchEnabledValue = response.data.navbarSearchEnabled ?? DEFAULT_NAVBAR_SEARCH_ENABLED;
          const supportWhatsAppUrlValue = response.data.supportWhatsAppUrl ?? '';
          const supportMessengerUrlValue = response.data.supportMessengerUrl ?? '';
          const supportTelegramUrlValue = response.data.supportTelegramUrl ?? '';

          setPrimaryColor(primary);
          setSecondaryColor(secondary);
          setLivePurchaseStatementEnabled(livePurchaseEnabled);
          setTopUpCategoriesEnabled(topUpCategoriesEnabled);
          setDigitalCodesEnabled(digitalCodesEnabled);
          setTopUpCategoriesBadge(topUpBadge);
          setTopUpCategoriesHeading(topUpHeading);
          setDigitalCodesBadge(digitalCodesBadgeValue);
          setDigitalCodesHeading(digitalCodesHeadingValue);
          setSubscriptionsEnabled(subscriptionsEnabledValue);
          setSubscriptionsBadge(subscriptionsBadgeValue);
          setSubscriptionsHeading(subscriptionsHeadingValue);
          setNavbarLogoUrl(navbarLogoUrlValue);
          setFontFamily(fontFamilyValue);
          setFontSizeBase(fontSizeBaseValue);
          setNavbarSearchPlaceholder(navbarSearchPlaceholderValue);
          setNavbarSearchEnabled(navbarSearchEnabledValue);
          setSupportWhatsAppUrl(supportWhatsAppUrlValue);
          setSupportMessengerUrl(supportMessengerUrlValue);
          setSupportTelegramUrl(supportTelegramUrlValue);
          applyTheme(primary, secondary, fontFamilyValue, fontSizeBaseValue);
        } else {
          console.warn('⚠️ Theme API returned unsuccessful response, using defaults:', response.message);
          // No theme settings found, use defaults
          setPrimaryColor(DEFAULT_PRIMARY);
          setSecondaryColor(DEFAULT_SECONDARY);
          applyTheme(DEFAULT_PRIMARY, DEFAULT_SECONDARY);
        }
        setIsLoaded(true);
      } catch (error: any) {
        console.error('❌ Error loading theme from MongoDB:', {
          message: error.message,
          error: error
        });
        // Fallback to defaults on error
        setPrimaryColor(DEFAULT_PRIMARY);
        setSecondaryColor(DEFAULT_SECONDARY);
        applyTheme(DEFAULT_PRIMARY, DEFAULT_SECONDARY);
        setIsLoaded(true);
      }
    };

    // Load theme immediately
    loadTheme();

    // Poll for theme changes every 30 seconds (since we don't have real-time updates)
    const pollInterval = setInterval(() => {
      loadTheme();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  // Update theme function
  const updateTheme = async (primary: string, secondary: string, updatedBy?: string, livePurchaseEnabled?: boolean, topUpCategoriesEnabled?: boolean, digitalCodesEnabled?: boolean, topUpCategoriesBadgeValue?: string, topUpCategoriesHeadingValue?: string, digitalCodesBadgeValue?: string, digitalCodesHeadingValue?: string, subscriptionsEnabledValue?: boolean, subscriptionsBadgeValue?: string, subscriptionsHeadingValue?: string, navbarLogoUrlValue?: string, fontFamilyValue?: string, fontSizeBaseValue?: number, navbarSearchPlaceholderValue?: string, navbarSearchEnabledValue?: boolean, supportWhatsAppUrlValue?: string, supportMessengerUrlValue?: string, supportTelegramUrlValue?: string) => {
    try {
      const response = await themeApi.update({
        primaryColor: primary,
        secondaryColor: secondary,
        livePurchaseStatementEnabled: livePurchaseEnabled,
        topUpCategoriesEnabled: topUpCategoriesEnabled,
        digitalCodesEnabled: digitalCodesEnabled,
        topUpCategoriesBadge: topUpCategoriesBadgeValue,
        topUpCategoriesHeading: topUpCategoriesHeadingValue,
        digitalCodesBadge: digitalCodesBadgeValue,
        digitalCodesHeading: digitalCodesHeadingValue,
        subscriptionsEnabled: subscriptionsEnabledValue,
        subscriptionsBadge: subscriptionsBadgeValue,
        subscriptionsHeading: subscriptionsHeadingValue,
        navbarLogoUrl: navbarLogoUrlValue,
        fontFamily: fontFamilyValue,
        fontSizeBase: fontSizeBaseValue,
        navbarSearchPlaceholder: navbarSearchPlaceholderValue,
        navbarSearchEnabled: navbarSearchEnabledValue,
        supportWhatsAppUrl: supportWhatsAppUrlValue,
        supportMessengerUrl: supportMessengerUrlValue,
        supportTelegramUrl: supportTelegramUrlValue,
        updatedBy: updatedBy || 'admin'
      });

      if (response.success && response.data) {
        const savedPrimary = response.data.primaryColor || primary;
        const savedSecondary = response.data.secondaryColor || secondary;
        const savedLivePurchaseEnabled = response.data.livePurchaseStatementEnabled !== undefined ? response.data.livePurchaseStatementEnabled : (livePurchaseEnabled !== undefined ? livePurchaseEnabled : true);
        const savedTopUpCategoriesEnabled = response.data.topUpCategoriesEnabled !== undefined ? response.data.topUpCategoriesEnabled : (topUpCategoriesEnabled !== undefined ? topUpCategoriesEnabled : true);
        const savedDigitalCodesEnabled = response.data.digitalCodesEnabled !== undefined ? response.data.digitalCodesEnabled : (digitalCodesEnabled !== undefined ? digitalCodesEnabled : true);
        const savedTopUpBadge = response.data.topUpCategoriesBadge || topUpCategoriesBadgeValue || DEFAULT_TOP_UP_BADGE;
        const savedTopUpHeading = response.data.topUpCategoriesHeading || topUpCategoriesHeadingValue || DEFAULT_TOP_UP_HEADING;
        const savedDigitalCodesBadge = response.data.digitalCodesBadge || digitalCodesBadgeValue || DEFAULT_DIGITAL_CODES_BADGE;
        const savedDigitalCodesHeading = response.data.digitalCodesHeading || digitalCodesHeadingValue || DEFAULT_DIGITAL_CODES_HEADING;
        const savedSubscriptionsEnabled = response.data.subscriptionsEnabled !== undefined ? response.data.subscriptionsEnabled : (subscriptionsEnabledValue !== undefined ? subscriptionsEnabledValue : true);
        const savedSubscriptionsBadge = response.data.subscriptionsBadge || subscriptionsBadgeValue || DEFAULT_SUBSCRIPTIONS_BADGE;
        const savedSubscriptionsHeading = response.data.subscriptionsHeading || subscriptionsHeadingValue || DEFAULT_SUBSCRIPTIONS_HEADING;
        const savedNavbarLogoUrl = response.data.navbarLogoUrl ?? navbarLogoUrlValue ?? '';
        const savedFontFamily = response.data.fontFamily ?? fontFamilyValue ?? fontFamily;
        const savedFontSizeBase = response.data.fontSizeBase ?? fontSizeBaseValue ?? fontSizeBase;
        const savedNavbarSearchPlaceholder = response.data.navbarSearchPlaceholder ?? navbarSearchPlaceholderValue ?? navbarSearchPlaceholder;
        const savedNavbarSearchEnabled = response.data.navbarSearchEnabled ?? navbarSearchEnabledValue ?? navbarSearchEnabled;
        const savedSupportWhatsAppUrl = response.data.supportWhatsAppUrl ?? supportWhatsAppUrlValue ?? supportWhatsAppUrl;
        const savedSupportMessengerUrl = response.data.supportMessengerUrl ?? supportMessengerUrlValue ?? supportMessengerUrl;
        const savedSupportTelegramUrl = response.data.supportTelegramUrl ?? supportTelegramUrlValue ?? supportTelegramUrl;

        setPrimaryColor(savedPrimary);
        setSecondaryColor(savedSecondary);
        setLivePurchaseStatementEnabled(savedLivePurchaseEnabled);
        setTopUpCategoriesEnabled(savedTopUpCategoriesEnabled);
        setDigitalCodesEnabled(savedDigitalCodesEnabled);
        setTopUpCategoriesBadge(savedTopUpBadge);
        setTopUpCategoriesHeading(savedTopUpHeading);
        setDigitalCodesBadge(savedDigitalCodesBadge);
        setDigitalCodesHeading(savedDigitalCodesHeading);
        setSubscriptionsEnabled(savedSubscriptionsEnabled);
        setSubscriptionsBadge(savedSubscriptionsBadge);
        setSubscriptionsHeading(savedSubscriptionsHeading);
        setNavbarLogoUrl(savedNavbarLogoUrl);
        setFontFamily(savedFontFamily);
        setFontSizeBase(savedFontSizeBase);
        setNavbarSearchPlaceholder(savedNavbarSearchPlaceholder);
        setNavbarSearchEnabled(savedNavbarSearchEnabled);
        setSupportWhatsAppUrl(savedSupportWhatsAppUrl);
        setSupportMessengerUrl(savedSupportMessengerUrl);
        setSupportTelegramUrl(savedSupportTelegramUrl);
        applyTheme(savedPrimary, savedSecondary, savedFontFamily, savedFontSizeBase);
      } else {
        const errorMessage = response.message || 'Failed to update theme';
        console.error('❌ Theme update failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Error updating theme:', {
        message: error.message,
        error: error
      });
      throw error;
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        primaryColor,
        secondaryColor,
        livePurchaseStatementEnabled,
        topUpCategoriesEnabled,
        digitalCodesEnabled,
        topUpCategoriesBadge,
        topUpCategoriesHeading,
        digitalCodesBadge,
        digitalCodesHeading,
        subscriptionsEnabled,
        subscriptionsBadge,
        subscriptionsHeading,
        navbarLogoUrl,
        fontFamily,
        fontSizeBase,
        navbarSearchPlaceholder,
        navbarSearchEnabled,
        supportWhatsAppUrl,
        supportMessengerUrl,
        supportTelegramUrl,
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
