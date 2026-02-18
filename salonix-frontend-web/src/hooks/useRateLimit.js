import { useContext } from 'react';
import { RateLimitContext } from '../contexts/RateLimitContextInstance';

export function useRateLimit() {
  const context = useContext(RateLimitContext);
  if (!context) {
    throw new Error('useRateLimit must be used within a RateLimitProvider');
  }
  return context;
}
