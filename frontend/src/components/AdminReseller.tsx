import { useEffect, useState, useMemo } from 'react';
import { productApi, digitalCodeApi, subscriptionApi } from '../services/api';
import type { BackendProduct, BackendDigitalCodeProduct, BackendSubscriptionProduct } from '../types';
import { FaSave, FaSearch, FaFilter } from 'react-icons/fa';

type ProductType = 'regular' | 'digitalCode' | 'subscription';

interface CombinedProduct {
  id: string;
  name: string;
  type: ProductType;
  categoryName: string;
  price: number;
  resellerPrice?: number | null;
  productId: string; // For API calls
  isActive?: boolean;
}

function AdminReseller() {
  const [regularProducts, setRegularProducts] = useState<BackendProduct[]>([]);
  const [digitalCodeProducts, setDigitalCodeProducts] = useState<BackendDigitalCodeProduct[]>([]);
  const [subscriptionProducts, setSubscriptionProducts] = useState<BackendSubscriptionProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ProductType | 'all'>('all');
  const [editingProducts, setEditingProducts] = useState<Record<string, string>>({}); // productId -> resellerPrice string
  const [savingProducts, setSavingProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    loadAllProducts();
  }, []);

  const loadAllProducts = async () => {
    try {
      setLoading(true);
      setMessage(null);
      // For regular products, use getAll() - it returns active products
      // For digital codes and subscriptions, use getAllProductsForAdmin() to get all including inactive
      const [regularRes, digitalRes, subscriptionRes] = await Promise.all([
        productApi.getAll(),
        digitalCodeApi.getAllProductsForAdmin(),
        subscriptionApi.getAllProductsForAdmin()
      ]);

      if (regularRes?.success && Array.isArray(regularRes.data)) {
        // Debug: Log sample product structure
        if (regularRes.data.length > 0) {
          const sample = regularRes.data[0];
          console.log('Sample regular product structure:', {
            id: sample.id,
            name: sample.name,
            categoryName: sample.categoryName,
            hasName: !!sample.name,
            hasCategoryName: !!sample.categoryName
          });
        }
        setRegularProducts(regularRes.data);
      } else {
        console.warn('Failed to load regular products:', regularRes);
      }
      
      if (digitalRes?.success && Array.isArray(digitalRes.data)) {
        console.log('Digital code products loaded:', digitalRes.data.length, 'products');
        if (digitalRes.data.length > 0) {
          const sample = digitalRes.data[0];
          console.log('Sample digital product structure:', {
            id: sample.id,
            name: sample.name,
            categoryName: sample.categoryName,
            hasName: !!sample.name,
            hasCategoryName: !!sample.categoryName
          });
        }
        setDigitalCodeProducts(digitalRes.data);
      } else {
        console.warn('Failed to load digital code products:', digitalRes);
      }
      
      if (subscriptionRes?.success && Array.isArray(subscriptionRes.data)) {
        console.log('Subscription products loaded:', subscriptionRes.data.length, 'products');
        if (subscriptionRes.data.length > 0) {
          const sample = subscriptionRes.data[0];
          console.log('Sample subscription product structure:', {
            id: sample.id,
            name: sample.name,
            categoryName: sample.categoryName,
            hasName: !!sample.name,
            hasCategoryName: !!sample.categoryName
          });
        }
        setSubscriptionProducts(subscriptionRes.data);
      } else {
        console.warn('Failed to load subscription products:', subscriptionRes);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      setMessage({ type: 'error', text: `Failed to load products: ${err instanceof Error ? err.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  // Combine all products into a single array
  const combinedProducts = useMemo<CombinedProduct[]>(() => {
    try {
      const regular: CombinedProduct[] = regularProducts.map(p => {
        // Ensure name and categoryName are properly extracted
        const productName = (p.name && String(p.name).trim()) || 'Unnamed Product';
        const categoryName = (p.categoryName && String(p.categoryName).trim()) || 'N/A';
        
        // Debug: Log if name is missing or categoryName seems wrong
        if (!p.name || !p.name.trim()) {
          console.warn('Regular product with missing name:', { id: p.id, name: p.name, categoryName: p.categoryName });
        }
        
        return {
          id: `regular-${p.id}`,
          name: productName,
          type: 'regular' as ProductType,
          categoryName: categoryName,
          price: p.price || 0,
          resellerPrice: p.resellerPrice ?? null,
          productId: p.id,
          isActive: p.isActive !== false
        };
      });

      const digital: CombinedProduct[] = digitalCodeProducts.map(p => {
        // Ensure name and categoryName are properly extracted
        const productName = (p.name && String(p.name).trim()) || 'Unnamed Product';
        const categoryName = (p.categoryName && String(p.categoryName).trim()) || 'N/A';
        
        // Debug: Log if price is missing or 0
        if (!p.price || p.price === 0) {
          console.warn('Digital product with missing/zero price:', p.id, p.name, 'Price:', p.price);
        }
        
        // Debug: Log if name is missing
        if (!p.name || !p.name.trim()) {
          console.warn('Digital product with missing name:', { id: p.id, name: p.name, categoryName: p.categoryName });
        }
        
        return {
          id: `digital-${p.id}`,
          name: productName,
          type: 'digitalCode' as ProductType,
          categoryName: categoryName,
          price: (p.price !== undefined && p.price !== null) ? p.price : 0,
          resellerPrice: p.resellerPrice ?? null,
          productId: p.id,
          isActive: p.isActive !== false
        };
      });

      const subscription: CombinedProduct[] = subscriptionProducts.map(p => {
        // Ensure name and categoryName are properly extracted
        const productName = (p.name && String(p.name).trim()) || 'Unnamed Product';
        const categoryName = (p.categoryName && String(p.categoryName).trim()) || 'N/A';
        
        // Debug: Log if price is missing or 0
        if (!p.price || p.price === 0) {
          console.warn('Subscription product with missing/zero price:', p.id, p.name, 'Price:', p.price);
        }
        
        // Debug: Log if name is missing
        if (!p.name || !p.name.trim()) {
          console.warn('Subscription product with missing name:', { id: p.id, name: p.name, categoryName: p.categoryName });
        }
        
        return {
          id: `subscription-${p.id}`,
          name: productName,
          type: 'subscription' as ProductType,
          categoryName: categoryName,
          price: (p.price !== undefined && p.price !== null) ? p.price : 0,
          resellerPrice: p.resellerPrice ?? null,
          productId: p.id,
          isActive: p.isActive !== false
        };
      });

      return [...regular, ...digital, ...subscription];
    } catch (error) {
      console.error('Error combining products:', error);
      return [];
    }
  }, [regularProducts, digitalCodeProducts, subscriptionProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = combinedProducts;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.type === filterType);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.categoryName.toLowerCase().includes(term) ||
        p.productId.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => {
      // Sort by type first, then by name
      if (a.type !== b.type) {
        const typeOrder = { regular: 0, digitalCode: 1, subscription: 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.name.localeCompare(b.name);
    });
  }, [combinedProducts, searchTerm, filterType]);

  const handleResellerPriceChange = (productId: string, value: string) => {
    setEditingProducts(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  const handleSaveResellerPrice = async (product: CombinedProduct, currentValue: string) => {
    try {
      const resellerPriceValue = currentValue?.trim();
      const resellerPrice = resellerPriceValue && resellerPriceValue !== '' 
        ? Number(resellerPriceValue) 
        : null;

      if (resellerPrice !== null && (isNaN(resellerPrice) || resellerPrice < 0)) {
        setMessage({ type: 'error', text: 'Please enter a valid price' });
        return;
      }

      setSavingProducts(prev => new Set(prev).add(product.id));

      let response;
      if (product.type === 'regular') {
        response = await productApi.update(product.productId, { 
          resellerPrice: resellerPrice ?? undefined 
        });
      } else if (product.type === 'digitalCode') {
        response = await digitalCodeApi.updateProduct(product.productId, { 
          resellerPrice: resellerPrice ?? undefined 
        });
      } else {
        response = await subscriptionApi.updateProduct(product.productId, { 
          resellerPrice: resellerPrice ?? undefined 
        });
      }

      if (response.success) {
        setMessage({ type: 'success', text: `Reseller price updated for ${product.name}` });
        // Remove from editing state
        setEditingProducts(prev => {
          const next = { ...prev };
          delete next[product.id];
          return next;
        });
        // Reload products
        await loadAllProducts();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update reseller price' });
      }
    } catch (err: any) {
      console.error('Error saving reseller price:', err);
      setMessage({ type: 'error', text: err?.message || 'Failed to update reseller price' });
    } finally {
      setSavingProducts(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  const getTypeLabel = (type: ProductType) => {
    switch (type) {
      case 'regular':
        return 'Regular';
      case 'digitalCode':
        return 'Digital Code';
      case 'subscription':
        return 'Subscription';
      default:
        return type;
    }
  };

  const getTypeBadgeColor = (type: ProductType) => {
    switch (type) {
      case 'regular':
        return 'bg-blue-100 text-blue-700';
      case 'digitalCode':
        return 'bg-purple-100 text-purple-700';
      case 'subscription':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const productsWithoutResellerPrice = useMemo(() => {
    return filteredProducts.filter(p => p.resellerPrice == null);
  }, [filteredProducts]);

  return (
    <div className="pt-4 pb-4 pl-0 pr-4 space-y-6 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
      {/* Header */}
      <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
        <h3 className="mb-2 text-lg font-bold text-slate-900">Reseller Price Management</h3>
        <p className="text-sm text-slate-600">
          Manage reseller prices for all products. Resellers will see these prices instead of regular prices.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <p className="font-semibold">{message.text}</p>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by name, category, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ProductType | 'all')}
              className="w-full pl-10 pr-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 appearance-none bg-white"
            >
              <option value="all">All Product Types</option>
              <option value="regular">Regular Products</option>
              <option value="digitalCode">Digital Codes</option>
              <option value="subscription">Subscriptions</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="px-3 py-1 bg-slate-100 rounded-lg">
            <span className="font-semibold text-slate-700">Total Products: </span>
            <span className="text-slate-600">{filteredProducts.length}</span>
          </div>
          <div className="px-3 py-1 bg-yellow-100 rounded-lg">
            <span className="font-semibold text-yellow-700">Without Reseller Price: </span>
            <span className="text-yellow-600">{productsWithoutResellerPrice.length}</span>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div
              className="w-12 h-12 border-4 rounded-full border-t-transparent animate-spin"
              style={{ borderColor: 'var(--theme-primary)' }}
            ></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">No products found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Product Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Category</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Regular Price</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Reseller Price</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isEditing = editingProducts.hasOwnProperty(product.id);
                  const currentResellerPrice = isEditing
                    ? (editingProducts[product.id] || '')
                    : (product.resellerPrice != null ? product.resellerPrice.toString() : '');
                  const isSaving = savingProducts.has(product.id);
                  const hasResellerPrice = product.resellerPrice != null;

                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${
                        !hasResellerPrice ? 'bg-yellow-50/50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 break-words">
                            {product.name && product.name.trim() ? product.name : `Product ${product.productId}`}
                          </span>
                          {product.isActive === false && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-600 whitespace-nowrap">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(product.type)}`}>
                          {getTypeLabel(product.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 min-w-[120px]">
                        <span className="break-words">
                          {product.categoryName && product.categoryName.trim() && product.categoryName !== 'N/A' 
                            ? product.categoryName 
                            : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                        ৳{product.price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Not set"
                            value={currentResellerPrice}
                            onChange={(e) => handleResellerPriceChange(product.id, e.target.value)}
                            className="w-32 px-3 py-1.5 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
                          />
                          {!hasResellerPrice && !isEditing && (
                            <span className="text-xs text-yellow-600 font-medium">⚠️ Not set</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {(isEditing || !hasResellerPrice) && (
                            <button
                              onClick={() => handleSaveResellerPrice(product, currentResellerPrice)}
                              disabled={isSaving}
                              className="px-3 py-1.5 text-sm font-semibold text-white transition-all rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              style={{
                                background: isSaving
                                  ? '#94a3b8'
                                  : `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`
                              }}
                            >
                              {isSaving ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <FaSave />
                                  Save
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminReseller;
