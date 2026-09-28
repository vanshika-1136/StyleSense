import { useEffect, useRef, useState } from 'react';

function ProductCard({ product, onInteraction, userInteractions = [] }) {
  // =========================================================
  // STATE
  // =========================================================

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInCart, setIsInCart] = useState(false);

  useEffect(() => {
    const productId = String(product.id);
    let wishlistState = false;
    let cartState = false;
    userInteractions
      .filter((interaction) => String(interaction.product_id) === productId)
      .forEach((interaction) => {
        if (interaction.interaction_type === 'add_to_wishlist') {
          wishlistState = true;
        } else if (interaction.interaction_type === 'remove_from_wishlist') {
          wishlistState = false;
        } else if (interaction.interaction_type === 'add_to_cart') {
          cartState = true;
        } else if (interaction.interaction_type === 'remove_from_cart') {
          cartState = false;
        }
      });
    setIsWishlisted(wishlistState);
    setIsInCart(cartState);
  }, [product.id, userInteractions]);

  // =========================================================
  // DWELL TIME
  // =========================================================

  const startTime = useRef(null);
  const cardRef = useRef(null);
  const hasRecordedView = useRef(false);

  // =========================================================
  // VIEW + DWELL TIME TRACKING
  // =========================================================

  useEffect(() => {
    const card = cardRef.current;

    if (!card) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        // Product entered viewport
        if (entry.isIntersecting) {
          startTime.current = Date.now();

          // Record first view only once
          if (!hasRecordedView.current) {
            hasRecordedView.current = true;

            onInteraction?.('view', 0);
          }
        }

        // Product left viewport
        else {
          if (startTime.current) {
            const dwellTime = Date.now() - startTime.current;

            if (dwellTime >= 1000) {
              onInteraction?.('view', dwellTime);
            }

            startTime.current = null;
          }
        }
      },
      {
        threshold: 0.6,
      }
    );

    observer.observe(card);

    return () => {
      observer.disconnect();
    };
  }, [product.id, onInteraction]);

  // =========================================================
  // PRODUCT CLICK
  // =========================================================

  const handleProductClick = () => {
    onInteraction?.('click', 0);
  };

  // =========================================================
  // WISHLIST
  // =========================================================

  const handleWishlist = async (e) => {
    e.stopPropagation();

    const newState = !isWishlisted;

    setIsWishlisted(newState);

    if (newState) {
      // Add wishlist
      onInteraction?.('add_to_wishlist', 0);
    } else {
      // Remove wishlist
      onInteraction?.('remove_from_wishlist', 0);
    }
  };

  // =========================================================
  // CART
  // =========================================================

  const handleCart = (e) => {
    e.stopPropagation();

    const newState = !isInCart;

    setIsInCart(newState);

    if (newState) {
      // Add to cart
      onInteraction?.('add_to_cart', 0);
    } else {
      // Remove from cart
      onInteraction?.('remove_from_cart', 0);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      ref={cardRef}
      onClick={handleProductClick}
      className="
                group
                bg-white
                rounded-2xl
                overflow-hidden
                border
                border-gray-100
                hover:border-gray-200
                hover:shadow-xl
                transition-all
                duration-300
                cursor-pointer
            "
    >
      {/* =================================================
                IMAGE
            ================================================= */}

      <div
        className="
                    relative
                    aspect-[3/4]
                    overflow-hidden
                    bg-gray-100
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
                            group-hover:scale-105
                            transition-transform
                            duration-500
                        "
            onError={(e) => {
              e.currentTarget.src =
                'https://placehold.co/500x650?text=No+Image';
            }}
          />
        ) : (
          <div
            className="
                            w-full
                            h-full
                            flex
                            items-center
                            justify-center
                            text-gray-400
                        "
          >
            No Image
          </div>
        )}

        {/* DISCOUNT */}

        {product.discount && (
          <span
            className="
                            absolute
                            top-3
                            left-3
                            bg-black
                            text-white
                            text-xs
                            font-semibold
                            px-3
                            py-1
                            rounded-full
                        "
          >
            {product.discount}% OFF
          </span>
        )}

        {/* =================================================
                    WISHLIST HEART
                ================================================= */}

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`
                        absolute
                        top-3
                        right-3
                        w-11
                        h-11
                        rounded-full
                        backdrop-blur
                        flex
                        items-center
                        justify-center
                        text-2xl
                        transition-all
                        duration-200
                        shadow-sm
                        ${
                          isWishlisted
                            ? 'bg-white text-red-500 scale-110'
                            : 'bg-white/90 text-gray-700 hover:bg-white hover:text-red-500'
                        }
                    `}
        >
          {isWishlisted ? '♥' : '♡'}
        </button>
      </div>

      {/* =================================================
                PRODUCT DETAILS
            ================================================= */}

      <div className="p-4">
        {/* PRODUCT NAME */}

        <h3
          className="
                        font-semibold
                        text-gray-900
                        truncate
                    "
        >
          {product.name || 'Unknown Product'}
        </h3>

        {/* CATEGORY */}

        <p
          className="
                        text-sm
                        text-gray-500
                        mt-1
                    "
        >
          {product.category}

          {product.color && (
            <>
              {' • '}
              {product.color}
            </>
          )}
        </p>

        {/* =================================================
                    RECOMMENDATION REASON
                ================================================= */}

        {product.recommendation_reason && (
          <div
            className="
                            mt-3
                            rounded-xl
                            bg-gray-50
                            border
                            border-gray-100
                            px-3
                            py-2
                        "
          >
            <p
              className="
                                text-xs
                                text-gray-600
                                font-medium
                            "
            >
              ✨ {product.recommendation_reason}
            </p>
          </div>
        )}

        {/* =================================================
                    PRICE
                ================================================= */}

        <div
          className="
                        flex
                        items-center
                        gap-2
                        mt-4
                    "
        >
          <span
            className="
                            text-lg
                            font-bold
                            text-gray-900
                        "
          >
            ₹{product.price}
          </span>

          {product.mrp && product.mrp !== product.price && (
            <span
              className="
                                    text-sm
                                    text-gray-400
                                    line-through
                                "
            >
              ₹{product.mrp}
            </span>
          )}
        </div>

        {/* =================================================
                    RATING
                ================================================= */}

        {product.rating && (
          <div
            className="
                            mt-2
                            text-sm
                            text-gray-600
                        "
          >
            ⭐ {product.rating}
            {product.ratingTotal && (
              <span
                className="
                                    text-gray-400
                                "
              >
                {' '}
                ({product.ratingTotal})
              </span>
            )}
          </div>
        )}

        {/* =================================================
                    CART BUTTON
                ================================================= */}

        <button
          type="button"
          onClick={handleCart}
          className={`
                        w-full
                        mt-4
                        py-3
                        rounded-xl
                        font-medium
                        transition-all
                        duration-200
                        ${
                          isInCart
                            ? 'bg-gray-100 text-gray-900 border border-gray-200'
                            : 'bg-black text-white hover:bg-gray-800'
                        }
                    `}
        >
          {isInCart ? '✓ Added to Cart' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
