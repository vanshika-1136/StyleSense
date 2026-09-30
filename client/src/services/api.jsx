const API_BASE_URL = 'http://localhost:5000/api';

// ============================================================
// SEARCH PRODUCTS
// ============================================================

export const searchProducts = async (query, userId) => {
  const response = await fetch(
    `${API_BASE_URL}/search?q=${encodeURIComponent(
      query
    )}&user_id=${encodeURIComponent(userId)}`
  );

  if (!response.ok) {
    throw new Error(`Search request failed: ${response.status}`);
  }

  return await response.json();
};

// ============================================================
// RECORD INTERACTION
// ============================================================

export const recordInteraction = async ({
  user_id,
  product_id,
  session_id,
  interaction_type,
  dwell_time_ms = 0,
}) => {
  const response = await fetch(`${API_BASE_URL}/interactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      user_id,
      product_id,
      session_id,
      interaction_type,
      dwell_time_ms,
    }),
  });

  if (!response.ok) {
    throw new Error('Interaction request failed');
  }

  return await response.json();
};

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('stylesense_token');

  return {
    Authorization: `Bearer ${token}`,
  };
};

// ============================================================
// GET USER INTERACTIONS
// ============================================================

export const getUserInteractions = async (userId) => {
  const response = await fetch(
    `${API_BASE_URL}/interactions/user/${encodeURIComponent(userId)}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to load user interactions');
  }

  return await response.json();
};

export const getWishlist = async (userId) => {
  const response = await fetch(
    `${API_BASE_URL}/wishlist/user/${encodeURIComponent(userId)}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to load wishlist ${response.status}`);
  }

  return await response.json();
};
// ============================================================
// TRENDING PRODUCTS
// ============================================================

export const getTrendingProducts = async (userId) => {
  const response = await fetch(
    `${API_BASE_URL}/search/trending?user_id=${encodeURIComponent(userId)}`
  );

  if (!response.ok) {
    throw new Error('Failed to load trending products');
  }

  return await response.json();
};

export const getCart = async (userId) => {
  const response = await fetch(
    `${API_BASE_URL}/cart/user/${encodeURIComponent(userId)}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to load cart ${response.status}`);
  }

  return await response.json();
};

export const getRecommendations = async (userId) => {
  const token = sessionStorage.getItem('stylesense_token');

  const response = await fetch(
    `${API_BASE_URL}/recommendations/${encodeURIComponent(userId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Recommendation request failed: ${response.status}`);
  }

  return await response.json();
};

export const recordSearch = async ({ user_id, query }) => {
  const response = await fetch(`${API_BASE_URL}/search-history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id,
      query,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to record search');
  }

  return await response.json();
};
