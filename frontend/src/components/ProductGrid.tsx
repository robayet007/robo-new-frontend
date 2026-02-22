import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { dealApi } from '../services/api';
import type { Category, Deal } from '../types';

function ProductGrid({ categories, badgeText, headingText, searchQuery }: { categories: Category[]; badgeText?: string; headingText?: string; searchQuery?: string }) {
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    const loadDeals = async () => {
      try {
        const response = await dealApi.getAll();
        if (response.success && Array.isArray(response.data)) {
          // Sort deals by displayOrder
          const sortedDeals = response.data
            .filter(d => d.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(d => ({
              id: d.id,
              name: d.name,
              description: d.description,
              displayOrder: d.displayOrder,
            }));
          setDeals(sortedDeals);
        }
      } catch (err) {
        console.error('Failed to load deals:', err);
      }
    };
    loadDeals();
  }, [categories]); // Reload when categories change

  // Helper function to get category image - use category.image if available, otherwise fallback to name-based logic
  const getCategoryImage = (category: Category): string => {
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

  const navigate = useNavigate();

  const q = searchQuery?.trim().toLowerCase();
  const matchCategory = (cat: Category) =>
    !q || (cat.name?.toLowerCase().includes(q) ?? false) || ((cat as { description?: string }).description?.toLowerCase().includes(q) ?? false);
  const matchDeal = (deal: Deal) =>
    !q || (deal.name?.toLowerCase().includes(q) ?? false) || (deal.description?.toLowerCase().includes(q) ?? false);

  // Group categories by deals; when searchQuery is set, filter by name/description
  let categoriesByDeal = deals.map(deal => ({
    deal,
    categories: categories.filter(cat => cat.dealId === deal.id)
  }));
  if (q) {
    categoriesByDeal = categoriesByDeal
      .map(({ deal, categories: cats }) => ({
        deal,
        categories: matchDeal(deal) ? cats : cats.filter(matchCategory)
      }))
      .filter(({ categories: cats }) => cats.length > 0);
  }

  // Categories without a deal
  let categoriesWithoutDeal = categories.filter(cat => !cat.dealId || !deals.find(d => d.id === cat.dealId));
  if (q) {
    categoriesWithoutDeal = categoriesWithoutDeal.filter(matchCategory);
  }

  return (
    <section id="diamonds" className="mt-2 sm:mt-2.5 md:mt-3.5 p-3 sm:p-4 md:p-6 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] bg-white border border-slate-900/6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex-1">
          <div className="inline-block">
            <h2
              className="text-xl font-semibold sm:text-2xl text-slate-900"
              style={{ fontFamily: 'var(--theme-font-family)' }}
            >
              {headingText || badgeText || 'Top-up Categories'}
            </h2>
            <div className="mt-1.5 space-y-1">
              <div
                className="h-0.5 rounded-full"
                style={{ width: '50%', backgroundColor: 'var(--theme-primary)' }}
              />
              <div
                className="h-0.5 rounded-full"
                style={{ width: '70%', backgroundColor: 'var(--theme-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Render categories grouped by deals */}
        {categoriesByDeal
          .filter(({ categories: dealCategories }) => dealCategories.length > 0)
          .map(({ deal, categories: dealCategories }) => (
            <div key={deal.id} className="w-full">
              <h3
                className="mb-3 text-lg font-bold text-center sm:text-xl md:text-2xl sm:mb-4"
                style={{ color: 'var(--theme-primary)' }}
              >
                {deal.name}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 bg-slate-50/80 rounded-xl p-2.5 sm:p-3 md:p-4">
                {dealCategories.map((cat) => (
                  <button
                    key={cat.id}
                    className="flex flex-col w-full rounded-lg cursor-pointer transition-all duration-150 border-[2px] bg-white text-slate-900 hover:scale-[1.02] overflow-hidden"
                    style={{
                      borderColor: 'rgba(var(--theme-primary-rgb), 0.25)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        'rgba(var(--theme-primary-rgb), 0.45)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        '0 10px 25px rgba(var(--theme-primary-rgb), 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        'rgba(var(--theme-primary-rgb), 0.25)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    }}
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigate(`/category/${cat.id}`);
                    }}
                  >
                    <div className="w-full aspect-[1.15] overflow-hidden">
                      <img
                        src={getCategoryImage(cat)}
                        alt={cat.name}
                        loading="lazy"
                        className="object-cover w-full h-full transition-transform duration-150 hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/diamond-top-up.png';
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-0.5 sm:gap-1 w-full px-2 py-2 sm:py-2.5">
                      <span className="font-medium text-center text-[9px] sm:text-[10px] md:text-xs leading-tight text-slate-900">
                        {cat.name}
                      </span>
                      {cat.badge ? (
                        <span
                          className="px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-medium"
                          style={{
                            backgroundColor: 'var(--theme-primary-light)',
                            color: 'var(--theme-primary)',
                          }}
                        >
                          {cat.badge}
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

        {/* Categories without a deal */}
        {categoriesWithoutDeal.length > 0 && (
          <div className="w-full mt-6 sm:mt-8">
            <h3
              className="mb-3 text-lg font-bold text-center sm:text-xl md:text-2xl sm:mb-4"
              style={{ color: 'var(--theme-primary)' }}
            >
              Other Categories
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 bg-slate-50/80 rounded-xl p-2.5 sm:p-3 md:p-4">
              {categoriesWithoutDeal.map((cat) => (
                <button
                  key={cat.id}
                  className="flex flex-col w-full rounded-lg cursor-pointer transition-all duration-150 border-[2px] bg-white text-slate-900 hover:scale-[1.02] overflow-hidden"
                  style={{
                    borderColor: 'rgba(var(--theme-primary-rgb), 0.25)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      'rgba(var(--theme-primary-rgb), 0.45)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      '0 10px 25px rgba(var(--theme-primary-rgb), 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      'rgba(var(--theme-primary-rgb), 0.25)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                  }}
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigate(`/category/${cat.id}`);
                  }}
                >
                  <div className="w-full aspect-[1.15] overflow-hidden">
                    <img
                      src={getCategoryImage(cat)}
                      alt={cat.name}
                      loading="lazy"
                      className="object-cover w-full h-full transition-transform duration-150 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/diamond-top-up.png';
                      }}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1 w-full px-2 py-2 sm:py-2.5">
                    <span className="font-medium text-center text-[9px] sm:text-[10px] md:text-xs leading-tight text-slate-900">
                      {cat.name}
                    </span>
                    {cat.badge ? (
                      <span
                        className="px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-medium"
                        style={{
                          backgroundColor: 'var(--theme-primary-light)',
                          color: 'var(--theme-primary)',
                        }}
                      >
                        {cat.badge}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Show message when search has no results only (no categories case handled by early return) */}
        {q && categoriesByDeal.length === 0 && categoriesWithoutDeal.length === 0 && (
          <div className="w-full mt-6 sm:mt-8">
            <p className="text-xs text-center sm:text-sm text-slate-500">
              No categories or deals match &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductGrid;

