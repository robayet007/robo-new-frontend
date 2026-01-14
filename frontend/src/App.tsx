import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Notice from './components/Notice';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
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
import useDigitalCodes from './hooks/useDigitalCodes';
import useAuth from './hooks/useAuth';
import useUserRole from './hooks/useUserRole';
import { useRoboGameZone } from './contexts/RoboGameZoneContext';
import FFIdInfo from './components/FFIdInfo';
import CategoryPage from './components/CategoryPage';
import Footer from './components/Footer';
import Niyom from './Niyom';
import MyAccount from './components/MyAccount';
import SendMoney from './components/SendMoney';
import DigitalCodesGrid from './components/DigitalCodesGrid';
import DigitalCodeCategoryPage from './components/DigitalCodeCategoryPage';
import SkeletonLoader from './components/SkeletonLoader';
import { bannerApi } from './services/api';
import { preloadImages } from './utils/imagePreloader';

// ==================== MAIN APP ====================
function App() {
  const catalog = useCatalog();
  const digitalCodes = useDigitalCodes();
  const { user, logout } = useAuth();
  const { isAdmin } = useUserRole();
  const { isRoboGameZoneEnabled } = useRoboGameZone();
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin';
  const isRoboGameZoneRoute = location.pathname === '/robo-game-zone';
  const isLoginSignupRoute = location.pathname === '/login' || location.pathname === '/signup';
  
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:35',message:'Location and route state',data:{pathname:location.pathname,isAdminRoute,isRoboGameZoneEnabled,catalogLoading:catalog.loading,shouldRenderMainRoutes:!isAdminRoute},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
  // #endregion
  
  // Preload banner images when catalog data is ready (non-blocking)
  useEffect(() => {
    if (!catalog.loading && !digitalCodes.loading) {
      const loadBanners = async () => {
        try {
          const response = await bannerApi.getAll();
          if (response.success && response.data && Array.isArray(response.data)) {
            const bannerImageUrls = response.data
              .map((banner: { image?: string }) => banner.image)
              .filter((url: string | undefined): url is string => Boolean(url));
            
            if (bannerImageUrls.length > 0) {
              preloadImages(bannerImageUrls).catch(() => {
                // Errors are handled in preloadImages, just catch to prevent unhandled rejection
              });
            }
          }
        } catch (error) {
          // Silently fail - banner preloading is not critical
          if (import.meta.env.DEV) {
            console.warn('Failed to preload banner images:', error);
          }
        }
      };
      
      loadBanners();
    }
  }, [catalog.loading, digitalCodes.loading]);
  
  // If toggle is ON and not on allowed routes, redirect to robo-game-zone
  const shouldRedirectToRoboGameZone = isRoboGameZoneEnabled && 
    !isAdminRoute && 
    !isRoboGameZoneRoute && 
    !isLoginSignupRoute;
  
  // some changesw
  // Only show full page loading for catalog (products/categories) and digital codes
  // Auth and role loading are non-blocking - they load in background
  // Wait for both catalog and digitalCodes to load before rendering website
  if (catalog.loading || digitalCodes.loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-12 min-h-screen">
        {!isAdminRoute && <Navbar />}
        <Notice />
        <SkeletonLoader />
        {(catalog.error || digitalCodes.error) && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{catalog.error || digitalCodes.error}</p>
          </div>
        )}
      </div>
    );
  }

  // Redirect to robo-game-zone if toggle is ON and on restricted route
  if (shouldRedirectToRoboGameZone) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:66',message:'Redirecting to robo-game-zone',data:{pathname:location.pathname,shouldRedirectToRoboGameZone},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return <Navigate to="/robo-game-zone" replace />;
  }

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:70',message:'Rendering main routes',data:{pathname:location.pathname,isAdminRoute,willRenderMainRoutes:!isAdminRoute},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  return (
    <>
      {!isAdminRoute && (
        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-12 min-h-screen">
          <Navbar />
          {/* #region agent log */}
          {(() => { fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:75',message:'Main Routes component rendering',data:{pathname:location.pathname,routeCount:'multiple',hasLoginRoute:true,hasRootRoute:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{}); return null; })()}
          {/* #endregion */}
          <Routes>
            {/* Always accessible routes */}
            <Route path="/robo-game-zone" element={<RoboGameZone />} />
            
            {/* Login and Signup routes always accessible */}
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to={isRoboGameZoneEnabled ? "/robo-game-zone" : "/"} replace />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/signup"
              element={
                user ? (
                  <Navigate to={isRoboGameZoneEnabled ? "/robo-game-zone" : "/"} replace />
                ) : (
                  <SignUp />
                )
              }
            />
            
            {/* Root route - always exists, redirects based on toggle state */}
            <Route
              path="/"
              element={
                isRoboGameZoneEnabled ? (
                  <Navigate to="/robo-game-zone" replace />
                ) : (
                  <>
                    <Notice />
                    <Hero />
                    <ProductGrid categories={catalog.categories} />
                    <DigitalCodesGrid categories={digitalCodes.categories} />
                    <Footer />
                  </>
                )
              }
            />
            <Route
              path="/terms-tutorials"
              element={
                <>
                  <Notice />
                  <Niyom />
                  <Footer />
                </>
              }
            />
            
            {/* Other routes only accessible when toggle is OFF */}
            {!isRoboGameZoneEnabled && (
              <>
                <Route path="/checkout" element={<Checkout products={catalog.products} />} />
                <Route 
                  path="/category/:categoryId" 
                  element={<CategoryPage categories={catalog.categories} products={catalog.products} />} 
                />
                <Route 
                  path="/digital-codes/category/:categoryId" 
                  element={<DigitalCodeCategoryPage categories={digitalCodes.categories} products={digitalCodes.products} />} 
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
                  path="/send-money"
                  element={
                    user ? (
                      <SendMoney />
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
              </>
            )}
            
            {/* Catch-all for unmatched routes - must be last */}
            <Route 
              path="*" 
              element={
                isRoboGameZoneEnabled ? (
                  <Navigate to="/robo-game-zone" replace />
                ) : (
                  <NotFound />
                )
              } 
            />
          </Routes>
          {!isRoboGameZoneEnabled && (
            <>
          <InstallButton />
          <WhatsAppButton />
            </>
          )}
        </div>
      )}
      {isAdminRoute && (
        <Routes>
          {/* #region agent log */}
          {(() => { fetch('http://127.0.0.1:7244/ingest/b45ca0c1-2c74-4e93-9f95-e1bb54c72b96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:220',message:'Admin Routes component rendering',data:{pathname:location.pathname,routeCount:1,hasAdminRoute:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{}); return null; })()}
          {/* #endregion */}
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
      )}
    </>
  );
}

export default App;
