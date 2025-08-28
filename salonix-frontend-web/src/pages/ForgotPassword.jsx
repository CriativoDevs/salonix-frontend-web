import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../layouts/AuthLayout';
import FormButton from '../components/ui/FormButton';

function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError(t('auth.errors.email_required'));
      return;
    }

    // TODO: implementar lógica de recuperação de senha
    console.log('Recuperar senha para:', email);
    setIsSubmitted(true);
    setError('');
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

          <h2 className="text-xl font-semibold text-gray-900">
            {t('auth.password_reset_sent')}
          </h2>

          <p className="text-gray-600">
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
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {t('auth.forgot_password')}
          </h1>
          <p className="text-gray-600">
            {t('auth.forgot_password_description')}
          </p>
        </div>

        <div>
          <label className="block text-sm mb-1">{t('auth.email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder={t('auth.email_placeholder')}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <FormButton type="submit" variant="primary" className="w-full">
          {t('auth.send_reset_link')}
        </FormButton>

        <div className="text-center text-sm">
          <span className="text-gray-600">{t('auth.remember_password')} </span>
          <Link to="/login" className="text-brand-primary hover:underline">
            {t('auth.login')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default ForgotPassword;
