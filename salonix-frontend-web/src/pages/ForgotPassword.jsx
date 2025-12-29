import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../layouts/AuthLayout';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';
import CaptchaGate from '../components/security/CaptchaGate';
import { getEnvVar } from '../utils/env';

function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    setEmail(cleanEmail);

    if (!cleanEmail) {
      setError(t('auth.errors.email_required'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { requestPasswordReset } = await import('../api/auth');
      const resetUrl = `${window.location.origin}/reset-password`;
      const bypass = getEnvVar('VITE_CAPTCHA_BYPASS_TOKEN');
      await requestPasswordReset(
        cleanEmail,
        resetUrl,
        bypass || captchaToken || undefined
      );
      setIsSubmitted(true);
    } catch {
      // Mesmo em erro, backend retorna neutro; aqui exibimos genérico
      setIsSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-brand-surfaceForeground">
            {t('auth.password_reset_sent')}
          </h2>

          <p className="text-brand-surfaceForeground">
            {t('auth.password_reset_instructions')}
          </p>

          <Link
            to="/login"
            className="inline-block text-brand-primary hover:underline"
          >
            {t('auth.back_to_login')}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-brand-surfaceForeground mb-2">
            {t('auth.forgot_password')}
          </h1>
          <p className="text-brand-surfaceForeground">
            {t('auth.forgot_password_description')}
          </p>
        </div>

        <FormInput
          type="email"
          label={t('auth.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.email_placeholder')}
          error={error}
        />

        <div className="text-center">
          <button
            type="submit"
            disabled={submitting}
            className="text-brand-primary hover:text-brand-primary/80 underline font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? t('common.loading') : t('auth.send_reset_link')}
          </button>
        </div>

        <CaptchaGate onToken={setCaptchaToken} className="mt-3" />

        <div className="text-center text-sm">
          <span className="text-brand-surfaceForeground">
            {t('auth.remember_password')}{' '}
          </span>
          <Link to="/login" className="text-brand-primary hover:underline">
            {t('auth.login')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default ForgotPassword;
