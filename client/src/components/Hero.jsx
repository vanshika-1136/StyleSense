function Hero({ query, setQuery, onSearch }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <section
      className="
            relative
            overflow-hidden
            bg-black
            text-white
        "
    >
      <div
        className="
                max-w-7xl
                mx-auto
                px-6
                py-24
                md:py-32
                relative
                z-10
            "
      >
        <div className="max-w-3xl">
          <p
            className="
                        text-sm
                        uppercase
                        tracking-[0.3em]
                        text-gray-400
                        mb-6
                    "
          >
            Intelligent Fashion Discovery
          </p>

          <h2
            className="
                        text-5xl
                        md:text-7xl
                        font-black
                        tracking-tight
                        leading-[0.95]
                    "
          >
            Fashion that
            <br />
            <span className="text-gray-500">learns you.</span>
          </h2>

          <p
            className="
                        mt-8
                        text-lg
                        md:text-xl
                        text-gray-400
                        max-w-xl
                        leading-relaxed
                    "
          >
            StyleSense learns from what you search, click, like and add to your
            cart — then builds your personal fashion feed.
          </p>

          <form
            onSubmit={handleSubmit}
            className="
                            mt-10
                            flex
                            bg-white
                            rounded-2xl
                            p-2
                            max-w-xl
                        "
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for?"
              className="
                                flex-1
                                px-4
                                py-3
                                text-black
                                outline-none
                                bg-transparent
                            "
            />

            <button
              className="
                                bg-black
                                text-white
                                px-7
                                py-3
                                rounded-xl
                                font-medium
                                hover:bg-gray-800
                                transition
                            "
            >
              Discover
            </button>
          </form>
        </div>
      </div>

      <div
        className="
                absolute
                -right-32
                -top-32
                w-96
                h-96
                rounded-full
                bg-gray-800
                blur-3xl
                opacity-40"
      />
    </section>
  );
}

export default Hero;
