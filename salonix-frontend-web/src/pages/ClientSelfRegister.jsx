import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../layouts/AuthLayout';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';
import CaptchaChallenge from '../components/security/CaptchaChallenge';
import { fetchPublicTenant } from '../api/tenant';
import { registerClientPublic } from '../api/clientSelfRegister';

export default function ClientSelfRegister() {
  const { t } = useTranslation();
  const { tenantSlug } = useParams();

  const [tenant, setTenant] = useState(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [tenantNotFound, setTenantNotFound] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [captcha, setCaptcha] = useState({ captchaKey: null, captchaValue: null });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setTenantLoading(true);
    setTenant(null);
    setTenantNotFound(false);
    fetchPublicTenant(tenantSlug)
      .then((data) => {
        if (!active) return;
        setTenant(data);
        setTenantNotFound(false);
      })
      .catch(() => {
        if (!active) return;
        setTenantNotFound(true);
      })
      .finally(() => {
        if (active) setTenantLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tenantSlug]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (loading) return;
      setLoading(true);
      setError(null);
      try {
        await registerClientPublic({
          tenantSlug,
          name,
          email,
          phoneNumber,
          marketingOptIn: false,
          captchaKey: captcha.captchaKey || undefined,
          captchaValue: captcha.captchaValue,
        });
        setSuccess(true);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 429) {
          setError({
            message: t(
              'join.errors.rate_limited',
              'Muitas tentativas. Aguarde uns minutos e tente novamente.'
            ),
          });
        } else {
          const detail = err?.response?.data?.detail;
          const fieldErrors = err?.response?.data;
          const firstFieldError =
            !detail && fieldErrors && typeof fieldErrors === 'object'
              ? Object.values(fieldErrors)[0]?.[0]
              : null;
          setError({
            message:
              detail ||
              firstFieldError ||
              t('join.errors.generic', 'Ocorreu um erro. Tente novamente.'),
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [loading, tenantSlug, name, email, phoneNumber, captcha, t]
  );

  if (tenantLoading) {
    return (
      <AuthLayout>
        <p className="text-center text-sm text-brand-surfaceForeground/70">
          {t('join.loading', 'A carregar…')}
        </p>
      </AuthLayout>
    );
  }

  if (tenantNotFound) {
    return (
      <AuthLayout>
        <p className="text-center text-sm text-brand-surfaceForeground/70">
          {t('join.tenant_not_found', 'Link inválido ou salão não encontrado.')}
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-xl font-semibold text-center text-brand-surfaceForeground">
          {tenant?.name}
        </h1>
        <p className="text-sm text-center text-brand-surfaceForeground/70">
          {t('join.subtitle', 'Registe-se para aceder à sua área de cliente')}
        </p>

        {!success && (
          <>
            <FormInput
              label={t('join.form.name', 'Nome completo')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <FormInput
              label={t('join.form.email', 'E-mail')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FormInput
              label={t('join.form.phone', 'Telefone')}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <CaptchaChallenge onChange={setCaptcha} />
            <FormButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading || !name}
              loading={loading}
            >
              {loading
                ? t('join.form.submitting', 'A registar…')
                : t('join.form.submit', 'Registar')}
            </FormButton>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {error.message}
              </p>
            )}
          </>
        )}

        {success && (
          <div className="text-center space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="text-green-800 dark:text-green-300 font-medium mb-2">
                {t('join.success_title', 'Cadastro realizado!')}
              </h3>
              <p className="text-green-700 dark:text-green-400 text-sm">
                {t(
                  'join.success_message',
                  'Verifique o seu email para definir a senha.'
                )}
              </p>
            </div>
          </div>
        )}
      </form>
    </AuthLayout>
  );
}
