import usePlanGate from './usePlanGate';
import { useNavigate } from 'react-router-dom';
import { TENANT_FEATURE_REQUIREMENTS } from '../constants/tenantFeatures';

/**
 * Hook simplificado para verificar bloqueios de features por plano.
 * Wrapper de usePlanGate com helpers adicionais.
 *
 * @param {string} featureKey - Chave da feature (ex: 'enableReports')
 * @param {string} requiredTier - Tier necessário (opcional, pode vir de featureKey)
 * @returns {Object} { isLocked, isAllowed, currentTier, requiredTier, loading, showUpgrade }
 *
 * @example
 * const { isLocked, showUpgrade } = useFeatureLock('enableReports');
 *
 * if (isLocked) {
 *   return <button onClick={showUpgrade}>Upgrade para Pro</button>;
 * }
 */
export default function useFeatureLock(featureKey, requiredTier) {
  const {
    allowed,
    currentTier,
    requiredTier: reqTier,
    loading,
  } = usePlanGate({
    featureKey,
    requiredTier,
  });

  const navigate = useNavigate();

  /**
   * Navega para a página de planos com highlight do plano necessário.
   * Passa informações via state para a página de planos saber qual feature
   * está sendo desbloqueada.
   */
  const showUpgrade = () => {
    const planToHighlight =
      reqTier ||
      (featureKey && TENANT_FEATURE_REQUIREMENTS[featureKey]?.requiredPlan);

    navigate('/plans', {
      state: {
        highlightPlan: planToHighlight,
        fromFeature: featureKey,
      },
    });
  };

  return {
    isLocked: !allowed, // Mais semântico que !allowed
    isAllowed: allowed, // Mantém compatibilidade
    currentTier, // Plano atual do tenant
    requiredTier: reqTier, // Plano necessário
    loading, // Estado de carregamento
    showUpgrade, // Helper para navegar para /plans
  };
}
