import { Link, useLocation } from 'react-router-dom';
import FullPageLayout from '../layouts/FullPageLayout';

function usePlanDetails() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const planCode = params.get('plan') || 'unknown';

  const planMap = {
    basic: {
      title: 'Basic – 29€ / mês',
      description:
        'Admin PWA, notificações por e-mail e relatórios básicos para iniciar com a equipa core.'
    },
    standard: {
      title: 'Standard – 59€ / mês',
      description: 'Tudo do Basic + PWA do cliente, web push e 100 SMS incluídos.'
    },
    pro: {
      title: 'Pro – 99€ / mês',
      description: 'Tudo do Standard + branding próprio e 500 SMS/mês com WhatsApp ilimitado.'
    }
  };

  return planMap[planCode] || {
    title: 'Plano desconhecido',
    description: 'O plano solicitado não foi identificado. Volte e escolha novamente.'
  };
}

function PlanCheckoutMock() {
  const { title, description } = usePlanDetails();

  return (
    <FullPageLayout>
      <div className="mx-auto max-w-xl space-y-6 rounded border border-dashed border-brand-primary bg-white/70 p-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-brand-primary">Mock de Checkout</h1>
        <p className="text-base font-semibold">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
        <p className="rounded bg-yellow-50 p-3 text-sm text-yellow-700">
          Este é apenas um simulador para validar o fluxo. Quando o backend de billing estiver pronto,
          este ecrã será substituído pela página de checkout real.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            to="/dashboard"
            className="rounded bg-brand-primary px-4 py-2 text-white shadow hover:bg-brand-primary/90"
          >
            Voltar para o dashboard
          </Link>
          <Link to="/plans" className="text-sm text-brand-primary hover:underline">
            Escolher outro plano
          </Link>
        </div>
      </div>
    </FullPageLayout>
  );
}

export default PlanCheckoutMock;
