import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';

import {
  searchProducts,
  recordInteraction,
  getUserInteractions,
  getRecommendations,
  recordSearch,
} from './services/api';

import './index.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function StyleSenseApp() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const hasSearched = useRef(false);
  const { user, logout } = useAuth();

  const [userInteractions, setUserInteractions] = useState([]);

  const [page, setPage] = useState(
    sessionStorage.getItem('stylesense_page') || 'home'
  );
const changePage = (newPage) => {
  sessionStorage.setItem('stylesense_page', newPage);

  if (newPage === 'home') {
    hasSearched.current = false;
    setQuery('');
  }

  setPage(newPage);
};
  // GLOBAL SEARCH QUERY
  const [query, setQuery] = useState('');

  // =========================================================
  // USER
  // =========================================================

  const userId = String(user.user_id);
  const sessionId = 'session_' + userId;

  // =========================================================
  // LOAD USER INTERACTIONS
  // =========================================================

  useEffect(() => {
    const loadUserInteractions = async () => {
      // Clear previous user's state immediately
      setUserInteractions([]);

      try {
        const result = await getUserInteractions(userId);

        setUserInteractions(result.interactions || []);
      } catch (error) {
        console.error('Failed to load user state:', error);
      }
    };

    loadUserInteractions();
  }, [userId]);

  // =========================================================
  // LOAD DEFAULT / TRENDING PRODUCTS
  // =========================================================

  // =========================================================
  // LOAD DASHBOARD PRODUCTS
  // New user → Trending
  // Existing user → Personalized
  // =========================================================

useEffect(() => {
  const loadDashboardProducts = async () => {
    if (hasSearched.current) {
      return;
    }

    try {
      setLoading(true);

      const data = await getRecommendations(userId);

      console.log('========== RECOMMENDATION RESPONSE ==========');
      console.log('User ID:', userId);
      console.log('Response:', data);
      console.log('Products:', data?.products);
      console.log('Product count:', data?.products?.length);

      if (hasSearched.current) {
        return;
      }

      if (data?.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Failed to load dashboard products:', error);
    } finally {
      if (!hasSearched.current) {
        setLoading(false);
      }
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

  hasSearched.current = true;

  setQuery(trimmedQuery);
  changePage('home');
  // setProducts([]);
  setLoading(true);

  try {
    const data = await searchProducts(trimmedQuery, userId);

    console.log('========== SEARCH RESPONSE ==========');
    console.log('Query:', trimmedQuery);
    console.log('User ID:', userId);
    console.log('Response:', data);
    console.log('Products:', data?.products);
    console.log('Product count:', data?.products?.length);

    if (data?.products) {
      setProducts(data.products);
    }
  } catch (error) {
    console.error('Search failed:', error);
  } finally {
    setLoading(false);
  }

  recordSearch({
    user_id: userId,
    query: trimmedQuery,
  }).catch((error) => {
    console.error('Failed to record search history:', error);
  });
};

//   useEffect(() => {
//   const trimmedQuery = query?.trim();

//   if (!trimmedQuery) {
//     return;
//   }

//   const timer = setTimeout(() => {
//     handleSearch(trimmedQuery);
//   }, 400);

//   return () => clearTimeout(timer);
// }, [query]);
  // =========================================================
  // INTERACTION
  // =========================================================

  const handleInteraction = async (product, interactionType, dwellTime = 0) => {
    console.log('========== APP INTERACTION ==========');
    console.log('product:', product);
    console.log('product.id:', product?.id);
    console.log('interactionType:', interactionType);
    console.log('dwellTime:', dwellTime);
    try {
      await recordInteraction({
        user_id: userId,
        product_id: String(product.id),
        session_id: sessionId,
        interaction_type: interactionType,
        dwell_time_ms: dwellTime,
      });

      // Keep local state updated for
      // wishlist/cart button states
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
      console.error('Interaction failed:', error);
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
          loading={loading}
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          onInteraction={handleInteraction}
          userInteractions={userInteractions}
          onWishlist={() => changePage('wishlist')}
          onCart={() => changePage('cart')}
          onHome={() => changePage('home')}
          page={page}
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

          onWishlist={() => changePage('wishlist')}
          onCart={() => changePage('cart')}
          onHome={() => changePage('home')}
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

          onWishlist={() => changePage('wishlist')}

          onCart={() => changePage('cart')}

          onHome={() => changePage('home')}
          page={page}
        />
      )}

      {/* =====================================================
          LOADING MESSAGE
      ====================================================== */}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

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
