import type { ApiResponse, BackendProduct, BackendCategory, BackendPurchase, BackendDeal, BackendBanner, BackendNotice, BackendGamePackage, BackendGamePackagePurchase, BackendDigitalCodeCategory, BackendDigitalCodeProduct, BackendDigitalCode, BackendDigitalCodePurchase, BackendSubscriptionCategory, BackendSubscriptionProduct, BackendSubscriptionPurchase, BackendMembershipPackage, BackendMembershipPurchase } from '../types';

// ==================== API MANAGER - Smart URL Detection ====================
class SmartAPIManager {
  // Get API base URL - uses environment variable for configuration
  static getBaseURL(): string {
    // Use environment variable if set, otherwise use production backend URL
    const backendUrl = import.meta.env.VITE_API_URL;
    
    // Remove trailing slash if present
    const cleanUrl = backendUrl.replace(/\/$/, '');
    
    return `${cleanUrl}/api`;
  }
  
  // Get API base URL (async for compatibility)
  static async getBaseURLAsync(): Promise<string> {
    return this.getBaseURL();
  }
  
  // Get API key from environment variable (optional for local development)
  static getApiKey(): string | null {
    const apiKey = import.meta.env.VITE_API_KEY;
    return apiKey || null;
  }
  
  // Simple fetch to backend with timeout and API key authentication
  static async smartFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const baseURL = this.getBaseURL();
    const url = `${baseURL}${path}`;
    
    // Get API key for authentication (optional)
    const apiKey = this.getApiKey();
    
    // console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);
    
    // Use provided signal or create new one with timeout
    let controller: AbortController | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let signalToUse: AbortSignal;
    
    if (options.signal) {
      // Use provided signal (already has timeout from caller)
      signalToUse = options.signal;
    } else {
      // Create new controller with default timeout
      controller = new AbortController();
      signalToUse = controller.signal;
      const timeout = 20000; // 20 seconds default
      timeoutId = setTimeout(() => {
        if (controller) {
          controller.abort();
          // console.warn('⏱️ Request timeout after 20 seconds');
        }
      }, timeout);
    }
    
    // Build headers - only include API key if provided
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };
    
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: signalToUse,
        headers
      });
      
      if (timeoutId) clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      throw error;
    }
  }
}

// ==================== API SERVICES ====================
// Products API with smart fetch
export const productApi = {
  getAll: async (userId?: string, userEmail?: string): Promise<ApiResponse<BackendProduct[]>> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    const queryString = params.toString();
    const url = queryString ? `/products?${queryString}` : '/products';
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },
  
  getById: async (id: string, userId?: string, userEmail?: string): Promise<ApiResponse<BackendProduct>> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    const queryString = params.toString();
    const url = queryString ? `/products/${id}?${queryString}` : `/products/${id}`;
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },
  
  getByCategory: async (categoryId: string, userId?: string, userEmail?: string): Promise<ApiResponse<BackendProduct[]>> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    const queryString = params.toString();
    const url = queryString ? `/products/category/${categoryId}?${queryString}` : `/products/category/${categoryId}`;
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },
  
  create: async (productData: Omit<BackendProduct, '_id'>): Promise<ApiResponse<BackendProduct>> => {
    const response = await SmartAPIManager.smartFetch('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    return response.json();
  },
  
  update: async (id: string, productData: Partial<BackendProduct>): Promise<ApiResponse<BackendProduct>> => {
    const response = await SmartAPIManager.smartFetch(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
    return response.json();
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch(`/products/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  }
};

// Categories API with smart fetch
export const categoryApi = {
  getAll: async (): Promise<ApiResponse<BackendCategory[]>> => {
    const response = await SmartAPIManager.smartFetch('/products/categories/all');
    return response.json();
  },
  
  getAllForAdmin: async (): Promise<ApiResponse<BackendCategory[]>> => {
    const response = await SmartAPIManager.smartFetch('/products/categories/admin');
    return response.json();
  },
  
  getCategories: async (): Promise<ApiResponse<BackendCategory[]>> => {
    const response = await SmartAPIManager.smartFetch('/products/categories');
    return response.json();
  },
  
  create: async (categoryData: Omit<BackendCategory, '_id'>): Promise<ApiResponse<BackendCategory>> => {
    const response = await SmartAPIManager.smartFetch('/products/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
    return response.json();
  },
  
  update: async (id: string, categoryData: Partial<BackendCategory>): Promise<ApiResponse<BackendCategory>> => {
    const response = await SmartAPIManager.smartFetch(`/products/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
    return response.json();
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch(`/products/categories/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },
};

// Deals API
export const dealApi = {
  getAll: async (): Promise<ApiResponse<BackendDeal[]>> => {
    const response = await SmartAPIManager.smartFetch('/products/deals');
    return response.json();
  },
  
  getById: async (id: string): Promise<ApiResponse<BackendDeal>> => {
    const response = await SmartAPIManager.smartFetch(`/products/deals/${id}`);
    return response.json();
  },
  
  create: async (dealData: Omit<BackendDeal, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<BackendDeal>> => {
    const response = await SmartAPIManager.smartFetch('/products/deals', {
      method: 'POST',
      body: JSON.stringify(dealData)
    });
    return response.json();
  },
  
  update: async (id: string, dealData: Partial<BackendDeal>): Promise<ApiResponse<BackendDeal>> => {
    const response = await SmartAPIManager.smartFetch(`/products/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dealData)
    });
    return response.json();
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch(`/products/deals/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },
};

// Banners API
export const bannerApi = {
  getAll: async (admin?: boolean): Promise<ApiResponse<BackendBanner[]>> => {
    const url = admin ? '/products/banners?admin=true' : '/products/banners';
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },
  
  getById: async (id: string): Promise<ApiResponse<BackendBanner>> => {
    const response = await SmartAPIManager.smartFetch(`/products/banners/${id}`);
    return response.json();
  },
  
  create: async (bannerData: Omit<BackendBanner, '_id' | 'createdAt'>): Promise<ApiResponse<BackendBanner>> => {
    const response = await SmartAPIManager.smartFetch('/products/banners', {
      method: 'POST',
      body: JSON.stringify(bannerData)
    });
    return response.json();
  },
  
  update: async (id: string, bannerData: Partial<BackendBanner>): Promise<ApiResponse<BackendBanner>> => {
    const response = await SmartAPIManager.smartFetch(`/products/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bannerData)
    });
    return response.json();
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch(`/products/banners/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },
};

// Notices API
export const noticeApi = {
  getAll: async (admin?: boolean): Promise<ApiResponse<BackendNotice[]>> => {
    const url = admin ? '/products/notices?admin=true' : '/products/notices';
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },
  
  getById: async (id: string): Promise<ApiResponse<BackendNotice>> => {
    const response = await SmartAPIManager.smartFetch(`/products/notices/${id}`);
    return response.json();
  },
  
  create: async (noticeData: Omit<BackendNotice, '_id' | 'createdAt'>): Promise<ApiResponse<BackendNotice>> => {
    const response = await SmartAPIManager.smartFetch('/products/notices', {
      method: 'POST',
      body: JSON.stringify(noticeData)
    });
    return response.json();
  },
  
  update: async (id: string, noticeData: Partial<BackendNotice>): Promise<ApiResponse<BackendNotice>> => {
    const response = await SmartAPIManager.smartFetch(`/products/notices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(noticeData)
    });
    return response.json();
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch(`/products/notices/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },
};

// ==================== Admin Roles API ====================

export type AdminModerationPermissions = {
  // Sidebar: Dashboard
  canAccessDashboard?: boolean;

  // Sidebar: Products & Categories
  canManageProducts?: boolean;

  // Sidebar: Banner Management
  canManageBanners?: boolean;

  // Sidebar: Notice Management
  canManageNotices?: boolean;

  // Sidebar: Game Packages / Game Zone related
  canManageGamePackages?: boolean;

  // Sidebar: User Management
  canManageUsers?: boolean;

  // Sidebar: Order History
  canManageOrders?: boolean;
};

export type AdminUserRole = {
  _id: string;
  userId?: string;
  userEmail: string;
  role: 'user' | 'moderator' | 'admin' | 'reseller';
  moderationPermissions?: AdminModerationPermissions;
};

export const adminRoleApi = {
  getAll: async (): Promise<ApiResponse<AdminUserRole[]>> => {
    const response = await SmartAPIManager.smartFetch('/admin/roles');
    const json = await response.json();
    if (json && Array.isArray(json.data)) {
      return { success: true, data: json.data } as ApiResponse<AdminUserRole[]>;
    }
    return json;
  },

  getForUser: async (params: {
    userId?: string | null;
    userEmail?: string | null;
  }): Promise<ApiResponse<AdminUserRole[]>> => {
    const searchParams = new URLSearchParams();
    if (params.userId) searchParams.append('userId', String(params.userId));
    if (params.userEmail) searchParams.append('userEmail', String(params.userEmail));

    const qs = searchParams.toString();
    const response = await SmartAPIManager.smartFetch(
      `/admin/roles${qs ? `?${qs}` : ''}`
    );
    const json = await response.json();
    return json;
  },

  upsert: async (payload: {
    userId?: string;
    userEmail: string;
    role: 'user' | 'moderator' | 'admin' | 'reseller';
    moderationPermissions?: AdminModerationPermissions;
  }): Promise<ApiResponse<AdminUserRole>> => {
    const response = await SmartAPIManager.smartFetch('/admin/roles', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return response.json();
  },
};

// Payments API with smart fetch
export const paymentApi = {
  verify: async (paymentData: {
    transactionId: string;
    amount: number;
    playerId: string;
    productId: string;
    productName?: string;
    diamonds?: string;
    price?: number;
    paymentMethod?: 'bkash' | 'robo';
    updatedBalance?: number; // For Robo Balance payments, send the remaining balance
    userEmail?: string; // User email for database tracking
    userName?: string; // User name for database tracking
    userId?: string; // User ID for database tracking
    timestamp?: string; // Timestamp for tracking
  }, options: RequestInit = {}): Promise<ApiResponse> => {
    try {
      // const baseURL = await SmartAPIManager.getBaseURL();
      // console.log('🌐 API Base URL:', baseURL);
      // console.log('🌐 API Endpoint: POST /payments/verify');
      // console.log('📦 Request Payload:', JSON.stringify(paymentData, null, 2));
      // console.log('🔑 Payment Method:', paymentData.paymentMethod);
      // console.log('💰 Updated Balance:', paymentData.updatedBalance);
      
      const response = await SmartAPIManager.smartFetch('/payments/verify', {
        method: 'POST',
        body: JSON.stringify(paymentData),
        ...options // Pass options including signal
      });
      
      // console.log('API Response status:', response.status);
      // console.log('API Response ok:', response.ok);
      
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          // console.error('API Error response:', errorText);
          // Try to parse as JSON
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) {
              errorMessage = errorJson.message;
            } else if (errorJson.error) {
              errorMessage = errorJson.error;
            }
          } catch {
            // If not JSON, use text
            errorMessage = errorText.substring(0, 200);
          }
        } catch (parseError) {
          // console.error('Failed to parse error response:', parseError);
        }
        return {
          success: false,
          message: errorMessage,
          data: null
        };
      }
      
      const jsonResponse = await response.json();
      // console.log('API JSON response:', jsonResponse);
      return jsonResponse;
    } catch (error: any) {
      // console.error('❌ API Call failed:', error);
      return {
        success: false,
        message: error.message || 'Network error. Please check your connection.',
        data: null
      };
    }
  },
  
  getStatus: async (transactionId: string): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch(`/payments/status/${transactionId}`);
    return response.json();
  },
  
  getAll: async (limit: number = 50, userId?: string): Promise<ApiResponse> => {
    const url = userId 
      ? `/payments/user/${userId}?limit=${limit}`
      : `/payments?limit=${limit}`;
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },

  getRecentPurchases: async (limit: number = 10): Promise<ApiResponse<BackendPurchase[]>> => {
    const response = await SmartAPIManager.smartFetch(`/payments/recent?limit=${limit}`);
    return response.json();
  },

  getUsernameByEmail: async (email: string): Promise<ApiResponse<{ email: string; username: string }>> => {
    const response = await SmartAPIManager.smartFetch(`/payments/user-by-email/${encodeURIComponent(email)}`);
    return response.json();
  },

  // Uddokta Pay checkout
  uddoktaCheckout: async (checkoutData: {
    amount: number;
    playerId: string;
    productId: string;
    productName?: string;
    diamonds?: string;
    price?: number;
    userEmail?: string;
    userName?: string;
    userId?: string;
    fullName?: string;
    email?: string;
    redirectUrl?: string;
    cancelUrl?: string;
  }): Promise<ApiResponse<{
    invoiceId: string;
    paymentUrl: string;
    transactionId: string;
    paymentId: string;
  }>> => {
    try {
      // console.log('🔄 Calling Uddokta Pay checkout API...', checkoutData);
      const response = await SmartAPIManager.smartFetch('/payments/uddokta/checkout', {
        method: 'POST',
        body: JSON.stringify(checkoutData)
      });
      
      // console.log('📥 Uddokta Pay API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        // console.error('❌ Uddokta Pay API error:', errorText);
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText.substring(0, 200);
        }
        return {
          success: false,
          message: errorMessage,
          data: undefined
        };
      }
      
      const jsonResponse = await response.json();
      // console.log('✅ Uddokta Pay API response:', jsonResponse);
      return jsonResponse;
    } catch (error: any) {
      // console.error('❌ Uddokta Pay checkout API call failed:', error);
      return {
        success: false,
        message: error.message || 'Network error. Please check your connection and try again.',
        data: undefined
      };
    }
  },

  // Uddokta Pay verify
  uddoktaVerify: async (invoiceId: string): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch('/payments/uddokta/verify', {
      method: 'POST',
      body: JSON.stringify({ invoice_id: invoiceId })
    });
    return response.json();
  }
};

// Balance Transactions API
export interface BalanceTransaction {
  _id?: string;
  userId: string;
  userEmail: string;
  transactionId: string;
  amount: number;
  status: 'pending' | 'verified' | 'rejected';
  description?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  verifiedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const balanceTransactionApi = {
  // Create a new balance transaction (pending verification)
  create: async (transactionData: {
    userId: string;
    userEmail: string;
    amount: number;
    transactionId: string;
    description?: string;
  }): Promise<ApiResponse<BalanceTransaction>> => {
    const response = await SmartAPIManager.smartFetch('/balance/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    });
    return response.json();
  },

  // Verify a transaction (adds amount to balance)
  verify: async (transactionId: string, verifiedBy?: string): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch(`/balance/transactions/${transactionId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ verifiedBy: verifiedBy || 'system' })
    });
    return response.json();
  },

  // Reject a transaction
  reject: async (transactionId: string, reason?: string): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch(`/balance/transactions/${transactionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return response.json();
  },

  // Get user's balance transactions
  getUserTransactions: async (userId: string, status?: string, limit: number = 50): Promise<ApiResponse<BalanceTransaction[]>> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    const response = await SmartAPIManager.smartFetch(`/balance/transactions/user/${userId}?${params.toString()}`);
    return response.json();
  },

  // Get a single transaction by ID
  getById: async (transactionId: string): Promise<ApiResponse<BalanceTransaction>> => {
    const response = await SmartAPIManager.smartFetch(`/balance/transactions/${transactionId}`);
    return response.json();
  },

  // Get all transactions (admin)
  getAll: async (status?: string, limit: number = 100): Promise<ApiResponse<BalanceTransaction[]>> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    const response = await SmartAPIManager.smartFetch(`/balance/transactions?${params.toString()}`);
    return response.json();
  }
};

// Purchases / Order History API
export const purchaseApi = {
  getUserPurchases: async (
    userId: string,
    limit: number = 50
  ): Promise<ApiResponse<BackendPurchase[]>> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    const response = await SmartAPIManager.smartFetch(
      `/balance/${userId}/purchases?${params.toString()}`
    );
    return response.json();
  },
};

// Balance API (for user balance)
export const balanceApi = {
  // Get user balance
  getUserBalance: async (userId: string): Promise<ApiResponse> => {
    try {
      const response = await SmartAPIManager.smartFetch(`/balance/${userId}`);
      // 404 is expected if user balance doesn't exist yet - return success: false gracefully
      if (response.status === 404) {
        return {
          success: false,
          message: 'User balance not found',
          data: null
        };
      }
      return response.json();
    } catch (error: any) {
      // Handle network errors gracefully
      return {
        success: false,
        message: error.message || 'Failed to fetch balance',
        data: null
      };
    }
  },

  // Get all user balances (admin)
  getAllBalances: async (): Promise<ApiResponse> => {
    try {
      const response = await SmartAPIManager.smartFetch('/balance');
      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch balances',
        data: null,
      };
    }
  },

  // Sync balance from Firestore
  sync: async (balanceData: {
    userId: string;
    userEmail: string;
    userName?: string;
    balance?: number;
    totalAdded?: number;
    totalSpent?: number;
  }): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch('/balance/sync', {
      method: 'POST',
      body: JSON.stringify(balanceData)
    });
    return response.json();
  },

  // Search emails for autocomplete
  searchEmails: async (query: string): Promise<ApiResponse<string[]>> => {
    const response = await SmartAPIManager.smartFetch(`/balance/search-emails?q=${encodeURIComponent(query)}`);
    return response.json();
  },
};

// Balance transfer API (P2P send money)
export const balanceTransferApi = {
  send: async (payload: {
    senderUserId: string;
    senderEmail: string;
    receiverEmail: string;
    amount: number;
    note?: string;
  }): Promise<ApiResponse<{ senderBalanceAfter: number }>> => {
    const response = await SmartAPIManager.smartFetch('/balance/transfer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.json();
  },
};

// Database seed (one-time use)
export const seedApi = {
  seedDatabase: async (): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch('/products/seed', {
      method: 'POST'
    });
    return response.json();
  }
};

// Game Packages API
export const gamePackageApi = {
  getAll: async (): Promise<ApiResponse<BackendGamePackage[]>> => {
    const response = await SmartAPIManager.smartFetch('/game-packages');
    return response.json();
  },
  
  getAllForAdmin: async (): Promise<ApiResponse<BackendGamePackage[]>> => {
    const response = await SmartAPIManager.smartFetch('/game-packages/admin');
    return response.json();
  },
  
  getById: async (id: string): Promise<ApiResponse<BackendGamePackage>> => {
    const response = await SmartAPIManager.smartFetch(`/game-packages/${id}`);
    return response.json();
  },
  
  create: async (packageData: Omit<BackendGamePackage, '_id' | 'createdAt' | 'updatedAt' | 'purchaseCount'>): Promise<ApiResponse<BackendGamePackage>> => {
    const response = await SmartAPIManager.smartFetch('/game-packages', {
      method: 'POST',
      body: JSON.stringify(packageData)
    });
    return response.json();
  },
  
  update: async (id: string, packageData: Partial<BackendGamePackage>): Promise<ApiResponse<BackendGamePackage>> => {
    const response = await SmartAPIManager.smartFetch(`/game-packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(packageData)
    });
    return response.json();
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch(`/game-packages/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },
  
  purchase: async (packageId: string, purchaseData: {
    userId: string;
    userEmail: string;
    userName?: string;
  }): Promise<ApiResponse<BackendGamePackagePurchase & { newBalance: number }>> => {
    const response = await SmartAPIManager.smartFetch(`/game-packages/${packageId}/purchase`, {
      method: 'POST',
      body: JSON.stringify(purchaseData)
    });
    return response.json();
  },
  
  getUserPurchases: async (userId: string): Promise<ApiResponse<BackendGamePackagePurchase[]>> => {
    const response = await SmartAPIManager.smartFetch(`/game-packages/purchases/user/${userId}`);
    return response.json();
  },
  
  getPurchaseCount: async (packageId: string): Promise<ApiResponse<{ packageId: string; purchaseCount: number }>> => {
    const response = await SmartAPIManager.smartFetch(`/game-packages/${packageId}/purchases`);
    return response.json();
  }
};

// Theme Settings API (using MongoDB backend)
export const themeApi = {
  get: async (): Promise<ApiResponse<{ primaryColor: string; secondaryColor: string; livePurchaseStatementEnabled?: boolean; topUpCategoriesEnabled?: boolean; digitalCodesEnabled?: boolean; topUpCategoriesBadge?: string; topUpCategoriesHeading?: string; digitalCodesBadge?: string; digitalCodesHeading?: string; subscriptionsEnabled?: boolean; subscriptionsBadge?: string; subscriptionsHeading?: string; updatedAt?: string; updatedBy?: string }>> => {
    try {
      const response = await SmartAPIManager.smartFetch('/theme');
      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch theme settings',
        data: undefined
      };
    }
  },
  
  update: async (themeData: { primaryColor: string; secondaryColor: string; livePurchaseStatementEnabled?: boolean; topUpCategoriesEnabled?: boolean; digitalCodesEnabled?: boolean; topUpCategoriesBadge?: string; topUpCategoriesHeading?: string; digitalCodesBadge?: string; digitalCodesHeading?: string; subscriptionsEnabled?: boolean; subscriptionsBadge?: string; subscriptionsHeading?: string; updatedBy?: string }): Promise<ApiResponse<{ primaryColor: string; secondaryColor: string; livePurchaseStatementEnabled?: boolean; topUpCategoriesEnabled?: boolean; digitalCodesEnabled?: boolean; topUpCategoriesBadge?: string; topUpCategoriesHeading?: string; digitalCodesBadge?: string; digitalCodesHeading?: string; subscriptionsEnabled?: boolean; subscriptionsBadge?: string; subscriptionsHeading?: string; updatedAt?: string; updatedBy?: string }>> => {
    try {
      const response = await SmartAPIManager.smartFetch('/theme', {
        method: 'PUT',
        body: JSON.stringify(themeData)
      });
      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update theme settings',
        data: undefined
      };
    }
  }
};

// Digital Codes API
export const digitalCodeApi = {
  // Categories
  getCategories: async (admin?: boolean): Promise<ApiResponse<BackendDigitalCodeCategory[]>> => {
    const url = admin ? '/digital-codes/categories/admin' : '/digital-codes/categories';
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },
  
  getCategoryById: async (id: string): Promise<ApiResponse<BackendDigitalCodeCategory>> => {
    const response = await SmartAPIManager.smartFetch(`/digital-codes/categories/${id}`);
    return response.json();
  },
  
  createCategory: async (categoryData: Omit<BackendDigitalCodeCategory, '_id'>): Promise<ApiResponse<BackendDigitalCodeCategory>> => {
    const response = await SmartAPIManager.smartFetch('/digital-codes/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
    return response.json();
  },
  
  updateCategory: async (id: string, categoryData: Partial<BackendDigitalCodeCategory>): Promise<ApiResponse<BackendDigitalCodeCategory>> => {
    const response = await SmartAPIManager.smartFetch(`/digital-codes/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
    return response.json();
  },
  
  deleteCategory: async (id: string): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch(`/digital-codes/categories/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },
  
  // Products
  getProducts: async (admin?: boolean, categoryId?: string, userId?: string, userEmail?: string): Promise<ApiResponse<BackendDigitalCodeProduct[]>> => {
    const params = new URLSearchParams();
    if (admin) params.append('admin', 'true');
    if (categoryId) params.append('categoryId', categoryId);
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    const url = `/digital-codes/products${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },
  
  getAllProductsForAdmin: async (): Promise<ApiResponse<BackendDigitalCodeProduct[]>> => {
    const response = await SmartAPIManager.smartFetch('/digital-codes/products/admin');
    return response.json();
  },
  
  getProductById: async (id: string, userId?: string, userEmail?: string): Promise<ApiResponse<BackendDigitalCodeProduct>> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    const queryString = params.toString();
    const url = queryString ? `/digital-codes/products/${id}?${queryString}` : `/digital-codes/products/${id}`;
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },
  
  createProduct: async (productData: Omit<BackendDigitalCodeProduct, '_id'>): Promise<ApiResponse<BackendDigitalCodeProduct>> => {
    const response = await SmartAPIManager.smartFetch('/digital-codes/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    return response.json();
  },
  
  updateProduct: async (id: string, productData: Partial<BackendDigitalCodeProduct>): Promise<ApiResponse<BackendDigitalCodeProduct>> => {
    const response = await SmartAPIManager.smartFetch(`/digital-codes/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
    return response.json();
  },
  
  deleteProduct: async (id: string): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch(`/digital-codes/products/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },
  
  // Codes
  getCodes: async (status?: 'active' | 'used', categoryId?: string, productId?: string, limit?: number): Promise<ApiResponse<BackendDigitalCode[]>> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (categoryId) params.append('categoryId', categoryId);
    if (productId) params.append('productId', productId);
    if (limit) params.append('limit', limit.toString());
    const url = `/digital-codes/codes${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },
  
  getCodeStats: async (categoryId?: string): Promise<ApiResponse<{ active: number; used: number; total: number }>> => {
    const url = categoryId 
      ? `/digital-codes/codes/stats?categoryId=${categoryId}`
      : '/digital-codes/codes/stats';
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },
  
  bulkUploadCodes: async (bulkText: string, categoryId: string, productId?: string): Promise<ApiResponse<{ inserted: number; skipped: number; codes: BackendDigitalCode[] }>> => {
    const response = await SmartAPIManager.smartFetch('/digital-codes/codes/bulk-upload', {
      method: 'POST',
      body: JSON.stringify({ bulkText, categoryId, productId })
    });
    return response.json();
  },
  
  addCode: async (codeData: { categoryId: string; productId?: string; code: string; prefix?: string }): Promise<ApiResponse<BackendDigitalCode>> => {
    const response = await SmartAPIManager.smartFetch('/digital-codes/codes', {
      method: 'POST',
      body: JSON.stringify(codeData)
    });
    return response.json();
  },
  
  deleteCode: async (serialNumber: string): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch(`/digital-codes/codes/${serialNumber}`, {
      method: 'DELETE'
    });
    return response.json();
  },
  
  // Purchases
  purchase: async (purchaseData: {
    productId: string;
    userId: string;
    userEmail: string;
    userName?: string;
    transactionId: string;
    inputFieldValues?: Record<string, string>;
  }): Promise<ApiResponse<{ purchase: BackendDigitalCodePurchase; code: string; prefix?: string }>> => {
    const response = await SmartAPIManager.smartFetch('/digital-codes/purchase', {
      method: 'POST',
      body: JSON.stringify(purchaseData)
    });
    return response.json();
  },
  
  getUserPurchases: async (userId: string, limit?: number): Promise<ApiResponse<BackendDigitalCodePurchase[]>> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    const url = `/digital-codes/purchases/user/${userId}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },
  
  getPurchaseByTransactionId: async (transactionId: string): Promise<ApiResponse<BackendDigitalCodePurchase>> => {
    const response = await SmartAPIManager.smartFetch(`/digital-codes/purchases/transaction/${transactionId}`);
    return response.json();
  },
  
  checkProductStock: async (productId: string): Promise<ApiResponse<{ available: number }>> => {
    const response = await SmartAPIManager.smartFetch(`/digital-codes/products/${productId}/stock`);
    return response.json();
  }
};

// Subscriptions API
export const subscriptionApi = {
  // Categories
  getCategories: async (admin?: boolean): Promise<ApiResponse<BackendSubscriptionCategory[]>> => {
    const url = admin ? '/subscriptions/categories/admin' : '/subscriptions/categories';
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },
  
  getCategoryById: async (id: string): Promise<ApiResponse<BackendSubscriptionCategory>> => {
    const response = await SmartAPIManager.smartFetch(`/subscriptions/categories/${id}`);
    return response.json();
  },
  
  createCategory: async (categoryData: Omit<BackendSubscriptionCategory, '_id'>): Promise<ApiResponse<BackendSubscriptionCategory>> => {
    const response = await SmartAPIManager.smartFetch('/subscriptions/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
    return response.json();
  },
  
  updateCategory: async (id: string, categoryData: Partial<BackendSubscriptionCategory>): Promise<ApiResponse<BackendSubscriptionCategory>> => {
    const response = await SmartAPIManager.smartFetch(`/subscriptions/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
    return response.json();
  },
  
  deleteCategory: async (id: string): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch(`/subscriptions/categories/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },
  
  // Products
  getProducts: async (admin?: boolean, categoryId?: string, userId?: string, userEmail?: string): Promise<ApiResponse<BackendSubscriptionProduct[]>> => {
    const params = new URLSearchParams();
    if (admin) params.append('admin', 'true');
    if (categoryId) params.append('categoryId', categoryId);
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    const url = `/subscriptions/products${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },
  
  getAllProductsForAdmin: async (): Promise<ApiResponse<BackendSubscriptionProduct[]>> => {
    const response = await SmartAPIManager.smartFetch('/subscriptions/products/admin');
    return response.json();
  },
  
  getProductsByCategory: async (categoryId: string, userId?: string, userEmail?: string): Promise<ApiResponse<BackendSubscriptionProduct[]>> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    const queryString = params.toString();
    const url = queryString ? `/subscriptions/products/category/${categoryId}?${queryString}` : `/subscriptions/products/category/${categoryId}`;
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },
  
  getProductById: async (id: string, userId?: string, userEmail?: string): Promise<ApiResponse<BackendSubscriptionProduct>> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    const queryString = params.toString();
    const url = queryString ? `/subscriptions/products/${id}?${queryString}` : `/subscriptions/products/${id}`;
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },
  
  createProduct: async (productData: Omit<BackendSubscriptionProduct, '_id'>): Promise<ApiResponse<BackendSubscriptionProduct>> => {
    const response = await SmartAPIManager.smartFetch('/subscriptions/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    return response.json();
  },
  
  updateProduct: async (id: string, productData: Partial<BackendSubscriptionProduct>): Promise<ApiResponse<BackendSubscriptionProduct>> => {
    const response = await SmartAPIManager.smartFetch(`/subscriptions/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
    return response.json();
  },
  
  deleteProduct: async (id: string): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch(`/subscriptions/products/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },
  
  // Purchases
  purchase: async (purchaseData: {
    productId: string;
    userId: string;
    userEmail: string;
    userName?: string;
    transactionId: string;
    inputFieldValues?: Record<string, string>;
  }): Promise<ApiResponse<BackendSubscriptionPurchase>> => {
    const response = await SmartAPIManager.smartFetch('/subscriptions/purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseData)
    });
    return response.json();
  },
  
  getPurchases: async (userId?: string, productId?: string): Promise<ApiResponse<BackendSubscriptionPurchase[]>> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (productId) params.append('productId', productId);
    const url = `/subscriptions/purchases${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  }
};

// Memberships API
export const membershipApi = {
  // User routes
  getPackages: async (): Promise<ApiResponse<BackendMembershipPackage[]>> => {
    try {
      const response = await SmartAPIManager.smartFetch('/memberships/packages');
      
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          return {
            success: false,
            message: errorJson.message || `Server error: ${response.status}`,
            data: undefined
          };
        } catch {
          return {
            success: false,
            message: errorText || `Server error: ${response.status}`,
            data: undefined
          };
        }
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        return {
          success: false,
          message: text || 'Invalid response format from server',
          data: undefined
        };
      }
      
      return response.json();
    } catch (error: any) {
      if (error.message && error.message.includes('timeout')) {
        return {
          success: false,
          message: 'Request timeout. Please check your connection and try again.',
          data: undefined
        };
      }
      if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        return {
          success: false,
          message: 'Network error. Please check your internet connection.',
          data: undefined
        };
      }
      return {
        success: false,
        message: error?.message || 'Failed to load membership packages. Please try again.',
        data: undefined
      };
    }
  },
  
  getMyMembership: async (userId?: string, userEmail?: string): Promise<ApiResponse<BackendMembershipPurchase | null | undefined>> => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (userEmail) params.append('userEmail', userEmail);
      const qs = params.toString();
      const url = `/memberships/my-membership${qs ? `?${qs}` : ''}`;
      const response = await SmartAPIManager.smartFetch(url);
      
      if (!response.ok) {
        // For my-membership, it's optional - return success with null data if not found
        if (response.status === 404) {
          return {
            success: true,
            message: 'No active membership found',
            data: null
          } as ApiResponse<BackendMembershipPurchase | null>;
        }
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          return {
            success: false,
            message: errorJson.message || `Server error: ${response.status}`,
            data: undefined
          };
        } catch {
          return {
            success: false,
            message: errorText || `Server error: ${response.status}`,
            data: undefined
          };
        }
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // For my-membership, if response is not JSON, assume no membership
        return {
          success: true,
          message: 'No active membership found',
          data: null
        } as ApiResponse<BackendMembershipPurchase | null>;
      }
      
      return response.json();
    } catch (error: any) {
      // For my-membership, network errors are not critical - return success with null
      if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        return {
          success: true,
          message: 'Unable to check membership status',
          data: null
        } as ApiResponse<BackendMembershipPurchase | null>;
      }
      return {
        success: true,
        message: 'Unable to check membership status',
        data: null
      } as ApiResponse<BackendMembershipPurchase | null>;
    }
  },
  
  purchaseMembership: async (packageId: string, userId: string, userEmail: string, userName?: string): Promise<ApiResponse<BackendMembershipPurchase>> => {
    try {
      const response = await SmartAPIManager.smartFetch('/memberships/purchase', {
        method: 'POST',
        body: JSON.stringify({ packageId, userId, userEmail, userName })
      });
      
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          return {
            success: false,
            message: errorJson.message || `Server error: ${response.status}`,
            data: undefined
          };
        } catch {
          return {
            success: false,
            message: errorText || `Server error: ${response.status}`,
            data: undefined
          };
        }
      }
      
      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        return {
          success: false,
          message: text || 'Invalid response format from server',
          data: undefined
        };
      }
      
      return response.json();
    } catch (error: any) {
      // Handle network errors
      if (error.message && error.message.includes('timeout')) {
        return {
          success: false,
          message: 'Request timeout. Please check your connection and try again.',
          data: undefined
        };
      }
      if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        return {
          success: false,
          message: 'Network error. Please check your internet connection.',
          data: undefined
        };
      }
      // Handle JSON parse errors
      if (error.message && error.message.includes('JSON')) {
        return {
          success: false,
          message: 'Invalid response from server. Please try again.',
          data: undefined
        };
      }
      return {
        success: false,
        message: error?.message || 'Failed to purchase membership. Please try again.',
        data: undefined
      };
    }
  },
  
  // Admin routes
  getAllPackages: async (userId?: string, userEmail?: string): Promise<ApiResponse<BackendMembershipPackage[]>> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    const qs = params.toString();
    const url = `/memberships/admin/packages${qs ? `?${qs}` : ''}`;
    const response = await SmartAPIManager.smartFetch(url);
    return response.json();
  },
  
  createPackage: async (data: {
    name: string;
    role?: 'reseller';
    durationDays: number;
    price: number;
    description?: string;
    isActive?: boolean;
  }, userId?: string, userEmail?: string): Promise<ApiResponse<BackendMembershipPackage>> => {
    const response = await SmartAPIManager.smartFetch('/memberships/admin/packages', {
      method: 'POST',
      body: JSON.stringify({ ...data, userId, userEmail })
    });
    return response.json();
  },
  
  updatePackage: async (id: string, data: {
    name?: string;
    role?: 'reseller';
    durationDays?: number;
    price?: number;
    description?: string;
    isActive?: boolean;
  }, userId?: string, userEmail?: string): Promise<ApiResponse<BackendMembershipPackage>> => {
    const response = await SmartAPIManager.smartFetch(`/memberships/admin/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, userId, userEmail })
    });
    return response.json();
  },
  
  deletePackage: async (id: string, userId?: string, userEmail?: string): Promise<ApiResponse> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    const qs = params.toString();
    const url = `/memberships/admin/packages/${id}${qs ? `?${qs}` : ''}`;
    const response = await SmartAPIManager.smartFetch(url, {
      method: 'DELETE'
    });
    return response.json();
  }
};
