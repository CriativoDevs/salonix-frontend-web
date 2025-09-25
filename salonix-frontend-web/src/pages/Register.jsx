import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../layouts/AuthLayout';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';
import ErrorPopup from '../components/ui/ErrorPopup';
import { registerUser } from '../api/auth';
import { parseApiError } from '../utils/apiError';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { trace } from '../utils/debug';
import { schedulePostAuthRedirect, consumePostAuthRedirect, clearPostAuthRedirect } from '../utils/navigation';
import { getEnvFlag } from '../utils/env';

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { applyTenantBootstrap } = useTenant();
  const { login } = useAuth();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    salon_name: '',
    phone_number: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!form.username) newErrors.username = t('auth.errors.username_required');
    if (!form.email) newErrors.email = t('auth.errors.email_required');
    if (!form.password) newErrors.password = t('auth.errors.password_required');
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.password_mismatch');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError(null);
    trace('register:submit');

    try {
      const response = await registerUser({
        username: form.username,
        email: form.email,
        password: form.password,
        salon_name: form.salon_name,
        phone_number: form.phone_number,
      });
      trace('register:success', response?.tenant);
      if (response?.tenant?.slug) {
        applyTenantBootstrap(response.tenant);
      }
      const enablePlans = getEnvFlag('VITE_PLAN_WIZARD_AFTER_LOGIN');
      try {
        trace('register:auto-login:start');
        schedulePostAuthRedirect('/plans');
        await login({ email: form.email, password: form.password });
        const scheduledTarget = consumePostAuthRedirect();
        const target = scheduledTarget || (enablePlans ? '/plans' : '/dashboard');
        trace('register:auto-login:success', target);
        navigate(target, { replace: true });
      } catch {
        // Se auto-login falhar por qualquer motivo, segue fluxo antigo
        trace('register:auto-login:fail');
        clearPostAuthRedirect();
        setApiError({ message: 'Auto-login falhou após registo. Por favor, autentique-se.' });
        navigate('/login', { replace: true });
      }
    } catch (err) {
      const parsed = parseApiError(err, t('auth.errors.register_failed'));
      setApiError(parsed);

      if (parsed.details && !Array.isArray(parsed.details) && typeof parsed.details === 'object') {
        const fieldErrors = Object.entries(parsed.details).reduce(
          (acc, [field, messages]) => ({
            ...acc,
            [field]: Array.isArray(messages) ? messages[0] : String(messages),
          }),
          {}
        );
        setErrors(fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseError = () => {
    setApiError(null);
  };

  return (
    <AuthLayout>
      <ErrorPopup error={apiError} onClose={handleCloseError} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          {t('auth.register_title')}
        </h1>

        <FormInput
          label={t('auth.username')}
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          error={errors.username}
        />

        <FormInput
          type="email"
          label={t('auth.email')}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />

        <FormInput
          type="password"
          label={t('auth.password')}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
        />

        <FormInput
          type="password"
          label={t('auth.confirm_password')}
          value={form.confirmPassword}
          onChange={(e) =>
            setForm({ ...form, confirmPassword: e.target.value })
          }
          error={errors.confirmPassword}
        />

        <FormInput
          label={t('auth.salon_name')}
          value={form.salon_name}
          onChange={(e) => setForm({ ...form, salon_name: e.target.value })}
        />

        <FormInput
          label={t('auth.phone_number')}
          value={form.phone_number}
          onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
        />

        <FormButton type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? t('common.loading') : t('auth.register')}
        </FormButton>

        <div className="text-center text-sm">
          <span className="text-gray-600">
            {t('auth.already_have_account')}{' '}
          </span>
          <Link to="/login" className="text-brand-primary hover:underline">
            {t('auth.login')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Register;
