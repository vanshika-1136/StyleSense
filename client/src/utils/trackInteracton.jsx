import { recordInteraction } from '../services/searchService';
import { getUserId, getSessionId } from './userSession';

export const trackInteraction = async ({
  product_id,
  interaction_type,
  dwell_time_ms = 0,
}) => {
  try {
    await recordInteraction({
      user_id: getUserId(),
      product_id,
      session_id: getSessionId(),
      interaction_type,
      dwell_time_ms,
    });
  } catch (error) {
    console.error('Interaction tracking failed:', error);
  }
};
