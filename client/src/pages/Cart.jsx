import { useEffect, useState } from 'react';

import Navbar from '../components/Navbar';

import { getCart } from '../services/api';

function Cart({ userId, onInteraction, onWishlist, onHome, onCart, page }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
        previous.filter((item) => String(item.id) !== String(product.id))
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

          <h1 className="text-4xl md:text-5xl font-bold mt-3">Your Cart</h1>

          <p className="text-gray-400 mt-3">
            {products.length} {products.length === 1 ? 'item' : 'items'} in your
            cart
          </p>
        </div>
      </section>

      {/* =================================================
                    CART CONTENT
                ================================================= */}

      <main className="max-w-7xl mx-auto px-6 py-12">
        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center">
            <div className="text-6xl mb-5">🛒</div>

            <h2 className="text-2xl font-bold text-gray-900">
              Your cart is empty
            </h2>

            <p className="text-gray-500 mt-2">
              Explore some fashion and add products to your cart.
            </p>

            <button
              onClick={onHome}
              className="mt-7 bg-black text-white px-7 py-3 rounded-full font-semibold hover:bg-gray-800 transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* =====================================
                            PRODUCTS
                        ===================================== */}

            <div className="lg:col-span-2 space-y-5">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl p-5 flex gap-5"
                >
                  {/* IMAGE */}

                  <div className="w-32 h-40 bg-gray-100 rounded-2xl overflow-hidden shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        No image
                      </div>
                    )}
                  </div>

                  {/* DETAILS */}

                  <div className="flex-1">
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {product.name}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          {product.category}
                        </p>

                        {product.color && (
                          <p className="text-sm text-gray-500 mt-1">
                            Color: {product.color}
                          </p>
                        )}
                      </div>

                      {product.price && (
                        <p className="font-bold text-lg text-gray-900">
                          ₹{product.price}
                        </p>
                      )}
                    </div>

                    {/* REMOVE */}

                    <button
                      onClick={() => handleRemove(product)}
                      className="mt-8 text-sm font-medium text-red-500 hover:text-red-700"
                    >
                      Remove from cart
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* =====================================
                            SUMMARY
                        ===================================== */}

            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-7 sticky top-28">
                <h2 className="text-xl font-bold">Cart Summary</h2>

                <div className="flex justify-between mt-6 text-gray-600">
                  <span>Items</span>

                  <span>{products.length}</span>
                </div>

                <div className="border-t border-gray-200 my-5" />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>

                  <span>
                    ₹
                    {products
                      .reduce(
                        (total, product) =>
                          total + (Number(product.price) || 0),
                        0
                      )
                      .toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  className="w-full mt-7 bg-black text-white py-4 rounded-full font-semibold hover:bg-gray-800 transition"
                  onClick={() => alert('Checkout will be added next.')}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Cart;
