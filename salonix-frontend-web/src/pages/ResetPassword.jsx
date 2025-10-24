import { useState, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../layouts/AuthLayout';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';

function ResetPassword() {
  const { t } = useTranslation();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const uid = sp.get('uid') || '';
  const token = sp.get('token') || '';

  const validParams = useMemo(() => Boolean(uid && token), [uid, token]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validParams) {
      setError(t('auth.errors.invalid_link'));
      return;
    }
    if (!password || password.length < 8) {
      setError(t('auth.errors.weak_password'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.errors.password_mismatch'));
      return;
    }
    try {
      const { confirmPasswordReset } = await import('../api/auth');
      await confirmPasswordReset(uid, token, password);
      setDone(true);
    } catch {
      setError(t('auth.errors.reset_failed'));
    }
  };

  if (!validParams) {
    return (
      <AuthLayout>
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-brand-surfaceForeground">
            {t('auth.errors.invalid_link')}
          </h2>
          <Link to="/forgot-password" className="text-brand-primary hover:underline">
            {t('auth.back_to_forgot')}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-brand-surfaceForeground">{t('auth.password_updated')}</h2>
          <button onClick={() => navigate('/login')} className="bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors">
            {t('auth.login')}
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-brand-surfaceForeground mb-2">
            {t('auth.reset_password')}
          </h1>
          <p className="text-brand-surfaceForeground">{t('auth.reset_password_description')}</p>
        </div>

        <FormInput
          type="password"
          label={t('auth.new_password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="********"
        />

        <FormInput
          type="password"
          label={t('auth.confirm_password')}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="********"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors">
          {t('auth.update_password')}
        </button>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
