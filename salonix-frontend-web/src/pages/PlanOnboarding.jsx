import { useCallback, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../layouts/AuthLayout';
import { PLAN_OPTIONS, createCheckoutSession } from '../api/billing';
import { parseApiError } from '../utils/apiError';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import useBillingOverview from '../hooks/useBillingOverview';
import Modal from '../components/ui/Modal';

export default function PlanOnboarding() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { plan, slug, refetch } = useTenant();
  const {
    overview,
    loading: overviewLoading,
    refresh: refreshOverview,
  } = useBillingOverview({ pollIntervalMs: 3000 });
  const [selected, setSelected] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const plans = useMemo(() => PLAN_OPTIONS, []);

  useEffect(() => {
    if (overview) {
      console.log('[PlanOnboarding] Debug Overview:', {
        trial_exhausted: overview.trial_exhausted,
        trial_eligible: overview.trial_eligible,
        trial_days: overview.trial_days,
        current_subscription: overview.current_subscription,
      });
    }
  }, [overview]);

  useEffect(() => {
    const fromOverview = (
      overview?.current_subscription?.plan_code || ''
    ).toLowerCase();
    const tier = (plan?.tier || plan?.code || '').toLowerCase();
    const candidate = fromOverview || tier;
    if (
      candidate &&
      ['basic', 'standard', 'pro', 'enterprise'].includes(candidate)
    ) {
      setSelected(candidate);
    }
  }, [overview?.current_subscription?.plan_code, plan?.tier, plan?.code]);

  useEffect(() => {
    const handleFocus = () => {
      refreshOverview();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshOverview();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshOverview]);

  useEffect(() => {
    const code = overview?.current_subscription?.plan_code;
    if (code) {
      refetch({ silent: true });
    }
  }, [overview?.current_subscription?.plan_code, refetch]);

  const confirmCheckout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      try {
        localStorage.setItem(
          'onboarding.plan.selection',
          JSON.stringify({ plan: selected, startedAt: Date.now() })
        );
      } catch {
        /* noop */
      }
      const { url } = await createCheckoutSession(selected, { slug });
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
  }, [selected, slug, t]);

  const onContinue = useCallback(() => {
    setConfirmOpen(true);
  }, []);

  return (
    <AuthLayout>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-brand-surfaceForeground">
          {t('plans.title', 'Planos')}
        </h1>
        <p className="text-sm text-brand-surfaceForeground/70">
          {t('plans.subtitle', 'Escolha o plano para iniciar seu painel')}
        </p>

        {!overviewLoading &&
        overview &&
        (overview.trial_exhausted || overview.trial_eligible === false) ? (
          <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            {t(
              'plans.trial_exhausted',
              'Aviso: seu período de teste de {{days}} dias já foi utilizado. A cobrança será imediata ao confirmar o checkout.',
              { days: overview?.trial_days || 14 }
            )}
          </div>
        ) : null}

        {error ? (
          <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error.message}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((p) => (
            <button
              key={p.code}
              type="button"
              className={`rounded border p-4 text-left transition hover:shadow ${
                selected === p.code
                  ? 'border-brand-primary ring-2 ring-brand-primary/40'
                  : 'border-gray-200'
              }`}
              onClick={() => setSelected(p.code)}
            >
              <div className="text-base font-semibold">
                {t(`plans.options.${p.code}.name`, p.name)}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {t(`plans.options.${p.code}.price`, p.price)}
              </div>
              {Array.isArray(p.highlights) && p.highlights.length ? (
                <ul className="mt-2 list-disc pl-4 text-xs text-gray-500">
                  {p.highlights.slice(0, 3).map((h, idx) => (
                    <li key={idx}>
                      {t(`plans.options.${p.code}.highlights.${idx}`, h)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </button>
          ))}
        </div>

        <div className="pt-2">
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
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('plans.confirm_title', 'Confirmar plano')}
        description={t(
          'plans.confirm_desc',
          'Revise o resumo antes de continuar ao checkout.'
        )}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => setConfirmOpen(false)}
              className="text-brand-surfaceForeground underline underline-offset-4 hover:text-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.cancel', 'Cancelar')}
            </button>
            <button
              type="button"
              disabled={loading || !isAuthenticated}
              onClick={confirmCheckout}
              className="text-brand-primary underline underline-offset-4 hover:text-brand-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? t('common.processing', 'Aguarde…')
                : t('plans.continue_checkout', 'Continuar para checkout')}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="rounded border border-brand-border bg-brand-light p-4">
            <p className="text-sm font-medium text-brand-surfaceForeground">
              {t('plans.summary.plan', 'Plano selecionado')}
            </p>
            <p className="text-sm text-brand-surfaceForeground/70">
              {t(`plans.options.${selected}.name`, selected)}
            </p>
          </div>
          <div className="rounded border border-brand-border bg-brand-light p-4">
            <p className="text-sm font-medium text-brand-surfaceForeground">
              {t('plans.summary.billing', 'Faturação')}
            </p>
            <p className="text-sm text-brand-surfaceForeground/70">
              {t(`plans.options.${selected}.price`, '')}
            </p>
          </div>
        </div>
      </Modal>
    </AuthLayout>
  );
}
