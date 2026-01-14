import { useEffect, useState } from 'react';
import { productApi, categoryApi } from '../services/api';
import type { ApiResponse, BackendCategory } from '../types';
import type { Category, Product } from '../types';
import { preloadImages } from '../utils/imagePreloader';

const STORAGE_KEY = 'rtu_catalog_backup';

// Helper function to get category image URL - matches ProductGrid.getCategoryImage logic
const getCategoryImageUrl = (category: Category): string => {
  // Safety check
  if (!category || !category.name) {
    return '/diamond-top-up.png';
  }
  
  // If category has an image URL, use it
  if (category.image) {
    return category.image;
  }
  
  // Fallback to name-based logic
  const nameLower = category.name.toLowerCase();
  
  if (nameLower.includes('weekly')) {
    return '/weekly.jpg';
  } else if (nameLower.includes('monthly')) {
    return '/monthly.jpg';
  } else if (nameLower.includes('diamond') && (nameLower.includes('top') || nameLower.includes('up'))) {
    return '/diamond-top-up.png';
  } else if (nameLower.includes('evo') || nameLower.includes('badge')) {
    return '/evo.png';
  } else if (nameLower.includes('level') && nameLower.includes('up')) {
    return '/level-up-pass.png';
  }
  
  // Default fallback image
  return '/diamond-top-up.png';
};

// ==================== ENHANCED CATALOG HOOK ====================
function useCatalog() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Try to load from localStorage first for instant display
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { categories: Category[], products: Product[] };
        if (parsed.categories && parsed.categories.length > 0) {
          setCategories(parsed.categories);
          // Preload category images from cache (non-blocking)
          const categoryImageUrls = parsed.categories.map(cat => getCategoryImageUrl(cat));
          preloadImages(categoryImageUrls).catch(() => {
            // Errors are handled in preloadImages, just catch to prevent unhandled rejection
          });
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
      
      // console.log('📦 Loading catalog data from backend...');
      
      // Try multiple endpoints for categories
      let categoriesRes: ApiResponse<BackendCategory[]> | undefined;
      const categoryEndpoints = [
        () => categoryApi.getAll(),
        () => categoryApi.getCategories(),
        async (): Promise<ApiResponse<BackendCategory[]>> => {
          // Fallback: extract categories from products
          const productsRes = await productApi.getAll();
          if (productsRes.success && productsRes.data) {
            const uniqueCategories = [...new Set(productsRes.data.map(p => p.categoryId))];
            return {
              success: true,
              data: uniqueCategories.map((catId, index) => ({
                _id: `temp-${index}`,
                id: catId,
                name: `Category ${catId}`,
                isActive: true
              }))
            };
          }
          throw new Error('Cannot extract categories');
        }
      ];
      
      for (const endpoint of categoryEndpoints) {
        try {
          categoriesRes = await endpoint();
          if (categoriesRes.success && categoriesRes.data && categoriesRes.data.length > 0) {
            // console.log(`✅ Categories loaded from ${endpoint.name || 'endpoint'}`);
            break;
          }
        } catch (err) {
          // console.log('Category endpoint failed, trying next...');
        }
      }
      
      // Load products
      const productsRes = await productApi.getAll();
      
      if (productsRes.success && productsRes.data) {
        const backendProducts = productsRes.data;
        const convertedProducts: Product[] = backendProducts
          .filter(p => p.isActive)
          .map(p => ({
            id: p.id,
            categoryId: p.categoryId,
            name: p.name,
            diamonds: p.diamonds,
            price: p.price,
            bonus: p.bonus,
            tag: p.tag
          }));
        setProducts(convertedProducts);
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          categories,
          products: convertedProducts
        }));
      } else {
        throw new Error(productsRes.message || 'Failed to load products');
      }
      
      // Process categories
      if (categoriesRes?.success && categoriesRes.data) {
        const backendCategories = categoriesRes.data;
        const convertedCategories: Category[] = backendCategories
          .filter(c => c.isActive)
          .map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            badge: c.badge,
            dealId: c.dealId || null,
            image: c.image || undefined
          }));
        setCategories(convertedCategories);
        
        // Preload category images (non-blocking)
        const categoryImageUrls = convertedCategories.map(cat => getCategoryImageUrl(cat));
        preloadImages(categoryImageUrls).catch(() => {
          // Errors are handled in preloadImages, just catch to prevent unhandled rejection
        });
      } else {
        // Extract categories from products if API failed
        const uniqueCategories = [...new Set(productsRes.data.map(p => p.categoryId))];
        const extractedCategories: Category[] = uniqueCategories.map((catId, index) => ({
          id: catId,
          name: `Category ${index + 1}`,
          description: `Products in ${catId}`
        }));
        setCategories(extractedCategories);
        
        // Preload category images for extracted categories too
        const categoryImageUrls = extractedCategories.map(cat => getCategoryImageUrl(cat));
        preloadImages(categoryImageUrls).catch(() => {
          // Errors are handled in preloadImages, just catch to prevent unhandled rejection
        });
        // console.warn('Using extracted categories from products');
      }
      
    } catch (err) {
      // console.error('Failed to load from backend:', err);
      setError(err instanceof Error ? err.message : 'Backend connection failed. Using local backup.');
      
      // Try to load from localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { categories: Category[], products: Product[] };
          if (parsed.categories && parsed.categories.length > 0) {
            setCategories(parsed.categories);
            // Preload category images from localStorage fallback (non-blocking)
            const categoryImageUrls = parsed.categories.map(cat => getCategoryImageUrl(cat));
            preloadImages(categoryImageUrls).catch(() => {
              // Errors are handled in preloadImages, just catch to prevent unhandled rejection
            });
          }
          if (parsed.products && parsed.products.length > 0) {
            setProducts(parsed.products);
          }
        } catch (parseErr) {
          // console.error('Failed to parse localStorage data:', parseErr);
        }
      } else {
        // If no localStorage backup, set empty arrays to prevent infinite loading
        // console.warn('No cached data available. Setting empty catalog.');
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

  const addCategoryToBackend = async (category: Omit<Category, 'id'>) => {
    try {
      const newCategory: Category = {
        id: crypto.randomUUID(),
        ...category
      };
      
      const response = await categoryApi.create({
        id: newCategory.id,
        name: newCategory.name,
        description: newCategory.description || '',
        badge: newCategory.badge || '',
        isActive: true
      });
      
      if (response.success) {
        setCategories(prev => [...prev, newCategory]);
        saveToStorage();
        return { success: true, data: newCategory };
      } else {
        throw new Error(response.message || 'Failed to create category');
      }
    } catch (err) {
      // console.error('Failed to save category to backend:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to create category' 
      };
    }
  };

  const deleteCategoryFromBackend = async (id: string) => {
    try {
      const response = await categoryApi.delete(id);
      if (response.success) {
        setCategories(prev => prev.filter(cat => cat.id !== id));
        setProducts(prev => prev.filter(product => product.categoryId !== id));
        saveToStorage();
        return { success: true };
      }
      return { success: false, error: response.message };
    } catch (err) {
      // console.error('Failed to delete category:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete category' 
      };
    }
  };

  const addProductToBackend = async (product: Omit<Product, 'id'>) => {
    try {
      const newProduct: Product = {
        id: crypto.randomUUID(),
        ...product
      };
      
      const category = categories.find(c => c.id === product.categoryId);
      
      const response = await productApi.create({
        id: newProduct.id,
        categoryId: newProduct.categoryId,
        name: newProduct.name,
        diamonds: newProduct.diamonds,
        price: newProduct.price,
        bonus: newProduct.bonus || '',
        tag: newProduct.tag || '',
        categoryName: category?.name || 'Unknown',
        isActive: true
      });
      
      if (response.success) {
        setProducts(prev => [...prev, newProduct]);
        saveToStorage();
        return { success: true, data: newProduct };
      } else {
        throw new Error(response.message || 'Failed to create product');
      }
    } catch (err) {
      // console.error('Failed to save product to backend:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to create product' 
      };
    }
  };

  const updateProductInBackend = async (id: string, productData: Partial<Product>) => {
    try {
      const existingProduct = products.find(p => p.id === id);
      if (!existingProduct) {
        return { success: false, error: 'Product not found' };
      }

      const category = categories.find(c => c.id === (productData.categoryId || existingProduct.categoryId));
      
      const response = await productApi.update(id, {
        id: id,
        categoryId: productData.categoryId || existingProduct.categoryId,
        name: productData.name || existingProduct.name,
        diamonds: productData.diamonds !== undefined ? productData.diamonds : existingProduct.diamonds,
        price: productData.price !== undefined ? productData.price : existingProduct.price,
        bonus: productData.bonus !== undefined ? productData.bonus : existingProduct.bonus || '',
        tag: productData.tag !== undefined ? productData.tag : existingProduct.tag || '',
        categoryName: category?.name || 'Unknown',
        isActive: true
      });
      
      if (response.success) {
        setProducts(prev => prev.map(product => 
          product.id === id 
            ? { ...product, ...productData }
            : product
        ));
        saveToStorage();
        return { success: true, data: { ...existingProduct, ...productData } };
      } else {
        throw new Error(response.message || 'Failed to update product');
      }
    } catch (err) {
      // console.error('Failed to update product:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update product' 
      };
    }
  };

  const deleteProductFromBackend = async (id: string) => {
    try {
      const response = await productApi.delete(id);
      if (response.success) {
        setProducts(prev => prev.filter(product => product.id !== id));
        saveToStorage();
        return { success: true };
      }
      return { success: false, error: response.message };
    } catch (err) {
      // console.error('Failed to delete product:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete product' 
      };
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
    addCategory: addCategoryToBackend,
    deleteCategory: deleteCategoryFromBackend,
    addProduct: addProductToBackend,
    updateProduct: updateProductInBackend,
    deleteProduct: deleteProductFromBackend,
    refresh: loadFromBackend,
    retry: retryLoad
  };
}

export default useCatalog;
