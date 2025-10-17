import { useEffect, useMemo, useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import FormButton from '../ui/FormButton';

const ROLE_LABELS = {
  owner: 'Owner',
  manager: 'Manager',
  collaborator: 'Colaborador',
};

const STATUS_LABELS = {
  active: 'Ativo',
  invited: 'Convite pendente',
  disabled: 'Desativado',
};

function resolveDisplayName(member) {
  if (!member) return '';
  const nameParts = [member.first_name, member.last_name].filter(Boolean).join(' ').trim();
  if (nameParts) return nameParts;
  return member.email || member.username || '';
}

function ManageStaffModal({
  open,
  member,
  onClose,
  currentUserRole,
  onUpdate,
}) {
  const { t } = useTranslation();
  const [role, setRole] = useState(member?.role || 'collaborator');
  const [savingRole, setSavingRole] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const formId = useId();
  const roleFieldId = useId();

  useEffect(() => {
    if (!open) {
      setRole('collaborator');
      setSavingRole(false);
      setStatusBusy(false);
      setFeedback(null);
      setError(null);
      setRequestId(null);
      return;
    }

    if (member) {
      setRole(member.role || 'collaborator');
      setFeedback(null);
      setError(null);
      setRequestId(null);
    }
  }, [open, member?.id, member?.role]);

  const memberName = useMemo(() => resolveDisplayName(member), [member]);
  const isOwnerMember = member?.role === 'owner';
  const canPromoteToManager = currentUserRole === 'owner';
  const managerOptionDisabled = !canPromoteToManager && member?.role !== 'manager';

  const roleOptions = useMemo(() => {
    return [
      {
        value: 'manager',
        label: t('team.manage.roles.manager', 'Manager'),
        disabled: managerOptionDisabled,
      },
      {
        value: 'collaborator',
        label: t('team.manage.roles.collaborator', 'Colaborador'),
        disabled: false,
      },
    ];
  }, [managerOptionDisabled, t]);

  const handleSaveRole = async (event) => {
    event.preventDefault();
    if (!member || isOwnerMember || savingRole) {
      return;
    }

    if (role === member.role) {
      setFeedback({
        type: 'info',
        message: t('team.manage.feedback.no_changes', 'Nenhuma alteração detectada.'),
      });
      return;
    }

    if (!canPromoteToManager && role === 'manager' && member.role !== 'manager') {
      setFeedback(null);
      setError({
        message: t('team.manage.errors.owner_required', 'Apenas o owner pode promover para manager.'),
      });
      return;
    }

    setSavingRole(true);
    setFeedback(null);
    setError(null);
    setRequestId(null);

    const result = await onUpdate(member.id, { role });
    if (result?.success) {
      setFeedback({
        type: 'success',
        message: t('team.manage.feedback.role_updated', 'Papel atualizado com sucesso.'),
      });
      setRequestId(result.requestId || null);
    } else if (result?.error) {
      setError(result.error);
      setRequestId(result.error.requestId || null);
    } else {
      setError({
        message: t('team.manage.errors.generic', 'Não foi possível atualizar o papel.'),
      });
    }

    setSavingRole(false);
  };

  const handleStatusUpdate = async (nextStatus, { confirmMessage }) => {
    if (!member || statusBusy) return;
    if (!window.confirm(confirmMessage)) return;

    setStatusBusy(true);
    setFeedback(null);
    setError(null);
    setRequestId(null);

    const result = await onUpdate(member.id, { status: nextStatus });
    if (result?.success) {
      const statusLabel = STATUS_LABELS[nextStatus] || nextStatus;
      setFeedback({
        type: 'success',
        message: t('team.manage.feedback.status_updated', {
          defaultValue: 'Status atualizado para {{status}}.',
          status: statusLabel,
        }),
      });
      setRequestId(result.requestId || null);
    } else if (result?.error) {
      setError(result.error);
      setRequestId(result.error.requestId || null);
    } else {
      setError({
        message: t('team.manage.errors.generic_status', 'Não foi possível atualizar o status.'),
      });
    }

    setStatusBusy(false);
  };

  const footerButtons = (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <FormButton variant="outline" onClick={onClose}>
        {t('common.close', 'Fechar')}
      </FormButton>
      {!isOwnerMember ? (
        <FormButton
          type="submit"
          form={formId}
          disabled={savingRole || statusBusy}
        >
          {savingRole
            ? t('team.manage.actions.saving', 'Salvando...')
            : t('team.manage.actions.save_role', 'Salvar papel')}
        </FormButton>
      ) : null}
    </div>
  );

  const description = member
    ? t('team.manage.description.label', {
        defaultValue: 'Atualize permissões e status de {{name}}.',
        name: memberName || t('team.manage.description.unknown', 'membro selecionado'),
      })
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('team.manage.title', 'Gerenciar membro da equipe')}
      description={description}
      footer={footerButtons}
    >
      {!member ? (
        <p className="text-sm text-gray-600">
          {t('team.manage.empty', 'Selecione um membro para gerenciar.')}
        </p>
      ) : (
        <form id={formId} onSubmit={handleSaveRole} className="space-y-5">
          <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700">
              {t('team.manage.summary.title', 'Resumo')}
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>
                <strong>{t('team.manage.summary.name', 'Nome')}:</strong>{' '}
                {memberName || t('team.manage.summary.unknown', 'Não informado')}
              </li>
              <li>
                <strong>{t('team.manage.summary.email', 'E-mail')}:</strong>{' '}
                {member?.email || '—'}
              </li>
              <li>
                <strong>{t('team.manage.summary.role', 'Papel atual')}:</strong>{' '}
                {ROLE_LABELS[member.role] || member.role}
              </li>
              <li>
                <strong>{t('team.manage.summary.status', 'Status atual')}:</strong>{' '}
                {STATUS_LABELS[member.status] || member.status}
              </li>
            </ul>
          </div>

          {isOwnerMember ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {t(
                'team.manage.owner_notice',
                'O owner não pode ter papel ou status alterados.',
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor={roleFieldId} className="block text-sm font-medium text-gray-700">
                {t('team.manage.fields.role', 'Papel')}
              </label>
              <select
                id={roleFieldId}
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                disabled={savingRole || statusBusy}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))}
              </select>
              {!canPromoteToManager ? (
                <p className="text-xs text-gray-500">
                  {t(
                    'team.manage.roles.owner_only',
                    'Apenas o owner pode promover colaboradores a manager.',
                  )}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  {t(
                    'team.manage.roles.helper',
                    'Managers têm acesso administrativo completo à equipe.',
                  )}
                </p>
              )}
            </div>
          )}

          {!isOwnerMember ? (
            <div className="space-y-3 rounded-lg border border-gray-100 p-4">
              <p className="text-sm font-medium text-gray-700">
                {t('team.manage.status.title', 'Status e acesso')}
              </p>
              <p className="text-xs text-gray-500">
                {t(
                  'team.manage.status.helper',
                  'Alterar o status ajusta o acesso deste membro ao painel.',
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {member.status === 'active' ? (
                  <FormButton
                    variant="danger"
                    size="sm"
                    disabled={statusBusy}
                    onClick={() =>
                      handleStatusUpdate('disabled', {
                        confirmMessage: t(
                          'team.manage.status.confirm_disable',
                          'Desativar o acesso de {{name}}?',
                          { name: memberName || t('team.manage.summary.unknown', 'este membro') },
                        ),
                      })
                    }
                  >
                    {statusBusy
                      ? t('team.manage.status.updating', 'Atualizando...')
                      : t('team.manage.status.disable', 'Desativar')}
                  </FormButton>
                ) : null}

                {member.status === 'disabled' ? (
                  <FormButton
                    variant="primary"
                    size="sm"
                    disabled={statusBusy}
                    onClick={() =>
                      handleStatusUpdate('active', {
                        confirmMessage: t(
                          'team.manage.status.confirm_activate',
                          'Reativar o acesso de {{name}}?',
                          { name: memberName || t('team.manage.summary.unknown', 'este membro') },
                        ),
                      })
                    }
                  >
                    {statusBusy
                      ? t('team.manage.status.updating', 'Atualizando...')
                      : t('team.manage.status.enable', 'Reativar')}
                  </FormButton>
                ) : null}

                {member.status === 'invited' ? (
                  <>
                    <FormButton
                      variant="primary"
                      size="sm"
                      disabled={statusBusy}
                      onClick={() =>
                        handleStatusUpdate('active', {
                          confirmMessage: t(
                            'team.manage.status.confirm_activate_invite',
                            'Ativar manualmente o convite de {{name}}?',
                            { name: memberName || t('team.manage.summary.unknown', 'este convite') },
                          ),
                        })
                      }
                    >
                      {statusBusy
                        ? t('team.manage.status.updating', 'Atualizando...')
                        : t('team.manage.status.accept', 'Ativar manualmente')}
                    </FormButton>
                    <FormButton
                      variant="danger"
                      size="sm"
                      disabled={statusBusy}
                      onClick={() =>
                        handleStatusUpdate('disabled', {
                          confirmMessage: t(
                            'team.manage.status.confirm_cancel_invite',
                            'Cancelar o convite enviado para {{name}}?',
                            { name: memberName || t('team.manage.summary.unknown', 'este convidado') },
                          ),
                        })
                      }
                    >
                      {statusBusy
                        ? t('team.manage.status.updating', 'Atualizando...')
                        : t('team.manage.status.cancel_invite', 'Cancelar convite')}
                    </FormButton>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {feedback ? (
            <div
              className={`rounded-lg p-3 text-sm ${
                feedback.type === 'success'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-blue-200 bg-blue-50 text-blue-700'
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <p>{error.message}</p>
              {requestId ? (
                <p className="mt-2 text-xs text-rose-600">
                  {t('common.request_id', 'Request ID')}: {requestId}
                </p>
              ) : null}
            </div>
          ) : requestId ? (
            <p className="text-xs text-gray-400">
              {t('common.request_id', 'Request ID')}: {requestId}
            </p>
          ) : null}
        </form>
      )}
    </Modal>
  );
}

export default ManageStaffModal;
