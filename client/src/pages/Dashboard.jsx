import Navbar from '../components/Navbar';
import ProductGrid from '../components/ProductGrid';

function Dashboard({
  products = [],
  loading = false,
  query = '',
  setQuery,
  onSearch,
  onInteraction,
  userInteractions = [],
  onWishlist,
  onHome,
  onCart,
  page,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!query.trim()) return;

    onSearch?.(query);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}

      <Navbar
        query={query}
        setQuery={setQuery}
        onSearch={onSearch}
        onWishlist={onWishlist}
        onHome={onHome}
        onCart={onCart}
        page={page}
      />

      {/* HERO */}

      <section
        className="
          bg-black
          text-white
          px-6
          py-16
        "
      >
        <div className="max-w-7xl mx-auto">
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

          {/* HERO SEARCH */}

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
              {query ? `Results for "${query}"` : 'Trending Fashion'}
            </h2>

            <p
              className="
                text-sm
                text-gray-500
                mt-1
              "
            >
              {query
                ? 'Products matching your search'
                : 'Popular products right now'}
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
            <p className="text-lg">No products found.</p>
          </div>
        )}
      </main>

      {/* LEARNING SECTION */}

      <section className="border-t border-gray-200 bg-white px-6 py-20">
        <div className="max-w-7xl mx-auto">
          {/* SECTION HEADER */}
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.25em] text-gray-400 font-medium">
              How StyleSense learns
            </p>

            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mt-3">
              Your actions shape your style.
            </h2>

            <p className="text-gray-500 mt-4 text-base md:text-lg leading-relaxed">
              StyleSense doesn't ask you to define your preferences. It learns
              them from the way you browse, interact, and shop.
            </p>
          </div>

          {/* LEARNING FLOW */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {/* BROWSE */}
            <div className="group relative p-7 rounded-3xl bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-2xl shadow-sm">
                👀
              </div>

              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-7">
                01
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-2">
                You Browse
              </h3>

              <p className="text-gray-500 mt-3 leading-relaxed">
                Every product you view, search for, or spend time exploring
                gives StyleSense a signal about your interests.
              </p>

              <div className="mt-6 text-sm font-medium text-gray-700">
                Views • Searches • Dwell time
              </div>
            </div>

            {/* INTERACT */}
            <div className="group relative p-7 rounded-3xl bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-2xl shadow-sm">
                ❤️
              </div>

              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-7">
                02
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-2">
                You Interact
              </h3>

              <p className="text-gray-500 mt-3 leading-relaxed">
                Wishlist and cart actions provide stronger signals, helping the
                system understand what you actually prefer.
              </p>

              <div className="mt-6 text-sm font-medium text-gray-700">
                Wishlist • Cart • Clicks
              </div>
            </div>

            {/* PERSONALIZE */}
            <div className="group relative p-7 rounded-3xl bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-2xl shadow-sm">
                ✨
              </div>

              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-7">
                03
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-2">
                Your Feed Adapts
              </h3>

              <p className="text-gray-500 mt-3 leading-relaxed">
                These signals are combined to build a dynamic preference profile
                and influence your future search results.
              </p>

              <div className="mt-6 text-sm font-medium text-gray-700">
                Personalization • Ranking • Recommendations
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
