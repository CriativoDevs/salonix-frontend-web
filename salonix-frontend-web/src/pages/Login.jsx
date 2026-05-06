import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import FormInput from '../components/ui/FormInput';
import ErrorPopup from '../components/ui/ErrorPopup';
import { useAuth } from '../hooks/useAuth';
import CaptchaGate from '../components/security/CaptchaGate';
import { getCaptchaTokenForRequest } from '../utils/captchaPolicy';

function Login() {
  const { t } = useTranslation();
  const { login, authError, clearAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [popupError, setPopupError] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleCaptchaToken = (token) => {
    setCaptchaToken(token);
    if (token) {
      setErrors((prev) => {
        if (!prev.captcha) {
          return prev;
        }
        const { captcha, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    setEmail(cleanEmail); // Update state to reflect trimmed value

    if (!cleanEmail) {
      setErrors({ email: t('login.errors.email_required') });
      return;
    }
    // Simple regex check, matching validate() logic but using cleanEmail
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrors({ email: t('login.errors.email_invalid') });
      return;
    }
    if (!password) {
      setErrors({ password: t('login.errors.password_required') });
      return;
    }
    const resolvedCaptchaToken = getCaptchaTokenForRequest(captchaToken);
    if (!resolvedCaptchaToken) {
      setErrors({
        captcha: t(
          'auth.errors.captcha_required',
          'Marque a opção "Eu não sou um robô" para continuar.'
        ),
      });
      return;
    }
    setErrors({}); // Clear errors if valid

    setSubmitting(true);
    setPopupError(null);
    clearAuthError();
    try {
      await login({ email: cleanEmail, password, captchaToken });
    } catch (err) {
      setPopupError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseError = () => {
    setPopupError(null);
    clearAuthError();
  };

  const activeError = popupError || authError;

  return (
    <AuthLayout>
      <ErrorPopup error={activeError} onClose={handleCloseError} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-2xl font-bold text-center text-brand-surfaceForeground">
          {t('login.title')}
        </h1>

        <FormInput
          type="email"
          label={t('login.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('login.email_placeholder')}
          error={errors.email}
        />

        <FormInput
          type="password"
          label={t('login.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('login.password_placeholder')}
          error={errors.password}
        />

        <div className="text-right text-sm">
          <Link
            to="/forgot-password"
            className="text-brand-primary hover:text-brand-primary/80 underline"
          >
            {t('login.forgot_password')}
          </Link>
        </div>

        <div className="text-center">
          <button
            type="submit"
            disabled={submitting}
            className="text-brand-primary hover:text-brand-primary/80 underline font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? t('common.loading') : t('login.submit')}
          </button>
        </div>

        <CaptchaGate onToken={handleCaptchaToken} className="mt-3" />
        {errors.captcha && (
          <p className="text-sm text-red-600" role="alert">
            {errors.captcha}
          </p>
        )}

        <div className="mt-4 text-sm text-center">
          {t('login.no_account')}{' '}
          <Link
            to="/register"
            className="text-brand-primary hover:text-brand-primary/80 underline"
          >
            {t('login.register')}
          </Link>
        </div>

        <div className="mt-2 text-sm text-center border-t border-gray-100 pt-3">
          <Link
            to="/client/enter"
            className="text-gray-500 hover:text-brand-primary transition-colors text-xs"
          >
            {t('login.are_you_a_client', 'É cliente? Aceda à sua área')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Login;
