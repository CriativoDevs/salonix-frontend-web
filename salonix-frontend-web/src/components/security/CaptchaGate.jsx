import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCaptchaBypassToken } from '../../utils/captchaPolicy';

/**
 * CaptchaGate - Builtin simple captcha checkbox
 * Production uses VITE_CAPTCHA_PROVIDER=builtin (no external providers)
 */
export default function CaptchaGate({ onToken, className, resetKey }) {
  const bypass = getCaptchaBypassToken();
  const { t } = useTranslation();

  useEffect(() => {
    if (bypass) {
      onToken?.(bypass);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bypass, resetKey]);

  if (bypass) {
    return null; // em dev, não renderiza widget
  }

  // Builtin: simple checkbox (UX only, not real security)
  return (
    <label
      className={className}
      style={{ display: 'flex', gap: 8, alignItems: 'center' }}
    >
      <input
        type="checkbox"
        onChange={(e) => onToken?.(e.target.checked ? 'builtin-ok' : null)}
      />
      <span className="text-brand-surfaceForeground">
        {t('auth.captcha.not_robot', 'Eu não sou um robô')}
      </span>
    </label>
  );
}
