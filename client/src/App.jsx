import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import ProductDetails from './pages/ProductDetails';

import PublicRoute from './components/PublicRoute';

import {
  searchProducts,
  recordInteraction,
  getUserInteractions,
  getRecommendations,
  recordSearch,
} from './services/api';

import './index.css';

// =========================================================
// PROTECTED ROUTE
// =========================================================

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading,loggingOut } = useAuth();

  if (loading || loggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-gray-600 text-sm">
            {loggingOut ? 'Logging out...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }


  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// =========================================================
// STYLESENSE APP
// =========================================================

function StyleSenseApp() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
const [searchLoading, setSearchLoading] = useState(false);
  const hasSearched = useRef(false);

  const { user } = useAuth();

  const [userInteractions, setUserInteractions] = useState([]);

  // =========================================================
  // PAGE
  // =========================================================

  const [page, setPage] = useState(
    sessionStorage.getItem('stylesense_page') || 'home'
  );

  // =========================================================
  // SELECTED PRODUCT
  // =========================================================

  const [selectedProduct, setSelectedProduct] = useState(() => {
    const savedProduct = sessionStorage.getItem(
      'stylesense_selected_product'
    );

    if (!savedProduct) {
      return null;
    }

    try {
      return JSON.parse(savedProduct);
    } catch (error) {
      console.error('Failed to restore selected product:', error);
      return null;
    }
  });

  // =========================================================
  // SEARCH QUERY
  // =========================================================

  const [query, setQuery] = useState('');

  // =========================================================
  // USER
  // =========================================================

  const userId = String(user.user_id);
  const sessionId = 'session_' + userId;

  // =========================================================
  // CHANGE PAGE
  // =========================================================

  const changePage = (newPage) => {
    sessionStorage.setItem('stylesense_page', newPage);

    if (newPage === 'home') {
      setQuery('');
      setSelectedProduct(null);

      sessionStorage.removeItem(
        'stylesense_selected_product'
      );
    }

    setPage(newPage);
  };

  // =========================================================
  // OPEN PRODUCT DETAILS
  // =========================================================

  const openProduct = (product) => {
    if (!product) {
      return;
    }

    setSelectedProduct(product);

    sessionStorage.setItem(
      'stylesense_selected_product',
      JSON.stringify(product)
    );

    sessionStorage.setItem(
      'stylesense_page',
      'product'
    );

    setPage('product');
  };


  // =========================================================
  // LOAD DASHBOARD PRODUCTS
  // =========================================================

const dashboardLoadedRef = useRef(false);

useEffect(() => {
  const loadDashboardProducts = async () => {
    if (!userId) return;
    if (dashboardLoadedRef.current) return;

    try {
      dashboardLoadedRef.current = true;
      setLoading(true);

      console.log(
        "🔥 Loading recommendations for user:",
        userId
      );

      const data = await getRecommendations(userId);

      console.log(
        "🔥 Recommendation response:",
        data
      );

      if (data?.products?.length > 0) {
        setProducts(data.products);
      } else {
        console.warn(
          "❌ Recommendation system returned no products"
        );
        setProducts([]);
      }

    } catch (error) {
      console.error(
        "❌ Failed to load dashboard recommendations:",
        error
      );

      dashboardLoadedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  loadDashboardProducts();
}, [userId]);

  // =========================================================
  // SEARCH
  // =========================================================

  const handleSearch = async (searchQuery) => {
  const trimmedQuery = searchQuery?.trim();

  if (!trimmedQuery) {
    return;
  }

  console.log('========== SEARCH STARTED ==========');
  console.log('Query:', trimmedQuery);
  console.log('User ID:', userId);

  hasSearched.current = true;

  setQuery(trimmedQuery);

  // Stay on Home
  setPage('home');
  sessionStorage.setItem('stylesense_page', 'home');

  setSelectedProduct(null);
  sessionStorage.removeItem('stylesense_selected_product');

  // Search has its own loading state
  setSearchLoading(true);

  try {
    const data = await searchProducts(
      trimmedQuery,
      userId
    );

    console.log('========== SEARCH RESPONSE ==========');
    console.log('Response:', data);
    console.log('Products:', data?.products);
    console.log('Product count:', data?.products?.length);

    if (data?.products) {
      setProducts(data.products);
    } else {
      setProducts([]);
    }
  } catch (error) {
    console.error('Search failed:', error);
    setProducts([]);
  } finally {
    setSearchLoading(false);
  }

  // Record search separately
  recordSearch({
    user_id: userId,
    query: trimmedQuery,
  }).catch((error) => {
    console.error(
      'Failed to record search history:',
      error
    );
  });
};
  // =========================================================
  // INTERACTION
  // =========================================================

  const handleInteraction = async (
    product,
    interactionType,
    dwellTime = 0
  ) => {
    console.log(
      '========== APP INTERACTION =========='
    );

    console.log('product:', product);
    console.log('product.id:', product?.id);
    console.log(
      'interactionType:',
      interactionType
    );
    console.log(
      'dwellTime:',
      dwellTime
    );

    try {
      await recordInteraction({
        user_id: userId,
        product_id: String(product.id),
        session_id: sessionId,
        interaction_type: interactionType,
        dwell_time_ms: dwellTime,
      });

      // Keep local wishlist/cart state updated
      if (
        interactionType === 'add_to_wishlist' ||
        interactionType === 'remove_from_wishlist' ||
        interactionType === 'add_to_cart' ||
        interactionType === 'remove_from_cart'
      ) {
        setUserInteractions((previous) => [
          ...previous,
          {
            product_id: String(product.id),
            interaction_type: interactionType,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error(
        'Interaction failed:',
        error
      );
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      {/* =====================================================
                          HOME
      ====================================================== */}

      {page === 'home' && (
        <Dashboard
          products={products}
          loading={loading || searchLoading}
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          onInteraction={handleInteraction}
          userInteractions={userInteractions}
          onWishlist={() =>
            changePage('wishlist')
          }
          onCart={() =>
            changePage('cart')
          }
          onHome={() =>
            changePage('home')
          }
          onProductClick={openProduct}
          page={page}
        />
      )}

      {/* =====================================================
                      PRODUCT DETAILS
      ====================================================== */}

      {page === 'product' && selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          onWishlist={() =>
            changePage('wishlist')
          }
          onCart={() =>
            changePage('cart')
          }
          onHome={() =>
            changePage('home')
          }
          page={page}
          onInteraction={handleInteraction}
        />
      )}

      {/* =====================================================
                          WISHLIST
      ====================================================== */}

      {page === 'wishlist' && (
        <Wishlist
          userId={userId}
          products={products}
          userInteractions={userInteractions}
          onInteraction={handleInteraction}
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          onWishlist={() =>
            changePage('wishlist')
          }
          onCart={() =>
            changePage('cart')
          }
          onHome={() =>
            changePage('home')
          }
          onProductClick={openProduct}
          page={page}
        />
      )}

      {/* =====================================================
                            CART
      ====================================================== */}

      {page === 'cart' && (
        <Cart
          userId={userId}
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          onInteraction={handleInteraction}
          onWishlist={() =>
            changePage('wishlist')
          }
          onCart={() =>
            changePage('cart')
          }
          onHome={() =>
            changePage('home')
          }
          onProductClick={openProduct}
          page={page}
        />
      )}
    </>
  );
}

// =========================================================
// APP
// =========================================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* REGISTER */}

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* PROTECTED APPLICATION */}

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <StyleSenseApp />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
