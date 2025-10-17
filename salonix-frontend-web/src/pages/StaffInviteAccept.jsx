import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../layouts/AuthLayout';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';
import { acceptStaffInvite } from '../api/staff';
import { parseApiError } from '../utils/apiError';

function buildDisplayName(member) {
  if (!member) return '';
  const name = [member.first_name, member.last_name].filter(Boolean).join(' ').trim();
  if (name) return name;
  return member.email || member.username || '';
}

function StaffInviteAccept() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState(() => searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [success, setSuccess] = useState(false);
  const [acceptedMember, setAcceptedMember] = useState(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const queryToken = searchParams.get('token') || '';
    if (queryToken && queryToken !== token) {
      setToken(queryToken);
    }
  }, [searchParams, token]);

  useEffect(() => {
    if (!success) {
      setCountdown(0);
      return;
    }
    setCountdown(8);
  }, [success]);

  useEffect(() => {
    if (!success || countdown <= 0) {
      if (success && countdown <= 0) {
        navigate('/login', { replace: true });
      }
      return undefined;
    }
    const timer = setTimeout(() => {
      setCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [success, countdown, navigate]);

  const displayName = useMemo(() => buildDisplayName(acceptedMember), [acceptedMember]);

  const validate = () => {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setError({
        message: t('invite_accept.errors.token_required', 'Informe o token do convite.'),
      });
      return false;
    }
    if (!password || password.length < 8) {
      setError({
        message: t('invite_accept.errors.password_length', 'A senha deve ter pelo menos 8 caracteres.'),
      });
      return false;
    }
    if (password !== confirmPassword) {
      setError({
        message: t('invite_accept.errors.password_mismatch', 'As senhas informadas não coincidem.'),
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!validate()) {
      setRequestId(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    setRequestId(null);

    const payload = {
      token: token.trim(),
      password,
    };
    if (firstName.trim()) {
      payload.first_name = firstName.trim();
    }
    if (lastName.trim()) {
      payload.last_name = lastName.trim();
    }

    try {
      const { staffMember, requestId: reqId } = await acceptStaffInvite(payload);
      setAcceptedMember(staffMember || null);
      setRequestId(reqId || null);
      setSuccess(true);
    } catch (err) {
      const parsed = parseApiError(
        err,
        t('invite_accept.errors.generic', 'Não foi possível aceitar o convite.')
      );
      setError(parsed);
      setRequestId(parsed.requestId || null);
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <AuthLayout>
      {success ? (
        <div className="space-y-5 text-center">
          <h1 className="text-2xl font-semibold text-gray-800">
            {t('invite_accept.success.title', 'Convite aceito com sucesso!')}
          </h1>
          <p className="text-sm text-gray-600">
            {displayName
              ? t('invite_accept.success.body_named', {
                  defaultValue: 'Bem-vindo(a), {{name}}! Sua conta foi ativada.',
                  name: displayName,
                })
              : t(
                  'invite_accept.success.body',
                  'Sua conta foi ativada. Faça login para começar a usar o painel.',
                )}
          </p>
          {requestId ? (
            <p className="text-xs text-gray-400">
              {t('common.request_id', 'Request ID')}: {requestId}
            </p>
          ) : null}
          <FormButton onClick={handleGoToLogin}>
            {t('invite_accept.success.go_to_login', 'Ir para login')}
          </FormButton>
          {countdown > 0 ? (
            <p className="text-xs text-gray-500">
              {t('invite_accept.success.countdown', {
                defaultValue: 'Redirecionando em {{seconds}}s...',
                seconds: countdown,
              })}
            </p>
          ) : null}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h1 className="text-2xl font-semibold text-center text-gray-800">
            {t('invite_accept.title', 'Ativar acesso ao painel')}
          </h1>
          <p className="text-sm text-gray-500 text-center">
            {t(
              'invite_accept.subtitle',
              'Defina sua senha para acessar o painel do salão.',
            )}
          </p>

          <FormInput
            label={t('invite_accept.fields.token', 'Token do convite')}
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder={t('invite_accept.fields.token_placeholder', 'Cole o token recebido')}
            spellCheck={false}
            autoComplete="off"
            required
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label={t('invite_accept.fields.first_name', 'Nome')}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
            <FormInput
              label={t('invite_accept.fields.last_name', 'Sobrenome')}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>

          <FormInput
            type="password"
            label={t('invite_accept.fields.password', 'Senha')}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t('invite_accept.fields.password_placeholder', 'Crie uma senha forte')}
            required
          />

          <FormInput
            type="password"
            label={t('invite_accept.fields.confirm_password', 'Confirmar senha')}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder={t(
              'invite_accept.fields.confirm_password_placeholder',
              'Repita a senha',
            )}
            required
          />

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <p>{error.message}</p>
              {requestId ? (
                <p className="mt-2 text-xs text-rose-600">
                  {t('common.request_id', 'Request ID')}: {requestId}
                </p>
              ) : null}
            </div>
          ) : null}

          <FormButton type="submit" disabled={submitting}>
            {submitting
              ? t('invite_accept.actions.submitting', 'Ativando...')
              : t('invite_accept.actions.submit', 'Ativar acesso')}
          </FormButton>
        </form>
      )}
    </AuthLayout>
  );
}

export default StaffInviteAccept;
