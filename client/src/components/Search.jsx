import { useState } from 'react';

import { recordInteraction } from '../services/api';

import { searchProducts } from '../services/searchService';

import ProductCard from './ProductCard';

function Search() {
  const [query, setQuery] = useState('');

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  // ========================================
  // CURRENT USER
  // ========================================

  // For now we are using the same user
  // that we used while testing the
  // recommendation engine.

  const userId = 'user_00001';

  // ========================================
  // SEARCH
  // ========================================

  const handleSearch = async () => {
    if (!query.trim()) {
      return;
    }

    try {
      setLoading(true);

      setError('');

      console.log('Searching for:', query);

      const data = await searchProducts(query, userId);

      console.log('Search response:', data);

      setProducts(data.products || []);
    } catch (error) {
      console.error('Search error:', error);

      setError('Something went wrong while searching.');

      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // PRODUCT CLICK
  // ========================================

  const handleProductClick = async (product) => {
    console.log('Product clicked:', product);

    try {
      await recordInteraction({
        user_id: userId,

        product_id: product.id,

        session_id: 'session_001',

        interaction_type: 'click',

        dwell_time_ms: 500,
      });

      console.log('Interaction recorded');
    } catch (error) {
      console.error('Failed to record interaction:', error);
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div
      style={{
        padding: '30px',
      }}
    >
      <h2>Search Fashion</h2>

      {/* ========================================
                SEARCH BAR
            ======================================== */}

      <div>
        <input
          type="text"
          placeholder="Search dresses, jeans, shirts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />

        <button onClick={handleSearch}>Search</button>
      </div>

      {/* ========================================
                LOADING
            ======================================== */}

      {loading && <p>Searching...</p>}

      {/* ========================================
                ERROR
            ======================================== */}

      {error && <p>{error}</p>}

      {/* ========================================
                RESULTS
            ======================================== */}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          marginTop: '30px',
        }}
      >
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            onInteraction={(type) =>
              recordInteraction({
                user_id: userId,
                product_id: product.id,
                session_id: sessionId,
                interaction_type: type,
              })
            }
          />
        ))}
      </div>

      {/* ========================================
                NO RESULTS
            ======================================== */}

      {!loading && !error && query && products.length === 0 && (
        <p>No products found.</p>
      )}
    </div>
  );
}

export default Search;
