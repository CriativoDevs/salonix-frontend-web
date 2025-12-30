import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRateLimit } from '../../hooks/useRateLimit';

export default function RateLimitWarning() {
  const { isRateLimited, secondsRemaining } = useRateLimit();
  const { t } = useTranslation('common');

  if (!isRateLimited) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-4 shadow-lg z-50 animate-slide-up">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg
            className="w-6 h-6 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium">
            {t('rate_limit_warning', { seconds: secondsRemaining })}
          </span>
        </div>
        <div className="text-sm opacity-90">{t('please_wait')}</div>
      </div>
    </div>
  );
}
