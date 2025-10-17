import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';
import { useTenant } from '../hooks/useTenant';
import { useStaff } from '../hooks/useStaff';
import { useAuth } from '../hooks/useAuth';
import InviteStaffModal from '../components/team/InviteStaffModal';
import ManageStaffModal from '../components/team/ManageStaffModal';

const ROLE_LABELS = {
  owner: 'Owner',
  manager: 'Manager',
  collaborator: 'Colaborador',
};

const STATUS_LABELS = {
  invited: 'Convite pendente',
  active: 'Ativo',
  disabled: 'Desativado',
};

const ROLE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Managers' },
  { value: 'collaborator', label: 'Colaboradores' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'invited', label: 'Convites pendentes' },
  { value: 'disabled', label: 'Desativados' },
];

const ROLE_BADGE_CLASS = {
  owner: 'bg-purple-100 text-purple-700',
  manager: 'bg-sky-100 text-sky-700',
  collaborator: 'bg-emerald-100 text-emerald-700',
};

const STATUS_BADGE_CLASS = {
  active: 'bg-emerald-100 text-emerald-700',
  invited: 'bg-amber-100 text-amber-700',
  disabled: 'bg-rose-100 text-rose-700',
};

const formatDateTime = (value) => {
  if (!value) return null;
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return null;
  }
};

function StaffList({ items, onManage, currentUserRole }) {
  const { t } = useTranslation();

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {items.map((member) => {
        const roleLabel = ROLE_LABELS[member.role] || member.role;
        const statusLabel = STATUS_LABELS[member.status] || member.status;
        const invitedAt = formatDateTime(member.invited_at);
        const activatedAt = formatDateTime(member.activated_at);
        const deactivatedAt = formatDateTime(member.deactivated_at);
        const inviteExpiresAt = formatDateTime(member.invite_token_expires_at);
        const canManage = typeof onManage === 'function';
        const manageDisabled =
          member?.role === 'owner' && currentUserRole !== 'owner';

        return (
          <Card key={member.id} className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {member.first_name || member.last_name
                      ? [member.first_name, member.last_name]
                          .filter(Boolean)
                          .join(' ')
                      : member.email || member.username || '—'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {member.email || member.username || ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  {invitedAt ? (
                    <span>
                      Convite enviado em <strong>{invitedAt}</strong>
                    </span>
                  ) : null}
                  {member.status === 'invited' && inviteExpiresAt ? (
                    <span>
                      Token expira em <strong>{inviteExpiresAt}</strong>
                    </span>
                  ) : null}
                  {activatedAt ? (
                    <span>
                      Ativado em <strong>{activatedAt}</strong>
                    </span>
                  ) : null}
                  {deactivatedAt ? (
                    <span>
                      Desativado em <strong>{deactivatedAt}</strong>
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 md:items-end">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    ROLE_BADGE_CLASS[member.role] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {roleLabel}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    STATUS_BADGE_CLASS[member.status] ||
                    'bg-gray-100 text-gray-600'
                  }`}
                >
                  {statusLabel}
                </span>
                {canManage ? (
                  <FormButton
                    size="sm"
                    variant="outline"
                    disabled={manageDisabled}
                    onClick={() => onManage(member.id)}
                  >
                    {t('team.list.manage', 'Gerenciar')}
                  </FormButton>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Team() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { slug } = useTenant();
  const {
    staff,
    loading,
    error,
    forbidden,
    requestId,
    refetch,
    inviteStaff,
    updateStaff,
  } = useStaff({ slug });

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const filteredStaff = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return (Array.isArray(staff) ? staff : []).filter((member) => {
      if (roleFilter !== 'all' && member.role !== roleFilter) {
        return false;
      }
      if (statusFilter !== 'all' && member.status !== statusFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = [
        member.first_name,
        member.last_name,
        member.email,
        member.username,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();
      return haystack.includes(term);
    });
  }, [staff, roleFilter, statusFilter, search]);

  const currentUserRole = useMemo(() => {
    if (!Array.isArray(staff) || !staff.length || !user) {
      return null;
    }
    const email =
      typeof user.email === 'string' ? user.email.toLowerCase() : null;
    const username =
      typeof user.username === 'string' ? user.username.toLowerCase() : null;
    const match = staff.find((member) => {
      const memberEmail =
        typeof member.email === 'string' ? member.email.toLowerCase() : null;
      const memberUsername =
        typeof member.username === 'string'
          ? member.username.toLowerCase()
          : null;
      return (
        (email && memberEmail === email) ||
        (username && memberUsername === username)
      );
    });
    return match?.role || null;
  }, [staff, user]);

  const currentRoleLabel = currentUserRole
    ? ROLE_LABELS[currentUserRole] || currentUserRole
    : null;

  const selectedMember = useMemo(() => {
    if (!selectedMemberId || !Array.isArray(staff)) return null;
    return staff.find((member) => member?.id === selectedMemberId) || null;
  }, [selectedMemberId, staff]);

  useEffect(() => {
    if (selectedMemberId && !selectedMember) {
      setSelectedMemberId(null);
    }
  }, [selectedMemberId, selectedMember]);

  const openInviteModal = () => setInviteModalOpen(true);
  const closeInviteModal = () => setInviteModalOpen(false);
  const openManageModal = (memberId) => setSelectedMemberId(memberId);
  const closeManageModal = () => setSelectedMemberId(null);

  const handleInviteSubmit = (payload) => inviteStaff(payload);
  const handleUpdateMember = (id, payload) => updateStaff(id, payload);

  return (
    <FullPageLayout>
      <PageHeader
        title={t('team.title', 'Equipe')}
        subtitle={t(
          'team.subtitle',
          'Convide colaboradores, acompanhe convites pendentes e organize os papéis que cada pessoa desempenha no seu negócio.'
        )}
      />

      {forbidden ? (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('team.forbidden.title', 'Acesso restrito')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t(
              'team.forbidden.description',
              'Somente o owner ou managers têm permissão para visualizar e gerenciar a equipe.'
            )}
          </p>
        </Card>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">
                {t('team.current_team_heading', 'Gestão da equipe')}
              </p>
              {currentRoleLabel ? (
                <p className="text-xs text-gray-500">
                  {t('team.current_role.label', {
                    defaultValue: 'Você está autenticado como {{role}}.',
                    role: currentRoleLabel,
                  })}
                </p>
              ) : (
                <p className="text-xs text-gray-400">
                  {t(
                    'team.current_role.loading',
                    'Identificando seu papel no salão...'
                  )}
                </p>
              )}
            </div>
            <FormButton onClick={openInviteModal}>
              {t('team.actions.invite', 'Convidar membro')}
            </FormButton>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <FormInput
              label={t('team.filters.search', 'Busca')}
              placeholder={t(
                'team.filters.search_placeholder',
                'Procurar por nome ou email'
              )}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              inputClassName="text-sm"
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {t('team.filters.role', 'Papel')}
              </label>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`team.filters.role.${option.value}`, option.label)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {t('team.filters.status', 'Status')}
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`team.filters.status.${option.value}`, option.label)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <Card className="mb-6 border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>
                {error.message ||
                  t('team.error.generic', 'Falha ao carregar a equipe.')}
              </p>
              {error.requestId ? (
                <p className="mt-1 text-xs text-rose-600">
                  {t('common.request_id', 'Request ID')}: {error.requestId}
                </p>
              ) : null}
              <button
                type="button"
                onClick={refetch}
                className="mt-3 inline-flex items-center rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
              >
                {t('common.try_again', 'Tentar novamente')}
              </button>
            </Card>
          ) : null}

          {loading ? (
            <Card className="p-6 text-sm text-gray-600">
              {t('common.loading', 'Carregando...')}
            </Card>
          ) : filteredStaff.length === 0 ? (
            <EmptyState
              title={t('team.empty.title', 'Nenhum membro encontrado')}
              description={t(
                'team.empty.description',
                'Convide sua equipe para acessar o painel do salão e organize os papéis conforme necessário.'
              )}
              action={
                <div className="flex flex-col gap-2 sm:flex-row">
                  <FormButton onClick={openInviteModal}>
                    {t('team.actions.invite', 'Convidar membro')}
                  </FormButton>
                  <FormButton variant="outline" onClick={refetch}>
                    {t('common.refresh', 'Atualizar')}
                  </FormButton>
                </div>
              }
            />
          ) : (
            <StaffList
              items={filteredStaff}
              onManage={openManageModal}
              currentUserRole={currentUserRole}
            />
          )}

          {requestId && !error ? (
            <p className="mt-6 text-xs text-gray-400">
              {t('common.request_id', 'Request ID')}: {requestId}
            </p>
          ) : null}
        </>
      )}

      <InviteStaffModal
        open={inviteModalOpen}
        onClose={closeInviteModal}
        currentUserRole={currentUserRole}
        onSubmit={handleInviteSubmit}
      />
      <ManageStaffModal
        open={Boolean(selectedMember)}
        member={selectedMember}
        onClose={closeManageModal}
        currentUserRole={currentUserRole}
        onUpdate={handleUpdateMember}
      />
    </FullPageLayout>
  );
}

export default Team;
