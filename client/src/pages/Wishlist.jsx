import { useEffect, useState } from 'react';

import ProductCard from '../components/ProductCard';

import { getWishlist } from '../services/api';

import Navbar from '../components/Navbar';

function Wishlist({
  userId,
  userInteractions = [],
  onInteraction,
  onWishlist,
  onCart,
  onHome,
  query = '',
  setQuery,
  onSearch,
  page,
}) {
  const [wishlistProducts, setWishlistProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  // =========================================================
  // LOAD WISHLIST
  // =========================================================

  const loadWishlist = async () => {
    try {
      setLoading(true);

      const result = await getWishlist(userId);

      console.log('WISHLIST RESPONSE:', result);

      setWishlistProducts(result.products || []);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadWishlist();
  }, [userId]);

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <Navbar
        query={query}
        setQuery={setQuery}
        onSearch={onSearch}
        onWishlist={onWishlist}
        onCart={onCart}
        onHome={onHome}
        page={page}
      />

      {/* =====================================================
          PAGE CONTENT
      ===================================================== */}

      <main
        className="
          max-w-7xl
          mx-auto
          px-6
          py-10
        "
      >
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-8">
          <h1
            className="
              text-3xl
              font-bold
              text-gray-900
            "
          >
            My Wishlist
          </h1>

          <p
            className="
              text-gray-500
              mt-2
            "
          >
            {wishlistProducts.length}{' '}
            {wishlistProducts.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading && (
          <div
            className="
              py-20
              text-center
              text-gray-500
            "
          >
            Loading your wishlist...
          </div>
        )}

        {/* ===================================================
            EMPTY WISHLIST
        =================================================== */}

        {!loading && wishlistProducts.length === 0 && (
          <div
            className="
                bg-white
                rounded-2xl
                border
                border-gray-100
                p-16
                text-center
              "
          >
            <div
              className="
                  text-6xl
                  mb-5
                "
            >
              ♡
            </div>

            <h2
              className="
                  text-xl
                  font-semibold
                  text-gray-900
                "
            >
              Your wishlist is empty
            </h2>

            <p
              className="
                  text-gray-500
                  mt-2
                "
            >
              Explore products and save the ones you love.
            </p>

            <button
              onClick={onHome}
              className="
                  mt-6
                  bg-black
                  text-white
                  px-6
                  py-3
                  rounded-full
                  font-medium
                  hover:bg-gray-800
                  transition
                "
            >
              Continue Shopping
            </button>
          </div>
        )}

        {/* ===================================================
            WISHLIST PRODUCTS
        =================================================== */}

        {!loading && wishlistProducts.length > 0 && (
          <div
            className="
                grid
                grid-cols-2
                md:grid-cols-3
                lg:grid-cols-4
                gap-5
              "
          >
            {wishlistProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}

                userInteractions={userInteractions}

                onInteraction={(productFromCard, type, dwellTime) =>
                  onInteraction?.(productFromCard, type, dwellTime)
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Wishlist;
