import Navbar from '../components/Navbar';

function ProductDetails({
  product,
  query = '',
  setQuery,
  onSearch,
  onWishlist,
  onCart,
  onHome,
  page,
  onInteraction,
}) {
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar
          query={query}
          setQuery={setQuery}
          onSearch={onSearch}
          onWishlist={onWishlist}
          onCart={onCart}
          onHome={onHome}
          page={page}
        />

        <div className="flex items-center justify-center py-32">
          <p className="text-gray-500">Product not found.</p>
        </div>
      </div>
    );
  }

  const handleShopNow = () => {
    if (!product.purl) {
      alert('Product shopping link is not available.');
      return;
    }

    onInteraction?.(product, 'shop_now', 0);

    window.open(product.purl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        query={query}
        setQuery={setQuery}
        onSearch={onSearch}
        onWishlist={onWishlist}
        onCart={onCart}
        onHome={onHome}
        page={page}
      />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* BACK */}

        <button
          type="button"
          onClick={onHome}
          className="
            mb-8
            text-sm
            font-medium
            text-gray-500
            hover:text-black
            transition
          "
        >
          ← Back to products
        </button>

        <div
          className="
            bg-white
            rounded-3xl
            overflow-hidden
            border
            border-gray-100
            shadow-sm
            grid
            md:grid-cols-2
          "
        >
          {/* IMAGE */}

          <div className="bg-gray-100 aspect-[3/4] md:aspect-auto md:min-h-[650px]">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name || 'Product'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://placehold.co/700x900?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>

          {/* DETAILS */}

          <div className="p-8 md:p-12 flex flex-col justify-center">
            {product.category && (
              <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
                {product.category}
              </p>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3">
              {product.name || 'Unknown Product'}
            </h1>

            {/* PRICE */}

            <div className="flex items-center gap-3 mt-6">
              <span className="text-3xl font-bold text-gray-900">
                ₹{product.price}
              </span>

              {product.mrp &&
                Number(product.mrp) !== Number(product.price) && (
                  <span className="text-lg text-gray-400 line-through">
                    ₹{product.mrp}
                  </span>
                )}

              {product.discount && (
                <span className="text-sm font-semibold text-gray-600">
                  {product.discount}% OFF
                </span>
              )}
            </div>

            {/* RATING */}

            {product.rating && (
              <div className="mt-4 text-gray-600">
                ⭐ {product.rating}

                {product.ratingTotal && (
                  <span className="text-gray-400">
                    {' '}
                    ({product.ratingTotal})
                  </span>
                )}
              </div>
            )}

            {/* PRODUCT ATTRIBUTES */}

            <div className="mt-8 space-y-3 text-sm text-gray-600">
              {product.color && (
                <div>
                  <span className="font-semibold text-gray-900">
                    Color:
                  </span>{' '}
                  {product.color}
                </div>
              )}

              {product.fit && (
                <div>
                  <span className="font-semibold text-gray-900">
                    Fit:
                  </span>{' '}
                  {product.fit}
                </div>
              )}

              {product.style && (
                <div>
                  <span className="font-semibold text-gray-900">
                    Style:
                  </span>{' '}
                  {product.style}
                </div>
              )}

              {product.subcategory && (
                <div>
                  <span className="font-semibold text-gray-900">
                    Category:
                  </span>{' '}
                  {product.subcategory}
                </div>
              )}
            </div>

            {/* RECOMMENDATION REASON */}

            {product.recommendation_reason && (
              <div
                className="
                  mt-8
                  rounded-2xl
                  bg-gray-50
                  border
                  border-gray-100
                  p-4
                "
              >
                <p className="text-sm text-gray-600">
                  ✨ {product.recommendation_reason}
                </p>
              </div>
            )}

            {/* SHOP NOW */}

            <button
              type="button"
              onClick={handleShopNow}
              className="
                w-full
                mt-10
                bg-black
                text-white
                py-4
                rounded-2xl
                font-semibold
                hover:bg-gray-800
                transition
              "
            >
              🛍️ Shop Now
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              You'll be redirected to the original product page.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProductDetails;