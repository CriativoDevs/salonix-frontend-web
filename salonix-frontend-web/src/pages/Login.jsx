import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { login } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../layouts/AuthLayout';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

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

    try {
      const data = await login(email, password);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setApiError(t('login.errors.invalid_credentials'));
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          {t('login.title')}
        </h1>

        {apiError && (
          <p className="text-sm text-red-500 text-center">{apiError}</p>
        )}

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

        <FormButton type="submit">{t('login.submit')}</FormButton>

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
