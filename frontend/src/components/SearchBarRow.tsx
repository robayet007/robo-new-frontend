import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

function SearchBarRow() {
  const { navbarSearchEnabled, navbarSearchPlaceholder } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') ?? '');

  useEffect(() => {
    setSearchQuery(searchParams.get('search') ?? '');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/?search=${encodeURIComponent(q)}`);
    } else {
      navigate('/');
    }
  };

  if (!navbarSearchEnabled) {
    return null;
  }

  return (
    <div className="mb-1 sm:mb-1.5 md:mb-2">
      <form onSubmit={handleSearchSubmit} className="w-full max-w-xl mx-auto">
        <div
          className="flex items-center w-full rounded-lg sm:rounded-xl border border-slate-200 shadow-md hover:shadow-lg focus-within:ring-2 focus-within:border-transparent focus-within:shadow-lg transition-shadow overflow-hidden"
          style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
        >
          <span className="pl-3 text-slate-400 shrink-0" aria-hidden>
            <FaSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={navbarSearchPlaceholder || 'Search games...'}
            className="flex-1 min-w-0 px-2.5 py-1 sm:py-1.5 text-sm border-0 focus:outline-none focus:ring-0 bg-transparent"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg shrink-0 transition-all m-1.5"
            style={{
              background: `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`
            }}
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
}

export default SearchBarRow;
