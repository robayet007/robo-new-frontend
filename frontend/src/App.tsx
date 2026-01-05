import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Notice from './components/Notice';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import Steps from './components/Steps';
import Login from './components/Login';
import SignUp from './components/SignUp';
import AdminPanel from './components/AdminPanel';
import Checkout from './components/Checkout';
import AddMoney from './components/AddMoney';
import ChangePassword from './components/ChangePassword';
import OrderHistory from './components/OrderHistory';
import NotFound from './components/NotFound';
import InstallButton from './components/InstallButton';
import WhatsAppButton from './components/WhatsAppButton';
import RoboGameZone from './components/RoboGameZone';
import useCatalog from './hooks/useCatalog';
import useAuth from './hooks/useAuth';
import useUserRole from './hooks/useUserRole';
import { useRoboGameZone } from './contexts/RoboGameZoneContext';
import FFIdInfo from './components/FFIdInfo';
import CategoryPage from './components/CategoryPage';
import Footer from './components/Footer';
import RulesAndServices from './components/RulesAndServices';
import MyAccount from './components/MyAccount';

// ==================== MAIN APP ====================
function App() {
  const catalog = useCatalog();
  const { user, logout } = useAuth();
  const { isAdmin } = useUserRole();
  const { isRoboGameZoneEnabled } = useRoboGameZone();
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin';
  const isRoboGameZoneRoute = location.pathname === '/robo-game-zone';
  const isLoginSignupRoute = location.pathname === '/login' || location.pathname === '/signup';
  
  // If toggle is ON and not on allowed routes, redirect to robo-game-zone
  const shouldRedirectToRoboGameZone = isRoboGameZoneEnabled && 
    !isAdminRoute && 
    !isRoboGameZoneRoute && 
    !isLoginSignupRoute;
  
  // some changesw
  // Only show full page loading for catalog (products/categories)
  // Auth and role loading are non-blocking - they load in background
  if (catalog.loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-12 min-h-screen">
        {!isAdminRoute && <Navbar />}
        <Notice />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600">Loading products...</p>
          {catalog.error && <p className="text-red-600 mt-2 text-sm">{catalog.error}</p>}
        </div>
      </div>
    );
  }

  // Redirect to robo-game-zone if toggle is ON and on restricted route
  if (shouldRedirectToRoboGameZone) {
    return <Navigate to="/robo-game-zone" replace />;
  }

  return (
    <>
      {!isAdminRoute && (
        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-12 min-h-screen">
          <Navbar />
          <Routes>
            <Route path="/robo-game-zone" element={<RoboGameZone />} />
            {/* Login and Signup routes always accessible */}
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
            {/* Other routes only accessible when toggle is OFF */}
            {!isRoboGameZoneEnabled && (
              <>
                <Route
                  path="/"
                  element={
                    <>
                      <Notice />
                      <Hero />
                      <ProductGrid 
                        categories={catalog.categories} 
                      />
                      <Steps />
                      <RulesAndServices />
                      <Footer />
                    </>
                  }
                />
                <Route path="/checkout" element={<Checkout products={catalog.products} />} />
                <Route 
                  path="/category/:categoryId" 
                  element={<CategoryPage categories={catalog.categories} products={catalog.products} />} 
                />
                <Route path="/add-money" element={<AddMoney />} />
                <Route
                  path="/change-password"
                  element={
                    user ? (
                      <ChangePassword />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="/orders"
                  element={
                    user ? (
                      <OrderHistory />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="/my-account"
                  element={
                    user ? (
                      <MyAccount />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="/ff-info"
                  element={
                    user ? (
                      <FFIdInfo />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route path="*" element={<NotFound />} />
              </>
            )}
            {/* Catch-all for when toggle is ON */}
            {isRoboGameZoneEnabled && (
              <Route path="*" element={<Navigate to="/robo-game-zone" replace />} />
            )}
          </Routes>
          {!isRoboGameZoneEnabled && (
            <>
              <InstallButton />
              <WhatsAppButton />
            </>
          )}
        </div>
      )}
      <Routes>
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
      </Routes>
    </>
  );
}

export default App;
