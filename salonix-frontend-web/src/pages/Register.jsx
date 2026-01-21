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
import {
  schedulePostAuthRedirect,
  consumePostAuthRedirect,
  clearPostAuthRedirect,
} from '../utils/navigation';
import { getEnvFlag, getEnvVar } from '../utils/env';
import CaptchaGate from '../components/security/CaptchaGate';

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
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sanitize inputs
    const cleanForm = {
      ...form,
      username: form.username.trim(),
      email: form.email.trim(),
      salon_name: form.salon_name.trim(),
      phone_number: form.phone_number.trim(),
      // Passwords are not trimmed to preserve user intent if they really want spaces
    };

    // Update state with clean values for visual feedback
    setForm(cleanForm);

    // Validate using clean values
    const newErrors = {};
    if (!cleanForm.username)
      newErrors.username = t('auth.errors.username_required');
    if (!cleanForm.email) newErrors.email = t('auth.errors.email_required');
    if (!cleanForm.password)
      newErrors.password = t('auth.errors.password_required');
    if (cleanForm.password !== cleanForm.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.password_mismatch');
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    setApiError(null);
    trace('register:submit');

    try {
      const response = await registerUser(
        {
          username: cleanForm.username,
          email: cleanForm.email,
          password: cleanForm.password,
          salon_name: cleanForm.salon_name,
          phone_number: cleanForm.phone_number,
        },
        {
          captchaBypassToken:
            getEnvVar('VITE_CAPTCHA_BYPASS_TOKEN') || captchaToken || undefined,
        }
      );
      trace('register:success', response?.tenant);
      if (response?.tenant?.slug) {
        applyTenantBootstrap(response.tenant);
      }
      const enablePlans = getEnvFlag('VITE_PLAN_WIZARD_AFTER_LOGIN');
      try {
        trace('register:auto-login:start');
        schedulePostAuthRedirect('/register/checkout');
        await login({ email: form.email, password: form.password });
        const scheduledTarget = consumePostAuthRedirect();
        const target =
          scheduledTarget ||
          (enablePlans ? '/register/checkout' : '/dashboard');
        trace('register:auto-login:success', target);
        navigate(target, { replace: true });
      } catch {
        // Se auto-login falhar por qualquer motivo, segue fluxo antigo
        trace('register:auto-login:fail');
        clearPostAuthRedirect();
        setApiError({
          message: 'Auto-login falhou após registo. Por favor, autentique-se.',
        });
        navigate('/login', { replace: true });
      }
    } catch (err) {
      const parsed = parseApiError(err, t('auth.errors.register_failed'));
      setApiError(parsed);

      if (
        parsed.details &&
        !Array.isArray(parsed.details) &&
        typeof parsed.details === 'object'
      ) {
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
        <h1 className="text-2xl font-bold text-center text-brand-surfaceForeground">
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

        <div className="text-center">
          <button
            type="submit"
            className="text-brand-primary hover:text-brand-primary/80 underline font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={submitting}
          >
            {submitting ? t('common.loading') : t('auth.register')}
          </button>
        </div>

        <CaptchaGate onToken={setCaptchaToken} className="mt-3" />

        <div className="text-center text-sm">
          <span className="text-brand-surfaceForeground">
            {t('auth.already_have_account')}{' '}
          </span>
          <Link to="/login" className="text-brand-primary hover:underline">
            {t('auth.login')}
          </Link>
        </div>

        <div className="mt-2 text-center border-t border-gray-100 pt-3">
          <Link
            to="/client/enter"
            className="text-gray-500 hover:text-brand-primary transition-colors text-xs"
          >
            {t('auth.are_you_a_client', 'É cliente? Aceda à sua área')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Register;
