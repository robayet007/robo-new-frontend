// Uddokta Pay API Integration - Using Backend Proxy
// Get backend base URL - automatically detect production or local
function getBackendBaseURL(): string {
  // Check if we're in production (Vercel deployment)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Production - use Vercel backend URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://robotopup-backend.vercel.app';
    return `${backendUrl}/api`;
  }
  // Local development
  return 'http://localhost:5000/api';
}

async function smartFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const baseURL = getBackendBaseURL();
  const url = `${baseURL}${path}`;
  
  console.log(`🌐 Uddokta Pay API Call: ${options.method || 'GET'} ${url}`);
  
  const controller = new AbortController();
  const timeout = 20000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection.');
    }
    throw error;
  }
}

// Get backend URL for webhook
export const getBackendWebhookUrl = (): string => {
  // For Uddokta Pay webhook, we ALWAYS need a publicly accessible URL
  // Localhost won't work - Uddokta Pay server can't reach localhost
  // Use production URL even in development, or use ngrok/tunneling service
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 
    (window.location.hostname === 'localhost' 
      ? 'https://robotopup-backend.vercel.app' // Use production URL even in dev for webhook
      : 'https://robotopup-backend.vercel.app');
  
  const webhookUrl = `${backendUrl}/api/payments/uddokta/webhook`;
  console.log('🔗 Webhook URL (must be publicly accessible):', webhookUrl);
  console.log('⚠️ Note: Localhost webhooks will not work. Use production URL or ngrok.');
  return webhookUrl;
};

export interface UddoktaPayCheckoutRequest {
  full_name: string;
  email: string;
  amount: string;
  metadata: {
    user_id?: string;
    order_id?: string;
    product_id?: string;
    product_name?: string;
    player_id?: string;
    diamonds?: number;
    price?: number;
    payment_type?: 'purchase' | 'add_money';
  };
  redirect_url: string;
  cancel_url: string;
  webhook_url: string;
}

export interface UddoktaPayCheckoutResponse {
  status: boolean;
  message: string;
  payment_url: string;
}

export interface UddoktaPayVerifyRequest {
  invoice_id: string;
}

export interface UddoktaPayVerifyResponse {
  status: boolean;
  message: string;
  payment: {
    invoice_id: string;
    full_name: string;
    email: string;
    amount: string;
    status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
    payment_method: string;
    created_at: string;
    metadata?: any;
  };
}

// Create payment checkout (via backend proxy)
export const createUddoktaPayCheckout = async (
  request: UddoktaPayCheckoutRequest
): Promise<UddoktaPayCheckoutResponse> => {
  try {
    const response = await smartFetch('/payments/uddokta/checkout', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Uddokta Pay API error: ${response.status} - ${errorText}`;
      let errorDetails = null;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
        if (errorJson.details) {
          errorDetails = errorJson.details;
        }
        if (errorJson.error) {
          errorDetails = errorJson.error;
        }
      } catch {
        // Use text as is
      }
      
      // Provide helpful message for 401 errors
      if (response.status === 401) {
        errorMessage = 'API authentication failed. Please check the Uddokta Pay API key configuration on the backend server.';
        if (errorDetails) {
          errorMessage += ` Details: ${errorDetails}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.success && data.data) {
      return {
        status: true,
        message: 'Payment URL created',
        payment_url: data.data.payment_url
      };
    } else {
      throw new Error(data.message || 'Failed to create payment checkout');
    }
  } catch (error: any) {
    console.error('Uddokta Pay checkout error:', error);
    throw new Error(error.message || 'Failed to create payment checkout');
  }
};

// Verify payment (via backend proxy)
export const verifyUddoktaPayPayment = async (
  invoiceId: string
): Promise<UddoktaPayVerifyResponse> => {
  try {
    const response = await smartFetch('/payments/uddokta/verify', {
      method: 'POST',
      body: JSON.stringify({
        invoice_id: invoiceId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Uddokta Pay verification error: ${response.status} - ${errorText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // Use text as is
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.success && data.data) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to verify payment');
    }
  } catch (error: any) {
    console.error('Uddokta Pay verification error:', error);
    throw new Error(error.message || 'Failed to verify payment');
  }
};

