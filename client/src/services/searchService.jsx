const API_URL = 'http://localhost:5000';

export const searchProducts = async (query, user_id) => {
  const response = await fetch(
    `${API_URL}/api/search?q=${encodeURIComponent(query)}&user_id=${user_id}`
  );

  if (!response.ok) {
    throw new Error('Failed to search products');
  }

  return response.json();
};

export const recordInteraction = async ({
  user_id,
  product_id,
  session_id,
  interaction_type,
  dwell_time_ms = 0,
}) => {
  const response = await fetch(`${API_URL}/api/interactions`, {
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
    throw new Error('Failed to record interaction');
  }

  return response.json();
};
