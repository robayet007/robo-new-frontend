import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import Steps from './components/Steps';
import Login from './components/Login';
import SignUp from './components/SignUp';
import AdminPanel from './components/AdminPanel';
import Checkout from './components/Checkout';
import AddMoney from './components/AddMoney';
import NotFound from './components/NotFound';
import InstallButton from './components/InstallButton';
import useCatalog from './hooks/useCatalog';
import useAuth from './hooks/useAuth';
import useUserRole from './hooks/useUserRole';

// ==================== MAIN APP ====================
function App() {
  const catalog = useCatalog();
  const { user, loading: authLoading, logout } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  // Only show full page loading for catalog (products/categories)
  // Auth and role loading are non-blocking - they load in background
  if (catalog.loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-12 min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600">Loading products...</p>
          {catalog.error && <p className="text-red-600 mt-2 text-sm">{catalog.error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-12 min-h-screen">
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero />
              <ProductGrid 
                categories={catalog.categories} 
                products={catalog.products} 
              />
              <Steps />
            </>
          }
        />
        <Route path="/checkout" element={<Checkout products={catalog.products} />} />
        <Route path="/add-money" element={<AddMoney />} />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/signup"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <SignUp />
            )
          }
        />
        <Route
          path="/admin"
          element={
            user && isAdmin ? (
              <AdminPanel onLogout={logout} />
            ) : user ? (
              <NotFound />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer className="mt-4 sm:mt-5 md:mt-7 text-slate-600 text-center text-xs sm:text-sm px-3">
        <p>Robo Top Up — All data stored in MongoDB database</p>
      </footer>
      <InstallButton />
    </div>
  );
}

export default App;
