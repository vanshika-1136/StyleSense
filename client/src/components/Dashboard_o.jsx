import ProductCard from './ProductCard';

function Dashboard({ products = [], onSearch, onInteraction }) {
  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight">StyleSense</h1>

            <p className="text-[10px] text-gray-500">Fashion that learns you</p>
          </div>

          <div className="flex items-center gap-5 text-lg">
            <button>♡</button>
            <button>🛒</button>
            <button>👤</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <section className="rounded-3xl bg-black text-white p-8 md:p-12 mb-10">
          <p className="text-sm text-gray-400 mb-3">
            YOUR PERSONAL STYLE ENGINE
          </p>

          <h2 className="text-4xl md:text-6xl font-bold max-w-2xl leading-tight">
            Discover fashion that gets you.
          </h2>

          <p className="text-gray-400 mt-5 max-w-lg">
            StyleSense learns from what you search, click, like and add to cart.
          </p>

          {/* Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();

              const query = e.target.search.value;

              if (query.trim()) {
                onSearch(query);
              }
            }}
            className="mt-8 max-w-xl"
          >
            <div className="flex bg-white rounded-2xl overflow-hidden">
              <input
                name="search"
                placeholder="Search dresses, sneakers, hoodies..."
                className="flex-1 px-5 py-4 text-black outline-none"
              />

              <button type="submit" className="px-6 bg-gray-200 text-black">
                Search
              </button>
            </div>
          </form>
        </section>

        {/* Categories */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold">Explore</h2>

            <span className="text-sm text-gray-500">Find your style</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['Dresses', 'Sneakers', 'Hoodies', 'Jeans', 'T-Shirts'].map(
              (category) => (
                <button
                  key={category}
                  onClick={() => onSearch(category)}
                  className="bg-white rounded-2xl p-5 text-left border hover:border-black transition"
                >
                  <div className="text-2xl mb-3">
                    {category === 'Dresses'
                      ? '👗'
                      : category === 'Sneakers'
                        ? '👟'
                        : category === 'Hoodies'
                          ? '🧥'
                          : category === 'Jeans'
                            ? '👖'
                            : '👕'}
                  </div>

                  <p className="font-semibold">{category}</p>
                </button>
              )
            )}
          </div>
        </section>

        {/* Recommendation */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500">
                AI PERSONALIZED
              </p>

              <h2 className="text-3xl font-bold mt-1">Picked for you</h2>
            </div>

            <span className="text-sm text-gray-500">
              Based on your interactions
            </span>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onInteraction={(type) => onInteraction(product, type)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 text-center">
              <div className="text-5xl mb-4">✨</div>

              <h3 className="text-xl font-bold">Start exploring</h3>

              <p className="text-gray-500 mt-2">
                Search or explore a category and StyleSense will learn your
                preferences.
              </p>
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="mt-16 mb-10">
          <div className="bg-white rounded-3xl p-8">
            <p className="text-xs uppercase tracking-widest text-gray-400">
              THE STYLE ENGINE
            </p>

            <h2 className="text-2xl font-bold mt-2">
              Your actions shape your feed.
            </h2>

            <div className="grid md:grid-cols-4 gap-6 mt-8">
              {[
                ['🔎', 'Search', 'What you look for'],
                ['👆', 'Click', 'What catches your eye'],
                ['♡', 'Wishlist', 'What you want later'],
                ['🛒', 'Cart', 'What you really want'],
              ].map(([icon, title, text]) => (
                <div key={title}>
                  <div className="text-3xl">{icon}</div>

                  <h3 className="font-semibold mt-3">{title}</h3>

                  <p className="text-sm text-gray-500 mt-1">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
