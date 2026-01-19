import { useEffect, useState, useCallback } from 'react';
import { subscriptionApi } from '../services/api';
import type { BackendSubscriptionProduct } from '../types';
import useAuth from './useAuth';

const STORAGE_KEY = 'rtu_subscriptions_backup';

// ==================== SUBSCRIPTIONS HOOK ====================
function useSubscriptions() {
  const { user } = useAuth();
  const [products, setProducts] = useState<BackendSubscriptionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadFromBackend = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all products (pass userId and userEmail for reseller pricing)
      const productsResponse = await subscriptionApi.getProducts(false, undefined, user?.uid, user?.email || undefined);
      if (productsResponse.success && Array.isArray(productsResponse.data)) {
        const activeProducts = productsResponse.data.filter(p => p.isActive);
        setProducts(activeProducts);
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeProducts));
      } else {
        throw new Error(productsResponse.message || 'Failed to load products');
      }
      
    } catch (err) {
      // console.error('Failed to load from backend:', err);
      setError(err instanceof Error ? err.message : 'Backend connection failed. Using local backup.');
      
      // Try to load from localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as BackendSubscriptionProduct[];
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
          }
        } catch (parseErr) {
          // console.error('Failed to parse localStorage data:', parseErr);
        }
      } else {
        // If no localStorage backup, set empty array to prevent infinite loading
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.uid, user?.email]);

  useEffect(() => {
    // Try to load from localStorage first for instant display
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as BackendSubscriptionProduct[];
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
          setLoading(false); // Show cached data immediately
        }
      } catch (parseErr) {
        // console.error('Failed to parse localStorage data:', parseErr);
      }
    }
    
    // Then load fresh data from backend
    loadFromBackend();
  }, [retryCount, loadFromBackend]);

  const retryLoad = () => {
    setRetryCount(prev => prev + 1);
  };

  return { 
    products, 
    loading,
    error,
    refresh: loadFromBackend,
    retry: retryLoad
  };
}

export default useSubscriptions;
