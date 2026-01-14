import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useLayoutEffect } from 'react';
import type { Category, Product } from '../types';

function CategoryPage({ 
  categories, 
  products 
}: { 
  categories: Category[]; 
  products: Product[] 
}) {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);

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

  const filteredProducts = products.filter((p) => p.categoryId === categoryId);

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
                // Fallback to default image if custom image fails to load
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
        {filteredProducts.map((item) => (
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
                <p className={`mt-0.5 mb-0 text-xs sm:text-sm ${
                       item.diamonds ? 'text-[#FAF6FF]' : 'text-slate-600'
                  }`}>
                  {item.diamonds ? `${item.diamonds} Diamonds` : 'Special item'}
                </p>
              </div>
              {item.tag ? <span className="inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-teal-400/14 border border-teal-400/40 text-teal-700 font-semibold text-[10px] sm:text-xs whitespace-nowrap">{item.tag}</span> : null}
            </div>
            {item.bonus ? (
              <p
                className="m-0 text-xs font-semibold sm:text-sm"
                style={{ color: 'var(--theme-primary)' }}
              >
                {item.bonus}
              </p>
            ) : (
              <div className="min-h-[14px] sm:min-h-[18px]" />
            )}
            <div className="flex items-center justify-between gap-2">
              <p className="m-0 text-xl font-extrabold sm:text-2xl text-slate-900">৳{item.price}</p>
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
                onClick={() => navigate('/checkout', { state: { productId: item.id } })}
              >
                Top up now
              </button>
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
    </section>
  );
}

export default CategoryPage;

