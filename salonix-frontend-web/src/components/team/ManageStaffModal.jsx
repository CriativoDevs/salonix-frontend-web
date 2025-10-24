import { useEffect, useMemo, useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import FormButton from '../ui/FormButton';
import FormInput from '../ui/FormInput';
import { parseApiError } from '../../utils/apiError';

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
  const nameParts = [member.first_name, member.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (nameParts) return nameParts;
  return member.email || member.username || '';
}

function ManageStaffModal({
  open,
  member,
  onClose,
  onUpdate,
  professionals = [],
  onProfessionalUpdate,
  onProfessionalCreate,
  canManageProfessional = () => false,
  currentUserRole, // Add currentUserRole prop
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('professional'); // 'professional' or 'permissions'
  const [role, setRole] = useState(member?.role || 'collaborator');
  const [statusBusy, setStatusBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [currentProfessional, setCurrentProfessional] = useState(null);
  const [professionalForm, setProfessionalForm] = useState({
    id: null,
    name: '',
    bio: '',
    staffMemberId: '',
    role: member?.role || 'collaborator',
  });
  const [professionalModalSubmitting, setProfessionalModalSubmitting] =
    useState(false);
  const [professionalModalError, setProfessionalModalError] = useState(null);
  const [professionalEditing, setProfessionalEditing] = useState(false);
  const [professionalFeedback, setProfessionalFeedback] = useState(null);
  const formId = useId();

  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    if (!open) {
      setActiveTab('professional');
      setRole(member?.role || 'collaborator');
      setStatusBusy(false);
      setFeedback(null);
      setError(null);
      setRequestId(null);
      setProfessionalModalSubmitting(false);
      setProfessionalModalError(null);
      setProfessionalForm({
        id: null,
        name: '',
        bio: '',
        staffMemberId: '',
        role: member?.role || 'collaborator',
      });
      setCurrentProfessional(null);
      setProfessionalEditing(false);
      setProfessionalFeedback(null);
      return;
    }

    setRole(member?.role || 'collaborator');
    setFeedback(null);
    setError(null);
    setRequestId(null);
    setProfessionalModalError(null);
    setCurrentProfessional(
      Array.isArray(professionals) && professionals.length
        ? professionals[0]
        : null
    );
  }, [open, member, professionals]);

  const memberName = useMemo(() => resolveDisplayName(member), [member]);

  const canEditProfessional =
    !!member &&
    (currentProfessional
      ? canManageProfessional(currentProfessional)
      : typeof onProfessionalCreate === 'function');

  useEffect(() => {
    if (!open || !currentProfessional || !member) {
      setProfessionalForm({
        id: null,
        name: '',
        bio: '',
        staffMemberId: '',
        role: member?.role || 'collaborator',
      });
      return;
    }

    setProfessionalForm({
      id: currentProfessional.id || null,
      name: currentProfessional.name || '',
      bio: currentProfessional.bio || '',
      staffMemberId: currentProfessional.staff_member || member.id || '',
      role: member.role || 'collaborator',
    });
  }, [open, currentProfessional, member, memberName]);

  const isOwnerMember = member?.role === 'owner';
  const isCollaboratorUser = currentUserRole === 'collaborator';

  const handleSaveRole = async (event) => {
    if (event) {
      event.preventDefault();
    }

    if (!member || !onUpdate || role === member.role) {
      return;
    }

    setSavingRole(true);
    setError(null);
    setFeedback(null);
    setRequestId(null);

    try {
      const result = await onUpdate(member.id, { role });
      if (result?.requestId) {
        setRequestId(result.requestId);
      }
      setFeedback({
        type: 'success',
        message: t(
          'team.manage.feedback.role_updated',
          'Papel atualizado com sucesso.'
        ),
      });
    } catch (err) {
      const parsedError = parseApiError(err);
      setError(parsedError);
      if (parsedError?.requestId) {
        setRequestId(parsedError.requestId);
      }
    } finally {
      setSavingRole(false);
    }
  };

  const handleStatusUpdate = async (nextStatus, { confirmMessage }) => {
    if (!member || !onUpdate) return;

    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    setStatusBusy(true);
    setError(null);
    setFeedback(null);
    setRequestId(null);

    try {
      const result = await onUpdate(member.id, { status: nextStatus });
      if (result?.requestId) {
        setRequestId(result.requestId);
      }
      setFeedback({
        type: 'success',
        message: t(
          'team.manage.feedback.status_updated',
          'Status atualizado com sucesso.'
        ),
      });
    } catch (err) {
      const parsedError = parseApiError(err);
      setError(parsedError);
      if (parsedError?.requestId) {
        setRequestId(parsedError.requestId);
      }
    } finally {
      setStatusBusy(false);
    }
  };

  const handleProfessionalChange = (field, value) => {
    setProfessionalForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetProfessionalForm = () => {
    setProfessionalForm({
      id: null,
      name: '',
      bio: '',
      staffMemberId: '',
      role: member?.role || 'collaborator',
    });
  };

  const handleProfessionalEdit = () => {
    setProfessionalEditing(true);
    setProfessionalForm({
      ...currentProfessional,
      staffMemberId: currentProfessional?.staff_member || member?.id || '',
    });
  };

  const handleProfessionalCancel = () => {
    setProfessionalEditing(false);
    resetProfessionalForm();
  };

  const handleProfessionalSave = async (event) => {
    if (event) {
      event.preventDefault();
    }

    if (!professionalForm.name.trim()) {
      setProfessionalModalError({
        message: t(
          'team.manage.professional.errors.name_required',
          'Nome é obrigatório.'
        ),
      });
      return;
    }

    setProfessionalModalSubmitting(true);
    setProfessionalModalError(null);

    try {
      const payload = {
        name: professionalForm.name.trim(),
        bio: professionalForm.bio.trim(),
        staffMemberId: professionalForm.staffMemberId || member?.id,
      };

      if (currentProfessional) {
        await onProfessionalUpdate(currentProfessional.id, payload);
        setProfessionalFeedback({
          type: 'success',
          message: t(
            'team.manage.professional.feedback.updated',
            'Profissional atualizado com sucesso.'
          ),
        });
      } else {
        await onProfessionalCreate(payload);
        setProfessionalFeedback({
          type: 'success',
          message: t(
            'team.manage.professional.feedback.created',
            'Profissional criado com sucesso.'
          ),
        });
      }

      setProfessionalEditing(false);
      resetProfessionalForm();
    } catch (err) {
      const parsedError = parseApiError(err);
      setProfessionalModalError(parsedError);
    } finally {
      setProfessionalModalSubmitting(false);
    }
  };

  const footerButtons = (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        className="text-sm font-medium text-brand-surfaceForeground/60 hover:underline"
      >
        {t('common.close', 'Fechar')}
      </button>
      {activeTab === 'permissions' &&
      !isOwnerMember &&
      currentUserRole === 'owner' ? (
        <button
          type="submit"
          form={formId}
          disabled={savingRole || statusBusy}
          className="text-sm font-medium text-[#1D29CF] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {savingRole
            ? t('team.manage.actions.saving', 'Salvando...')
            : t('team.manage.actions.save_role', 'Salvar papel')}
        </button>
      ) : null}
    </div>
  );

  const description = member
    ? t('team.manage.description.label', {
        defaultValue: 'Gerencie dados profissionais e permissões de {{name}}.',
        name:
          currentProfessional?.name ||
          memberName ||
          t('team.manage.description.unknown', 'membro selecionado'),
      })
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('team.manage.title', 'Gerenciar Profissional')}
      description={description}
      footer={footerButtons}
    >
      {!member ? (
        <p className="text-sm text-brand-surfaceForeground/60">
          {t('team.manage.empty', 'Selecione um membro para gerenciar.')}
        </p>
      ) : (
        <div className="space-y-5">
          {/* Tab Navigation - Hide permissions tab for collaborators */}
          {!isCollaboratorUser && (
            <div className="border-b border-brand-border">
              <nav className="-mb-px flex space-x-8">
                <button
                  type="button"
                  onClick={() => setActiveTab('professional')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'professional'
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-brand-surfaceForeground/60 hover:text-brand-surfaceForeground hover:border-brand-border'
                  }`}
                >
                  {t('team.manage.tabs.professional', 'Dados Profissionais')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('permissions')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'permissions'
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-brand-surfaceForeground/60 hover:text-brand-surfaceForeground hover:border-brand-border'
                  }`}
                >
                  {t('team.manage.tabs.permissions', 'Permissões')}
                </button>
              </nav>
            </div>
          )}

          {/* Professional Tab */}
          {(activeTab === 'professional' || isCollaboratorUser) && (
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border border-brand-border bg-brand-light p-4">
                <p className="text-sm font-medium text-brand-surfaceForeground">
                  {t(
                    'team.manage.professional.summary',
                    'Informações Profissionais'
                  )}
                </p>
                <ul className="space-y-1 text-sm text-brand-surfaceForeground/70">
                  <li>
                    <strong>{t('team.manage.summary.name', 'Nome')}:</strong>{' '}
                    {currentProfessional?.name ||
                      t(
                        'team.manage.summary.no_professional',
                        'Nenhum profissional vinculado'
                      )}
                  </li>
                  {currentProfessional?.bio && (
                    <li>
                      <strong>
                        {t('team.manage.summary.bio', 'Bio ou especialidade')}:
                      </strong>{' '}
                      {currentProfessional.bio}
                    </li>
                  )}
                  <li>
                    <strong>
                      {t('team.manage.summary.email', 'E-mail de acesso')}:
                    </strong>{' '}
                    {member?.email || '—'}
                  </li>
                </ul>
              </div>

              {professionalEditing ? (
                <div className="space-y-3 rounded-lg border border-brand-border bg-brand-surface p-4">
                  <FormInput
                    label={t(
                      'team.manage.professional.form.name',
                      'Nome do profissional'
                    )}
                    value={professionalForm.name}
                    onChange={(event) =>
                      handleProfessionalChange('name', event.target.value)
                    }
                  />
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-brand-surfaceForeground">
                      {t(
                        'team.manage.professional.form.bio',
                        'Bio ou especialidade'
                      )}
                    </label>
                    <textarea
                      value={professionalForm.bio}
                      onChange={(event) =>
                        handleProfessionalChange('bio', event.target.value)
                      }
                      rows={3}
                      className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-primary)'
                      }}
                    />
                  </div>
                  {professionalModalError ? (
                    <div className="my-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                      <p>{professionalModalError.message}</p>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={professionalModalSubmitting}
                      onClick={handleProfessionalSave}
                      className="text-sm font-medium text-emerald-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {professionalModalSubmitting
                        ? t(
                            'team.manage.professional.form.saving',
                            'Salvando...'
                          )
                        : t(
                            'team.manage.professional.form.save',
                            'Salvar profissional'
                          )}
                    </button>
                    <button
                      type="button"
                      disabled={professionalModalSubmitting}
                      onClick={handleProfessionalCancel}
                      className="text-sm font-medium text-brand-surfaceForeground/60 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('common.cancel', 'Cancelar')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {canEditProfessional ? (
                    <button
                      type="button"
                      onClick={handleProfessionalEdit}
                      className="text-sm font-medium text-[#1D29CF] hover:underline"
                    >
                      {currentProfessional
                        ? t(
                            'team.manage.professional.edit',
                            'Editar Profissional'
                          )
                        : t(
                            'team.manage.professional.create',
                            'Criar Profissional'
                          )}
                    </button>
                  ) : (
                    <p className="text-xs text-brand-surfaceForeground/60">
                      {t(
                        'team.manage.professional.no_permission',
                        'Sem permissão para editar dados profissionais'
                      )}
                    </p>
                  )}
                </div>
              )}

              {professionalFeedback ? (
                <div
                  className={`rounded-lg border p-3 text-sm ${
                    professionalFeedback.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-blue-200 bg-blue-50 text-blue-700'
                  }`}
                >
                  {professionalFeedback.message}
                </div>
              ) : null}
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <form id={formId} onSubmit={handleSaveRole} className="space-y-5">
              <div className="space-y-2 rounded-lg border border-brand-border bg-brand-light p-4">
                <p className="text-sm font-medium text-brand-surfaceForeground">
                  {t('team.manage.permissions.summary', 'Permissões de Acesso')}
                </p>
                <ul className="space-y-1 text-sm text-brand-surfaceForeground/70">
                  <li>
                    <strong>{t('team.manage.summary.email', 'E-mail')}:</strong>{' '}
                    {member?.email || '—'}
                  </li>
                  <li>
                    <strong>
                      {t('team.manage.summary.status', 'Status atual')}:
                    </strong>{' '}
                    {STATUS_LABELS[member.status] || member.status}
                  </li>
                  <li>
                    <strong>
                      {t('team.manage.summary.role', 'Papel atual')}:
                    </strong>{' '}
                    {ROLE_LABELS[member.role] || member.role}
                  </li>
                </ul>
              </div>

              {isOwnerMember ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {t(
                    'team.manage.owner_notice',
                    'O owner não pode ter papel ou status alterados.'
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Role section - only visible to owners */}
                  {currentUserRole === 'owner' && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-brand-surfaceForeground">
                        {t('team.manage.role.label', 'Papel')}
                      </label>
                      <div className="space-y-2">
                        {['collaborator', 'manager'].map((roleOption) => {
                          return (
                            <label key={roleOption} className="flex items-center">
                              <input
                                type="radio"
                                name="role"
                                value={roleOption}
                                checked={role === roleOption}
                                onChange={(e) => setRole(e.target.value)}
                                className="mr-2 text-brand-primary focus:ring-brand-primary"
                              />
                              <span className="text-sm text-brand-surfaceForeground">
                                {ROLE_LABELS[roleOption] || roleOption}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(currentUserRole === 'owner' ||
                    currentUserRole === 'manager') && (
                    <div className="space-y-3 rounded-lg border border-brand-border bg-brand-light p-4">
                      <p className="text-sm font-medium text-brand-surfaceForeground">
                        {t('team.manage.status.title', 'Status e acesso')}
                      </p>
                      <p className="text-xs text-brand-surfaceForeground/60">
                        {t(
                          'team.manage.status.helper',
                          'Alterar o status ajusta o acesso deste membro ao painel.'
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <button
                          type="button"
                          disabled={statusBusy || member.status === 'active'}
                          onClick={() =>
                            handleStatusUpdate('active', {
                              confirmMessage: t(
                                'team.manage.status.confirm_activate',
                                'Tem certeza que deseja ativar este membro?'
                              ),
                            })
                          }
                          className="text-sm font-medium text-emerald-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t('team.manage.status.activate', 'Ativar')}
                        </button>
                        <button
                          type="button"
                          disabled={statusBusy || member.status === 'disabled'}
                          onClick={() =>
                            handleStatusUpdate('disabled', {
                              confirmMessage: t(
                                'team.manage.status.confirm_disable',
                                'Tem certeza que deseja desativar este membro?'
                              ),
                            })
                          }
                          className="text-sm font-medium text-rose-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {statusBusy
                            ? t(
                                'team.manage.status.disabling',
                                'Desativando...'
                              )
                            : t('team.manage.status.disable', 'Desativar')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {feedback ? (
                <div
                  className={`rounded-lg border p-3 text-sm ${
                    feedback.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-blue-200 bg-blue-50 text-blue-700'
                  }`}
                >
                  {feedback.message}
                  {requestId ? (
                    <p className="mt-1 text-xs opacity-75">
                      {t('common.request_id', 'Request ID')}: {requestId}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <p>{error.message}</p>
                  {requestId ? (
                    <p className="mt-1 text-xs opacity-75">
                      {t('common.request_id', 'Request ID')}: {requestId}
                    </p>
                  ) : null}
                </div>
              ) : requestId ? (
                <p className="text-xs text-brand-surfaceForeground/40">
                  {t('common.request_id', 'Request ID')}: {requestId}
                </p>
              ) : null}
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}

export default ManageStaffModal;
