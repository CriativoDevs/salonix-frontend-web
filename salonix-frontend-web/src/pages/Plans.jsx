import { useCallback, useMemo, useState } from 'react';
import { PLAN_OPTIONS, createCheckoutSession } from '../api/billing';
import { parseApiError } from '../utils/apiError';
import { useAuth } from '../hooks/useAuth';

function Plans() {
  const { isAuthenticated } = useAuth();
  const [selected, setSelected] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const plans = useMemo(() => PLAN_OPTIONS, []);

  const onContinue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { url } = await createCheckoutSession(selected);
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
  }, [selected]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Escolha o seu plano</h1>
      {!isAuthenticated && (
        <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
          É necessário iniciar sessão para concluir o checkout.
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
              selected === p.code ? 'border-brand-primary ring-2 ring-brand-primary/40' : 'border-gray-200'
            }`}
            onClick={() => setSelected(p.code)}
          >
            <div className="text-lg font-semibold">{p.name}</div>
            <div className="mt-1 text-sm text-gray-600">{p.description}</div>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <button
          type="button"
          disabled={loading || !isAuthenticated}
          onClick={onContinue}
          className="rounded bg-brand-primary px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Aguarde…' : 'Continuar para checkout'}
        </button>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Dica: defina VITE_BILLING_MOCK=true para simular checkout em desenvolvimento.
      </p>
    </div>
  );
}

export default Plans;

