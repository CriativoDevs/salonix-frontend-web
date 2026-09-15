import { Navigate, useLocation } from 'react-router-dom';
import { useTenant } from '../hooks/useTenant';
import { DEFAULT_TENANT_SLUG } from '../utils/tenant';

const ONBOARDING_ROUTES = {
  setup: '/setup',
  plans: '/onboarding/plan',
  dashboard: '/dashboard',
};

export default function OnboardingGuard({ children }) {
  const { tenant, loading } = useTenant();
  const location = useLocation();

  // Só bloqueia a renderização se for o carregamento inicial (sem dados de tenant)
  // Refetchs subsequentes (loading=true mas com tenant válido) não devem desmontar a tela
  const isInitialLoad =
    loading && (!tenant || tenant.slug === DEFAULT_TENANT_SLUG);

  if (isInitialLoad) {
    return null; // Deixa o PrivateRoute lidar com loading UI se necessário
  }

  const onboardingState = tenant?.onboarding_state || 'completed';

  // Mapeamento de estado para rota obrigatória
  let requiredRoute = null;

  switch (onboardingState) {
    case 'setup_pending':
      requiredRoute = ONBOARDING_ROUTES.setup;
      break;
    case 'billing_pending':
      // FEW-TRIAL-02: com o checkout removido do registo (BE-TRIAL-01/02),
      // este estado só ocorre quando o trial de 14 dias já expirou de
      // verdade (Tenant.is_trial_expired()) -- nunca mais "acabou de se
      // registar". /onboarding/plan (PlanOnboarding.jsx) passa a servir
      // como a tela de bloqueio pós-trial: o redirect forçado abaixo já
      // impede acesso a qualquer outra rota até o pagamento.
      requiredRoute = ONBOARDING_ROUTES.plans;
      break;
    case 'completed':
    default:
      requiredRoute = null; // Acesso livre (dashboard e outras rotas)
      break;
  }

  // Se houver uma rota obrigatória e não estivermos nela, redirecionar
  if (requiredRoute && location.pathname !== requiredRoute) {
    // Evitar loop de redirecionamento se já estivermos na rota certa
    // ou se a rota atual for uma sub-rota permitida do fluxo (ex: /plans/checkout)
    const isAllowedSubRoute = location.pathname.startsWith(requiredRoute);

    if (!isAllowedSubRoute) {
      console.log(
        `[OnboardingGuard] Redirecting from ${location.pathname} to ${requiredRoute} (state: ${onboardingState})`
      );
      return <Navigate to={requiredRoute} replace />;
    }
  }

  // Se o estado for 'completed' ou 'first_login', mas tentarmos acessar rotas de onboarding
  // (ex: usuário já configurado tentando acessar /setup), redirecionar para dashboard
  if (
    !requiredRoute &&
    (location.pathname === '/setup' || location.pathname === '/onboarding/plan')
  ) {
    // Exceção: permitir /plans se o usuário quiser ver planos voluntariamente?
    // Por enquanto, bloqueamos /setup para evitar reconfiguração acidental.
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
