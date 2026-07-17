import { useCallback, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../layouts/AuthLayout';
import { PLAN_OPTIONS, createCheckoutSession } from '../api/billing';
import { parseApiError } from '../utils/apiError';
import { isRedirectValidationError, safeRedirect } from '../utils/safeRedirect';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import useBillingOverview from '../hooks/useBillingOverview';
import Modal from '../components/ui/Modal';
import { mergePlanAvailability } from '../utils/planAvailability';

export default function PlanOnboarding() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { slug, refetch } = useTenant();
  const {
    overview,
    loading: overviewLoading,
    refresh: refreshOverview,
  } = useBillingOverview({ pollIntervalMs: 3000 });
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const plans = useMemo(
    () => mergePlanAvailability(PLAN_OPTIONS, overview?.available_plans),
    [overview?.available_plans]
  );

  const plan = plans[0];

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
          JSON.stringify({ plan: plan?.code, startedAt: Date.now() })
        );
      } catch {
        /* noop */
      }
      const { url } = await createCheckoutSession(plan?.code, {
        slug,
        interval: billingCycle,
      });
      if (url) {
        safeRedirect(url);
      } else {
        setError({
          message: t(
            'plans.checkout_link_error',
            'Não foi possível obter o link de checkout.'
          ),
        });
      }
    } catch (e) {
      if (isRedirectValidationError(e)) {
        setError({
          message: t(
            'plans.checkout_redirect_invalid',
            'Não foi possível abrir o checkout com segurança. Tente novamente em instantes.'
          ),
          code: e.code,
          details: null,
          requestId: null,
        });
      } else {
        setError(
          parseApiError(
            e,
            t('plans.checkout_error', 'Falha ao iniciar checkout.')
          )
        );
      }
    } finally {
      setLoading(false);
    }
  }, [plan?.code, slug, t, billingCycle]);

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

        <div className="flex justify-center mb-4">
          <div className="relative flex rounded-full bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`relative z-10 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow dark:bg-indigo-600 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t('plans.monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`relative z-10 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-white text-slate-900 shadow dark:bg-indigo-600 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t('plans.annual')}
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                -17%
              </span>
            </button>
          </div>
        </div>

        {plan && (
          <div className="grid gap-3">
            {(() => {
              const isAnnual = billingCycle === 'annual';
              const showPrice =
                isAnnual && plan.price_annual ? plan.price_annual : plan.price;
              return (
                <div className="relative rounded border border-brand-primary p-4 text-left ring-2 ring-brand-primary/40">
                  <div className="text-base font-semibold flex items-center gap-2">
                    {t(`plans.options.${plan.code}.name`, plan.name)}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 flex items-baseline gap-1">
                    <span>
                      {t(
                        `plans.options.${plan.code}.price_${isAnnual ? 'annual' : 'monthly'}`,
                        showPrice
                      )}
                    </span>
                    <span className="text-xs text-gray-400">
                      {isAnnual ? t('plans.per_year') : t('plans.per_month')}
                    </span>
                  </div>
                  {isAnnual && plan.price_annual && (
                    <p className="mt-1 text-[10px] font-bold text-emerald-600">
                      {t('plans.savings', 'Poupe 2 meses')}
                    </p>
                  )}
                  {Array.isArray(plan.highlights) && plan.highlights.length ? (
                    <ul className="mt-2 list-disc pl-4 text-xs text-gray-500">
                      {plan.highlights.slice(0, 3).map((h, idx) => (
                        <li key={idx}>
                          {t(`plans.options.${plan.code}.highlights.${idx}`, h)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })()}
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            disabled={loading || !isAuthenticated || !plan?.is_available}
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
              disabled={loading || !isAuthenticated || !plan?.is_available}
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
              {t(`plans.options.${plan?.code}.name`, plan?.name)}
            </p>
          </div>
          <div className="rounded border border-brand-border bg-brand-light p-4">
            <p className="text-sm font-medium text-brand-surfaceForeground">
              {t('plans.summary.billing', 'Faturação')}
            </p>
            <p className="text-sm text-brand-surfaceForeground/70">
              {(() => {
                const isAnnual = billingCycle === 'annual';
                const showPrice =
                  isAnnual && plan?.price_annual
                    ? plan.price_annual
                    : plan?.price;
                return t(
                  `plans.options.${plan?.code}.price_${isAnnual ? 'annual' : 'monthly'}`,
                  showPrice
                );
              })()}
            </p>
          </div>
        </div>
      </Modal>
    </AuthLayout>
  );
}
