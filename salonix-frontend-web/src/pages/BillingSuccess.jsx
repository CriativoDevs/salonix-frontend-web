import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import useBillingOverview from '../hooks/useBillingOverview';

function BillingSuccess() {
  const navigate = useNavigate();
  const { refresh } = useBillingOverview();

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <FullPageLayout>
      <PageHeader title="Pagamento concluído" subtitle="Sua assinatura foi atualizada." />
      <div className="mx-auto max-w-xl p-6 text-brand-surfaceForeground">
        <p className="text-sm">
          Obrigado! Processamos seu checkout. Caso o plano não apareça atualizado, clique em voltar.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="rounded-md border border-brand-border px-4 py-2 text-sm"
            onClick={() => navigate('/settings')}
          >
            Voltar para Configurações
          </button>
          <button
            type="button"
            className="rounded-md border border-brand-border px-4 py-2 text-sm"
            onClick={() => navigate('/plans')}
          >
            Ir para Planos
          </button>
        </div>
      </div>
    </FullPageLayout>
  );
}

export default BillingSuccess;
