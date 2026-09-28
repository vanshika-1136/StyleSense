import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import Wishlist from './pages/Wishlist';

import {
  searchProducts,
  recordInteraction,
  getUserInteractions,
} from './services/api';

import './index.css';

function App() {
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(false);

  const [userInteractions, setUserInteractions] = useState([]);
  const [page, setPage] = useState('wishlist');

  // =========================================================
  // USER / SESSION
  // =========================================================

  // const userId = 'user_0001';

  // const sessionId = 'session_' + userId;

  const getUserId = () => {
    let userId = localStorage.getItem("stylesense_user_id");

    if (!userId) {
        userId = "user_" + crypto.randomUUID();

        localStorage.setItem(
            "stylesense_user_id",
            userId
        );
    }

    return userId;
};

const userId = getUserId();
 const sessionId = 'session_' + userId;
  // =========================================================
  // LOAD USER INTERACTIONS
  // =========================================================

  useEffect(() => {
    const loadUserInteractions = async () => {
      try {
        const result = await getUserInteractions(userId);

        setUserInteractions(result.interactions || []);
      } catch (error) {
        console.error('Failed to load user state:', error);
      }
    };

    loadUserInteractions();
  }, []);

  // =========================================================
  // SEARCH
  // =========================================================

  const handleSearch = async (query) => {
    if (!query.trim()) return;

    try {
      setLoading(true);

      const data = await searchProducts(query, userId);

      if (data?.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RECORD INTERACTION
  // =========================================================

  const handleInteraction = async (product, interactionType, dwellTime = 0) => {
    try {
      // -----------------------------------------------
      // Save interaction to Neon
      // -----------------------------------------------

      await recordInteraction({
        user_id: userId,

        product_id: String(product.id),

        session_id: sessionId,

        interaction_type: interactionType,

        dwell_time_ms: dwellTime,
      });

      // -----------------------------------------------
      // Update React state immediately
      // -----------------------------------------------

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
      {page === 'home' ? (
        <Dashboard
          products={products}

          loading={loading}

          onSearch={handleSearch}

          onInteraction={handleInteraction}

          userInteractions={userInteractions}
          onWishlist={() => setPage('wishlist')}
        />
      ) : (
        <Wishlist
          userId={userId}
          products={products}
          userInteractions={userInteractions}
          onInteraction={handleInteraction}
        />
      )}

      {/* SEARCH LOADING */}

      {loading && (
        <div
          className="
                        fixed
                        bottom-6
                        right-6
                        bg-black
                        text-white
                        px-5
                        py-3
                        rounded-full
                        shadow-xl
                        text-sm
                        z-50
                    "
        >
          Finding your style...
        </div>
      )}
    </>
  );
}

export default App;
