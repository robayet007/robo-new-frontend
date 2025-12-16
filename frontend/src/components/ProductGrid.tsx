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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex-1">
          <p className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-purple-400/14 text-purple-700 border border-purple-400/35 font-semibold text-[11px] sm:text-[12px] md:text-[13px]">
            💎 Top-up categories
          </p>
          <h2 className="mt-2 mb-0.5 text-lg sm:text-xl md:text-2xl text-slate-900">
            {categoryName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            First, <span className="font-semibold text-slate-800">tap a category button</span> below, then choose your perfect pack.
          </p>
        </div>
        {categories.length > 0 && (
          <div className="flex gap-1.5 sm:gap-2 flex-wrap overflow-x-auto pb-2 sm:pb-0 bg-slate-50/80 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`inline-flex gap-1.5 sm:gap-2 items-center px-3 sm:px-3.5 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-full cursor-pointer transition-all duration-150 whitespace-nowrap text-xs sm:text-sm ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-br from-purple-500 to-violet-600 text-white border-transparent shadow-[0_10px_30px_rgba(168,85,247,0.25)]'
                    : 'border border-slate-300 bg-white text-slate-900 hover:border-purple-400/60 hover:bg-purple-50/40'
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="text-[11px] sm:text-xs opacity-80">Category</span>
                <span className="font-semibold">{cat.name}</span>
                {cat.badge ? (
                  <span className="bg-white/20 text-inherit px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                    {cat.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5 mt-3 sm:mt-3.5">
        {filtered.map((item) => (
          <article key={item.id} className="p-3 sm:p-4 rounded-[12px] sm:rounded-[14px] border border-slate-900/6 bg-gradient-to-b from-purple-50 via-violet-50/50 to-white flex flex-col gap-2 sm:gap-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-2 sm:gap-2.5">
              <div className="flex-1 min-w-0">
                <p className="m-0 text-sm font-bold truncate sm:text-base text-slate-900">{item.name}</p>
                <p className="mt-0.5 mb-0 text-xs sm:text-sm text-slate-600">
                  {item.diamonds ? `${item.diamonds} Diamonds` : 'Special item'}
                </p>
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
            <p className="mt-2 text-sm text-slate-500">If this takes too long, check your backend connection at http://localhost:5000</p>
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

