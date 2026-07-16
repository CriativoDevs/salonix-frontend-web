import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchCaptchaChallenge } from '../../api/captcha';
import { getCaptchaBypassToken } from '../../utils/captchaPolicy';

/**
 * CaptchaChallenge - Real image/text captcha challenge (django-simple-captcha).
 * Used on the public client self-registration page.
 * In non-production environments with VITE_CAPTCHA_BYPASS_TOKEN set, skips
 * the real challenge and reports the bypass token as the captcha value.
 */
export default function CaptchaChallenge({ onChange }) {
  const { t } = useTranslation();
  const bypass = getCaptchaBypassToken();
  const [challenge, setChallenge] = useState(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const loadChallenge = useCallback(async () => {
    try {
      const data = await fetchCaptchaChallenge();
      setChallenge(data);
      setValue('');
      setError(false);
    } catch {
      setChallenge(null);
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (bypass) {
      onChange?.({ captchaKey: null, captchaValue: bypass });
      return;
    }
    loadChallenge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bypass]);

  if (bypass) {
    return null;
  }

  const handleChange = (e) => {
    const nextValue = e.target.value;
    setValue(nextValue);
    onChange?.({ captchaKey: challenge?.key || null, captchaValue: nextValue });
  };

  return (
    <div className="space-y-2">
      {challenge && (
        <div className="flex items-center gap-2">
          <img
            src={challenge.image_url}
            alt={t('auth.captcha.image_alt', 'Captcha')}
            className="rounded border border-brand-border"
          />
          <button
            type="button"
            onClick={loadChallenge}
            aria-label={t('auth.captcha.refresh', 'Atualizar')}
            className="text-sm text-brand-primary hover:text-brand-primary/80"
          >
            🔄 {t('auth.captcha.refresh', 'Atualizar')}
          </button>
        </div>
      )}
      {!challenge && error && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-red-600 dark:text-red-400">
            {t('auth.captcha.load_error', 'Não foi possível carregar o captcha.')}
          </p>
          <button
            type="button"
            onClick={loadChallenge}
            className="text-sm text-brand-primary hover:text-brand-primary/80"
          >
            {t('auth.captcha.retry', 'Tentar novamente')}
          </button>
        </div>
      )}
      <label className="block text-sm font-medium text-brand-surfaceForeground">
        {t('auth.captcha.label', 'Digite o texto da imagem (captcha)')}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground"
        />
      </label>
    </div>
  );
}
