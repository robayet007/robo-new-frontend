import type { ApiResponse, BackendProduct, BackendCategory, BackendPurchase } from '../types';

// ==================== API MANAGER - Smart URL Detection ====================
class SmartAPIManager {
  // Get API base URL - default to local backend for development
  static getBaseURL(): string {
    // Local development default
    // In production (Vercel), set VITE_API_URL in environment variables to point to the live backend
    const backendUrl = "https://backend-dawn-wind-7381.fly.dev";
    // const backendUrl = "    http://localhost:5000";
    return `${backendUrl}/api`;
  }
  
  // Get API base URL (async for compatibility)
  static async getBaseURLAsync(): Promise<string> {
    return this.getBaseURL();
  }
  
  // Simple fetch to Render backend with timeout
  static async smartFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const baseURL = this.getBaseURL();
    const url = `${baseURL}${path}`;
    
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
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: signalToUse,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
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
  getAll: async (): Promise<ApiResponse<BackendProduct[]>> => {
    const response = await SmartAPIManager.smartFetch('/products');
    return response.json();
  },
  
  getById: async (id: string): Promise<ApiResponse<BackendProduct>> => {
    const response = await SmartAPIManager.smartFetch(`/products/${id}`);
    return response.json();
  },
  
  getByCategory: async (categoryId: string): Promise<ApiResponse<BackendProduct[]>> => {
    const response = await SmartAPIManager.smartFetch(`/products/category/${categoryId}`);
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
  }
};

// Payments API with smart fetch
export const paymentApi = {
  verify: async (paymentData: {
    transactionId: string;
    amount: number;
    playerId: string;
    productId: string;
    productName?: string;
    diamonds?: number;
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

  // Uddokta Pay checkout
  uddoktaCheckout: async (checkoutData: {
    amount: number;
    playerId: string;
    productId: string;
    productName?: string;
    diamonds?: number;
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
  }
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
