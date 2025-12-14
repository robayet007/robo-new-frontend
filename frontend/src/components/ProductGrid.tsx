import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category, Product } from '../types';

function ProductGrid({ categories, products }: { categories: Category[]; products: Product[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categories.length ? categories[0].id : null,
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedCategory && categories.length) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const filtered = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;
  const categoryName =
    categories.find((c) => c.id === selectedCategory)?.name ?? 'All categories';

  return (
    <section id="diamonds" className="mt-4 sm:mt-5 md:mt-7 p-3 sm:p-4 md:p-6 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] bg-white border border-slate-900/6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-3">
        <div className="flex-1">
          <p className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-sky-400/14 text-sky-700 border border-sky-400/35 font-semibold text-[11px] sm:text-[12px] md:text-[13px]">Top-up list</p>
          <h2 className="mt-2 mb-0.5 text-lg sm:text-xl md:text-2xl text-slate-900">{categoryName}</h2>
          <p className="text-xs sm:text-sm text-slate-600">Choose a category, then pick your perfect pack.</p>
        </div>
        {categories.length > 0 && (
          <div className="flex gap-1.5 sm:gap-2 flex-wrap overflow-x-auto pb-2 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`inline-flex gap-1 sm:gap-2 items-center px-2.5 sm:px-3 md:px-3.5 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-150 whitespace-nowrap text-xs sm:text-sm ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-br from-sky-400 to-blue-500 text-[#0b1221] border-transparent shadow-[0_10px_30px_rgba(59,130,246,0.18)]'
                    : 'border border-slate-900/8 bg-white text-slate-900 hover:border-sky-400/50'
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.name}</span>
                {cat.badge ? <span className="bg-white/16 text-inherit px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">{cat.badge}</span> : null}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5 mt-3 sm:mt-3.5">
        {filtered.map((item) => (
          <article key={item.id} className="p-3 sm:p-4 rounded-[12px] sm:rounded-[14px] border border-slate-900/6 bg-gradient-to-b from-sky-400/8 to-white/95 flex flex-col gap-2 sm:gap-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-2 sm:gap-2.5">
              <div className="flex-1 min-w-0">
                <p className="m-0 font-bold text-sm sm:text-base text-slate-900 truncate">{item.name}</p>
                <p className="mt-0.5 mb-0 text-xs sm:text-sm text-slate-600">
                  {item.diamonds ? `${item.diamonds} Diamonds` : 'Special item'}
                </p>
              </div>
              {item.tag ? <span className="inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-sky-400/14 border border-sky-400/40 text-sky-700 font-semibold text-[10px] sm:text-xs whitespace-nowrap">{item.tag}</span> : null}
            </div>
            {item.bonus ? <p className="m-0 text-xs sm:text-sm text-blue-600 font-semibold">{item.bonus}</p> : <div className="min-h-[14px] sm:min-h-[18px]" />}
            <div className="flex items-center justify-between gap-2">
              <p className="m-0 text-xl sm:text-2xl font-extrabold text-slate-900">৳{item.price}</p>
              <button
                className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-transparent bg-green-500 text-white cursor-pointer font-semibold transition-all duration-[180ms] hover:-translate-y-px hover:opacity-95 text-xs sm:text-sm hover:bg-green-600 shadow-md hover:shadow-lg whitespace-nowrap"
                onClick={() => navigate('/checkout', { state: { productId: item.id } })}
              >
                Top up now
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-slate-600">No products in this category.</p>
            <p className="text-slate-600 text-[13px]">Try selecting a different category.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default ProductGrid;

