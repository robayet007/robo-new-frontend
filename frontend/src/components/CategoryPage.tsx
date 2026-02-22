import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import type { Category, Product } from '../types';
import InlinePurchasePanel from './InlinePurchasePanel';

function CategoryPage({ 
  categories, 
  products 
}: { 
  categories: Category[]; 
  products: Product[] 
}) {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const panelAnchorRef = useRef<HTMLDivElement | null>(null);

  // Helper function to get category image - use category.image if available, otherwise fallback to name-based logic
  const getCategoryImage = (category: Category): string => {
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

  // Scroll to top immediately when component mounts or category changes
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [categoryId]);

  useEffect(() => {
    if (categoryId) {
      // Only try to find category if categories array is not empty
      if (categories.length > 0) {
        const foundCategory = categories.find(cat => cat.id === categoryId);
        if (foundCategory) {
          setCategory(foundCategory);
        } else {
          // Category not found, redirect to home
          navigate('/', { replace: true });
        }
      }
      // If categories array is empty, wait for it to load (don't set category yet)
    }
  }, [categoryId, categories, navigate]);

  const filteredProducts = products.filter((p) => p.categoryId === categoryId);

  useEffect(() => {
    if (!filteredProducts.length) return;
    if (!selectedProduct || !filteredProducts.some((p) => p.id === selectedProduct.id)) {
      setSelectedProduct(filteredProducts[0]);
    }
  }, [filteredProducts, selectedProduct]);

  useEffect(() => {
    const status = searchParams.get('status');
    const productIdFromUrl = searchParams.get('productId');
    if (!status || !productIdFromUrl) return;

    const matched = filteredProducts.find((item) => item.id === productIdFromUrl);
    if (matched) {
      setSelectedProduct(matched);
      setTimeout(() => panelAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [searchParams, filteredProducts]);

  // Only show loading spinner if categories array is empty (still loading from global state)
  // If categories exist but category not found, useEffect will redirect, so we won't reach here
  if (!category && categories.length === 0) {
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

  // If category is still null but categories array is not empty, it means category was not found
  // useEffect should have redirected, but if not, return null to prevent rendering
  if (!category) {
    return null;
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
        <div className="flex flex-col items-center justify-center max-w-2xl gap-2 px-2 mx-auto text-center">
          <div className="flex items-center justify-center gap-2.5">
            <img
              src={getCategoryImage(category)}
              alt={selectedProduct?.name || category.name}
              loading="eager"
              className="object-cover w-10 h-10 border border-slate-200 shadow-sm rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/diamond-top-up.png';
              }}
            />
            <h2 className="m-0 text-lg font-bold leading-tight text-slate-900 sm:text-xl">
              {selectedProduct?.name || category.name}
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1">⚡ Instant Delivery</span>
            <span className="inline-flex items-center gap-1">○ Secure Payment</span>
            <span className="inline-flex items-center gap-1">● Fast Service</span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-3 sm:mt-3.5 max-w-2xl mx-auto">
        {filteredProducts.map((item) => (
          <article
            key={item.id}
            className={`p-2.5 sm:p-3 rounded-[10px] sm:rounded-[12px] border flex flex-col gap-1.5 shadow-[0_8px_20px_rgba(15,23,42,0.05)] cursor-pointer transition-all ${
              selectedProduct?.id === item.id
                ? 'border-rose-400 ring-2 ring-rose-200'
                : 'border-slate-900/6 hover:border-rose-300'
            }`}
            style={{ background: '#ffffff' }}
            onClick={() => {
              setSelectedProduct(item);
              setTimeout(() => panelAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="m-0 text-sm font-semibold truncate sm:text-[15px] text-slate-900">{item.name}</p>
              <p className="m-0 text-sm font-extrabold sm:text-base text-slate-900">৳{item.price}</p>
            </div>
            <div className="flex items-center justify-end min-h-[20px]">
              {selectedProduct?.id === item.id ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold text-white"
                  style={{ background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))' }}>
                  Selected
                </span>
              ) : (
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">Tap to select</span>
              )}
            </div>
          </article>
        ))}
      </div>

      {filteredProducts.length === 0 && (
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
          mode="regular"
          selectedProduct={selectedProduct}
          originPath={`/category/${categoryId}`}
        />
      )}
    </section>
  );
}

export default CategoryPage;

