import { useState, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../layouts/AuthLayout';
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
          <h2 className="text-xl font-semibold text-gray-900">
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
          <h2 className="text-xl font-semibold text-gray-900">{t('auth.password_updated')}</h2>
          <FormButton onClick={() => navigate('/login')} variant="primary">
            {t('auth.login')}
          </FormButton>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {t('auth.reset_password')}
          </h1>
          <p className="text-gray-600">{t('auth.reset_password_description')}</p>
        </div>

        <div>
          <label className="block text-sm mb-1">{t('auth.new_password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="********"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">{t('auth.confirm_password')}</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="********"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}

        <FormButton type="submit" variant="primary" className="w-full">
          {t('auth.update_password')}
        </FormButton>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
