import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../layouts/AuthLayout';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';
import CaptchaGate from '../components/security/CaptchaGate';
import { useTenant } from '../hooks/useTenant';
import { requestClientAccessLinkPublic } from '../api/clientAccess';
import { getEnvFlag } from '../utils/env';

export default function ClientEnter() {
  const { t } = useTranslation();
  const { slug } = useTenant();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const captchaBypassToken = getEnvFlag('VITE_CAPTCHA_BYPASS_TOKEN');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await requestClientAccessLinkPublic({ tenantSlug: slug, email, captchaBypassToken });
      setSuccess(true);
    } catch (err) {
      const detail = err?.response?.data?.detail || t('Ocorreu um erro. Tente novamente.');
      setError({ message: detail });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-xl font-semibold text-center">{t('Entrar (Cliente)')}</h1>
        {!success && (
          <>
            <FormInput
              label={t('E-mail')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <CaptchaGate />
            <FormButton type="submit" disabled={loading || !email}>
              {loading ? t('Enviando…') : t('Enviar link de acesso')}
            </FormButton>
            {error && (
              <p className="text-sm text-red-600 text-center">{error.message}</p>
            )}
          </>
        )}
        {success && (
          <div className="text-center space-y-2">
            <p className="text-green-700">{t('Se existir cadastro, enviaremos o link.')}</p>
            <p className="text-sm text-gray-600">
              {t('Verifique seu e-mail e siga as instruções.')}
            </p>
          </div>
        )}
      </form>
    </AuthLayout>
  );
}

