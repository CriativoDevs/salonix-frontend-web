import client from './client';

export async function checkFounderAvailability() {
  try {
    const response = await client.get('users/founder-availability/');
    // Backend returns: { total_limit: number, used_count: number, remaining_count: number }
    // Frontend expects: { available: boolean, count: number }
    const { remaining_count, used_count, total_limit } = response.data;

    console.log('[UsersAPI] Founder Check:', {
      total: total_limit,
      used: used_count,
      remaining: remaining_count,
      isAvailable: remaining_count > 0,
    });

    return {
      available: remaining_count > 0,
      count: remaining_count,
      ...response.data,
    };
  } catch (error) {
    console.error('[UsersAPI] Failed to check founder availability:', error);
    // Fail safe: assume not available if error
    return { available: false, count: 0 };
  }
}
