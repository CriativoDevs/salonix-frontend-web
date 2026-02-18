import { useCallback, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PLAN_OPTIONS, createCheckoutSession } from '../api/billing';
import { checkFounderAvailability } from '../api/users';
import { parseApiError } from '../utils/apiError';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';

function RegisterCheckout() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { slug } = useTenant();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState(() =>
    PLAN_OPTIONS.filter((p) => p.code !== 'founder')
  );

  useEffect(() => {
    checkFounderAvailability()
      .then(({ available }) => {
        if (available) {
          setPlans(PLAN_OPTIONS.filter((p) => p.code !== 'basic'));
        } else {
          setPlans(PLAN_OPTIONS.filter((p) => p.code !== 'founder'));
        }
      })
      .catch(() => {
        setPlans(PLAN_OPTIONS.filter((p) => p.code !== 'founder'));
      });
  }, []);

  const [selected, setSelected] = useState('standard');
  const [billingCycle, setBillingCycle] = useState(
    searchParams.get('interval') === 'annual' ? 'annual' : 'monthly'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onContinue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { url } = await createCheckoutSession(selected, {
        slug,
        interval: billingCycle,
      });
      if (url) {
        window.location.assign(url);
      } else {
        setError({
          message: t(
            'plans.checkout_link_error',
            'Não foi possível obter o link de checkout.'
          ),
        });
      }
    } catch (e) {
      setError(
        parseApiError(
          e,
          t('plans.checkout_error', 'Falha ao iniciar checkout.')
        )
      );
    } finally {
      setLoading(false);
    }
  }, [selected, slug, billingCycle, t]);

  return (
    <div className="min-h-screen theme-bg-primary theme-text-primary flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-brand-border bg-brand-surface p-6 shadow">
        <h1 className="text-xl font-semibold text-brand-surfaceForeground text-center">
          {t('register.checkout.title', 'Escolha seu plano')}
        </h1>
        <p className="mt-2 text-center text-sm text-brand-surfaceForeground/70">
          {t(
            'register.checkout.subtitle',
            'Conclua o registro selecionando um plano'
          )}
        </p>

        {/* Toggle Mensal/Anual */}
        <div className="mt-6 flex justify-center">
          <div className="relative flex rounded-full bg-slate-800 p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`relative z-10 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`relative z-10 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Anual
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                -17%
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error.message}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {plans.map((p) => {
            const isAnnual = billingCycle === 'annual';
            const showPrice =
              isAnnual && p.price_annual ? p.price_annual : p.price;

            return (
              <button
                key={p.code}
                type="button"
                className={`rounded border p-4 text-left transition hover:shadow ${
                  selected === p.code
                    ? 'border-brand-primary ring-2 ring-brand-primary/40'
                    : 'border-brand-border'
                }`}
                onClick={() => setSelected(p.code)}
              >
                <div className="text-lg font-semibold text-brand-surfaceForeground">
                  {t(`plans.options.${p.code}.name`, p.name)}
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-brand-surfaceForeground">
                    {t(
                      `plans.options.${p.code}.price_${isAnnual ? 'annual' : 'monthly'}`,
                      showPrice.replace('/mês', '').replace('/ano', '')
                    )}
                  </span>
                  <span className="text-xs text-brand-surfaceForeground/60">
                    {isAnnual ? '/ano' : '/mês'}
                  </span>
                </div>

                {isAnnual && p.price_annual && (
                  <p className="mt-1 text-[10px] font-bold text-emerald-600">
                    Poupe 2 meses
                  </p>
                )}

                {Array.isArray(p.highlights) && p.highlights.length ? (
                  <ul className="mt-3 list-disc pl-4 text-xs text-brand-surfaceForeground/60">
                    {p.highlights.slice(0, 4).map((h, idx) => (
                      <li key={idx}>
                        {t(`plans.options.${p.code}.highlights.${idx}`, h)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            disabled={loading || !isAuthenticated}
            onClick={onContinue}
            className="text-brand-primary underline hover:text-brand-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? t('common.processing', 'Aguarde…')
              : t('plans.continue_checkout', 'Continuar para checkout')}
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-brand-surfaceForeground/60">
          {t(
            'plans.dev_hint',
            'Dica: defina VITE_BILLING_MOCK=true para simular checkout em desenvolvimento.'
          )}
        </p>
      </div>
    </div>
  );
}

export default RegisterCheckout;
