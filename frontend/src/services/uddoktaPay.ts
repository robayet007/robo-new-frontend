// Uddokta Pay API Integration - Using Backend Proxy
// Get backend base URL - always use Render backend URL
function getBackendBaseURL(): string {
  // Always use Render backend URL
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://robo-backend-sbms.onrender.com';
  return `${backendUrl}/api`;
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
  // Always use Render backend URL for webhook
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://robo-backend-sbms.onrender.com';
  const webhookUrl = `${backendUrl}/api/payments/uddokta/webhook`;
  console.log('🔗 Webhook URL:', webhookUrl);
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
  status: boolean | string;
  message?: string;
  payment_status?: string;
  payment?: {
    invoice_id: string;
    full_name: string;
    email: string;
    amount: string;
    status: 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'UNKNOWN';
    payment_method: string;
    created_at: string;
    metadata?: any;
  };
  // Allow for flat response structure (status at root level)
  invoice_id?: string;
  full_name?: string;
  email?: string;
  amount?: string;
  payment_method?: string;
  created_at?: string;
  metadata?: any;
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
    console.log('📥 Backend verification response (raw):', data);
    
    if (data.success && data.data) {
      const responseData = data.data;
      console.log('📥 Uddokta Pay response data:', responseData);
      console.log('📥 Response keys:', Object.keys(responseData));
      console.log('📥 Has payment object:', !!responseData.payment);
      console.log('📥 Payment status:', responseData.payment?.status || responseData.status);
      
      return responseData;
    } else {
      throw new Error(data.message || 'Failed to verify payment');
    }
  } catch (error: any) {
    console.error('Uddokta Pay verification error:', error);
    throw new Error(error.message || 'Failed to verify payment');
  }
};



