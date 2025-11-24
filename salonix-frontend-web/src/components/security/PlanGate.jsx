import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import usePlanGate from '../../hooks/usePlanGate';
import { trace } from '../../utils/debug';

export default function PlanGate({ featureKey, requiredTier, children, fallback = null }) {
  const { allowed, currentTier, requiredTier: req } = usePlanGate({ featureKey, requiredTier });
  const navigate = useNavigate();

  const defaultFallback = useMemo(() => {
    const tierLabel = (req || '').charAt(0).toUpperCase() + (req || '').slice(1);
    return (
      <div className="rounded-lg border border-brand-border bg-brand-light px-4 py-3 text-sm text-brand-surfaceForeground">
        <p className="mb-2">
          {tierLabel ? `Disponível a partir do plano ${tierLabel}.` : 'Disponível em planos superiores.'}
        </p>
        <button
          type="button"
          className="rounded-md border border-brand-border px-3 py-1 text-xs font-medium"
          onClick={() => {
            trace('plan_gate_upgrade_click', { featureKey: featureKey || null, requiredTier: req, currentTier });
            navigate('/plans');
          }}
        >
          Atualizar plano
        </button>
      </div>
    );
  }, [currentTier, navigate, req, featureKey]);

  if (!allowed) {
    return fallback || defaultFallback;
  }

  return children;
}

