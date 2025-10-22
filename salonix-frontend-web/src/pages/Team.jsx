import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import {
  fetchProfessionals,
  createProfessional,
  updateProfessional,
} from '../api/professionals';
import InviteStaffModal from '../components/team/InviteStaffModal';
import ManageStaffModal from '../components/team/ManageStaffModal';
import { parseApiError } from '../utils/apiError';

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

function StaffList({ items, onManage, currentUserRole, currentStaffMember }) {
  const { t } = useTranslation();

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {items.map((professional) => {
        // Get linked staff member for role and permissions
        const staffMember = professional.staff_member_data;
        const roleLabel = staffMember ? ROLE_LABELS[staffMember.role] || staffMember.role : '—';
        
        // Determine status based on staff member status if available
        let statusLabel, statusBadgeClass;
        if (professional.isStaffOnly) {
          // For staff-only entries, use staff status directly
          const staffStatus = staffMember?.status || 'active';
          statusLabel = STATUS_LABELS[staffStatus] || staffStatus;
          statusBadgeClass = STATUS_BADGE_CLASS[staffStatus] || 'bg-gray-100 text-gray-600';
        } else {
          // For professionals with staff, combine both statuses
          if (staffMember) {
            if (staffMember.status === 'invited') {
              statusLabel = STATUS_LABELS.invited;
              statusBadgeClass = STATUS_BADGE_CLASS.invited;
            } else if (staffMember.status === 'disabled') {
              statusLabel = STATUS_LABELS.disabled;
              statusBadgeClass = STATUS_BADGE_CLASS.disabled;
            } else if (staffMember.status === 'active' && professional.is_active) {
              statusLabel = STATUS_LABELS.active;
              statusBadgeClass = STATUS_BADGE_CLASS.active;
            } else {
              statusLabel = STATUS_LABELS.disabled;
              statusBadgeClass = STATUS_BADGE_CLASS.disabled;
            }
          } else {
            // Professional without staff member
            statusLabel = professional.is_active ? STATUS_LABELS.active : STATUS_LABELS.disabled;
            statusBadgeClass = professional.is_active ? STATUS_BADGE_CLASS.active : STATUS_BADGE_CLASS.disabled;
          }
        }
        
        const createdAt = formatDateTime(professional.created_at);
        const updatedAt = formatDateTime(professional.updated_at);
        
        const canManage = typeof onManage === 'function';
        const manageDisabled = staffMember?.role === 'owner' && currentUserRole !== 'owner';
        
        // Check if current user can manage this professional
        const canManageThisProfessional = () => {
          // Owners and managers can manage all (except owners can't be managed by managers)
          if (currentUserRole === 'owner') return true;
          if (currentUserRole === 'manager' && staffMember?.role !== 'owner') return true;
          // Collaborators can only manage their own profile
          if (currentUserRole === 'collaborator' && currentStaffMember) {
            return Number(staffMember?.id) === Number(currentStaffMember.id);
          }
          return false;
        };
        
        // Use Staff member name if available, otherwise Professional name
        const staffName = staffMember ? 
          [staffMember.first_name, staffMember.last_name].filter(Boolean).join(' ').trim() : '';
        const primaryName = staffName || professional.name || '—';
        const bio = professional.bio || '';
        const email = staffMember?.email || professional.email || '';
        
        return (
          <Card key={professional.id} className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {primaryName}
                  </h3>
                  {bio && (
                    <p className="text-sm text-gray-600 mt-1">
                      {bio}
                    </p>
                  )}
                  {email && (
                    <p className="text-sm text-gray-500">
                      {email}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  {createdAt && (
                    <span>
                      Criado em <strong>{createdAt}</strong>
                    </span>
                  )}
                  {updatedAt && (
                    <span>
                      Atualizado em <strong>{updatedAt}</strong>
                    </span>
                  )}
                </div>
                {!staffMember && (
                  <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    {t('team.list.no_staff_member', 'Sem membro da equipe vinculado')}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-start gap-2 md:items-end">
                {staffMember && (
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      ROLE_BADGE_CLASS[staffMember.role] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {roleLabel}
                  </span>
                )}
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass}`}
                >
                  {statusLabel}
                </span>
                {canManage && staffMember && canManageThisProfessional() && (
                  <FormButton
                    size="sm"
                    variant="outline"
                    disabled={manageDisabled}
                    onClick={() => onManage(staffMember.id)}
                  >
                    {t('team.list.manage', 'Gerenciar')}
                  </FormButton>
                )}
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
  
  // Determine current user role first to conditionally load staff
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [requestId, setRequestId] = useState(null);
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [professionalsError, setProfessionalsError] = useState(null);
  const [professionalsLoading, setProfessionalsLoading] = useState(false);
  const professionalsMountedRef = useRef(true);

  useEffect(() => {
    professionalsMountedRef.current = true;
    return () => {
      professionalsMountedRef.current = false;
    };
  }, []);

  const staffArray = useMemo(
    () => (Array.isArray(staff) ? staff : []),
    [staff]
  );

  const currentStaffMember = useMemo(() => {
    if (!staffArray.length || !user) {
      return null;
    }
    const email =
      typeof user.email === 'string' ? user.email.toLowerCase() : null;
    const username =
      typeof user.username === 'string' ? user.username.toLowerCase() : null;
    const match = staffArray.find((member) => {
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
    return match || null;
  }, [staffArray, user]);

  const currentUserRole = currentStaffMember?.role || null;

  // Custom staff loading logic that respects permissions
  const loadStaff = useCallback(async () => {
    if (!slug) {
      setStaff([]);
      setStaffLoading(false);
      setStaffError(null);
      setRequestId(null);
      setForbidden(false);
      return;
    }

    // Only owners and managers should load staff data
    if (currentUserRole === 'collaborator') {
      setStaff([]);
      setStaffLoading(false);
      setStaffError(null);
      setRequestId(null);
      setForbidden(false);
      return;
    }

    setStaffLoading(true);
    setStaffError(null);
    setRequestId(null);
    setForbidden(false);

    try {
      const { fetchStaffMembers } = await import('../api/staff');
      const { staff: staffData, requestId: reqId } = await fetchStaffMembers({ slug });
      if (!professionalsMountedRef.current) return;
      setStaff(Array.isArray(staffData) ? staffData : []);
      setRequestId(reqId || null);
      setStaffLoading(false);
    } catch (err) {
      if (!professionalsMountedRef.current) return;
      const status = err?.response?.status;
      setForbidden(status === 403);
      const { parseApiError } = await import('../utils/apiError');
      const parsed = parseApiError(err, 'Não foi possível carregar a equipe.');
      setStaffError(parsed);
      setRequestId(parsed.requestId || null);
      setStaffLoading(false);
    }
  }, [slug, currentUserRole]);

  // Load staff when role is determined
  useEffect(() => {
    if (currentUserRole !== null) {
      loadStaff();
    }
  }, [loadStaff, currentUserRole]);

  const refetchStaff = useCallback(() => {
    if (!professionalsMountedRef.current) return;
    loadStaff();
  }, [loadStaff]);

  const inviteStaff = useCallback(
    async (payload) => {
      try {
        const { inviteStaffMember } = await import('../api/staff');
        const { staffMember, requestId: reqId } = await inviteStaffMember(payload, { slug });
        if (!professionalsMountedRef.current) {
          return { success: true, staffMember, requestId: reqId || null };
        }
        setStaff((current) => {
          const index = current.findIndex((item) => item?.id === staffMember?.id);
          if (index === -1) {
            return [...current, staffMember];
          }
          const next = [...current];
          next[index] = staffMember;
          return next;
        });
        return { success: true, staffMember, requestId: reqId || null };
      } catch (err) {
        const { parseApiError } = await import('../utils/apiError');
        const parsed = parseApiError(err, 'Falha ao enviar o convite.');
        return { success: false, error: parsed };
      }
    },
    [slug]
  );

  const updateStaff = useCallback(
    async (id, payload) => {
      try {
        const { updateStaffMember } = await import('../api/staff');
        const { staffMember, requestId: reqId } = await updateStaffMember(id, payload, { slug });
        if (!professionalsMountedRef.current) {
          return { success: true, staffMember, requestId: reqId || null };
        }
        setStaff((current) => {
          const index = current.findIndex((item) => item?.id === staffMember?.id);
          if (index === -1) {
            return [...current, staffMember];
          }
          const next = [...current];
          next[index] = staffMember;
          return next;
        });
        return { success: true, staffMember, requestId: reqId || null };
      } catch (err) {
        const { parseApiError } = await import('../utils/apiError');
        const parsed = parseApiError(err, 'Não foi possível atualizar o membro de equipe.');
        return { success: false, error: parsed };
      }
    },
    [slug]
  );

  // Create professionals with staff member data included + staff without professionals
  const professionalsWithStaff = useMemo(() => {
    const professionalsResult = professionals.map(professional => ({
      ...professional,
      staff_member_data: staffArray.find(staff => staff.id === professional.staff_member)
    }));
    
    // Add staff members that don't have professionals
    const staffWithoutProfessionals = staffArray
      .filter(staff => !professionals.some(prof => prof.staff_member === staff.id))
      .map(staff => ({
        id: `staff-${staff.id}`, // Unique ID for staff-only entries
        name: [staff.first_name, staff.last_name].filter(Boolean).join(' ').trim() || staff.email || staff.username,
        bio: '',
        is_active: staff.status === 'active',
        staff_member: staff.id,
        staff_member_data: staff,
        created_at: staff.created_at,
        updated_at: staff.updated_at,
        isStaffOnly: true // Flag to identify staff-only entries
      }));
    
    const result = [...professionalsResult, ...staffWithoutProfessionals];
    
    return result;
  }, [professionals, staffArray]);

  const filteredProfessionals = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    
    let professionalsToFilter = professionalsWithStaff;
    
    // For collaborators, only show their own profile
    if (currentUserRole === 'collaborator' && currentStaffMember) {
      professionalsToFilter = professionalsWithStaff.filter((professional) => {
        const staffMember = professional.staff_member_data;
        return staffMember && Number(staffMember.id) === Number(currentStaffMember.id);
      });
      
      // If collaborator doesn't have a professional profile, create a staff-only entry
      if (professionalsToFilter.length === 0) {
        professionalsToFilter = [{
          id: `staff-${currentStaffMember.id}`,
          name: [currentStaffMember.first_name, currentStaffMember.last_name].filter(Boolean).join(' ').trim() || currentStaffMember.email || currentStaffMember.username,
          bio: '',
          is_active: currentStaffMember.status === 'active',
          staff_member: currentStaffMember.id,
          staff_member_data: currentStaffMember,
          created_at: currentStaffMember.created_at,
          updated_at: currentStaffMember.updated_at,
          isStaffOnly: true
        }];
      }
    }
    
    const filtered = professionalsToFilter.filter((professional) => {
      const staffMember = professional.staff_member_data;
      
      // Role filter
      if (roleFilter !== 'all' && (!staffMember || staffMember.role !== roleFilter)) {
        return false;
      }
      
      // Status filter - consider both Professional and Staff member status
      if (statusFilter !== 'all') {
        let itemStatus;
        
        if (professional.isStaffOnly) {
          // For staff-only entries, use staff status directly
          itemStatus = staffMember?.status;
        } else {
          // For professionals with staff, combine both statuses
          if (staffMember) {
            if (staffMember.status === 'invited') {
              itemStatus = 'invited';
            } else if (staffMember.status === 'disabled') {
              itemStatus = 'disabled';
            } else if (staffMember.status === 'active' && professional.is_active) {
              itemStatus = 'active';
            } else {
              itemStatus = 'disabled';
            }
          } else {
            // Professional without staff member
            itemStatus = professional.is_active ? 'active' : 'disabled';
          }
        }
        
        if (statusFilter === 'active' && itemStatus !== 'active') {
          return false;
        }
        if (statusFilter === 'disabled' && itemStatus !== 'disabled') {
          return false;
        }
        if (statusFilter === 'invited' && itemStatus !== 'invited') {
          return false;
        }
      }
      
      // Search filter
      if (!term) {
        return true;
      }
      
      const haystack = [
        professional.name,
        professional.bio,
        professional.email,
        staffMember?.first_name,
        staffMember?.last_name,
        staffMember?.email,
        staffMember?.username,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();
      return haystack.includes(term);
    });
    
    return filtered;
  }, [professionalsWithStaff, roleFilter, statusFilter, search, currentUserRole, currentStaffMember]);

  const professionalsByStaff = useMemo(() => {
    const map = new Map();
    professionals.forEach((professional) => {
      if (professional?.staff_member == null) return;
      const staffId = Number(professional.staff_member);
      const list = map.get(staffId) || [];
      list.push(professional);
      map.set(staffId, list);
    });
    return map;
  }, [professionals]);

  const currentRoleLabel = currentUserRole
    ? ROLE_LABELS[currentUserRole] || currentUserRole
    : null;

  const canManageAll =
    currentUserRole === 'owner' || currentUserRole === 'manager';

  const activeStaffOptions = useMemo(
    () => staffArray.filter((member) => member?.status === 'active'),
    [staffArray]
  );

  const selectableStaffOptions = useMemo(() => {
    const formatStaffOption = (member) => ({
      value: member.id,
      label: member.first_name || member.last_name
        ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
        : member.email || member.username || `#${member.id}`
    });

    if (canManageAll) {
      return activeStaffOptions.map(formatStaffOption);
    }
    if (currentStaffMember?.status === 'active') {
      return [formatStaffOption(currentStaffMember)];
    }
    return [];
  }, [activeStaffOptions, canManageAll, currentStaffMember]);



  const canManageProfessional = useCallback(
    (professional) => {
      if (canManageAll) return true;
      if (!currentStaffMember) return false;
      return (
        Number(professional.staff_member) === Number(currentStaffMember.id)
      );
    },
    [canManageAll, currentStaffMember]
  );

  const refetchProfessionals = useCallback(async () => {
    if (!professionalsMountedRef.current) return;
    if (!slug) {
      setProfessionals([]);
      setProfessionalsError(null);
      setProfessionalsLoading(false);
      return;
    }

    setProfessionalsLoading(true);
    setProfessionalsError(null);

    try {
      const data = await fetchProfessionals(slug);
      if (!professionalsMountedRef.current) return;
      setProfessionals(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!professionalsMountedRef.current) return;
      setProfessionals([]);
      setProfessionalsError(
        parseApiError(
          err,
          t('team.professionals_error', 'Falha ao carregar profissionais.')
        )
      );
    } finally {
      if (professionalsMountedRef.current) {
        setProfessionalsLoading(false);
      }
    }
  }, [slug, t]);

  useEffect(() => {
    refetchProfessionals();
  }, [refetchProfessionals]);

  const createProfessionalEntry = useCallback(
    async ({ name, specialty, phone, staffMemberId }) => {
      try {
        const created = await createProfessional({
          name,
          specialty,
          phone,
          staffMemberId,
          slug,
        });
        await refetchProfessionals();
        refetchStaff();
        return { success: true, professional: created };
      } catch (err) {
        return {
          success: false,
          error: parseApiError(err, t('common.save_error', 'Falha ao salvar.')),
        };
      }
    },
    [slug, refetchProfessionals, refetchStaff, t]
  );

  const updateProfessionalEntry = useCallback(
    async (id, payload) => {
      try {
        const updated = await updateProfessional(id, { ...payload, slug });
        await refetchProfessionals();
        refetchStaff();
        return { success: true, professional: updated };
      } catch (err) {
        return {
          success: false,
          error: parseApiError(err, t('common.save_error', 'Falha ao salvar.')),
        };
      }
    },
    [refetchStaff, refetchProfessionals, slug, t]
  );

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

  const handleInviteSubmit = useCallback(
    async (payload) => {
      const { professional, ...invitePayload } = payload || {};
      const result = await inviteStaff(invitePayload);
      if (!result?.success) {
        return result;
      }

      const staffMember = result.staffMember || null;
      const professionalData = professional || null;

      let professionalResult = null;
      if (professionalData && professionalData.name) {
        const selectedStaffId =
          professionalData.staffMemberId != null &&
          professionalData.staffMemberId !== ''
            ? Number(professionalData.staffMemberId)
            : null;
        const targetStaffId =
          selectedStaffId != null
            ? selectedStaffId
            : staffMember?.id != null
            ? Number(staffMember.id)
            : null;

        if (targetStaffId != null) {
          const existingList =
            professionalsByStaff.get(Number(targetStaffId)) || [];
          const existingProfessional =
            professionalData.professionalId != null
              ? professionals.find(
                  (item) => item.id === professionalData.professionalId
                )
              : existingList[0] || null;

          const updatePayload = {
            name: professionalData.name,
            bio: professionalData.specialty || professionalData.bio || '',
            staffMemberId: targetStaffId,
          };

          if (existingProfessional) {
            professionalResult = await updateProfessionalEntry(
              existingProfessional.id,
              updatePayload
            );
          } else {
            professionalResult = await createProfessionalEntry({
              name: professionalData.name,
              specialty:
                professionalData.specialty || professionalData.bio || '',
              phone: professionalData.phone || '',
              staffMemberId: targetStaffId,
            });
          }

          if (!professionalResult.success) {
            return {
              success: false,
              error: professionalResult.error,
            };
          }
        }
      }

      await refetchProfessionals();
      await refetchStaff();
      return { ...result, success: true, professional: professionalResult?.professional || null };
    },
    [
      inviteStaff,
      professionals,
      professionalsByStaff,
      createProfessionalEntry,
      updateProfessionalEntry,
      refetchProfessionals,
      refetchStaff,
    ]
  );
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
                {currentUserRole === 'collaborator' 
                  ? t('team.current_team_heading_collaborator', 'Meu perfil profissional')
                  : t('team.current_team_heading', 'Gestão da equipe')
                }
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
            {canManageAll && (
              <FormButton onClick={openInviteModal}>
                {t('team.actions.invite', 'Convidar membro')}
              </FormButton>
            )}
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

            {canManageAll && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('team.filters.role', 'Papel')}
                </label>
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('team.filters.status', 'Status')}
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {professionalsLoading ? (
            <p className="mb-4 text-xs text-gray-500">
              {t('team.professionals_loading', 'Carregando profissionais...')}
            </p>
          ) : null}

          {professionalsError ? (
            <p className="mb-4 text-xs text-red-600">
              {professionalsError.message}
            </p>
          ) : null}

          {staffError ? (
            <Card className="mb-6 border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>
                {staffError.message ||
                  t('team.error.generic', 'Falha ao carregar a equipe.')}
              </p>
              {staffError.requestId ? (
                <p className="mt-1 text-xs text-rose-600">
                  {t('common.request_id', 'Request ID')}: {staffError.requestId}
                </p>
              ) : null}
              <button
                type="button"
                onClick={refetchStaff}
                className="mt-3 inline-flex items-center rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
              >
                {t('common.try_again', 'Tentar novamente')}
              </button>
            </Card>
          ) : null}

          {staffLoading ? (
            <Card className="p-6 text-sm text-gray-600">
              {t('common.loading', 'Carregando...')}
            </Card>
          ) : filteredProfessionals.length === 0 ? (
            <EmptyState
              title={t('team.empty.title', 'Nenhum membro encontrado')}
              description={t(
                'team.empty.description',
                'Convide sua equipe para acessar o painel do salão e organize os papéis conforme necessário.'
              )}
              action={
                <div className="flex flex-col gap-2 sm:flex-row">
                  {canManageAll && (
                    <FormButton onClick={openInviteModal}>
                      {t('team.actions.invite', 'Convidar membro')}
                    </FormButton>
                  )}
                  <FormButton variant="outline" onClick={refetchStaff}>
                    {t('common.refresh', 'Atualizar')}
                  </FormButton>
                </div>
              }
            />
          ) : (
            <StaffList
              items={filteredProfessionals}
              onManage={openManageModal}
              currentUserRole={currentUserRole}
              currentStaffMember={currentStaffMember}
            />
          )}

          {requestId && !staffError ? (
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
        staffOptions={selectableStaffOptions}
        loadingStaff={staffLoading}
        staffError={staffError}
        defaultStaffId={currentStaffMember?.id ?? null}
      />
      <ManageStaffModal
        open={Boolean(selectedMember)}
        member={selectedMember}
        onClose={closeManageModal}
        currentUserRole={currentUserRole}
        onUpdate={handleUpdateMember}
        professionals={
          selectedMember
            ? professionalsByStaff.get(Number(selectedMember.id)) || []
            : []
        }
        onProfessionalCreate={createProfessionalEntry}
        onProfessionalUpdate={updateProfessionalEntry}
        canManageProfessional={canManageProfessional}
        staffOptions={activeStaffOptions}
        selectableStaffOptions={selectableStaffOptions}
      />
    </FullPageLayout>
  );
}

export default Team;
