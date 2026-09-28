function Navbar({ query, setQuery, onSearch }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <header
      className="
            sticky
            top-0
            z-50
            bg-white/90
            backdrop-blur-xl
            border-b
            border-gray-100
        "
    >
      <div
        className="
                max-w-7xl
                mx-auto
                px-6
                h-20
                flex
                items-center
                gap-8
            "
      >
        {/* Logo */}

        <div className="shrink-0">
          <h1
            className="
                        text-2xl
                        font-black
                        tracking-tight
                    "
          >
            Style<span className="text-gray-400">Sense</span>
          </h1>
        </div>

        {/* Search */}

        <form
          onSubmit={handleSubmit}
          className="
                        hidden
                        md:flex
                        flex-1
                        max-w-2xl
                        relative
                    "
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dresses, sneakers, hoodies..."
            className="
                            w-full
                            bg-gray-100
                            rounded-full
                            px-6
                            py-3
                            pr-14
                            outline-none
                            focus:ring-2
                            focus:ring-gray-300
                            transition
                        "
          />

          <button
            type="submit"
            className="
                            absolute
                            right-2
                            top-1/2
                            -translate-y-1/2
                            w-10
                            h-10
                            rounded-full
                            bg-black
                            text-white
                            flex
                            items-center
                            justify-center
                            hover:scale-105
                            transition
                        "
          >
            →
          </button>
        </form>

        {/* Navigation */}

        <nav
          className="
                    ml-auto
                    flex
                    items-center
                    gap-5
                "
        >
          <button className="hidden lg:block text-sm font-medium">Home</button>

          <button
            className="
                        text-xl
                        hover:scale-110
                        transition
                    "
          >
            ♡
          </button>

          <button
            className="
                        text-xl
                        hover:scale-110
                        transition
                    "
          >
            🛒
          </button>

          <div
            className="
                        w-9
                        h-9
                        rounded-full
                        bg-black
                        text-white
                        flex
                        items-center
                        justify-center
                        text-sm
                        font-semibold
                    "
          >
            U
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
