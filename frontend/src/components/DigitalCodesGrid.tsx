import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { dealApi } from '../services/api';
import type { Deal } from '../types';
import type { BackendDigitalCodeCategory } from '../types';

function DigitalCodesGrid({ categories, badgeText, headingText }: { categories: BackendDigitalCodeCategory[]; badgeText?: string; headingText?: string }) {
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    const loadDeals = async () => {
      try {
        // Load deals only (categories come from props)
        const dealsResponse = await dealApi.getAll();
        if (dealsResponse.success && Array.isArray(dealsResponse.data)) {
          const sortedDeals = dealsResponse.data
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

  const navigate = useNavigate();

  // Filter active categories
  const activeCategories = categories.filter(cat => cat.isActive);

  // Group categories by deals
  const categoriesByDeal = deals.map(deal => ({
    deal,
    categories: activeCategories.filter(cat => cat.dealId === deal.id)
  }));

  // Categories without a deal
  const categoriesWithoutDeal = activeCategories.filter(cat => !cat.dealId || !deals.find(d => d.id === cat.dealId));

  if (activeCategories.length === 0) {
    return null; // Don't show section if no categories
  }

  return (
    <section id="digital-codes" className="mt-4 sm:mt-5 md:mt-7 p-3 sm:p-4 md:p-6 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] bg-white border border-slate-900/6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
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
            {badgeText || '🔑 Digital Codes'}
          </p>
          <h2 className="mt-2 mb-1 text-lg sm:text-xl md:text-2xl text-slate-900">
            {headingText || 'Digital Codes Categories'}
          </h2>
          <p className="mb-2 text-xs sm:text-sm text-slate-600">
            ডিজিটাল কোড দেখতে নিচের ক্যাটাগরিতে ক্লিক করুন
          </p>
        </div>
        {/* Render categories grouped by deals */}
        {categoriesByDeal
          .filter(({ categories: dealCategories }) => dealCategories.length > 0)
          .map(({ deal, categories: dealCategories }) => (
            <div key={deal.id} className="w-full">
              <h3
                className="text-center text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4"
                style={{ color: 'var(--theme-primary)' }}
              >
                {deal.name}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3 bg-slate-50/80 rounded-xl p-2.5 sm:p-3 md:p-4">
                {dealCategories.map((cat) => (
                  <button
                    key={cat.id}
                    className="flex flex-col rounded-lg cursor-pointer transition-all duration-150 border-[2px] bg-white text-slate-900 hover:scale-[1.02] overflow-hidden"
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
                      navigate(`/digital-codes/category/${cat.id}`);
                    }}
                  >
                    <div className="w-full aspect-square overflow-hidden">
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
                      <span className="font-semibold text-center text-[10px] sm:text-xs md:text-sm leading-tight text-slate-900">
                        {cat.name}
                      </span>
                      {cat.badge ? (
                        <span
                          className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold"
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
              className="text-center text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4"
              style={{ color: 'var(--theme-primary)' }}
            >
              Other Categories
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3 bg-slate-50/80 rounded-xl p-2.5 sm:p-3 md:p-4">
              {categoriesWithoutDeal.map((cat) => (
                <button
                  key={cat.id}
                  className="flex flex-col rounded-lg cursor-pointer transition-all duration-150 border-[2px] bg-white text-slate-900 hover:scale-[1.02] overflow-hidden"
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
                    navigate(`/digital-codes/category/${cat.id}`);
                  }}
                >
                  <div className="w-full aspect-square overflow-hidden">
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
                    <span className="font-semibold text-center text-[10px] sm:text-xs md:text-sm leading-tight text-slate-900">
                      {cat.name}
                    </span>
                    {cat.badge ? (
                      <span
                        className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold"
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
      </div>
    </section>
  );
}

export default DigitalCodesGrid;
