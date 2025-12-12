import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

export default function CaptchaGate({ onToken, className, resetKey }) {
  const containerRef = useRef(null);
  const provider = import.meta.env.VITE_CAPTCHA_PROVIDER || '';
  const bypass = import.meta.env.VITE_CAPTCHA_BYPASS_TOKEN || '';
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      if (cancelled) return;

      if (bypass) {
        onToken?.(bypass);
        return;
      }

      if (provider === 'turnstile') {
        const sitekey = import.meta.env.VITE_TURNSTILE_SITEKEY;
        if (!sitekey) return;
        await loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit');
        if (cancelled) return;
        window.turnstile.render(containerRef.current, {
          sitekey,
          callback: (token) => onToken?.(token),
          'error-callback': () => onToken?.(null),
          'expired-callback': () => onToken?.(null),
        });
        return;
      }

      if (provider === 'hcaptcha') {
        const sitekey = import.meta.env.VITE_HCAPTCHA_SITEKEY;
        if (!sitekey) return;
        await loadScript('https://js.hcaptcha.com/1/api.js?render=explicit');
        if (cancelled) return;
        window.hcaptcha.render(containerRef.current, {
          sitekey,
          callback: (token) => onToken?.(token),
          'error-callback': () => onToken?.(null),
          'expired-callback': () => onToken?.(null),
        });
        return;
      }
      // builtin: simples checkbox (apenas UX em dev; não é segurança real)
    }

    setup();
    return () => {
      cancelled = true;
      // turnstile/hcaptcha têm funções de reset, mas mantemos simples aqui
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, bypass, resetKey]);

  if (bypass) {
    return null; // em dev, não renderiza widget
  }

  if (provider === 'turnstile' || provider === 'hcaptcha') {
    return <div ref={containerRef} className={className} />;
  }

  // Fallback builtin: checkbox simples
  return (
    <label className={className} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="checkbox"
        onChange={(e) => onToken?.(e.target.checked ? 'builtin-ok' : null)}
      />
      <span className="text-brand-surfaceForeground">{t('auth.captcha.not_robot', 'Eu não sou um robô')}</span>
    </label>
  );
}
