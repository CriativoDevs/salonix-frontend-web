import { useEffect, useMemo, useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import FormInput from '../ui/FormInput';
import FormButton from '../ui/FormButton';

const DEFAULT_FORM = {
  email: '',
  firstName: '',
  lastName: '',
  role: 'collaborator',
};

function normalizeEmail(value = '') {
  return value.trim().toLowerCase();
}

function InviteStaffModal({
  open,
  onClose,
  currentUserRole,
  onSubmit,
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [success, setSuccess] = useState(false);
  const [inviteToken, setInviteToken] = useState(null);
  const [inviteExpiresAt, setInviteExpiresAt] = useState(null);
  const formId = useId();

  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_FORM);
      setSubmitting(false);
      setError(null);
      setRequestId(null);
      setSuccess(false);
      setInviteToken(null);
      setInviteExpiresAt(null);
    }
  }, [open]);

  const canInviteManagers = currentUserRole === 'owner';

  const roleOptions = useMemo(() => {
    const options = [
      {
        value: 'collaborator',
        label: t('team.invite.roles.collaborator', 'Colaborador'),
        disabled: false,
      },
      {
        value: 'manager',
        label: t('team.invite.roles.manager', 'Manager'),
        disabled: !canInviteManagers,
      },
    ];
    return options;
  }, [canInviteManagers, t]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const email = normalizeEmail(form.email);
    if (!email) {
      setError({
        message: t('team.invite.errors.email_required', 'Informe o e-mail da pessoa convidada.'),
      });
      return;
    }

    setSubmitting(true);
    setError(null);
    setRequestId(null);
    setSuccess(false);
    setInviteToken(null);
    setInviteExpiresAt(null);

    const payload = {
      email,
      role: form.role || 'collaborator',
    };
    if (form.firstName.trim()) {
      payload.first_name = form.firstName.trim();
    }
    if (form.lastName.trim()) {
      payload.last_name = form.lastName.trim();
    }

    try {
      const result = await onSubmit(payload);
      if (!result?.success) {
        setError(result?.error || { message: t('team.invite.errors.generic', 'Não foi possível enviar o convite.') });
        setRequestId(result?.error?.requestId || null);
        return;
      }

      setSuccess(true);
      setRequestId(result.requestId || null);
      setInviteToken(result.staffMember?.invite_token || null);
      setInviteExpiresAt(result.staffMember?.invite_token_expires_at || null);
      setForm((prev) => ({ ...prev, email: '', firstName: '', lastName: '' }));
    } catch (err) {
      setError({
        message: err?.message || t('team.invite.errors.generic', 'Não foi possível enviar o convite.'),
      });
      setRequestId(err?.requestId || null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteAnother = () => {
    setForm(DEFAULT_FORM);
    setSuccess(false);
    setInviteToken(null);
    setInviteExpiresAt(null);
    setRequestId(null);
    setError(null);
  };

  const footer = success ? (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <FormButton variant="outline" onClick={handleInviteAnother}>
        {t('team.invite.actions.invite_another', 'Convidar outra pessoa')}
      </FormButton>
      <FormButton onClick={onClose}>{t('common.close', 'Fechar')}</FormButton>
    </div>
  ) : (
    <div className="flex justify-end gap-3">
      <FormButton variant="outline" onClick={onClose}>
        {t('common.cancel', 'Cancelar')}
      </FormButton>
      <FormButton type="submit" form={formId} disabled={submitting}>
        {submitting
          ? t('team.invite.actions.sending', 'Enviando...')
          : t('team.invite.actions.submit', 'Enviar convite')}
      </FormButton>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('team.invite.title', 'Convidar membro da equipe')}
      description={t(
        'team.invite.description',
        'Envie um convite por e-mail. O convidado receberá instruções para criar a senha e acessar o painel.',
      )}
      footer={footer}
    >
      {success ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p>{t('team.invite.success', 'Convite enviado com sucesso!')}</p>
            {inviteExpiresAt ? (
              <p className="mt-2 text-xs text-emerald-700">
                {t(
                  'team.invite.token_expires_at',
                  'Token válido até {{datetime}}.',
                  {
                    datetime: new Date(inviteExpiresAt).toLocaleString(),
                  },
                )}
              </p>
            ) : null}
          </div>
          {inviteToken ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {t(
                  'team.invite.token_hint',
                  'Compartilhe este token com o convidado se precisar aceitar manualmente:',
                )}
              </p>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs font-mono text-gray-700 break-all">
                {inviteToken}
              </div>
            </div>
          ) : null}
          {requestId ? (
            <p className="text-xs text-gray-400">
              {t('common.request_id', 'Request ID')}: {requestId}
            </p>
          ) : null}
        </div>
      ) : (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label={t('team.invite.fields.email', 'E-mail')}
            type="email"
            value={form.email}
            onChange={(event) => handleChange('email', event.target.value)}
            required
            autoFocus
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label={t('team.invite.fields.first_name', 'Nome')}
              value={form.firstName}
              onChange={(event) => handleChange('firstName', event.target.value)}
            />
            <FormInput
              label={t('team.invite.fields.last_name', 'Sobrenome')}
              value={form.lastName}
              onChange={(event) => handleChange('lastName', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('team.invite.fields.role', 'Papel')}
            </label>
            <select
              value={form.role}
              onChange={(event) => handleChange('role', event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
            {!canInviteManagers ? (
              <p className="text-xs text-gray-500">
                {t(
                  'team.invite.roles.manager_hint',
                  'Somente o owner pode convidar novos managers.',
                )}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                {t(
                  'team.invite.roles.helper',
                  'Managers podem gerenciar a equipe; colaboradores têm acesso restrito.',
                )}
              </p>
            )}
          </div>

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
        </form>
      )}
    </Modal>
  );
}

export default InviteStaffModal;
