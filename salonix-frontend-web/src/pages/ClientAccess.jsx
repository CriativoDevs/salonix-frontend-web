import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../layouts/AuthLayout';
import FormButton from '../components/ui/FormButton';
import { acceptClientAccessToken } from '../api/clientAccess';
import { storeTenantSlug } from '../utils/tenantStorage';
import {
  setClientAccessToken,
  setClientRefreshToken,
} from '../utils/clientAuthStorage';
import { clearTokens } from '../utils/authStorage';

export default function ClientAccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    const token = params.get('token');
    const qsTenant = params.get('tenant');
    const run = async () => {
      if (hasRunRef.current) return;
      hasRunRef.current = true;
      setLoading(true);
      setError(null);
      try {
        if (qsTenant) {
          try {
            storeTenantSlug(qsTenant);
          } catch {
            /* ignore */
          }
        }
        const data = await acceptClientAccessToken({ token });
        setResult(data);

        // Troca explícita de contexto: acesso cliente invalida sessão staff.
        clearTokens();

        // Store tokens using clientAuthStorage (sessionStorage + localStorage)
        if (data.access) {
          setClientAccessToken(data.access);
        }
        if (data.refresh) {
          setClientRefreshToken(data.refresh);
        }

        // Redirecionar baseado em has_password
        if (data.has_password === false) {
          navigate('/client/set-password', { replace: true });
        } else {
          navigate('/client/appointments', { replace: true });
        }
      } catch (err) {
        const detail =
          err?.response?.data?.detail ||
          t('client_access.errors.generic', 'Ocorreu um erro ao aceitar o link.');
        setError({ message: detail });
      } finally {
        setLoading(false);
      }
    };
    if (token) run();
    else {
      setError({
        message: t('client_access.errors.missing_token', 'Token ausente.'),
      });
      setLoading(false);
    }
  }, [params, t, navigate]);

  return (
    <AuthLayout>
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold">
          {t('client_access.title', 'Acesso do Cliente')}
        </h1>
        {loading && <p>{t('client_access.processing', 'Processando…')}</p>}
        {!loading && result && (
          <div className="space-y-2">
            <p className="text-green-700">
              {t('client_access.success', 'Sessão criada com sucesso.')}
            </p>
            <FormButton type="button" onClick={() => window.close()}>
              {t('client_access.close', 'Fechar')}
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
