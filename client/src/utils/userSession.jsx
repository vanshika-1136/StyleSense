export const getUserId = () => {
  let userId = localStorage.getItem('stylesense_user_id');

  if (!userId) {
    userId = `user_${Date.now()}`;
    localStorage.setItem('stylesense_user_id', userId);
  }

  return userId;
};

export const getSessionId = () => {
  let sessionId = sessionStorage.getItem('stylesense_session_id');

  if (!sessionId) {
    sessionId = `session_${Date.now()}`;
    sessionStorage.setItem('stylesense_session_id', sessionId);
  }

  return sessionId;
};
