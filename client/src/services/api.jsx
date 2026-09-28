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
    throw new Error('Search request failed');
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

// ============================================================
// GET USER INTERACTIONS
// ============================================================

export const getUserInteractions = async (userId) => {
  const response = await fetch(
    `${API_BASE_URL}/interactions/user/${encodeURIComponent(userId)}`
  );

  if (!response.ok) {
    throw new Error('Failed to load user interactions');
  }

  return await response.json();
};

export const getWishlist = async (userId) => {
  const response = await fetch(
    `${API_BASE_URL}/wishlist/user/${encodeURIComponent( userId )}`
  );

  if (!response.ok) {
    throw new Error(`Failed to load wishlist ${response.status}`);
  }

  return await response.json();
};
