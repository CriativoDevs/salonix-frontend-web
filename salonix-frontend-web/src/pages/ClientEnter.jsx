import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';
import CaptchaGate from '../components/security/CaptchaGate';
import { requestClientAccessLinkPublic } from '../api/clientAccess';
import { getEnvFlag } from '../utils/env';

export default function ClientEnter() {
  const { t } = useTranslation();
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
      await requestClientAccessLinkPublic({ email, captchaBypassToken });
      setSuccess(true);
    } catch (err) {
      const detail =
        err?.response?.data?.detail || t('Ocorreu um erro. Tente novamente.');
      setError({ message: detail });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-xl font-semibold text-center">
          {t('Entrar (Cliente)')}
        </h1>
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
            <FormButton
              type="submit"
              variant="link"
              disabled={loading || !email}
            >
              {loading ? t('client_enter.sending') : t('client_enter.submit')}
            </FormButton>
            {error && (
              <p className="text-sm text-red-600 text-center">
                {error.message}
              </p>
            )}
          </>
        )}
        {success && (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-green-800 font-medium mb-2">
                {t('client_enter.success_title')}
              </h3>
              <p className="text-green-700 text-sm">
                {t('client_enter.success_message')}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-center">
          <Link
            to="/client/login"
            className="text-brand-primary hover:text-brand-primary/80 underline"
          >
            {t(
              'client_enter.already_have_password',
              'Já tem senha? Faça login'
            )}
          </Link>
        </div>

        <div className="mt-6 text-center border-t border-gray-100 pt-3">
          <Link
            to="/login"
            className="text-gray-500 hover:text-brand-primary transition-colors text-xs"
          >
            {t('login.are_you_a_professional')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
