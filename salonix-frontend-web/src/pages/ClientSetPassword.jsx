import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../layouts/AuthLayout';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';
import ErrorPopup from '../components/ui/ErrorPopup';
import { setClientPassword } from '../api/clientAccess';

export default function ClientSetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const validateForm = () => {
    const validationErrors = {};

    if (!password) {
      validationErrors.password = t(
        'client_set_password.errors.password_required'
      );
    } else if (password.length < 6) {
      validationErrors.password = t(
        'client_set_password.errors.password_too_short'
      );
    }

    if (!confirmPassword) {
      validationErrors.confirmPassword = t(
        'client_set_password.errors.confirm_password_required'
      );
    } else if (password !== confirmPassword) {
      validationErrors.confirmPassword = t(
        'client_set_password.errors.passwords_mismatch'
      );
    }

    return validationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await setClientPassword({ password });

      // Sucesso: redirecionar para área de cliente
      navigate('/client/dashboard', { replace: true });
    } catch (err) {
      console.error('Error setting password:', err);

      // Mapeamento de erros do backend
      const errorMessage = err.response?.data?.detail || '';

      if (
        errorMessage.toLowerCase().includes('sessão') ||
        errorMessage.toLowerCase().includes('autenticação')
      ) {
        setApiError(t('client_set_password.errors.session_expired'));
      } else if (errorMessage.toLowerCase().includes('senha')) {
        setApiError(errorMessage);
      } else {
        setApiError('Erro ao definir senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('client_set_password.title')}
      subtitle={t('client_set_password.subtitle')}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        data-testid="set-password-form"
      >
        <FormInput
          label={t('client_set_password.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('client_set_password.password_placeholder')}
          error={errors.password}
          required
          autoComplete="new-password"
        />

        <FormInput
          label={t('client_set_password.confirm_password')}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('client_set_password.confirm_password_placeholder')}
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
        />

        {apiError && (
          <ErrorPopup message={apiError} onClose={() => setApiError(null)} />
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full text-brand-primary hover:text-brand-primary/80 font-medium underline text-center py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('Definindo...') : t('client_set_password.submit')}
        </button>
      </form>
    </AuthLayout>
  );
}
