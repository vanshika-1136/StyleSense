import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { getWishlist } from '../services/api';

function Wishlist({ userId, userInteractions = [], onInteraction }) {
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    try {
      setLoading(true);

      const result = await getWishlist(userId);

      setWishlistProducts(result.products || []);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="
            max-w-7xl
            mx-auto
            px-6
            py-10
        "
      >
        {/* HEADER */}
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

        {/* LOADING */}
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

        {/* EMPTY */}
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
          </div>
        )}

        {/* PRODUCTS */}
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
                onInteraction={(type, dwellTime) =>
                  onInteraction?.(product, type, dwellTime)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Wishlist;
