import { useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import {
  PLAN_OPTIONS,
  createCheckoutSession,
  createBillingPortalSession,
} from '../api/billing';
import { checkFounderAvailability } from '../api/users';
import { parseApiError } from '../utils/apiError';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import useBillingOverview from '../hooks/useBillingOverview';
import Modal from '../components/ui/Modal';

function Plans() {
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
  const [managing, setManaging] = useState(false);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [founderAvailable, setFounderAvailable] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showFounderWarning, setShowFounderWarning] = useState(false);

  const [plans, setPlans] = useState(() =>
    PLAN_OPTIONS.filter((p) => p.code !== 'founder')
  );

  useEffect(() => {
    // Detectar ciclo atual
    const interval = overview?.current_subscription?.interval;
    if (interval === 'year' || interval === 'annual') {
      setBillingCycle('annual');
    }
  }, [overview?.current_subscription?.interval]);

  useEffect(() => {
    checkFounderAvailability()
      .then(({ available }) => {
        console.log('[Plans] Founder availability check:', { available });
        setFounderAvailable(available);
      })
      .catch((err) => {
        console.error('[Plans] Founder availability error:', err);
        setFounderAvailable(false);
      });
  }, []);

  useEffect(() => {
    // Backend já valida elegibilidade (ex-Founders recebem remaining_count: 0)
    // Confiar apenas em founderAvailable que reflete a resposta personalizada do backend
    if (founderAvailable) {
      // Founder disponível: Mostra Founder, Esconde Basic
      console.log('[Plans] Showing Founder plan (available)');
      setPlans(PLAN_OPTIONS.filter((p) => p.code !== 'basic'));
    } else {
      // Founder não disponível: Esconde Founder, Mostra Basic
      console.log('[Plans] Hiding Founder plan (not available)');
      setPlans(PLAN_OPTIONS.filter((p) => p.code !== 'founder'));
    }
  }, [founderAvailable]);

  useEffect(() => {
    if (
      overview &&
      (overview.trial_exhausted || overview.trial_eligible === false)
    ) {
      console.warn('[Plans] Trial warning shown:', {
        trial_exhausted: overview.trial_exhausted,
        trial_eligible: overview.trial_eligible,
        trial_days: overview.trial_days,
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
      ['basic', 'standard', 'pro', 'founder'].includes(candidate)
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
      refetch();
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
  }, [selected, slug, t, billingCycle]);

  const onContinue = useCallback(() => {
    setConfirmOpen(true);
  }, []);

  const onManage = useCallback(async () => {
    setManaging(true);
    setError(null);
    try {
      const { url } = await createBillingPortalSession({ slug });
      if (url) {
        window.location.assign(url);
      } else {
        setError({
          message: t(
            'plans.portal_link_error',
            'Não foi possível obter o link do portal.'
          ),
        });
      }
    } catch (e) {
      setError(
        parseApiError(
          e,
          t('plans.portal_error', 'Falha ao abrir o portal de faturação.')
        )
      );
    } finally {
      setManaging(false);
    }
  }, [slug, t]);

  return (
    <FullPageLayout>
      <PageHeader
        title={t('plans.title', 'Planos')}
        subtitle={t('plans.subtitle', 'Escolha ou gerencie seu plano atual')}
      >
        {overview?.current_subscription?.plan_name || plan?.name ? (
          <span className="rounded-full border border-brand-border bg-brand-light px-3 py-1 text-xs font-medium text-brand-surfaceForeground">
            {t('plans.current_badge', 'Plano atual')}:{' '}
            {overview?.current_subscription?.plan_name || plan?.name}
          </span>
        ) : null}
      </PageHeader>
      <div className="mx-auto max-w-3xl p-6">
        {!isAuthenticated && (
          <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
            {t(
              'plans.login_required',
              'É necessário iniciar sessão para concluir o checkout.'
            )}
          </div>
        )}
        {!overviewLoading &&
        overview &&
        !overview.current_subscription &&
        (overview.trial_exhausted || overview.trial_eligible === false) ? (
          <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            {t(
              'plans.trial_exhausted',
              'Aviso: seu período de teste de {{days}} dias já foi utilizado. A cobrança será imediata ao confirmar o checkout.',
              { days: overview?.trial_days || 14 }
            )}
          </div>
        ) : null}
        {!overviewLoading &&
          overview &&
          overview.current_subscription &&
          overview.current_subscription.status !== 'trialing' &&
          overview.current_subscription.plan_code !== 'founder' && (
            <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              {t(
                'plans.already_active',
                'Você já possui uma assinatura ativa. Qualquer mensagem de "14 dias grátis" exibida no Stripe não se aplica; a cobrança é imediata.'
              )}
            </div>
          )}
        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error.message}
          </div>
        )}
        <div className="mb-6 flex justify-center">
          <div className="relative flex rounded-full bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`relative z-10 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow dark:bg-indigo-600 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`relative z-10 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-white text-slate-900 shadow dark:bg-indigo-600 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Anual
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                -17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((p) => {
            const isAnnual = billingCycle === 'annual';
            const showPrice =
              isAnnual && p.price_annual ? p.price_annual : p.price;

            return (
              <button
                key={p.code}
                type="button"
                className={`rounded border p-4 text-left transition hover:shadow relative ${
                  selected === p.code
                    ? 'border-brand-primary ring-2 ring-brand-primary/40'
                    : p.code === 'founder'
                      ? 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10'
                      : 'border-gray-200'
                }`}
                onClick={() => {
                  if (p.code === 'founder') {
                    setShowFounderWarning(true);
                  } else {
                    setSelected(p.code);
                  }
                }}
              >
                {p.code === 'founder' && (
                  <div className="mb-2 inline-block rounded-full bg-amber-500 px-2 py-1 text-xs font-bold text-white">
                    {t(
                      'plans.founder.limited_badge',
                      '⚠️ Limitado a 500 usuários'
                    )}
                  </div>
                )}
                <div className="text-lg font-semibold flex items-center gap-2">
                  {t(`plans.options.${p.code}.name`, p.name)}
                  {p.code === 'founder' && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      {t(`plans.options.${p.code}.badge`, 'Oferta Limitada')}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {t(
                    `plans.options.${p.code}.price_${isAnnual ? 'annual' : 'monthly'}`,
                    showPrice
                  )}
                </div>
                {isAnnual && p.price_annual && (
                  <p className="mt-1 text-[10px] font-bold text-emerald-600">
                    {p.code === 'founder'
                      ? t(
                          'plans.founder.annual_savings',
                          '(10 meses pagos, 2 grátis) - Vitalício'
                        )
                      : t('plans.savings', 'Poupe 2 meses')}
                  </p>
                )}
                {Array.isArray(p.highlights) && p.highlights.length ? (
                  <ul className="mt-2 list-disc pl-4 text-xs text-gray-500">
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

        <div className="mt-6">
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
          <span className="mx-2 text-gray-400">•</span>
          <button
            type="button"
            disabled={managing || !isAuthenticated}
            onClick={onManage}
            className="text-brand-primary underline hover:text-brand-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {managing
              ? t('plans.opening', 'Abrindo…')
              : t('plans.manage_plan', 'Gerir plano')}
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          {t(
            'plans.dev_hint',
            'Dica: defina VITE_BILLING_MOCK=true para simular checkout em desenvolvimento.'
          )}
        </p>
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
              {(() => {
                const p = plans.find((pl) => pl.code === selected) || {};
                const isAnnual = billingCycle === 'annual';
                const showPrice =
                  isAnnual && p.price_annual ? p.price_annual : p.price;
                return t(
                  `plans.options.${selected}.price_${isAnnual ? 'annual' : 'monthly'}`,
                  showPrice
                );
              })()}
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal de Warning do Plano Founder */}
      {showFounderWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex-shrink-0 rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
                <svg
                  className="h-6 w-6 text-amber-600 dark:text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                  {t(
                    'plans.founder.warning_title',
                    'Plano Founder: Limitações Importantes'
                  )}
                </h3>
                <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                  {t(
                    'plans.founder.warning_message',
                    'O Plano Founder é limitado a 500 usuários ativos por salão. Após esse limite, será necessário fazer upgrade para outro plano.'
                  )}
                </p>
                <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                    {t(
                      'plans.founder.warning_note',
                      '💡 Este plano foi criado para apoiar os primeiros 500 clientes da TimelyOne.'
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 text-center text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setShowFounderWarning(false)}
              >
                {t('plans.founder.warning_cancel', 'Cancelar')}
              </button>
              <button
                type="button"
                className="flex-1 text-center text-sm font-medium text-brand-primary hover:text-brand-primary/80 hover:underline dark:text-brand-primary-light"
                onClick={() => {
                  setSelected('founder');
                  setShowFounderWarning(false);
                }}
              >
                {t('plans.founder.warning_confirm', 'Entendi, Continuar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </FullPageLayout>
  );
}

export default Plans;
