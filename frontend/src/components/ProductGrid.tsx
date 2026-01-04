import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { dealApi } from '../services/api';
import type { Category, Deal } from '../types';

function ProductGrid({ categories }: { categories: Category[] }) {
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

  // Group categories by deals
  const categoriesByDeal = deals.map(deal => ({
    deal,
    categories: categories.filter(cat => cat.dealId === deal.id)
  }));

  // Categories without a deal
  const categoriesWithoutDeal = categories.filter(cat => !cat.dealId || !deals.find(d => d.id === cat.dealId));

  return (
    <section id="diamonds" className="mt-4 sm:mt-5 md:mt-7 p-3 sm:p-4 md:p-6 rounded-[12px] sm:rounded-[16px] md:rounded-[18px] bg-white border border-slate-900/6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex-1">
          <p className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-purple-400/14 text-purple-700 border border-purple-400/35 font-semibold text-[11px] sm:text-[12px] md:text-[13px]">
            💎 Top-up categories
          </p>
          <h2 className="mt-2 mb-1 text-lg sm:text-xl md:text-2xl text-slate-900">
            Browse Categories
          </h2>
          <p className="mb-2 text-xs sm:text-sm text-slate-600">
            অফার দেখতে নিচের ক্যাটাগরিতে ক্লিক করুন
          </p>
        </div>
        {/* Render categories grouped by deals */}
        {categoriesByDeal.map(({ deal, categories: dealCategories }) => (
          dealCategories.length > 0 && (
            <div key={deal.id} className="w-full">
              <h3 className="text-center text-lg sm:text-xl md:text-2xl font-bold text-purple-600 mb-3 sm:mb-4">
                {deal.name}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3 bg-slate-50/80 rounded-xl p-2.5 sm:p-3 md:p-4">
                {dealCategories.map((cat) => (
                  <button
                    key={cat.id}
                    className="flex flex-col rounded-lg cursor-pointer transition-all duration-150 border-[2px] border-purple-300 bg-white text-slate-900 hover:border-purple-400 hover:shadow-md hover:scale-[1.02] overflow-hidden"
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigate(`/category/${cat.id}`);
                    }}
                  >
                    <div className="w-full aspect-square overflow-hidden">
                      <img 
                        src={getCategoryImage(cat)} 
                        alt={cat.name}
                        className="object-cover w-full h-full transition-transform duration-150 hover:scale-105"
                        onError={(e) => {
                          // Fallback to default image if custom image fails to load
                          (e.target as HTMLImageElement).src = '/diamond-top-up.png';
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-0.5 sm:gap-1 w-full px-2 py-2 sm:py-2.5">
                      <span className="font-semibold text-center text-[10px] sm:text-xs md:text-sm leading-tight text-slate-900">
                        {cat.name}
                      </span>
                      {cat.badge ? (
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-purple-100 text-purple-700">
                          {cat.badge}
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        ))}

        {/* Categories without a deal */}
        {categoriesWithoutDeal.length > 0 && (
          <div className="w-full mt-6 sm:mt-8">
            <h3 className="text-center text-lg sm:text-xl md:text-2xl font-bold text-purple-600 mb-3 sm:mb-4">
              Other Categories
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3 bg-slate-50/80 rounded-xl p-2.5 sm:p-3 md:p-4">
              {categoriesWithoutDeal.map((cat) => (
                <button
                  key={cat.id}
                  className="flex flex-col rounded-lg cursor-pointer transition-all duration-150 border-[2px] border-purple-300 bg-white text-slate-900 hover:border-purple-400 hover:shadow-md hover:scale-[1.02] overflow-hidden"
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigate(`/category/${cat.id}`);
                  }}
                >
                  <div className="w-full aspect-square overflow-hidden">
                    <img 
                      src={getCategoryImage(cat)} 
                      alt={cat.name}
                      className="object-cover w-full h-full transition-transform duration-150 hover:scale-105"
                      onError={(e) => {
                        // Fallback to default image if custom image fails to load
                        (e.target as HTMLImageElement).src = '/diamond-top-up.png';
                      }}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1 w-full px-2 py-2 sm:py-2.5">
                    <span className="font-semibold text-center text-[10px] sm:text-xs md:text-sm leading-tight text-slate-900">
                      {cat.name}
                    </span>
                    {cat.badge ? (
                      <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-purple-100 text-purple-700">
                        {cat.badge}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Show message if no categories */}
        {categories.length === 0 && (
          <div className="w-full mt-6 sm:mt-8">
            <p className="text-center text-xs sm:text-sm text-slate-500">
              No categories available yet
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductGrid;

