import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const { refetch } = useTenant();
  const { refresh: refreshCredits } = useCreditBalance();

  const isCreditPurchase = type === 'credits';

  useEffect(() => {
    const timer = setTimeout(() => {
      refresh();
      refetch({ silent: true });
      refreshCredits();
    }, 1500); // Aguarda um pouco para o webhook do backend processar o Stripe
    return () => clearTimeout(timer);
  }, [refresh, refetch, refreshCredits]);

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
                'Sua assinatura foi atualizada.'
              )
        }
      />
      <div className="mx-auto max-w-xl p-6 text-brand-surfaceForeground">
        <p className="text-sm">
          {isCreditPurchase
            ? t(
                'settings.billing.success.credits_message',
                'Obrigado! Sua compra de créditos foi processada com sucesso. Você já pode utilizá-los.'
              )
            : t(
                'settings.billing.success.subscription_message',
                'Obrigado! Processamos seu checkout. Caso o plano não apareça atualizado, clique em voltar.'
              )}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="rounded-md border border-brand-border px-4 py-2 text-sm"
            onClick={() => navigate('/settings')}
          >
            {t(
              'settings.billing.success.back_settings',
              'Voltar para Configurações'
            )}
          </button>
          {!isCreditPurchase && (
            <button
              type="button"
              className="rounded-md border border-brand-border px-4 py-2 text-sm"
              onClick={() => navigate('/plans')}
            >
              {t('settings.billing.success.go_plans', 'Ir para Planos')}
            </button>
          )}
        </div>
      </div>
    </FullPageLayout>
  );
}

export default BillingSuccess;
