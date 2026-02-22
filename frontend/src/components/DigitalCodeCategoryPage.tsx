import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { digitalCodeApi } from '../services/api';
import type { BackendDigitalCodeCategory, BackendDigitalCodeProduct } from '../types';
import InlinePurchasePanel from './InlinePurchasePanel';

function DigitalCodeCategoryPage({ 
  categories, 
  products: allProducts 
}: { 
  categories: BackendDigitalCodeCategory[];
  products: BackendDigitalCodeProduct[];
}) {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState<BackendDigitalCodeCategory | null>(null);
  const [products, setProducts] = useState<BackendDigitalCodeProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<BackendDigitalCodeProduct | null>(null);
  const [productStock, setProductStock] = useState<Record<string, number>>({});
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockChecked, setStockChecked] = useState(false);
  // Initialize loading state based on whether props are available
  const [loading, setLoading] = useState(() => {
    // If props are available, we can find category instantly, so no loading needed
    return categories.length === 0 || allProducts.length === 0;
  });
  const panelAnchorRef = useRef<HTMLDivElement | null>(null);

  // Helper function to get category image
  const getCategoryImage = (category: BackendDigitalCodeCategory): string => {
    if (!category || !category.name) {
      return '/diamond-top-up.png';
    }
    
    if (category.image) {
      return category.image;
    }
    
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
    
    return '/diamond-top-up.png';
  };

  // Scroll to top immediately when component mounts or category changes
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [categoryId]);

  // Load category and products - use props if available, otherwise fallback to API
  useEffect(() => {
    if (!categoryId) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      // Check if props are available and not empty (optimized path)
      const hasProps = categories.length > 0 && allProducts.length > 0;
      
      if (hasProps) {
        // Use props (instant, optimized) - no loading needed
        const foundCategory = categories.find(cat => cat.id === categoryId);
        if (foundCategory && foundCategory.isActive) {
          setCategory(foundCategory);
          const categoryProducts = allProducts.filter(p => p.categoryId === categoryId && p.isActive);
          setProducts(categoryProducts);
          setLoading(false);
          return;
        } else if (foundCategory && !foundCategory.isActive) {
          navigate('/');
          return;
        }
        // Category not found in props, fallback to API
      }

      // Fallback: Load from API (original behavior) - only set loading here
      setLoading(true);
      try {
        // Load category
        const categoryResponse = await digitalCodeApi.getCategoryById(categoryId);
        if (categoryResponse.success && categoryResponse.data) {
          if (!categoryResponse.data.isActive) {
            navigate('/');
            return;
          }
          setCategory(categoryResponse.data);
        } else {
          navigate('/');
          return;
        }

        // Load products for this category
        const productsResponse = await digitalCodeApi.getProducts(false, categoryId);
        if (productsResponse.success && Array.isArray(productsResponse.data)) {
          const activeProducts = productsResponse.data.filter(p => p.isActive);
          setProducts(activeProducts);
        }
      } catch (err) {
        console.error('Failed to load digital code category data:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryId, categories, allProducts, navigate]);

  // Lazy load stock checking after products are displayed (non-blocking)
  useEffect(() => {
    if (products.length > 0 && !stockChecked) {
      // Load stock in background after a short delay to not block UI
      const timer = setTimeout(() => {
        const loadStock = async () => {
          setLoadingStock(true);
          const stockData: Record<string, number> = {};
          await Promise.all(
            products.map(async (product) => {
              try {
                const stockResponse = await digitalCodeApi.checkProductStock(product.id);
                if (stockResponse.success && stockResponse.data) {
                  stockData[product.id] = stockResponse.data.available;
                } else {
                  stockData[product.id] = 0;
                }
              } catch (err) {
                console.error(`Failed to load stock for product ${product.id}:`, err);
                stockData[product.id] = 0;
              }
            })
          );
          setProductStock(stockData);
          setLoadingStock(false);
          setStockChecked(true);
        };
        loadStock();
      }, 100); // Small delay to let UI render first

      return () => clearTimeout(timer);
    }
  }, [products, stockChecked]);

  useEffect(() => {
    const status = searchParams.get('status');
    const productIdFromUrl = searchParams.get('productId');
    if (!status || !productIdFromUrl) return;
    const matched = products.find((item) => item.id === productIdFromUrl);
    if (matched) {
      setSelectedProduct(matched);
      setTimeout(() => panelAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [searchParams, products]);

  if (loading || !category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div
          className="w-12 h-12 mb-4 border-4 rounded-full border-t-transparent animate-spin"
          style={{ borderColor: 'var(--theme-primary)' }}
        ></div>
        <p className="text-slate-600">Loading category...</p>
      </div>
    );
  }

  return (
    <section className="mt-4 sm:mt-5 md:mt-7 p-3 sm:p-4 md:p-6 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] bg-white border border-slate-900/6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 mb-4 sm:gap-4">
        <button
          onClick={() => navigate('/')}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-semibold whitespace-nowrap w-fit"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Category Image */}
          <div className="flex-shrink-0">
            <img 
              src={getCategoryImage(category)} 
              alt={category.name}
              loading="eager"
              className="object-cover w-16 h-16 border-2 shadow-md sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl"
              style={{
                borderColor: 'rgba(var(--theme-primary-rgb), 0.35)'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/diamond-top-up.png';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="mb-1 text-lg font-bold sm:text-xl md:text-2xl"
              style={{ color: 'var(--theme-primary)' }}
            >
              {category.name}
            </h2>
            {category.description && (
              <p className="text-xs sm:text-sm text-slate-600">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5 mt-3 sm:mt-3.5">
        {products.map((item) => (
          <article
            key={item.id}
            className="p-3 sm:p-4 rounded-[12px] sm:rounded-[14px] border border-slate-900/6 flex flex-col gap-2 sm:gap-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
            style={{
              background:
                'linear-gradient(to bottom, var(--theme-primary-light), rgba(255,255,255,1))'
            }}
          >
            <div className="flex items-start justify-between gap-2 sm:gap-2.5">
              <div className="flex-1 min-w-0">
                <p className="m-0 text-sm font-bold truncate sm:text-base text-slate-900">{item.name}</p>
                {item.description && (
                  <p className="mt-0.5 mb-0 text-xs sm:text-sm text-slate-600">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {item.tag ? (
                  <span className="inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-teal-400/14 border border-teal-400/40 text-teal-700 font-semibold text-[10px] sm:text-xs whitespace-nowrap">
                    {item.tag}
                  </span>
                ) : null}
                {(loadingStock || productStock[item.id] === undefined || productStock[item.id] === 0) && (
                  <span className="inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-red-100 border border-red-300 text-red-700 font-semibold text-[10px] sm:text-xs whitespace-nowrap">
                    {loadingStock ? 'Checking...' : 'Stock Out'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="m-0 text-xl font-extrabold sm:text-2xl text-slate-900">৳{item.price}</p>
              <button
                disabled={loadingStock || productStock[item.id] === undefined || productStock[item.id] === 0}
                className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-transparent text-white cursor-pointer font-semibold transition-all duration-[180ms] hover:-translate-y-px hover:opacity-95 text-xs sm:text-sm shadow-md hover:shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{
                  background:
                    loadingStock || productStock[item.id] === undefined || productStock[item.id] === 0
                      ? 'linear-gradient(to right, #94a3b8, #64748b)'
                      : 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))'
                }}
                onMouseEnter={(e) => {
                  if (!loadingStock && productStock[item.id] !== undefined && productStock[item.id] > 0) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'linear-gradient(to right, var(--theme-primary-hover), var(--theme-secondary-dark))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loadingStock && productStock[item.id] !== undefined && productStock[item.id] > 0) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))';
                  }
                }}
                onClick={() => {
                  // Only navigate if stock is loaded and > 0
                  if (!loadingStock && productStock[item.id] !== undefined && productStock[item.id] > 0) {
                    setSelectedProduct(item);
                    setTimeout(() => panelAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                  }
                }}
              >
                {loadingStock 
                  ? 'Loading...' 
                  : productStock[item.id] !== undefined && productStock[item.id] === 0 
                    ? 'Stock Out' 
                    : 'Purchase'}
              </button>
            </div>
          </article>
        ))}
      </div>

      {products.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-slate-600">No products available in this category.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 mt-4 font-semibold text-white transition-all rounded-lg"
            style={{
              background:
                'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'linear-gradient(to right, var(--theme-primary-hover), var(--theme-secondary-dark))';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))';
            }}
          >
            Browse All Categories
          </button>
        </div>
      )}

      <div ref={panelAnchorRef} />
      {selectedProduct && categoryId && (
        <InlinePurchasePanel
          mode="digital"
          selectedProduct={selectedProduct}
          originPath={`/digital-codes/category/${categoryId}`}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
}

export default DigitalCodeCategoryPage;
