import { useEffect, useMemo, useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import FormInput from '../ui/FormInput';
import FormButton from '../ui/FormButton';

const DEFAULT_FORM = {
  professionalName: '',
  email: '',
  role: 'collaborator',
  professionalBio: '',
  professionalStaffMemberId: '',
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
      return;
    }

    setForm({
      ...DEFAULT_FORM,
      role: DEFAULT_FORM.role,
    });
    setSubmitting(false);
    setError(null);
    setRequestId(null);
    setSuccess(false);
    setInviteToken(null);
    setInviteExpiresAt(null);
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

    const professionalName = form.professionalName.trim();
    if (!professionalName) {
      setError({
        message: t(
          'team.invite.errors.professional_name_required',
          'Informe o nome que será exibido para o profissional.'
        ),
      });
      return;
    }

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
      first_name: professionalName, // Usando o nome profissional como first_name
    };

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
      setForm({
        ...DEFAULT_FORM,
      });
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
    setForm({
      ...DEFAULT_FORM,
    });
    setSuccess(false);
    setInviteToken(null);
    setInviteExpiresAt(null);
    setRequestId(null);
    setError(null);
  };

  const footer = success ? (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={handleInviteAnother}
        className="text-sm font-medium text-brand-primary hover:underline"
      >
        {t('team.invite.actions.invite_another', 'Convidar outra pessoa')}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="text-sm font-medium text-brand-surfaceForeground/60 hover:underline"
      >
        {t('common.close', 'Fechar')}
      </button>
    </div>
  ) : (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="text-sm font-medium text-brand-surfaceForeground/60 hover:underline"
      >
        {t('common.cancel', 'Cancelar')}
      </button>
      <button
        type="submit"
        form={formId}
        disabled={submitting}
        className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting
          ? t('team.invite.actions.sending', 'Enviando...')
          : t('team.invite.actions.submit', 'Enviar convite')}
      </button>
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
              <p className="text-sm text-brand-surfaceForeground/70">
                {t(
                  'team.invite.token_hint',
                  'Compartilhe este token com o convidado se precisar aceitar manualmente:',
                )}
              </p>
              <div className="rounded-lg border border-brand-border bg-brand-light p-3 text-xs font-mono text-brand-surfaceForeground break-all">
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
          <div className="space-y-3 rounded-lg border border-brand-border bg-brand-surface p-4">
            <div>
              <p className="text-sm font-medium text-brand-surfaceForeground">
                {t('team.invite.professional.title', 'Dados do profissional')}
              </p>
              <p className="text-xs text-brand-surfaceForeground/70">
                {t(
                  'team.invite.professional.helper',
                  'Defina como o profissional será apresentado no portal.'
                )}
              </p>
            </div>
            <FormInput
              label={t('team.invite.professional.name', 'Nome do profissional')}
              value={form.professionalName}
              onChange={(event) =>
                handleChange('professionalName', event.target.value)
              }
              required
              autoFocus
            />
            <FormInput
              label={t('team.invite.fields.email', 'E-mail')}
              type="email"
              value={form.email}
              onChange={(event) => handleChange('email', event.target.value)}
              required
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-brand-surfaceForeground">
                {t('team.invite.fields.role', 'Papel')}
              </label>
              <select
                value={form.role}
                onChange={(event) => handleChange('role', event.target.value)}
                className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))}
              </select>
              {!canInviteManagers ? (
                <p className="text-xs text-brand-surfaceForeground/70">
                  {t(
                    'team.invite.roles.manager_hint',
                    'Somente o owner pode convidar novos managers.',
                  )}
                </p>
              ) : (
                <p className="text-xs text-brand-surfaceForeground/70">
                  {t(
                    'team.invite.roles.helper',
                    'Managers podem gerenciar a equipe; colaboradores têm acesso restrito.',
                  )}
                </p>
              )}
            </div>
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
