import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { BackendSubscriptionProduct } from '../types';
import InlinePurchasePanel from './InlinePurchasePanel';
import { getImageUrl } from '../utils/imageUrl';

function SubscriptionGrid({ products, badgeText, headingText }: { products: BackendSubscriptionProduct[]; badgeText?: string; headingText?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState<BackendSubscriptionProduct | null>(null);
  const panelAnchorRef = useRef<HTMLDivElement | null>(null);

  // Helper function to get product image
  const getProductImage = (product: BackendSubscriptionProduct): string => {
    if (product.image) {
      return getImageUrl(product.image);
    }
    return '/diamond-top-up.png';
  };

  // Filter active products
  const activeProducts = products.filter(p => p.isActive);

  useEffect(() => {
    if (location.pathname !== '/') return;
    const status = searchParams.get('status');
    const mode = searchParams.get('mode');
    const productIdFromUrl = searchParams.get('productId');
    if (!status || !productIdFromUrl || (mode && mode !== 'subscription')) return;
    const matched = activeProducts.find((product) => product.id === productIdFromUrl);
    if (matched) {
      setSelectedProduct(matched);
      setTimeout(() => panelAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [searchParams, activeProducts, location.pathname]);

  if (activeProducts.length === 0) {
    return null; // Don't show section if no products
  }

  return (
    <section id="subscriptions" className="mt-4 sm:mt-5 md:mt-7 p-3 sm:p-4 md:p-6 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] bg-white border border-slate-900/6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex-1">
          <p
            className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border font-semibold text-[11px] sm:text-[12px] md:text-[13px]"
            style={{
              backgroundColor: 'var(--theme-primary-light)',
              borderColor: 'rgba(var(--theme-primary-rgb), 0.35)',
              color: 'var(--theme-primary)',
            }}
          >
            {badgeText || '📅 Subscriptions'}
          </p>
          <h2 className="mt-2 mb-1 text-lg sm:text-xl md:text-2xl text-slate-900">
            {headingText || 'Subscription Plans'}
          </h2>
          <p className="mb-2 text-xs sm:text-sm text-slate-600">
            সাবস্ক্রিপশন প্ল্যান দেখতে নিচের প্রোডাক্টে ক্লিক করুন
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5 mt-3 sm:mt-3.5">
          {activeProducts.map((product) => (
            <article
              key={product.id}
              className="p-3 sm:p-4 rounded-[12px] sm:rounded-[14px] border border-slate-900/6 flex flex-col gap-2 sm:gap-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
              style={{
                background:
                  'linear-gradient(to bottom, var(--theme-primary-light), rgba(255,255,255,1))'
              }}
            >
              {/* Product Image */}
              {product.image && (
                <div className="w-full aspect-square overflow-hidden rounded-lg mb-2">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    loading="lazy"
                    className="object-cover w-full h-full transition-transform duration-150 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/diamond-top-up.png';
                    }}
                  />
                </div>
              )}
              
              <div className="flex items-start justify-between gap-2 sm:gap-2.5">
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-sm font-bold truncate sm:text-base text-slate-900">{product.name}</p>
                  {product.description && (
                    <p className="mt-0.5 mb-0 text-xs sm:text-sm text-slate-600">
                      {product.description}
                    </p>
                  )}
                </div>
                {product.tag ? (
                  <span className="inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-teal-400/14 border border-teal-400/40 text-teal-700 font-semibold text-[10px] sm:text-xs whitespace-nowrap">
                    {product.tag}
                  </span>
                ) : null}
              </div>
              
              {product.bonus ? (
                <p
                  className="m-0 text-xs font-semibold sm:text-sm"
                  style={{ color: 'var(--theme-primary)' }}
                >
                  {product.bonus}
                </p>
              ) : (
                <div className="min-h-[14px] sm:min-h-[18px]" />
              )}
              
              <div className="flex items-center justify-between gap-2">
                <p className="m-0 text-xl font-extrabold sm:text-2xl text-slate-900">৳{product.price}</p>
                <button
                  className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-transparent text-white cursor-pointer font-semibold transition-all duration-[180ms] hover:-translate-y-px hover:opacity-95 text-xs sm:text-sm shadow-md hover:shadow-lg whitespace-nowrap"
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
                  onClick={() => {
                    if (location.pathname !== '/') {
                      navigate('/');
                      return;
                    }
                    setSelectedProduct(product);
                    setTimeout(() => panelAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                  }}
                >
                  Subscribe
                </button>
              </div>
            </article>
          ))}
        </div>

        {activeProducts.length === 0 && (
          <div className="w-full mt-6 sm:mt-8">
            <p className="text-center text-xs sm:text-sm text-slate-500">
              No subscription plans available yet
            </p>
          </div>
        )}
      </div>
      <div ref={panelAnchorRef} />
      {selectedProduct && (
        <InlinePurchasePanel
          mode="subscription"
          selectedProduct={selectedProduct}
          originPath="/"
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
}

export default SubscriptionGrid;
