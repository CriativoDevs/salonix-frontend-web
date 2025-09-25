import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';
import ErrorPopup from '../components/ui/ErrorPopup';
import { useAuth } from '../hooks/useAuth';
import { consumePostAuthRedirect } from '../utils/navigation';
import { getEnvFlag } from '../utils/env';

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, authError, isLoading, isAuthenticated, clearAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [popupError, setPopupError] = useState(null);

  const enablePlans = getEnvFlag('VITE_PLAN_WIZARD_AFTER_LOGIN');

  useEffect(() => {
    console.log('[Login] enablePlans=', enablePlans, 'isLoading=', isLoading, 'isAuthenticated=', isAuthenticated);
    if (!isLoading && isAuthenticated) {
      const scheduled = consumePostAuthRedirect();
      const target = scheduled || (enablePlans ? '/plans' : '/dashboard');
      navigate(target, { replace: true });
    }
  }, [isLoading, isAuthenticated, enablePlans, navigate]);

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = t('login.errors.email_required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = t('login.errors.email_invalid');

    if (!password) newErrors.password = t('login.errors.password_required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setPopupError(null);
    clearAuthError();
    try {
      console.log('[Login] Attempting login');
      await login({ email, password });
    } catch (err) {
      console.warn('[Login] Login failed', err);
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
        <h1 className="text-2xl font-bold text-center text-gray-800">
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
          <Link to="/forgot-password" className="text-brand hover:underline">
            {t('login.forgot_password')}
          </Link>
        </div>

        <FormButton type="submit" disabled={submitting}>
          {submitting ? t('common.loading') : t('login.submit')}
        </FormButton>

        <div className="mt-4 text-sm text-center">
          {t('login.no_account')}{' '}
          <Link to="/register" className="text-brand hover:underline">
            {t('login.register')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Login;
