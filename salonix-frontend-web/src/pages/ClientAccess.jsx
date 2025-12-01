import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../layouts/AuthLayout';
import FormButton from '../components/ui/FormButton';
import {
  acceptClientAccessToken,
  refreshClientSession,
} from '../api/clientAccess';

export default function ClientAccess() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = params.get('token');
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await acceptClientAccessToken({ token });
        setResult(data);
        await refreshClientSession().catch(() => {});
        try {
          localStorage.setItem('client_session_present', '1');
        } catch {
          /* ignore */
        }
      } catch (err) {
        const detail =
          err?.response?.data?.detail ||
          t('Ocorreu um erro ao aceitar o link.');
        setError({ message: detail });
      } finally {
        setLoading(false);
      }
    };
    if (token) run();
    else {
      setError({ message: t('Token ausente.') });
      setLoading(false);
    }
  }, [params, t]);

  return (
    <AuthLayout>
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold">{t('Acesso do Cliente')}</h1>
        {loading && <p>{t('Processando…')}</p>}
        {!loading && result && (
          <div className="space-y-2">
            <p className="text-green-700">{t('Sessão criada com sucesso.')}</p>
            <FormButton type="button" onClick={() => window.close()}>
              {t('Fechar')}
            </FormButton>
          </div>
        )}
        {!loading && error && (
          <p className="text-sm text-red-600">{error.message}</p>
        )}
      </div>
    </AuthLayout>
  );
}
