import { useAuth } from '../context/AuthContext';

function Navbar({
  query = '',
  setQuery,
  onSearch,
  onWishlist,
  onHome,
  onCart,
  page,
}) {
  const { user, logout } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!query.trim()) return;

    onSearch?.(query);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center gap-8">
        {/* Logo */}
        <button onClick={onHome} className="shrink-0">
          <h1 className="text-2xl font-black tracking-tight">
            Style
            <span className="text-gray-400">Sense</span>
          </h1>
        </button>

        {/* Search */}
        <form
          onSubmit={handleSubmit}
          className="hidden md:flex flex-1 max-w-2xl relative"
        >
          <input
            value={query}
            onChange={(e) => setQuery?.(e.target.value)}
            placeholder="Search dresses, sneakers, hoodies..."
            className="w-full bg-gray-100 rounded-full px-6 py-3 pr-14 outline-none focus:ring-2 focus:ring-gray-300 transition"
          />

          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:scale-105 transition"
          >
            →
          </button>
        </form>

        {/* Navigation */}
        <nav className="ml-auto flex items-center gap-5">
          {/* Home */}
          <button
            onClick={onHome}
            className={`hidden lg:block text-sm transition ${
              page === 'home'
                ? 'text-black font-bold'
                : 'text-gray-500 font-medium hover:text-black'
            }`}
          >
            Home
          </button>

          {/* Wishlist */}
          <button
            onClick={onWishlist}
            title="Wishlist"
            className={`text-2xl transition ${
              page === 'wishlist'
                ? 'text-red-500 scale-110'
                : 'text-black hover:scale-110'
            }`}
          >
            {page === 'wishlist' ? '♥' : '♡'}
          </button>

          {/* Cart */}
          <button
            onClick={onCart}
            title="Cart"
            className={`text-xl transition ${
              page === 'cart' ? 'scale-110' : 'hover:scale-110'
            }`}
          >
            🛒
          </button>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-gray-900">
                {user?.name || 'User'}
              </p>

              <button
                onClick={handleLogout}
                className="text-xs text-gray-500 hover:text-red-500 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
