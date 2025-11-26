import { useCallback, useMemo, useState, useEffect } from 'react';
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

function Plans() {
  const { isAuthenticated } = useAuth();
  const { plan, slug } = useTenant();
  const {
    overview,
    loading: overviewLoading,
    refresh: refreshOverview,
  } = useBillingOverview();
  const [selected, setSelected] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [managing, setManaging] = useState(false);
  const [error, setError] = useState(null);

  const plans = useMemo(() => PLAN_OPTIONS, []);

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

  const onContinue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { url } = await createCheckoutSession(selected, { slug });
      if (url) {
        window.location.assign(url);
      } else {
        setError({ message: 'Não foi possível obter o link de checkout.' });
      }
    } catch (e) {
      setError(parseApiError(e, 'Falha ao iniciar checkout.'));
    } finally {
      setLoading(false);
    }
  }, [selected, slug]);

  const onManage = useCallback(async () => {
    setManaging(true);
    setError(null);
    try {
      const { url } = await createBillingPortalSession({ slug });
      if (url) {
        window.location.assign(url);
      } else {
        setError({ message: 'Não foi possível obter o link do portal.' });
      }
    } catch (e) {
      setError(parseApiError(e, 'Falha ao abrir o portal de faturação.'));
    } finally {
      setManaging(false);
    }
  }, [slug]);

  return (
    <FullPageLayout>
      <PageHeader title="Planos" subtitle="Escolha ou gerencie seu plano atual">
        {overview?.current_subscription?.plan_name || plan?.name ? (
          <span className="rounded-full border border-brand-border bg-brand-light px-3 py-1 text-xs font-medium text-brand-surfaceForeground">
            Plano atual:{' '}
            {overview?.current_subscription?.plan_name || plan?.name}
          </span>
        ) : null}
      </PageHeader>
      <div className="mx-auto max-w-3xl p-6">
        {!isAuthenticated && (
          <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
            É necessário iniciar sessão para concluir o checkout.
          </div>
        )}
        {!overviewLoading &&
        overview &&
        (overview.trial_exhausted || overview.trial_eligible === false) ? (
          <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            Aviso: seu período de teste de {overview.trial_days || 14} dias já
            foi utilizado. A cobrança será imediata ao confirmar o checkout.
          </div>
        ) : null}
        {!overviewLoading &&
          overview &&
          overview.current_subscription &&
          overview.current_subscription.status !== 'trialing' && (
            <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              Você já possui uma assinatura ativa. Qualquer mensagem de "14 dias
              grátis" exibida no Stripe não se aplica; a cobrança é imediata.
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
              <div className="text-lg font-semibold">{p.name}</div>
              <div className="mt-1 text-sm text-gray-600">{p.price}</div>
              {Array.isArray(p.highlights) && p.highlights.length ? (
                <ul className="mt-2 list-disc pl-4 text-xs text-gray-500">
                  {p.highlights.slice(0, 3).map((h, idx) => (
                    <li key={idx}>{h}</li>
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
            {loading ? 'Aguarde…' : 'Continuar para checkout'}
          </button>
          <span className="mx-2 text-gray-400">•</span>
          <button
            type="button"
            disabled={managing || !isAuthenticated}
            onClick={onManage}
            className="text-brand-primary underline hover:text-brand-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {managing ? 'Abrindo…' : 'Gerir plano'}
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Dica: defina VITE_BILLING_MOCK=true para simular checkout em
          desenvolvimento.
        </p>
      </div>
    </FullPageLayout>
  );
}

export default Plans;
