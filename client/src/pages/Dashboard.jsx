import { useState } from 'react';
import Navbar from '../components/Navbar';
import ProductGrid from '../components/ProductGrid';

function Dashboard({
  products = [],
  loading = false,
  onSearch,
  onInteraction,
  userInteractions = [],
}) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!query.trim()) return;

    onSearch?.(query);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* HERO */}

      <section
        className="
                bg-black
                text-white
                px-6
                py-16
            "
      >
        <div
          className="
                    max-w-7xl
                    mx-auto
                "
        >
          <p
            className="
                        text-sm
                        uppercase
                        tracking-[0.3em]
                        text-gray-400
                        mb-4
                    "
          >
            StyleSense
          </p>

          <h1
            className="
                        text-4xl
                        md:text-6xl
                        font-bold
                        max-w-3xl
                        leading-tight
                    "
          >
            Fashion that
            <br />
            learns you.
          </h1>

          <p
            className="
                        mt-5
                        text-gray-400
                        max-w-xl
                    "
          >
            Search, explore and interact. StyleSense learns from your behaviour
            to personalize your fashion discovery.
          </p>

          {/* SEARCH */}

          <form
            onSubmit={handleSubmit}
            className="
                            mt-8
                            flex
                            max-w-2xl
                            bg-white
                            rounded-2xl
                            overflow-hidden
                        "
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search red dresses, sneakers, hoodies..."
              className="
                                flex-1
                                px-5
                                py-4
                                text-black
                                outline-none
                            "
            />

            <button
              type="submit"
              className="
                                bg-white
                                text-black
                                px-7
                                font-semibold
                                hover:bg-gray-100
                            "
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* PRODUCTS */}

      <main
        className="
                max-w-7xl
                mx-auto
                px-6
                py-12
            "
      >
        <div
          className="
                    flex
                    items-center
                    justify-between
                    mb-8
                "
        >
          <div>
            <h2
              className="
                            text-2xl
                            font-bold
                            text-gray-900
                        "
            >
              {query ? `Results for "${query}"` : 'Discover Fashion'}
            </h2>

            <p
              className="
                            text-sm
                            text-gray-500
                            mt-1
                        "
            >
              Personalized using your interactions
            </p>
          </div>

          {products.length > 0 && (
            <span
              className="
                            text-sm
                            text-gray-500
                        "
            >
              {products.length} products
            </span>
          )}
        </div>

        {loading ? (
          <div
            className="
                        flex
                        justify-center
                        py-20
                    "
          >
            <div
              className="
                            w-10
                            h-10
                            border-4
                            border-gray-200
                            border-t-black
                            rounded-full
                            animate-spin
                        "
            />
          </div>
        ) : products.length > 0 ? (
          <ProductGrid
            products={products}
            onInteraction={onInteraction}
            userInteractions={userInteractions}
          />
        ) : (
          <div
            className="
                        text-center
                        py-20
                        text-gray-400
                    "
          >
            <p className="text-lg">Search for something to discover fashion.</p>
          </div>
        )}
      </main>

      {/* LEARNING SECTION */}

      <section
        className="
                border-t
                border-gray-200
                bg-white
                px-6
                py-16
            "
      >
        <div
          className="
                    max-w-7xl
                    mx-auto
                    text-center
                "
        >
          <p
            className="
                        text-sm
                        uppercase
                        tracking-widest
                        text-gray-400
                    "
          >
            The idea
          </p>

          <h2
            className="
                        text-3xl
                        font-bold
                        mt-3
                    "
          >
            Your actions shape your feed.
          </h2>

          <div
            className="
                        grid
                        md:grid-cols-3
                        gap-6
                        mt-10
                    "
          >
            <div className="p-6 bg-gray-50 rounded-2xl">
              <div className="text-2xl">👀</div>
              <h3 className="font-semibold mt-3">Browse</h3>
              <p className="text-sm text-gray-500 mt-2">
                Products you view help us understand your interests.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-2xl">
              <div className="text-2xl">❤️</div>
              <h3 className="font-semibold mt-3">Interact</h3>
              <p className="text-sm text-gray-500 mt-2">
                Wishlist and cart actions provide stronger signals.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-2xl">
              <div className="text-2xl">✨</div>
              <h3 className="font-semibold mt-3">Personalize</h3>
              <p className="text-sm text-gray-500 mt-2">
                Your future results adapt to those signals.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
