import { useEffect, useMemo, useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import FormButton from '../ui/FormButton';
import FormInput from '../ui/FormInput';
import { parseApiError } from '../../utils/apiError';
import { useTenant } from '../../hooks/useTenant';
import { fetchServices } from '../../api/services';

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
  const { slug } = useTenant();
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
    serviceIds: [],
  });
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [professionalModalSubmitting, setProfessionalModalSubmitting] =
    useState(false);
  const [professionalModalError, setProfessionalModalError] = useState(null);
  const [professionalEditing, setProfessionalEditing] = useState(false);
  const [professionalFeedback, setProfessionalFeedback] = useState(null);
  const [contactEmail, setContactEmail] = useState(member?.email || '');
  const formId = useId();

  const [savingRole, setSavingRole] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState(null);

  useEffect(() => {
    if (open && slug) {
      setServicesLoading(true);
      fetchServices(slug)
        .then((data) => {
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
              ? data.results
              : [];
          setServices(list);
        })
        .catch(() => setServices([]))
        .finally(() => setServicesLoading(false));
    }
  }, [open, slug]);

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
        serviceIds: [],
      });
      setCurrentProfessional(null);
      setProfessionalEditing(false);
      setProfessionalFeedback(null);
      setContactEmail(member?.email || '');
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
  }, [open, member, professionals, slug]);

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
        serviceIds: [],
      });
      return;
    }

    setProfessionalForm({
      id: currentProfessional.id || null,
      name: currentProfessional.name || '',
      bio: currentProfessional.bio || '',
      staffMemberId: currentProfessional.staff_member || member.id || '',
      role: member.role || 'collaborator',
      serviceIds: (currentProfessional.service_ids || []).map(Number),
    });
    setContactEmail(member?.email || '');
  }, [open, currentProfessional, member, memberName]);

  const isOwnerMember = member?.role === 'owner';
  const isCollaboratorUser = currentUserRole === 'collaborator';
  const canResendInvite =
    !isOwnerMember &&
    (currentUserRole === 'owner' || currentUserRole === 'manager') &&
    member?.status !== 'active';

  const canSendAccessLink =
    !isOwnerMember &&
    (currentUserRole === 'owner' || currentUserRole === 'manager') &&
    member?.status === 'active' &&
    !!member?.email;

  const missingEmailForAccessLink =
    !isOwnerMember &&
    (currentUserRole === 'owner' || currentUserRole === 'manager') &&
    member?.status === 'active' &&
    !member?.email;

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

  const handleResendInvite = async () => {
    if (!member || !canResendInvite || inviteBusy) return;
    setInviteBusy(true);
    setInviteFeedback(null);
    setError(null);
    setRequestId(null);

    try {
      const { resendStaffInvite } = await import('../../api/staff');
      const result = await resendStaffInvite(member.id);
      if (result?.requestId) setRequestId(result.requestId);
      const staffMember = result?.staffMember || {};
      const token = staffMember.invite_token || null;
      const expiresAt = staffMember.invite_token_expires_at || null;
      setInviteFeedback({
        type: 'success',
        message: t(
          'team.manage.invite.resend_success',
          'Convite reenviado com sucesso.'
        ),
        token,
        expiresAt,
      });
    } catch (err) {
      const parsed = parseApiError(
        err,
        t('team.manage.invite.resend_error', 'Falha ao reenviar o convite.')
      );
      setError(parsed);
      if (parsed?.requestId) setRequestId(parsed.requestId);
    } finally {
      setInviteBusy(false);
    }
  };

  const handleSendAccessLink = async () => {
    if (!member || !canSendAccessLink || inviteBusy) return;
    setInviteBusy(true);
    setInviteFeedback(null);
    setError(null);
    setRequestId(null);

    try {
      const { sendStaffAccessLink } = await import('../../api/staff');
      const result = await sendStaffAccessLink(member.id);
      if (result?.requestId) setRequestId(result.requestId);
      setInviteFeedback({
        type: 'success',
        message: t(
          'team.manage.access_link.sent_success',
          'Link de acesso enviado com sucesso.'
        ),
      });
    } catch (err) {
      const parsed = parseApiError(
        err,
        t(
          'team.manage.access_link.sent_error',
          'Falha ao enviar o link de acesso.'
        )
      );
      setError(parsed);
      if (parsed?.requestId) setRequestId(parsed.requestId);
    } finally {
      setInviteBusy(false);
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
      serviceIds: [],
    });
  };

  const handleProfessionalEdit = () => {
    setProfessionalEditing(true);
    setProfessionalForm({
      id: currentProfessional?.id || null,
      name: currentProfessional?.name || '',
      bio: currentProfessional?.bio || '',
      staffMemberId: currentProfessional?.staff_member || member?.id || '',
      role: member?.role || 'collaborator',
      serviceIds: (currentProfessional?.service_ids || []).map(Number),
    });
  };

  const handleProfessionalCancel = () => {
    setProfessionalEditing(false);
    resetProfessionalForm();
  };

  const handleServiceToggle = (serviceId) => {
    setProfessionalForm((prev) => {
      const current = prev.serviceIds || [];
      if (current.includes(serviceId)) {
        return {
          ...prev,
          serviceIds: current.filter((id) => id !== serviceId),
        };
      }
      return { ...prev, serviceIds: [...current, serviceId] };
    });
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
        bio: (professionalForm.bio || '').trim(),
        staffMemberId: professionalForm.staffMemberId || member?.id,
        serviceIds: professionalForm.serviceIds,
      };

      // Atualizar e-mail de acesso antes de salvar dados do profissional
      const emailTrimmed = contactEmail.trim();
      if (member?.email && !emailTrimmed) {
        setProfessionalModalError({
          message: t(
            'team.manage.contact.email_required',
            'E-mail de acesso não pode ser apagado. Informe um e-mail válido.'
          ),
        });
        setProfessionalModalSubmitting(false);
        return;
      }
      if (emailTrimmed && emailTrimmed !== (member?.email || '')) {
        try {
          const { updateStaffContact } = await import('../../api/staff');
          await updateStaffContact(member.id, { email: emailTrimmed });
        } catch (e) {
          const parsed = parseApiError(
            e,
            t(
              'team.manage.contact.updated_error',
              'Falha ao atualizar e-mail do membro.'
            )
          );
          setProfessionalModalError(parsed);
        }
      }

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
          className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <li>
                    <strong>
                      {t('team.manage.summary.services', 'Serviços')}:
                    </strong>{' '}
                    {servicesLoading ? (
                      <span className="text-brand-surfaceForeground/60">
                        {t('common.loading', 'Carregando...')}
                      </span>
                    ) : currentProfessional?.service_ids &&
                      currentProfessional.service_ids.length > 0 ? (
                      services
                        .filter((s) =>
                          currentProfessional.service_ids.includes(s.id)
                        )
                        .map((s) => s.name)
                        .join(', ') || '—'
                    ) : (
                      '—'
                    )}
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
                  <FormInput
                    label={t(
                      'team.manage.professional.form.email',
                      'E-mail de acesso'
                    )}
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
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
                        borderColor: 'var(--border-primary)',
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-brand-surfaceForeground">
                      {t(
                        'team.manage.professional.form.services',
                        'Serviços Realizados'
                      )}
                    </label>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-brand-border bg-brand-surface p-2">
                      {servicesLoading ? (
                        <p className="text-xs text-brand-surfaceForeground/60 p-2">
                          {t('common.loading', 'Carregando...')}
                        </p>
                      ) : services.length === 0 ? (
                        <p className="text-xs text-brand-surfaceForeground/60 p-2">
                          {t(
                            'team.manage.services.empty',
                            'Nenhum serviço disponível.'
                          )}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {services.map((service) => (
                            <label
                              key={service.id}
                              className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-brand-light rounded"
                            >
                              <input
                                type="checkbox"
                                checked={professionalForm.serviceIds?.includes(
                                  service.id
                                )}
                                onChange={() => handleServiceToggle(service.id)}
                                className="rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                              />
                              <span className="text-sm text-brand-surfaceForeground">
                                {service.name}
                                {service.price_eur && (
                                  <span className="ml-1 text-xs text-brand-surfaceForeground/60">
                                    (€{service.price_eur})
                                  </span>
                                )}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
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
                    <>
                      <button
                        type="button"
                        onClick={handleProfessionalEdit}
                        className="text-sm font-medium text-brand-primary hover:underline"
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
                      {canResendInvite ? (
                        <button
                          type="button"
                          onClick={handleResendInvite}
                          disabled={inviteBusy}
                          className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {inviteBusy
                            ? t('team.manage.invite.resending', 'Reenviando...')
                            : t(
                                'team.manage.invite.resend',
                                'Reenviar convite'
                              )}
                        </button>
                      ) : null}
                      {canSendAccessLink ? (
                        <button
                          type="button"
                          onClick={handleSendAccessLink}
                          disabled={inviteBusy}
                          className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {inviteBusy
                            ? t(
                                'team.manage.access_link.sending',
                                'Enviando...'
                              )
                            : t(
                                'team.manage.access_link.send',
                                'Enviar link de acesso'
                              )}
                        </button>
                      ) : null}
                      {missingEmailForAccessLink ? (
                        <p className="ml-3 text-xs text-brand-surfaceForeground/60">
                          {t(
                            'team.manage.access_link.email_required',
                            'Informe o e-mail do membro para enviar link de acesso.'
                          )}
                        </p>
                      ) : null}
                    </>
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

              {inviteFeedback ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  <p>{inviteFeedback.message}</p>
                  {inviteFeedback.expiresAt ? (
                    <p className="mt-2 text-xs text-emerald-700">
                      {t(
                        'team.invite.token_expires_at',
                        'Token válido até {{datetime}}.',
                        {
                          datetime: new Date(
                            inviteFeedback.expiresAt
                          ).toLocaleString(),
                        }
                      )}
                    </p>
                  ) : null}
                  {inviteFeedback.token ? (
                    <div className="mt-2 rounded-lg border border-brand-border bg-brand-light p-3 text-xs font-mono text-brand-surfaceForeground break-all">
                      {inviteFeedback.token}
                    </div>
                  ) : null}
                  {requestId ? (
                    <p className="mt-2 text-xs text-gray-400">
                      {t('common.request_id', 'Request ID')}: {requestId}
                    </p>
                  ) : null}
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
                    {t(`team.status.${member.status}`, member.status)}
                  </li>
                  <li>
                    <strong>
                      {t('team.manage.summary.role', 'Papel atual')}:
                    </strong>{' '}
                    {t(`team.roles.${member.role}`, member.role)}
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
                            <label
                              key={roleOption}
                              className="flex items-center"
                            >
                              <input
                                type="radio"
                                name="role"
                                value={roleOption}
                                checked={role === roleOption}
                                onChange={(e) => setRole(e.target.value)}
                                className="mr-2 text-brand-primary focus:ring-brand-primary"
                              />
                              <span className="text-sm text-brand-surfaceForeground">
                                {t(`team.roles.${roleOption}`, roleOption)}
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
                          className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-500 rounded-sm"
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
