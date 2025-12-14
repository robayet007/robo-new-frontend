import type { ApiResponse, BackendProduct, BackendCategory } from '../types';

// ==================== SMART API MANAGER ====================
interface APIEndpoint {
  url: string;
  name: string;
  priority: number;
  type: string;
}

class SmartAPIManager {
  static endpoints: APIEndpoint[] = [
    { 
      url: 'https://robo-backend-gguf.onrender.com/api', 
      name: 'Render', 
      priority: 1, 
      type: 'https' 
    },
    { 
      url: '/api', 
      name: 'Vercel Proxy', 
      priority: 2, 
      type: 'proxy' 
    },
    { 
      url: 'http://3.27.116.101:5000/api', 
      name: 'EC2 Direct', 
      priority: 3, 
      type: 'http' 
    }
  ];
  
  static currentEndpoint: APIEndpoint = this.endpoints[0];
  static isInitialized: boolean = false;
  static initializationPromise: Promise<string> | null = null;
  
  // Initialize API manager
  static async initialize(): Promise<string> {
    if (this.isInitialized) {
      return this.currentEndpoint.url;
    }
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = (async (): Promise<string> => {
      console.log('🔍 Initializing API Manager...');
      
      // Sort by priority
      const sortedEndpoints = [...this.endpoints].sort((a, b) => a.priority - b.priority);
      
      // Filter out incompatible endpoints
      const compatibleEndpoints = sortedEndpoints.filter(endpoint => {
        // Skip HTTP endpoints on HTTPS sites
        if (window.location.protocol === 'https:' && endpoint.type === 'http') {
          console.log(`⏭️ Skipping ${endpoint.name} (HTTP not allowed on HTTPS site)`);
          return false;
        }
        return true;
      });
      
      if (compatibleEndpoints.length === 0) {
        console.warn('⚠️ No compatible endpoints found, using first endpoint');
        this.currentEndpoint = this.endpoints[0];
        this.isInitialized = true;
        return this.endpoints[0].url;
      }
      
      // Test endpoints
      for (const endpoint of compatibleEndpoints) {
        try {
          console.log(`Testing ${endpoint.name} (${endpoint.url})...`);
          const isHealthy = await this.testEndpoint(endpoint);
          
          if (isHealthy) {
            this.currentEndpoint = endpoint;
            console.log(`✅ Selected: ${endpoint.name}`);
            this.isInitialized = true;
            return endpoint.url;
          }
          
          console.log(`❌ ${endpoint.name} failed`);
        } catch (error) {
          console.log(`⚠️ ${endpoint.name} test error:`, error instanceof Error ? error.message : String(error));
        }
      }
      
      // All endpoints failed, use first compatible
      this.currentEndpoint = compatibleEndpoints[0];
      console.warn(`⚠️ All endpoints failed, using fallback: ${compatibleEndpoints[0].name}`);
      this.isInitialized = true;
      return compatibleEndpoints[0].url;
    })();
    
    return this.initializationPromise;
  }
  
  // Test endpoint health
  static async testEndpoint(endpoint: APIEndpoint): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${endpoint.url}/health`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return false;
      }
      
      try {
        const data = await response.json();
        return data.status === 'OK' || data.success === true || data.message?.includes('running');
      } catch {
        // If not JSON, check if response text contains success indicators
        const text = await response.text();
        return text.includes('"status":"OK"') || text.includes('"success":true');
      }
    } catch (error) {
      console.log(`Endpoint ${endpoint.name} test failed:`, error instanceof Error ? error.message : String(error));
      return false;
    }
  }
  
  // Get current API base URL
  static async getBaseURL(): Promise<string> {
    if (!this.isInitialized) {
      return await this.initialize();
    }
    return this.currentEndpoint.url;
  }
  
  // Smart fetch with retry logic
  static async smartFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const baseURL = await this.getBaseURL();
    
    try {
      const response = await fetch(`${baseURL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      // If request fails, try next endpoint (except for POST/PUT/DELETE to avoid duplicates)
      if (!response.ok && 
          this.currentEndpoint.priority < this.endpoints.length && 
          (!options.method || options.method === 'GET')) {
        
        const currentIndex = this.endpoints.findIndex(e => e.url === baseURL);
        if (currentIndex < this.endpoints.length - 1) {
          console.warn(`Retrying with next endpoint (HTTP ${response.status})`);
          this.currentEndpoint = this.endpoints[currentIndex + 1];
          return this.smartFetch(path, options);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }
}

// Initialize API manager when module loads
SmartAPIManager.initialize().then(url => {
  console.log('🚀 API Manager initialized with:', url);
}).catch(error => {
  console.error('Failed to initialize API manager:', error);
});

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
    userEmail?: string; // User email for Telegram notification
    userName?: string; // User name for Telegram notification
    timestamp?: string; // Timestamp for tracking
  }): Promise<ApiResponse> => {
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
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📊 Response Status:', response.status);
      console.log('✅ Response OK:', response.ok);
      console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          console.error('❌ API Error Response Text:', errorText);
        } catch (e) {
          console.error('❌ Could not read error response');
        }
        
        return {
          success: false,
          message: `Server error (${response.status}): ${response.statusText}`,
          data: null
        };
      }
      
      let jsonResponse;
      try {
        const responseText = await response.text();
        console.log('📄 Raw Response Text:', responseText);
        jsonResponse = JSON.parse(responseText);
        console.log('✅ Parsed JSON Response:', JSON.stringify(jsonResponse, null, 2));
      } catch (parseError: any) {
        console.error('❌ JSON Parse Error:', parseError);
        return {
          success: false,
          message: 'Invalid response from server',
          data: null
        };
      }
      
      return jsonResponse;
    } catch (error: any) {
      console.error('❌ API Call Exception:', error);
      console.error('❌ Error Type:', error.constructor.name);
      console.error('❌ Error Message:', error.message);
      console.error('❌ Error Stack:', error.stack);
      
      return {
        success: false,
        message: error.message || 'Network error. Please check your connection and backend server.',
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
