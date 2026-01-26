import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import useBillingOverview from '../hooks/useBillingOverview';
import { useTenant } from '../hooks/useTenant';
import useCreditBalance from '../hooks/useCreditBalance';

function BillingSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const { refresh } = useBillingOverview();
  const { tenant, refetch } = useTenant();
  const { refresh: refreshCredits } = useCreditBalance();
  const pollingRef = useRef(null);
  const attemptsRef = useRef(0);

  const isCreditPurchase = type === 'credits';

  useEffect(() => {
    // ✅ NOVO: Polling até detectar assinatura ativa
    const checkSubscriptionReady = async () => {
      try {
        // Força refetch SEM cache
        await refetch({ silent: false });

        const currentState = tenant?.onboarding_state;

        console.log('[BillingSuccess] Polling attempt:', {
          attempt: attemptsRef.current + 1,
          onboarding_state: currentState,
          plan_tier: tenant?.plan?.tier,
        });

        // Se não é mais billing_pending, assinatura foi processada
        if (currentState === 'completed') {
          console.log(
            '[BillingSuccess] Subscription ready! Redirecting to dashboard...'
          );

          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          // Aguarda 1s para garantir que UI atualizou
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);

          return;
        }

        attemptsRef.current += 1;

        // ⚠️ Timeout após 20 tentativas (40 segundos)
        if (attemptsRef.current >= 20) {
          console.warn(
            '[BillingSuccess] Polling timeout after 40s. Webhook may not have processed yet.'
          );

          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (error) {
        console.error('[BillingSuccess] Polling error:', error);
      }
    };

    // Refresh imediato de billing overview e créditos
    refresh();
    refreshCredits();

    // ✅ Inicia polling a cada 2 segundos (só para assinaturas, não créditos)
    if (!isCreditPurchase) {
      pollingRef.current = setInterval(checkSubscriptionReady, 2000);

      // Primeira tentativa imediata
      checkSubscriptionReady();
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [
    refresh,
    refetch,
    refreshCredits,
    navigate,
    isCreditPurchase,
    tenant?.onboarding_state,
    tenant?.plan?.tier,
  ]);

  return (
    <FullPageLayout>
      <PageHeader
        title={
          isCreditPurchase
            ? t(
                'settings.billing.success.credits_title',
                'Compra de créditos concluída'
              )
            : t(
                'settings.billing.success.subscription_title',
                'Pagamento concluído'
              )
        }
        subtitle={
          isCreditPurchase
            ? t(
                'settings.billing.success.credits_subtitle',
                'Seus créditos foram adicionados à sua conta.'
              )
            : t(
                'settings.billing.success.subscription_subtitle',
                'Sua assinatura foi atualizada. Aguarde enquanto processamos...'
              )
        }
      />
      <div className="mx-auto max-w-xl p-6 text-brand-surfaceForeground">
        {/* ✅ NOVO: Indicador de processamento para assinaturas */}
        {!isCreditPurchase &&
          tenant?.onboarding_state === 'billing_pending' && (
            <div className="mb-4 rounded border border-blue-300 bg-blue-50 p-4 text-sm text-blue-800">
              <div className="flex items-center gap-3">
                {/* Spinner animado */}
                <svg
                  className="h-5 w-5 animate-spin text-blue-600"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-medium">
                    {t(
                      'settings.billing.success.processing',
                      'Processando pagamento...'
                    )}
                  </p>
                  <p className="mt-1 text-xs text-blue-600">
                    {t(
                      'settings.billing.success.redirect_info',
                      'Você será redirecionado automaticamente para o dashboard.'
                    )}
                  </p>
                </div>
              </div>

              {/* Contador de tentativas (só mostra se passou de 5 tentativas) */}
              {attemptsRef.current > 5 && (
                <p className="mt-3 text-xs text-blue-600 border-t border-blue-200 pt-2">
                  {t(
                    'settings.billing.success.polling_info',
                    'Tentativa {{attempt}} de 20. Se demorar muito, clique em "Ir para Dashboard" abaixo.',
                    { attempt: attemptsRef.current }
                  )}
                </p>
              )}
            </div>
          )}

        {/* ✅ NOVO: Mensagem de sucesso quando onboarding_state já é "completed" */}
        {!isCreditPurchase && tenant?.onboarding_state === 'completed' && (
          <div className="mb-4 rounded border border-green-300 bg-green-50 p-4 text-sm text-green-800">
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-medium">
                  {t('settings.billing.success.ready', 'Assinatura ativada!')}
                </p>
                <p className="mt-1 text-xs text-green-600">
                  {t(
                    'settings.billing.success.ready_info',
                    'Redirecionando para o dashboard...'
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm">
          {isCreditPurchase
            ? t(
                'settings.billing.success.credits_message',
                'Obrigado! Sua compra de créditos foi processada com sucesso. Você já pode utilizá-los.'
              )
            : t(
                'settings.billing.success.subscription_message',
                'Obrigado! Seu checkout foi processado. Aguarde enquanto ativamos sua assinatura.'
              )}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-brand-border px-4 py-2 text-sm text-brand-surfaceForeground hover:bg-brand-surface transition-colors"
          >
            {t('common.back', 'Voltar')}
          </button>

          <Link
            to="/dashboard"
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors"
          >
            {t('common.go_dashboard', 'Ir para Dashboard')}
          </Link>

          {!isCreditPurchase && (
            <Link
              to="/settings"
              className="rounded-md border border-brand-border px-4 py-2 text-sm text-brand-surfaceForeground hover:bg-brand-surface transition-colors"
            >
              {t('common.settings', 'Configurações')}
            </Link>
          )}
        </div>
      </div>
    </FullPageLayout>
  );
}

export default BillingSuccess;
