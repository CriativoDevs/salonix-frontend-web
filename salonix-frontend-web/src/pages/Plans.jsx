import { useCallback, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import {
  PLAN_OPTIONS,
  createCheckoutSession,
  createBillingPortalSession,
} from '../api/billing';
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

  const plans = useMemo(() => PLAN_OPTIONS, []);

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
          overview.current_subscription.status !== 'trialing' && (
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
        <div className="grid gap-4 sm:grid-cols-3">
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
              <div className="text-lg font-semibold">
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
              {t(`plans.options.${selected}.price`, '')}
            </p>
          </div>
        </div>
      </Modal>
    </FullPageLayout>
  );
}

export default Plans;
