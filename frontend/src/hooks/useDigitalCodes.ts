import { useEffect, useState } from 'react';
import { digitalCodeApi } from '../services/api';
import type { ApiResponse } from '../types';
import type { BackendDigitalCodeCategory, BackendDigitalCodeProduct } from '../types';

const STORAGE_KEY = 'rtu_digital_codes_backup';

// ==================== DIGITAL CODES HOOK ====================
function useDigitalCodes() {
  const [categories, setCategories] = useState<BackendDigitalCodeCategory[]>([]);
  const [products, setProducts] = useState<BackendDigitalCodeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Try to load from localStorage first for instant display
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { 
          categories: BackendDigitalCodeCategory[], 
          products: BackendDigitalCodeProduct[] 
        };
        if (parsed.categories && parsed.categories.length > 0) {
          setCategories(parsed.categories);
        }
        if (parsed.products && parsed.products.length > 0) {
          setProducts(parsed.products);
          setLoading(false); // Show cached data immediately
        }
      } catch (parseErr) {
        // console.error('Failed to parse localStorage data:', parseErr);
      }
    }
    
    // Then load fresh data from backend
    loadFromBackend();
  }, [retryCount]);

  const loadFromBackend = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load categories
      const categoriesResponse = await digitalCodeApi.getCategories();
      if (categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
        const activeCategories = categoriesResponse.data.filter(cat => cat.isActive);
        setCategories(activeCategories);
      } else {
        throw new Error(categoriesResponse.message || 'Failed to load categories');
      }
      
      // Load all products (without category filter to get everything)
      const productsResponse = await digitalCodeApi.getProducts(false);
      if (productsResponse.success && Array.isArray(productsResponse.data)) {
        const activeProducts = productsResponse.data.filter(p => p.isActive);
        setProducts(activeProducts);
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          categories: activeCategories,
          products: activeProducts
        }));
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
          const parsed = JSON.parse(saved) as { 
            categories: BackendDigitalCodeCategory[], 
            products: BackendDigitalCodeProduct[] 
          };
          if (parsed.categories && parsed.categories.length > 0) {
            setCategories(parsed.categories);
          }
          if (parsed.products && parsed.products.length > 0) {
            setProducts(parsed.products);
          }
        } catch (parseErr) {
          // console.error('Failed to parse localStorage data:', parseErr);
        }
      } else {
        // If no localStorage backup, set empty arrays to prevent infinite loading
        if (categories.length === 0) {
          setCategories([]);
        }
        if (products.length === 0) {
          setProducts([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const saveToStorage = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ categories, products }));
  };

  const retryLoad = () => {
    setRetryCount(prev => prev + 1);
  };

  return { 
    categories, 
    products, 
    loading,
    error,
    refresh: loadFromBackend,
    retry: retryLoad
  };
}

export default useDigitalCodes;
