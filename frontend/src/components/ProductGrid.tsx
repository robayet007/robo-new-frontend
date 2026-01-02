import { useNavigate } from 'react-router-dom';
import type { Category } from '../types';

function ProductGrid({ categories }: { categories: Category[] }) {

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

  const navigate = useNavigate();

  // Sort categories: E Badge & Evo Access and Level up pass should be at the end
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
            Click on a category below to view products
          </p>
        </div>
        {sortedCategories.length > 0 && (
          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3 bg-slate-50/80 rounded-xl p-2.5 sm:p-3 md:p-4">
              {sortedCategories.map((cat) => (
                <button
                  key={cat.id}
                  className="flex flex-col gap-1.5 sm:gap-2 items-center px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg cursor-pointer transition-all duration-150 border-[2px] border-purple-300 bg-white text-slate-900 hover:border-purple-400 hover:bg-purple-50/40 hover:shadow-sm hover:scale-[1.02]"
                  onClick={() => navigate(`/category/${cat.id}`)}
                >
                  <img 
                    src={getCategoryImage(cat.name)} 
                    alt={cat.name}
                    className="object-cover rounded-lg transition-transform duration-150 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
                  />
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1 w-full">
                    <span className="font-semibold text-center text-[10px] sm:text-xs md:text-sm leading-tight px-1 text-slate-900">
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
      </div>
    </section>
  );
}

export default ProductGrid;

