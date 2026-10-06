import { useEffect, useState } from 'react';

import Navbar from '../components/Navbar';

import { getCart } from '../services/api';

function Cart({
  userId,
  onInteraction,
  onWishlist,
  onHome,
  onCart,
  page,
  onProductClick,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ========================================================
  // SHOP NOW
  // ========================================================

  const handleShopNow = (product) => {
    if (!product?.purl) {
      alert('Product link is not available.');
      return;
    }

    window.open(product.purl, '_blank', 'noopener,noreferrer');
  };

  // ========================================================
  // LOAD CART
  // ========================================================

  const loadCart = async () => {
    try {
      setLoading(true);

      const result = await getCart(userId);

      console.log('CART RESPONSE:', result);

      setProducts(result.products || []);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [userId]);

  // ========================================================
  // REMOVE FROM CART
  // ========================================================

  const handleRemove = async (product) => {
    try {
      await onInteraction(product, 'remove_from_cart');

      setProducts((previous) =>
        previous.filter(
          (item) => String(item.id) !== String(product.id)
        )
      );
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar
          query=""
          setQuery={() => {}}
          onSearch={() => {}}
          onWishlist={onWishlist}
          onHome={onHome}
          onCart={onCart}
          page={page}
        />

        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ========================================================
  // PAGE
  // ========================================================

  return (
    <div className="min-h-screen bg-gray-50">

      {/* =================================================
                    NAVBAR
      ================================================= */}

      <Navbar
        query=""
        setQuery={() => {}}
        onSearch={() => {}}
        onWishlist={onWishlist}
        onHome={onHome}
        onCart={onCart}
        page={page}
      />

      {/* =================================================
                    HEADER
      ================================================= */}

      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-400">
            StyleSense
          </p>

          <h1 className="text-4xl md:text-5xl font-bold mt-3">
            Your Cart
          </h1>

          <p className="text-gray-400 mt-3">
            {products.length}{' '}
            {products.length === 1 ? 'item' : 'items'} saved in your cart
          </p>
        </div>
      </section>

      {/* =================================================
                    CART CONTENT
      ================================================= */}

      <main className="max-w-7xl mx-auto px-6 py-12">

        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center">

            <div className="text-6xl mb-5">
              🛒
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              Your cart is empty
            </h2>

            <p className="text-gray-500 mt-2">
              Explore fashion products and save the ones you like.
            </p>

            <button
              onClick={onHome}
              className="
                mt-7
                bg-black
                text-white
                px-7
                py-3
                rounded-full
                font-semibold
                hover:bg-gray-800
                transition
              "
            >
              Continue Exploring
            </button>

          </div>
        ) : (

          <div className="space-y-5">

            {products.map((product) => (

              <div
                key={product.id}
                className="
                  bg-white
                  rounded-3xl
                  p-5
                  flex
                  flex-col
                  sm:flex-row
                  gap-5
                  border
                  border-gray-100
                  hover:shadow-lg
                  transition
                "
              >

                {/* =================================================
                              IMAGE
                ================================================= */}

                <button
                  type="button"
                  onClick={() => onProductClick?.(product)}
                  className="
                    w-full
                    sm:w-32
                    h-64
                    sm:h-40
                    bg-gray-100
                    rounded-2xl
                    overflow-hidden
                    shrink-0
                    cursor-pointer
                  "
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name || 'Product'}
                      className="
                        w-full
                        h-full
                        object-cover
                        hover:scale-105
                        transition-transform
                        duration-300
                      "
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://placehold.co/500x650?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      No image
                    </div>
                  )}
                </button>

                {/* =================================================
                              DETAILS
                ================================================= */}

                <div className="flex-1 flex flex-col">

                  <div className="flex flex-col sm:flex-row justify-between gap-4">

                    <div>

                      <button
                        type="button"
                        onClick={() => onProductClick?.(product)}
                        className="
                          text-left
                          font-bold
                          text-lg
                          text-gray-900
                          hover:text-gray-600
                          transition
                        "
                      >
                        {product.name || 'Unknown Product'}
                      </button>

                      {product.category && (
                        <p className="text-sm text-gray-500 mt-1">
                          {product.category}
                        </p>
                      )}

                      {product.color && (
                        <p className="text-sm text-gray-500 mt-1">
                          Color: {product.color}
                        </p>
                      )}

                      {product.rating && (
                        <p className="text-sm text-gray-600 mt-2">
                          ⭐ {product.rating}

                          {product.ratingTotal && (
                            <span className="text-gray-400">
                              {' '}
                              ({product.ratingTotal})
                            </span>
                          )}
                        </p>
                      )}

                    </div>

                    {/* PRICE */}

                    {product.price && (
                      <div className="text-left sm:text-right">

                        <p className="font-bold text-lg text-gray-900">
                          ₹{product.price}
                        </p>

                        {product.mrp &&
                          Number(product.mrp) !== Number(product.price) && (
                            <p className="text-sm text-gray-400 line-through">
                              ₹{product.mrp}
                            </p>
                          )}

                      </div>
                    )}

                  </div>

                  {/* =================================================
                                ACTIONS
                  ================================================= */}

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">

                    {/* PRODUCT DETAILS */}

                    <button
                      type="button"
                      onClick={() => onProductClick?.(product)}
                      className="
                        px-5
                        py-3
                        rounded-xl
                        border
                        border-gray-200
                        text-gray-900
                        font-medium
                        hover:bg-gray-50
                        transition
                      "
                    >
                      View Details
                    </button>

                    {/* SHOP NOW */}

                    <button
                      type="button"
                      onClick={() => handleShopNow(product)}
                      className="
                        px-5
                        py-3
                        rounded-xl
                        bg-black
                        text-white
                        font-semibold
                        hover:bg-gray-800
                        transition
                      "
                    >
                      🛍️ Shop Now
                    </button>

                    {/* REMOVE */}

                    <button
                      type="button"
                      onClick={() => handleRemove(product)}
                      className="
                        px-5
                        py-3
                        rounded-xl
                        text-red-500
                        font-medium
                        hover:bg-red-50
                        transition
                      "
                    >
                      Remove
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </main>
    </div>
  );
}

export default Cart;
