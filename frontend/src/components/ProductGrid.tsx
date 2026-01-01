import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category, Product } from '../types';

function ProductGrid({ categories, products }: { categories: Category[]; products: Product[] }) {
  // Helper function to find the diamond top-up category
  const findDiamondTopUpCategory = (cats: Category[]): string | null => {
    if (!cats.length) return null;
    
    // Look for category with "diamond" and "top" in the name (case-insensitive)
    const diamondCategory = cats.find(cat => {
      const nameLower = cat.name.toLowerCase();
      return (nameLower.includes('diamond') && nameLower.includes('top')) ||
             nameLower.includes('top up diamond') ||
             nameLower.includes('diamond topup') ||
             nameLower.includes('diamond top up');
    });
    
    return diamondCategory?.id || (cats.length ? cats[0].id : null);
  };

  // Helper function to get category image based on category name
  const getCategoryImage = (categoryName: string): string => {
    const nameLower = categoryName.toLowerCase();
    
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

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categories.length ? findDiamondTopUpCategory(categories) : null,
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedCategory && categories.length) {
      const defaultCategory = findDiamondTopUpCategory(categories);
      setSelectedCategory(defaultCategory);
    } else if (selectedCategory && categories.length) {
      // Re-check if the selected category still exists, if not, find diamond category again
      const categoryExists = categories.some(cat => cat.id === selectedCategory);
      if (!categoryExists) {
        const defaultCategory = findDiamondTopUpCategory(categories);
        setSelectedCategory(defaultCategory);
      }
    }
  }, [categories, selectedCategory]);

  // Sort categories: E Badge & Evo Access and Level up pass should be at the end
  const sortedCategories = [...categories].sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    
    const aIsLast = (aName.includes('evo') && aName.includes('badge')) || 
                    (aName.includes('level') && aName.includes('up'));
    const bIsLast = (bName.includes('evo') && bName.includes('badge')) || 
                    (bName.includes('level') && bName.includes('up'));
    
    if (aIsLast && !bIsLast) return 1; // a goes to end
    if (!aIsLast && bIsLast) return -1; // b goes to end
    return 0; // keep original order for others
  });

  const filtered = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;
  const categoryName =
    categories.find((c) => c.id === selectedCategory)?.name ?? 'All categories';

  return (
    <section id="diamonds" className="mt-4 sm:mt-5 md:mt-7 p-3 sm:p-4 md:p-6 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] bg-white border border-slate-900/6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex-1">
          <p className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-purple-400/14 text-purple-700 border border-purple-400/35 font-semibold text-[11px] sm:text-[12px] md:text-[13px]">
            💎 Top-up categories
          </p>
          <h2 className="mt-2 mb-1 text-lg sm:text-xl md:text-2xl text-slate-900">
            {categoryName}
          </h2>
          <p className="mb-2 text-xs sm:text-sm text-slate-600">
            Select a category below to view products
          </p>
        </div>
        {sortedCategories.length > 0 && (
          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3 bg-slate-50/80 rounded-xl p-2.5 sm:p-3 md:p-4">
              {sortedCategories.map((cat) => (
                <button
                  key={cat.id}
                  className={`flex flex-col gap-1.5 sm:gap-2 items-center px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg cursor-pointer transition-all duration-150 border-[2px] ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-br from-purple-500 to-violet-600 text-white border-purple-400 shadow-[0_4px_12px_rgba(168,85,247,0.3)] scale-[1.02]'
                      : 'border-purple-300 bg-white text-slate-900 hover:border-purple-400 hover:bg-purple-50/40 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <img 
                    src={getCategoryImage(cat.name)} 
                    alt={cat.name}
                    className={`object-cover rounded-lg transition-transform duration-150 ${
                      selectedCategory === cat.id 
                        ? 'w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16' 
                        : 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14'
                    }`}
                  />
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1 w-full">
                    <span className={`font-semibold text-center text-[10px] sm:text-xs md:text-sm leading-tight px-1 ${
                      selectedCategory === cat.id ? 'text-white' : 'text-slate-900'
                    }`}>
                      {cat.name}
                    </span>
                    {cat.badge ? (
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
                        selectedCategory === cat.id
                          ? 'bg-white/25 text-white'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {cat.badge}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5 mt-3 sm:mt-3.5">
        {filtered.map((item) => (
          <article key={item.id} className="p-3 sm:p-4 rounded-[12px] sm:rounded-[14px] border border-slate-900/6 bg-gradient-to-b from-purple-50 via-violet-50/50 to-white flex flex-col gap-2 sm:gap-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-2 sm:gap-2.5">
              <div className="flex-1 min-w-0">
                <p className="m-0 text-sm font-bold truncate sm:text-base text-slate-900">{item.name}</p>
                {/* diamond color  */}
                <p className={`mt-0.5 mb-0 text-xs sm:text-sm ${
                       item.diamonds ? 'text-[#FAF6FF]' : 'text-slate-600'
                  }`}>
                  {item.diamonds ? `${item.diamonds} Diamonds` : 'Special item'}
                </p>

                {/* color end */}
              </div>
              {item.tag ? <span className="inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-teal-400/14 border border-teal-400/40 text-teal-700 font-semibold text-[10px] sm:text-xs whitespace-nowrap">{item.tag}</span> : null}
            </div>
            {item.bonus ? <p className="m-0 text-xs font-semibold sm:text-sm text-violet-600">{item.bonus}</p> : <div className="min-h-[14px] sm:min-h-[18px]" />}
            <div className="flex items-center justify-between gap-2">
              <p className="m-0 text-xl font-extrabold sm:text-2xl text-slate-900">৳{item.price}</p>
              <button
                className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-transparent bg-gradient-to-r from-purple-500 to-violet-600 text-white cursor-pointer font-semibold transition-all duration-[180ms] hover:-translate-y-px hover:opacity-95 text-xs sm:text-sm hover:from-purple-600 hover:to-violet-700 shadow-md hover:shadow-lg whitespace-nowrap"
                onClick={() => navigate('/checkout', { state: { productId: item.id } })}
              >
                Top up now
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 && products.length === 0 ? (
          <div className="py-8 text-center col-span-full">
            <div className="inline-block w-12 h-12 mb-4 border-4 border-purple-400 rounded-full border-t-transparent animate-spin"></div>
            <p className="text-slate-600">Loading products...</p>
            <p className="mt-2 text-sm text-slate-500">If this takes too long, check your backend connection</p>
          </div>
        ) : filtered.length === 0 && products.length > 0 ? (
          <div className="py-4 text-center col-span-full">
            <p className="text-slate-600">No products in this category.</p>
            <p className="text-slate-600 text-[13px]">Try selecting a different category.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default ProductGrid;

