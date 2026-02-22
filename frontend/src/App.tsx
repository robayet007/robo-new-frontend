import { Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import SearchBarRow from './components/SearchBarRow';
import Notice from './components/Notice';
import Hero from './components/Hero';
import SupportSection from './components/SupportSection';
import ProductGrid from './components/ProductGrid';
import Login from './components/Login';
import SignUp from './components/SignUp';
import AdminPanel from './components/AdminPanel';
import AddMoney from './components/AddMoney';
import ChangePassword from './components/ChangePassword';
import OrderHistory from './components/OrderHistory';
import NotFound from './components/NotFound';
import InstallButton from './components/InstallButton';
import SupportFab from './components/SupportFab';
import MobileBottomNav from './components/MobileBottomNav';
import RoboGameZone from './components/RoboGameZone';
import useCatalog from './hooks/useCatalog';
import useSubscriptions from './hooks/useSubscriptions';
import useAuth from './hooks/useAuth';
import useUserRole from './hooks/useUserRole';
import { useTheme } from './contexts/ThemeContext';
import { ModeratorPermissionsProvider } from './contexts/ModeratorPermissionsContext';
import { ToastProvider } from './contexts/ToastContext';
import CategoryPage from './components/CategoryPage';
import Footer from './components/Footer';
import MyAccount from './components/MyAccount';
import SendMoney from './components/SendMoney';
import Membership from './components/Membership';
import SubscriptionGrid from './components/SubscriptionGrid';
import SkeletonLoader from './components/SkeletonLoader';
import LivePurchaseStatement from './components/LivePurchaseStatement';
import ServiceWorkflow from './components/ServiceWorkflow';
import ReviewSection from './components/ReviewSection';
import { bannerApi } from './services/api';
import { preloadImages } from './utils/imagePreloader';

// ==================== MAIN APP ====================
function App() {
  const catalog = useCatalog();
  const subscriptions = useSubscriptions();
  const { user, logout, loading: authLoading } = useAuth();
  const { isAdmin } = useUserRole();
  const { livePurchaseStatementEnabled, topUpCategoriesEnabled, subscriptionsEnabled, reviewSectionEnabled, topUpCategoriesBadge, topUpCategoriesHeading, subscriptionsBadge, subscriptionsHeading } = useTheme();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') ?? undefined;
  const isAdminRoute = location.pathname === '/admin';
  const isPurchaseRoute = location.pathname.startsWith('/category/');
  const hideSearchBar = location.pathname === '/service-workflow' || isPurchaseRoute;
  const authLoadingElement = (
    <div className="max-w-6xl p-4 mx-auto mt-4 sm:mt-6 md:mt-8 sm:p-6">
      <div className="flex items-center justify-center py-12">
        <div
          className="w-12 h-12 border-4 rounded-full border-t-transparent animate-spin"
          style={{ borderColor: 'var(--theme-primary)' }}
        ></div>
      </div>
    </div>
  );
  
  
  // Preload banner images when catalog data is ready (non-blocking)
  useEffect(() => {
    if (!catalog.loading) {
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
  }, [catalog.loading]);
  
  // some changesw
  // Only show full page loading for catalog (products/categories)
  // Auth and role loading are non-blocking - they load in background
  if (catalog.loading) {
    return (
      <div className="max-w-[1380px] mx-auto px-3 sm:px-4 md:px-6 pt-1 sm:pt-2 md:pt-3 pb-4 sm:pb-6 md:pb-12 min-h-screen">
        {!isAdminRoute && <Navbar />}
        <Notice />
        <SkeletonLoader />
        {catalog.error && (
          <div className="p-4 mt-4 border border-red-200 rounded-lg bg-red-50">
            <p className="text-sm text-red-600">{catalog.error}</p>
          </div>
        )}
      </div>
    );
  }


  return (
    <>
      {!isAdminRoute && (
        <div className="max-w-[1380px] mx-auto px-3 sm:px-4 md:px-6 pt-1 sm:pt-2 md:pt-3 pb-44 sm:pb-6 md:pb-12 min-h-screen">
          <Navbar />
          {!hideSearchBar && <SearchBarRow />}
          <Routes>
            {/* Always accessible routes */}
            <Route path="/robo-game-zone" element={<RoboGameZone />} />
            
            {/* Login and Signup routes always accessible */}
            <Route
              path="/login"
              element={
                authLoading ? (
                  authLoadingElement
                ) : user ? (
                  <Navigate to="/" replace />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/signup"
              element={
                authLoading ? (
                  authLoadingElement
                ) : user ? (
                  <Navigate to="/" replace />
                ) : (
                  <SignUp />
                )
              }
            />
            
            {/* User account routes - always accessible */}
            <Route
              path="/membership"
              element={
                authLoading ? (
                  <div className="max-w-6xl p-4 mx-auto mt-4 sm:mt-6 md:mt-8 sm:p-6">
                    <div className="flex items-center justify-center py-12">
                      <div
                        className="w-12 h-12 border-4 rounded-full border-t-transparent animate-spin"
                        style={{ borderColor: 'var(--theme-primary)' }}
                      ></div>
                    </div>
                  </div>
                ) : user ? (
                  <Membership />
                ) : (
                  <Navigate to="/login" replace state={{ from: '/membership' }} />
                )
              }
            />
            <Route
              path="/my-account"
              element={
                authLoading ? (
                  authLoadingElement
                ) : user ? (
                  <MyAccount />
                ) : (
                  <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
                )
              }
            />
            <Route path="/add-money" element={<AddMoney />} />
            <Route
              path="/send-money"
              element={
                authLoading ? (
                  authLoadingElement
                ) : user ? (
                  <SendMoney />
                ) : (
                  <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
                )
              }
            />
            <Route
              path="/change-password"
              element={
                authLoading ? (
                  authLoadingElement
                ) : user ? (
                  <ChangePassword />
                ) : (
                  <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
                )
              }
            />
            <Route
              path="/orders"
              element={
                authLoading ? (
                  authLoadingElement
                ) : user ? (
                  <OrderHistory />
                ) : (
                  <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
                )
              }
            />
            
            {/* Root route */}
            <Route
              path="/"
              element={
                <>
                  <Notice />
                  <Hero />
                  <SupportSection />
                  {topUpCategoriesEnabled && <ProductGrid categories={catalog.categories} badgeText={topUpCategoriesBadge} headingText={topUpCategoriesHeading} searchQuery={searchQuery} />}
                  {subscriptionsEnabled && <SubscriptionGrid products={subscriptions.products} badgeText={subscriptionsBadge} headingText={subscriptionsHeading} />}
                  {livePurchaseStatementEnabled && <LivePurchaseStatement />}
                  {reviewSectionEnabled && <ReviewSection />}
                  <Footer />
                </>
              }
            />
            <Route
              path="/service-workflow"
              element={
                <>
                  <ServiceWorkflow />
                  <Footer />
                </>
              }
            />
            
            {/* Shopping/browsing routes */}
            <Route 
              path="/category/:categoryId" 
              element={<CategoryPage categories={catalog.categories} products={catalog.products} />} 
            />
            {/* Catch-all for unmatched routes - must be last */}
            <Route 
              path="*" 
              element={<NotFound />} 
            />
          </Routes>
          <InstallButton />
          <MobileBottomNav />
          <SupportFab />
        </div>
      )}
      {isAdminRoute && (
        <ModeratorPermissionsProvider>
          <Routes>
            <Route
              path="/admin"
              element={
                authLoading ? (
                  authLoadingElement
                ) : user && isAdmin ? (
                  <ToastProvider>
                    <AdminPanel onLogout={logout} />
                  </ToastProvider>
                ) : user ? (
                  <NotFound />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </ModeratorPermissionsProvider>
      )}
    </>
  );
}

export default App;
