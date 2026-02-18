import React, { useState, useEffect } from 'react';
import { RATE_LIMIT_EVENT } from '../constants/events';
import { RateLimitContext } from './RateLimitContextInstance';

export function RateLimitProvider({ children }) {
  const [retryUntil, setRetryUntil] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const handleRateLimit = (event) => {
      const { retryAfter } = event.detail;
      // retryAfter is in seconds
      const until = Date.now() + retryAfter * 1000;
      setRetryUntil(until);
      setNow(Date.now());
    };

    window.addEventListener(RATE_LIMIT_EVENT, handleRateLimit);
    return () => window.removeEventListener(RATE_LIMIT_EVENT, handleRateLimit);
  }, []);

  // Check periodically if we are still limited
  useEffect(() => {
    if (!retryUntil) return;

    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current > retryUntil) {
        setRetryUntil(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [retryUntil]);

  const isRateLimited = retryUntil !== null && now < retryUntil;
  const secondsRemaining = isRateLimited
    ? Math.ceil((retryUntil - now) / 1000)
    : 0;

  return (
    <RateLimitContext.Provider value={{ isRateLimited, secondsRemaining }}>
      {children}
    </RateLimitContext.Provider>
  );
}
