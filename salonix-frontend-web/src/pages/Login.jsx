import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';
import ErrorPopup from '../components/ui/ErrorPopup';
import { useAuth } from '../hooks/useAuth';
import { consumePostAuthRedirect } from '../utils/navigation';
import { getEnvVar } from '../utils/env';
import CaptchaGate from '../components/security/CaptchaGate';

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, authError, isLoading, isAuthenticated, clearAuthError } =
    useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [popupError, setPopupError] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const scheduled = consumePostAuthRedirect();
      // Se houver redirect agendado, respeitamos.
      // Caso contrário, mandamos para dashboard e o OnboardingGuard decide o resto.
      const target = scheduled || '/dashboard';
      navigate(target, { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

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
    setErrors({}); // Clear errors if valid

    setSubmitting(true);
    setPopupError(null);
    clearAuthError();
    try {
      const bypass = getEnvVar('VITE_CAPTCHA_BYPASS_TOKEN');
      const token = bypass || captchaToken || undefined;
      await login({ email: cleanEmail, password, captchaToken: token });
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

        <CaptchaGate onToken={setCaptchaToken} className="mt-3" />

        <div className="mt-4 text-sm text-center">
          {t('login.no_account')}{' '}
          <Link
            to="/register"
            className="text-brand-primary hover:text-brand-primary/80 underline"
          >
            {t('login.register')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Login;
