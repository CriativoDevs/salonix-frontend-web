import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import FormInput from '../components/ui/FormInput';
import ErrorPopup from '../components/ui/ErrorPopup';
import { loginClient } from '../api/clientAccess';
import { useTenant } from '../hooks/useTenant';
import { useClientAuth } from '../hooks/useClientAuth';
import {
  setClientAccessToken,
  setClientRefreshToken,
} from '../utils/clientAuthStorage';

function ClientLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTenantSlug: setContextTenantSlug } = useTenant();
  const { login: clientLogin } = useClientAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [popupError, setPopupError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});
    setPopupError(null);

    // Trim email
    const cleanEmail = email.trim();
    setEmail(cleanEmail);

    // Trim tenant slug
    const cleanTenantSlug = tenantSlug.trim();
    setTenantSlug(cleanTenantSlug);

    // Client-side validation
    const validationErrors = {};

    if (!cleanEmail) {
      validationErrors.email = t(
        'client_login.errors.email_required',
        'E-mail é obrigatório'
      );
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      validationErrors.email = t(
        'client_login.errors.email_invalid',
        'E-mail inválido'
      );
    }

    if (!password) {
      validationErrors.password = t(
        'client_login.errors.password_required',
        'Senha é obrigatória'
      );
    } else if (password.length < 6) {
      validationErrors.password = t(
        'client_login.errors.password_too_short',
        'Senha deve ter no mínimo 6 caracteres'
      );
    }

    if (!cleanTenantSlug) {
      validationErrors.tenantSlug = t(
        'client_login.errors.tenant_required',
        'Identificação do estabelecimento é obrigatória'
      );
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Submit to API
    setSubmitting(true);
    try {
      const data = await loginClient({
        email: cleanEmail,
        password,
        tenantSlug: cleanTenantSlug,
      });

      // Store JWT tokens using clientAuthStorage (sessionStorage + localStorage)
      clientLogin(data.access); // Atualizar estado do ClientAuthContext
      if (data.access) {
        setClientAccessToken(data.access);
      }
      if (data.refresh) {
        setClientRefreshToken(data.refresh);
      }

      // Update tenant slug in context (triggers data fetch)
      setContextTenantSlug(cleanTenantSlug);

      // Redirect to client area
      navigate('/client/dashboard');
    } catch (err) {
      // Map backend errors to user-friendly messages
      const backendMessage = err?.response?.data?.detail || err?.message || '';

      const errorMap = {
        'Tenant inválido.': t(
          'client_login.errors.tenant_invalid',
          'Estabelecimento não encontrado. Verifique o identificador digitado.'
        ),
        'Funcionalidade indisponível para este tenant.': t(
          'client_login.errors.feature_disabled',
          'Este estabelecimento não possui área de clientes habilitada.'
        ),
        'Cliente não possui senha definida. Use o link de acesso mágico.': t(
          'client_login.errors.no_password_set',
          'Você ainda não tem senha. Solicite um link de acesso.'
        ),
        'Credenciais inválidas.': t(
          'client_login.errors.invalid_credentials',
          'Email ou senha incorretos'
        ),
      };

      // Check if we have a mapped error
      const mappedError = errorMap[backendMessage];

      if (mappedError) {
        setPopupError({ message: mappedError });
      } else if (err?.response?.status === 429) {
        // Throttle error
        setPopupError({
          message: t(
            'client_login.errors.too_many_attempts',
            'Muitas tentativas. Aguarde alguns minutos.'
          ),
        });
      } else {
        // Generic error
        setPopupError({
          message:
            backendMessage ||
            t('common.error', 'Ocorreu um erro. Tente novamente.'),
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseError = () => {
    setPopupError(null);
  };

  return (
    <AuthLayout>
      <ErrorPopup error={popupError} onClose={handleCloseError} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-brand-surfaceForeground">
            {t('client_login.title', 'Área do Cliente')}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {t('client_login.subtitle', 'Acesse seus agendamentos')}
          </p>
        </div>

        <FormInput
          type="email"
          label={t('client_login.email', 'E-mail')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('client_login.email_placeholder', 'seu@email.com')}
          error={errors.email}
          required
        />

        <FormInput
          type="password"
          label={t('client_login.password', 'Senha')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('client_login.password_placeholder', 'Sua senha')}
          error={errors.password}
          required
        />

        <div>
          <FormInput
            type="text"
            label={t(
              'client_login.tenant_slug',
              'Identificação do Estabelecimento'
            )}
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
            placeholder={t(
              'client_login.tenant_slug_placeholder',
              'nome-do-estabelecimento'
            )}
            error={errors.tenantSlug}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {t(
              'client_login.tenant_slug_help',
              'É o identificador único que aparece no topo da área de cliente. Se não souber, entre em contato com o estabelecimento.'
            )}
          </p>
        </div>

        <div className="text-center">
          <button
            type="submit"
            disabled={submitting}
            className="text-brand-primary hover:text-brand-primary/80 underline font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting
              ? t('common.loading', 'Carregando...')
              : t('client_login.submit', 'Entrar')}
          </button>
        </div>

        <div className="text-center text-sm">
          <Link
            to="/client/enter"
            className="text-brand-primary hover:text-brand-primary/80 underline"
          >
            {t('client_login.forgot_password', 'Esqueceu a senha?')}
          </Link>
        </div>

        <div className="mt-4 text-sm text-center">
          <Link
            to="/client/enter"
            className="text-gray-600 hover:text-brand-primary transition-colors"
          >
            {t(
              'client_login.no_password',
              'Ainda não tem senha? Solicite um link de acesso'
            )}
          </Link>
        </div>

        <div className="mt-2 text-sm text-center border-t border-gray-100 pt-3">
          <Link
            to="/login"
            className="text-gray-500 hover:text-brand-primary transition-colors text-xs"
          >
            {t(
              'client_login.are_you_professional',
              'É profissional? Aceda ao painel'
            )}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default ClientLogin;
