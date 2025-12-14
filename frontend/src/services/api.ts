import type { ApiResponse, BackendProduct, BackendCategory } from '../types';

// ==================== API MANAGER - Render.com Only ====================
class SmartAPIManager {
  // Use only Render.com backend
  static baseURL = 'https://robo-backend-gguf.onrender.com/api';
  
  // Get API base URL
  static async getBaseURL(): Promise<string> {
    return this.baseURL;
  }
  
  // Simple fetch to Render backend with timeout
  static async smartFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseURL}${path}`;
    
    console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);
    
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
          console.warn('⏱️ Request timeout after 20 seconds');
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
      const baseURL = await SmartAPIManager.getBaseURL();
      console.log('🌐 API Base URL:', baseURL);
      console.log('🌐 API Endpoint: POST /payments/verify');
      console.log('📦 Request Payload:', JSON.stringify(paymentData, null, 2));
      console.log('🔑 Payment Method:', paymentData.paymentMethod);
      console.log('💰 Updated Balance:', paymentData.updatedBalance);
      
      const response = await SmartAPIManager.smartFetch('/payments/verify', {
        method: 'POST',
        body: JSON.stringify(paymentData),
        ...options // Pass options including signal
      });
      
      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        return {
          success: false,
          message: `Server error: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}...`,
          data: null
        };
      }
      
      const jsonResponse = await response.json();
      console.log('API JSON response:', jsonResponse);
      return jsonResponse;
    } catch (error: any) {
      console.error('❌ API Call failed:', error);
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
  
  getAll: async (limit: number = 50): Promise<ApiResponse> => {
    const response = await SmartAPIManager.smartFetch(`/payments?limit=${limit}`);
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
