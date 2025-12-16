import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="max-w-md mx-auto mt-8 p-6 rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h2>
        <p className="text-slate-600 mb-6">
          The page you're looking for doesn't exist or you don't have permission to access it.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold hover:from-purple-600 hover:to-violet-700 transition-all duration-200 shadow-lg shadow-purple-500/30"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;









