import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import { fetchAppointments, fetchAppointmentDetail, createAppointment, updateAppointment, createAppointmentsSeries, createAppointmentsMixedBulk } from '../api/appointments';
import { fetchCustomers } from '../api/customers';
import { fetchServices } from '../api/services';
import { fetchProfessionals } from '../api/professionals';
import { fetchSlots, fetchSlotDetail } from '../api/slots';
import { useTenant } from '../hooks/useTenant';
import { parseApiError } from '../utils/apiError';
import { APPOINTMENT_STATUS_STYLES } from '../utils/badgeStyles';
import PaginationControls from '../components/ui/PaginationControls';

const STATUS_OPTIONS = ['scheduled', 'completed', 'paid', 'cancelled'];

const INITIAL_FORM = {
  customerId: '',
  serviceId: '',
  professionalId: '',
  slotId: '',
  notes: '',
};

function normalizeResults(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

function parseSlotDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw;
  }
  if (typeof raw === 'string') {
    const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
    const fallback = new Date(raw);
    if (!Number.isNaN(fallback.getTime())) {
      return fallback;
    }
    return null;
  }
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }
  return null;
}

function formatDateTimeRange(start, end) {
  const startDate = parseSlotDate(start);
  if (!startDate) return '--';
  const endDate = parseSlotDate(end);
  try {
    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
    const datePart = dateFormatter.format(startDate).replace('.', '');
    const startTime = timeFormatter.format(startDate);
    const endTime = endDate ? timeFormatter.format(endDate) : null;
    return endTime ? `${datePart} ${startTime} – ${endTime}` : `${datePart} ${startTime}`;
  } catch {
    return endDate ? `${start} – ${end}` : String(start);
  }
}

function formatServiceOption(service) {
  if (!service) return '';
  const parts = [service.name].filter(Boolean);
  if (service.duration_minutes) {
    parts.push(`${service.duration_minutes} min`);
  }
  if (service.price_eur != null && service.price_eur !== '') {
    const priceValue = Number.parseFloat(service.price_eur);
    if (!Number.isNaN(priceValue)) {
      const price = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(priceValue);
      parts.push(price);
    }
  }
  return parts.join(' • ');
}

function formatProfessionalOption(professional) {
  if (!professional) return '';
  const description = typeof professional.bio === 'string' ? professional.bio.trim() : '';
  return description ? `${professional.name} • ${description}` : professional.name;
}

function combineAppointment(base, detail, serviceName, professionalName, slotDetail = null, fallbackCustomer = null) {
  const slotInfo = slotDetail || detail?.slot || null;
  const slotStart = slotInfo?.start_time ?? detail?.slot?.start_time ?? null;
  const slotEnd = slotInfo?.end_time ?? detail?.slot?.end_time ?? null;
  const slotId = slotInfo?.id ?? detail?.slot?.id ?? base.slot ?? null;
  const customerInfo = detail?.customer || fallbackCustomer || null;
  return {
    id: base.id,
    serviceId: detail?.service?.id ?? base.service,
    professionalId: detail?.professional?.id ?? base.professional,
    slotId,
    status: detail?.status || base.status || 'scheduled',
    notes: detail?.notes || base.notes || '',
    clientName: detail?.client_username || '',
    clientEmail: detail?.client_email || '',
    customerId: customerInfo?.id ?? null,
    customerName: customerInfo?.name || detail?.client_username || '',
    customerEmail: customerInfo?.email || detail?.client_email || '',
    customerPhone: customerInfo?.phone_number || '',
    slotStart,
    slotEnd,
    serviceName: detail?.service?.name || serviceName || `#${base.service}`,
    professionalName: detail?.professional?.name || professionalName || `#${base.professional}`,
  };
}

function buildServiceMap(list) {
  const map = new Map();
  list.forEach((item) => {
    if (item?.id != null) {
      map.set(item.id, item);
    }
  });
  return map;
}

function buildCustomerMap(list) {
  const map = new Map();
  list.forEach((item) => {
    if (item?.id != null) {
      map.set(item.id, item);
    }
  });
  return map;
}

function sortCustomers(list) {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const timeA = new Date(a?.created_at || 0).getTime();
    const timeB = new Date(b?.created_at || 0).getTime();
    if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0;
    if (Number.isNaN(timeA)) return 1;
    if (Number.isNaN(timeB)) return -1;
    if (timeA === timeB) {
      const nameA = (a?.name || '').toLocaleLowerCase();
      const nameB = (b?.name || '').toLocaleLowerCase();
      return nameA.localeCompare(nameB);
    }
    return timeB - timeA;
  });
}

function Bookings() {
  const { t } = useTranslation();
  const { slug } = useTenant();

  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    customerId: '',
  });

  // paginação baseada em limit/offset

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formSlots, setFormSlots] = useState([]);
  const [formSlotsLoading, setFormSlotsLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'scheduled', notes: '', slotId: '' });
  const [editingSlots, setEditingSlots] = useState([]);
  const [editingSlotsLoading, setEditingSlotsLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Modal Série/Multi (primeira versão: somente Série)
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [activeSeriesTab, setActiveSeriesTab] = useState('series'); // 'series' | 'multi'
  const [seriesSelections, setSeriesSelections] = useState([]); // [{ id, start_time, end_time }]
  const [seriesSubmitting, setSeriesSubmitting] = useState(false);
  const [seriesError, setSeriesError] = useState(null);
  // Estado para Multi (lote)
  const [multiSelections, setMultiSelections] = useState([]);
  const [multiSubmitting, setMultiSubmitting] = useState(false);
  const [multiError, setMultiError] = useState(null);
  const [multiFeedback, setMultiFeedback] = useState([]);
  // Defaults e controles próprios da aba Multi
  const [multiProfessionalId, setMultiProfessionalId] = useState('');
  const [multiDefaultNotes, setMultiDefaultNotes] = useState('');
  // Item ativo da aba Multi (para sincronização com seletor global)
  const [activeMultiSlotId, setActiveMultiSlotId] = useState(null);
  // logger no-op para manter compatibilidade com chamadas existentes
  const logMultiEvent = useCallback(() => {}, []);
  // Removido painel de debug e estados relacionados
  const [visibleWeekStart, setVisibleWeekStart] = useState(() => {
    const today = new Date();
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const day = d.getDay(); // 0=Sun
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diffToMonday);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Sem overlay: posicionamento final direto do botão

  const serviceMap = useMemo(() => buildServiceMap(services), [services]);
  const professionalMap = useMemo(() => buildServiceMap(professionals), [professionals]);
  const customerMap = useMemo(() => buildCustomerMap(customers), [customers]);
  // Apenas profissionais com serviços atribuídos (evita itens sem oferta)
  const professionalsWithServices = useMemo(
    () => professionals.filter((p) => Array.isArray(p?.service_ids) && p.service_ids.length > 0),
    [professionals]
  );

  const refreshSlotsForProfessional = useCallback(
    (professionalId) => {
      if (!professionalId) {
        setFormSlots([]);
        return Promise.resolve();
      }
      setFormSlotsLoading(true);
      return fetchSlots({ professionalId, slug })
        .then((slots) => {
          setFormSlots(Array.isArray(slots) ? slots : []);
        })
        .catch((err) => {
          setFormSlots([]);
          setFormError(parseApiError(err, t('common.load_error', 'Falha ao carregar.')));
        })
        .finally(() => {
          setFormSlotsLoading(false);
        });
    },
    [slug, t],
  );

  // Helpers para validação de itens Multi
  const slotMap = useMemo(() => {
    const m = new Map();
    (formSlots || []).forEach((s) => { if (s?.id != null) m.set(s.id, s); });
    return m;
  }, [formSlots]);

  const servicesById = useMemo(() => buildServiceMap(services), [services]);
  const professionalServices = useMemo(() => {
    const m = new Map();
    professionals.forEach((p) => {
      const ids = Array.isArray(p?.service_ids) ? p.service_ids.map((id) => Number.parseInt(id, 10)) : [];
      m.set(Number.parseInt(p.id, 10), ids);
    });
    return m;
  }, [professionals]);

  const getSlotMinutes = useCallback((selection) => {
    const slot = slotMap.get(selection?.id);
    const start = parseSlotDate(slot?.start_time || selection?.start_time);
    const end = parseSlotDate(slot?.end_time || selection?.end_time);
    if (!start || !end) return 0;
    const diff = (end.getTime() - start.getTime()) / 60000;
    return Math.max(0, Math.round(diff));
  }, [slotMap]);

  const formSlotsByStart = useMemo(() => {
    const m = new Map();
    (formSlots || []).forEach((s) => {
      const dt = parseSlotDate(s?.start_time);
      if (dt) m.set(dt.getTime(), s);
    });
    return m;
  }, [formSlots]);

  const hasContiguousBlockFrom = useCallback((slot, requiredMinutes) => {
    if (!slot || !requiredMinutes || requiredMinutes <= 0) return true;
    const start = parseSlotDate(slot.start_time);
    const end = parseSlotDate(slot.end_time);
    if (!start || !end) return false;
    let accumulated = Math.round((end.getTime() - start.getTime()) / 60000);
    if (accumulated >= requiredMinutes) return true;
    let cursorEnd = end;
    let steps = 0;
    while (accumulated < requiredMinutes && steps < 24) {
      const next = formSlotsByStart.get(cursorEnd.getTime());
      if (!next) break;
      const nStart = parseSlotDate(next.start_time);
      const nEnd = parseSlotDate(next.end_time);
      if (!nStart || !nEnd) break;
      accumulated += Math.round((nEnd.getTime() - nStart.getTime()) / 60000);
      cursorEnd = nEnd;
      steps += 1;
    }
    return accumulated >= requiredMinutes;
  }, [formSlotsByStart]);

  const validateMultiItem = useCallback((s) => {
    const slot = slotMap.get(s.id);
    const svcId = s.serviceId;
    const profId = s.professionalId;
    if (!svcId || !profId) return { code: 'missing', message: t('bookings.multi.missing_fields_item', 'Selecione serviço e profissional.') };
    const offered = professionalServices.get(Number.parseInt(profId, 10)) || [];
    if (offered.length > 0 && svcId != null && !offered.includes(Number.parseInt(svcId, 10))) {
      return { code: 'prof_not_offer', message: t('bookings.multi.prof_not_offer', 'Profissional não oferece o serviço.') };
    }
    if (slot?.professional != null && Number.parseInt(slot.professional, 10) !== Number.parseInt(profId, 10)) {
      return { code: 'slot_wrong_professional', message: t('bookings.multi.slot_wrong_professional', 'Horário pertence a outro profissional.') };
    }
    return null;
  }, [slotMap, professionalServices, t]);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLookupLoading(true);
    const loadCustomers = fetchCustomers({ slug })
      .then(normalizeResults)
      .catch(() => []);

    Promise.all([fetchServices(slug), fetchProfessionals(slug), loadCustomers])
      .then(([svc, profs, customerList]) => {
        if (!active) return;
        setServices(Array.isArray(svc) ? svc : []);
        setProfessionals(Array.isArray(profs) ? profs : []);
        setCustomers(sortCustomers(customerList));
      })
      .catch((err) => {
        if (!active) return;
        setError(parseApiError(err, t('common.load_error', 'Falha ao carregar.')));
      })
      .finally(() => {
        if (!active) return;
        setLookupLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug, t]);

  useEffect(() => {
    if (!slug || lookupLoading) return;
    let active = true;
    setLoadingList(true);
    setError(null);

    const page = Math.floor(offset / limit) + 1;
    const params = {
      page,
      page_size: limit,
    };
    if (filters.status) params.status = filters.status;
    if (filters.dateFrom) params.date_from = filters.dateFrom;
    if (filters.dateTo) params.date_to = filters.dateTo;
    if (filters.customerId) params.customer_id = filters.customerId;

    const slotCache = new Map();

    fetchAppointments({ slug, params })
      .then(async (payload) => {
        if (!active) return;
        const baseResults = Array.isArray(payload.results) ? payload.results : [];
        const count = payload.count || baseResults.length;
        setTotalCount(count);

        const detailed = await Promise.all(
          baseResults.map(async (item) => {
            const customerFallback = customerMap.get(item.customer) || null;
            try {
              const detail = await fetchAppointmentDetail(item.id, { slug });
              const svcName = serviceMap.get(item.service)?.name;
              const profName = professionalMap.get(item.professional)?.name;
              let slotDetail = detail?.slot ?? null;

              if (!slotDetail?.start_time && item.slot) {
                const cached = slotCache.get(item.slot);
                if (cached) {
                  slotDetail = { ...(slotDetail || {}), ...cached };
                } else {
                  try {
                    const slotData = await fetchSlotDetail(item.slot, { slug });
                    if (slotData) {
                      slotCache.set(item.slot, slotData);
                      slotDetail = { ...(slotDetail || {}), ...slotData };
                    }
                  } catch {
                    // ignore slot fallback failure
                  }
                }
              }

              return combineAppointment(item, detail, svcName, profName, slotDetail, customerFallback);
            } catch {
              const svcName = serviceMap.get(item.service)?.name;
              const profName = professionalMap.get(item.professional)?.name;
              let slotDetail = null;
              if (item.slot) {
                const cached = slotCache.get(item.slot);
                if (cached) {
                  slotDetail = cached;
                } else {
                  try {
                    const slotData = await fetchSlotDetail(item.slot, { slug });
                    if (slotData) {
                      slotCache.set(item.slot, slotData);
                      slotDetail = slotData;
                    }
                  } catch {
                    // ignore
                  }
                }
              }
              return combineAppointment(item, null, svcName, profName, slotDetail, customerFallback);
            }
          })
        );

        if (!active) return;
        setAppointments(detailed);
      })
      .catch((err) => {
        if (!active) return;
        setError(parseApiError(err, t('common.load_error', 'Falha ao carregar.')));
        setAppointments([]);
        setTotalCount(0);
      })
      .finally(() => {
        if (!active) return;
        setLoadingList(false);
      });

    return () => {
      active = false;
    };
  }, [slug, filters, limit, offset, lookupLoading, serviceMap, professionalMap, customerMap, t]);

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setFormSlots([]);
    setFormError(null);
    setSeriesSelections([]);
    setIsSeriesModalOpen(false);
    // Limpeza de estado da aba Multi
    setMultiSelections([]);
    setMultiFeedback([]);
    setMultiProfessionalId('');
    setMultiDefaultNotes('');
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'professionalId') {
      setFormSlots([]);
      setFormData((prev) => ({ ...prev, slotId: '' }));
      if (!value) return;
      refreshSlotsForProfessional(value);
    }
    if (field !== 'professionalId' && field !== 'slotId') {
      setFormError(null);
    }
  };

  const handleCreateAppointment = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!formData.customerId) {
      setFormError({ message: t('bookings.form.customer_required', 'Selecione um cliente para o agendamento.') });
      return;
    }
    if (!formData.serviceId || !formData.professionalId || !formData.slotId) {
      setFormError({ message: t('bookings.form.required', 'Selecione serviço, profissional e horário.') });
      return;
    }

    const payload = {
      customer: Number.parseInt(formData.customerId, 10),
      service: Number.parseInt(formData.serviceId, 10),
      professional: Number.parseInt(formData.professionalId, 10),
      slot: Number.parseInt(formData.slotId, 10),
    };
    if (formData.notes && formData.notes.trim()) {
      payload.notes = formData.notes.trim();
    }

    try {
      setFormSubmitting(true);
      await createAppointment(payload, { slug });
      resetForm();
      // reload list
      setOffset(0);
      // trigger effect by updating filters (force rerender). We'll update to new object to re-run effect.
      setFilters((prev) => ({ ...prev }));
    } catch (err) {
      setFormError(parseApiError(err, t('common.save_error', 'Falha ao salvar.')));
    } finally {
      setFormSubmitting(false);
    }
  };

  const openEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setEditingId(appointment.id);
    setEditForm({
      status: appointment.status,
      notes: appointment.notes || '',
      slotId: '',
    });
    setEditError(null);
    setEditingSlots([]);
    if (!appointment.professionalId) return;
    setEditingSlotsLoading(true);
    fetchSlots({ professionalId: appointment.professionalId, slug })
      .then((slots) => {
        const list = Array.isArray(slots) ? slots : [];
        const currentSlot = appointment.slotStart
          ? {
              id: appointment.slotId,
              start_time: appointment.slotStart,
              end_time: appointment.slotEnd,
              is_available: false,
            }
          : null;
        const merged = currentSlot
          ? [currentSlot, ...list.filter((s) => s.id !== appointment.slotId)]
          : list;
        setEditingSlots(merged);
      })
      .catch((err) => {
        setEditError(parseApiError(err, t('common.load_error', 'Falha ao carregar.')));
      })
      .finally(() => {
        setEditingSlotsLoading(false);
      });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
    setEditForm({ status: 'scheduled', notes: '', slotId: '' });
    setEditingSlots([]);
  };

  const submitEdit = async (appointment) => {
    if (!editingId) return;
    const payload = {};

    const trimmedNotes = editForm.notes?.trim() ?? '';
    if (trimmedNotes !== (appointment.notes || '')) {
      payload.notes = trimmedNotes;
    }

    if (editForm.status && editForm.status !== appointment.status) {
      payload.status = editForm.status;
    }

    if (editForm.slotId) {
      payload.slot = Number.parseInt(editForm.slotId, 10);
    }

    if (!Object.keys(payload).length) {
      cancelEdit();
      return;
    }

    try {
      setEditSubmitting(true);
      await updateAppointment(editingId, payload, { slug });
      cancelEdit();
      setSelectedAppointment(null);
      setFilters((prev) => ({ ...prev }));
      if (
        formData.professionalId &&
        Number.parseInt(formData.professionalId, 10) === appointment.professionalId &&
        (payload.status === 'cancelled' || Object.prototype.hasOwnProperty.call(payload, 'slot'))
      ) {
        refreshSlotsForProfessional(formData.professionalId);
      }
    } catch (err) {
      setEditError(parseApiError(err, t('common.save_error', 'Falha ao salvar.')));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleStatusQuickChange = async (appointment, status) => {
    try {
      await updateAppointment(appointment.id, { status }, { slug });
      if (selectedAppointment?.id === appointment.id) {
        cancelEdit();
        setSelectedAppointment(null);
      }
      setFilters((prev) => ({ ...prev }));
      if (
        status === 'cancelled' &&
        formData.professionalId &&
        Number.parseInt(formData.professionalId, 10) === appointment.professionalId
      ) {
        refreshSlotsForProfessional(formData.professionalId);
      }
    } catch (err) {
      setError(parseApiError(err, t('common.save_error', 'Falha ao salvar.')));
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setOffset(0);
  };

  const loading = lookupLoading || loadingList;
  const closeDetails = () => {
    cancelEdit();
    setSelectedAppointment(null);
  };

  // Série/Multi helpers
  const openSeriesModal = () => {
    setSeriesError(null);
    // Gating atualizado: exigir apenas cliente para abrir o modal.
    if (!formData.customerId) {
      setFormError({ message: t('bookings.form.customer_required', 'Selecione o cliente para continuar.') });
      return;
    }
    // Inicializar defaults da aba Multi
    setMultiProfessionalId(formData.professionalId || '');
    setMultiDefaultNotes((formData.notes || '').trim());
    // garantir que slots estejam carregados para o profissional selecionado
    const profForSlots = formData.professionalId || '';
    if (formSlots.length === 0 || profForSlots) {
      refreshSlotsForProfessional(profForSlots);
    }
    // Se serviço/profissional não estiverem definidos, abrir diretamente na aba Multi.
    if (!formData.serviceId || !formData.professionalId) {
      setActiveSeriesTab('multi');
    } else {
      setActiveSeriesTab('series');
    }
    setIsSeriesModalOpen(true);
  };

  const closeSeriesModal = () => {
    setIsSeriesModalOpen(false);
    setSeriesSubmitting(false);
    setSeriesError(null);
    // Garantir que itens anteriores não persistam ao fechar
    setMultiSelections([]);
    setMultiFeedback([]);
  };

  const isInCurrentWeek = (isoString) => {
    const s = new Date(isoString);
    const start = new Date(visibleWeekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return s >= start && s < end;
  };

  const nextWeek = () => {
    const d = new Date(visibleWeekStart);
    d.setDate(d.getDate() + 7);
    setVisibleWeekStart(d);
  };
  const prevWeek = () => {
    const d = new Date(visibleWeekStart);
    d.setDate(d.getDate() - 7);
    setVisibleWeekStart(d);
  };

  const toggleSeriesSelection = (slot) => {
    setSeriesSelections((prev) => {
      // Bloquear slots no passado
      const now = new Date();
      if (new Date(slot.start_time) < now) {
        return prev;
      }
      const exists = prev.some((s) => s.id === slot.id);
      if (exists) {
        return prev.filter((s) => s.id !== slot.id);
      }
      if (prev.length >= 20) return prev; // limite superior
      const next = [...prev, { id: slot.id, start_time: slot.start_time, end_time: slot.end_time }];
      return next;
    });
  };

  const toggleMultiSelection = (slot) => {
    setMultiSelections((prev) => {
      const now = new Date();
      if (new Date(slot.start_time) < now) {
        logMultiEvent('slot_click_blocked_past', {
          slot_id: slot.id,
          professionalId: slot?.professional != null ? String(slot.professional) : (multiProfessionalId || ''),
          serviceId: '',
        });
        return prev;
      }
      const exists = prev.some((s) => s.id === slot.id);
      if (exists) {
        logMultiEvent('multi_remove', {
          slot_id: slot.id,
          professionalId: slot?.professional != null ? String(slot.professional) : (multiProfessionalId || ''),
          serviceId: '',
        });
        return prev.filter((s) => s.id !== slot.id);
      }
      if (prev.length >= 20) {
        logMultiEvent('multi_limit_reached', {
          slot_id: slot.id,
          professionalId: slot?.professional != null ? String(slot.professional) : (multiProfessionalId || ''),
          serviceId: '',
        });
        return prev;
      }
      const nextItem = {
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        serviceId: '',
        professionalId: (slot?.professional != null ? String(slot.professional) : (multiProfessionalId || '')),
        customerId: formData.customerId || '',
        notes: '',
      };
      // Deduplicar por id para evitar duplicações em dev/StrictMode
      const map = new Map(prev.map((x) => [x.id, x]));
      map.set(nextItem.id, nextItem);
      const next = Array.from(map.values());
      if (next.length > prev.length) {
        logMultiEvent('multi_add', {
          slot_id: slot.id,
          professionalId: nextItem.professionalId || '',
          serviceId: nextItem.serviceId || '',
        });
      }
      return next;
    });
    // Define o item recém-adicionado como ativo
    setActiveMultiSlotId(slot.id);
  };

  const updateMultiItemField = (slotId, field, value) => {
    const current = multiSelections.find((x) => x.id === slotId);
    logMultiEvent('item_field_change', {
      slot_id: slotId,
      field,
      value,
      professionalId: field === 'professionalId' ? (value || '') : (current?.professionalId || ''),
      serviceId: field === 'serviceId' ? (value || '') : (current?.serviceId || ''),
    });
    setMultiSelections((prev) => prev.map((s) => (s.id === slotId ? { ...s, [field]: value } : s)));
  };

  const removeMultiItem = (slotId) => {
    logMultiEvent('multi_item_remove', {
      slot_id: slotId,
    });
    setMultiSelections((prev) => prev.filter((s) => s.id !== slotId));
    setMultiFeedback((prev) => prev.filter((r) => r.slot_id !== slotId));
    setActiveMultiSlotId((current) => (current === slotId ? null : current));
  };

  // Ao focar em um item, sincroniza o seletor global com o profissional do item
  const onFocusMultiItem = (slotId) => {
    setActiveMultiSlotId(slotId);
    const item = multiSelections.find((x) => x.id === slotId);
    logMultiEvent('item_focus', {
      slot_id: slotId,
      professionalId: item?.professionalId || '',
      serviceId: item?.serviceId || '',
    });
    if (item && (item.professionalId || '') !== multiProfessionalId) {
      setMultiProfessionalId(item.professionalId || '');
    }
  };

  const applySuggestion = (currentSlotId, suggested) => {
    if (!suggested || !suggested.slot_id) return;
    logMultiEvent('apply_suggestion_apply', {
      slot_id: currentSlotId,
      professionalId: suggested?.professional_id != null ? String(suggested.professional_id) : undefined,
      serviceId: undefined,
      suggested_slot_id: suggested.slot_id,
    });
    setMultiSelections((prev) => prev.map((s) => (
      s.id === currentSlotId
        ? {
            ...s,
            id: suggested.slot_id,
            start_time: suggested.start_time || s.start_time,
            end_time: suggested.end_time || s.end_time,
            professionalId: suggested.professional_id != null ? String(suggested.professional_id) : s.professionalId,
          }
        : s
    )));
    // Recarregar slots para refletir alterações e atualizar validações locais
    const profToRefresh = suggested?.professional_id != null
      ? String(suggested.professional_id)
      : (multiProfessionalId || '');
    refreshSlotsForProfessional(profToRefresh);
    setMultiFeedback((prev) => prev.filter((r) => r.slot_id !== currentSlotId));
  };

  const confirmSeries = async () => {
    const count = seriesSelections.length;
    if (count < 2) {
      setSeriesError({ message: t('bookings.series.min_selection', 'Selecione pelo menos 2 horários.') });
      return;
    }
    if (count > 20) {
      setSeriesError({ message: t('bookings.series.max_selection', 'Máximo de 20 horários por série.') });
      return;
    }
    // Validação: nenhum horário no passado
    const now = new Date();
    const hasPast = seriesSelections.some((s) => new Date(s.start_time) < now);
    if (hasPast) {
      setSeriesError({ message: t('bookings.series.past_not_allowed', 'Alguns horários estão no passado. Selecione horários futuros.') });
      return;
    }
    const payload = {
      service_id: Number.parseInt(formData.serviceId, 10),
      professional_id: Number.parseInt(formData.professionalId, 10),
      customer_id: Number.parseInt(formData.customerId, 10),
      appointments: seriesSelections.map((s) => ({ slot_id: s.id, notes: (formData.notes || '').trim() || undefined })),
    };
    try {
      setSeriesSubmitting(true);
      await createAppointmentsSeries(payload, { slug });
      closeSeriesModal();
      resetForm();
      // atualizar lista e slots
      setFilters((prev) => ({ ...prev }));
      refreshSlotsForProfessional(formData.professionalId);
    } catch (err) {
      setSeriesError(parseApiError(err, t('common.save_error', 'Falha ao salvar.')));
    } finally {
      setSeriesSubmitting(false);
    }
  };
  
  const confirmMulti = async (allowRetry = true) => {
    const count = multiSelections.length;
    if (count < 2) {
      setMultiError({ message: t('bookings.series.min_selection', 'Selecione pelo menos 2 horários.') });
      return;
    }
    if (count > 20) {
      setMultiError({ message: t('bookings.series.max_selection', 'Máximo de 20 horários por lote.') });
      return;
    }
    const now = new Date();
    const hasPast = multiSelections.some((s) => new Date(s.start_time) < now);
    if (hasPast) {
      setMultiError({ message: t('bookings.series.past_not_allowed', 'Alguns horários estão no passado. Selecione horários futuros.') });
      return;
    }
    // Garantir customer_id presente em todos os itens (fallback do formulário)
    if (!formData.customerId) {
      setMultiError({ message: t('bookings.form.customer_required', 'Selecione o cliente para continuar.') });
      return;
    }
    const appointments = multiSelections.map((s) => ({
      slot_id: s.id,
      service_id: s.serviceId ? Number.parseInt(s.serviceId, 10) : NaN,
      professional_id: s.professionalId ? Number.parseInt(s.professionalId, 10) : NaN,
      customer_id: s.customerId ? Number.parseInt(s.customerId, 10) : Number.parseInt(formData.customerId, 10),
      notes: s.notes?.trim() || multiDefaultNotes.trim() || (formData.notes || '').trim() || undefined,
    }));
    const invalid = appointments.filter((a) => Number.isNaN(a.customer_id) || Number.isNaN(a.service_id) || Number.isNaN(a.professional_id));
    if (invalid.length > 0) {
      setMultiError({
        message: t(
          'bookings.multi.missing_fields',
          'Informe cliente no formulário e serviço/profissional por item.'
        ),
      });
      return;
    }
    // Validação preventiva por item (evitar 400 recorrentes)
    const itemsWithValidation = multiSelections.map((s) => ({ s, v: validateMultiItem(s) }));
    const clientInvalids = itemsWithValidation.filter((x) => x.v);
    const clientWarnings = multiSelections
      .map((s) => {
        const svc = s.serviceId ? servicesById.get(Number.parseInt(s.serviceId, 10)) : null;
        const slotMinutes = getSlotMinutes(s);
        if (svc && svc.duration_minutes && svc.duration_minutes > slotMinutes) {
          return { slot_id: s.id, status: 'warning', message: t('bookings.multi.service_not_fit', 'Serviço não cabe no slot.') };
        }
        return null;
      })
      .filter(Boolean);
    if (clientInvalids.length > 0) {
      const errorFeedback = clientInvalids.map(({ s, v }) => ({ slot_id: s.id, status: 'error', message: v.message }));
      setMultiFeedback([...clientWarnings, ...errorFeedback]);
      setMultiError({ message: t('bookings.multi.precheck_failed', 'Alguns itens estão inválidos. Corrija os erros destacados abaixo.') });
      return;
    }
    // Avisos não bloqueantes: permitir envio e deixar BE reservar bloco contíguo
    if (clientWarnings.length > 0) {
      setMultiFeedback(clientWarnings);
    } else {
      setMultiFeedback([]);
    }
    const payload = { items: appointments };
  try {
      setMultiSubmitting(true);
      const resp = await createAppointmentsMixedBulk(payload, { slug });
      // Tratar sucesso completo vs. parcial
      const results = Array.isArray(resp?.results) ? resp.results : [];
      if (results.length > 0) {
        setMultiFeedback(results);
      } else {
        setMultiFeedback([]);
      }
      if (resp && resp.success) {
        // Sucesso total: fechar modal e resetar
        closeSeriesModal();
        resetForm();
        setFilters((prev) => ({ ...prev }));
        refreshSlotsForProfessional(formData.professionalId);
      } else {
        // Sucesso parcial: tentar auto-aplicar sugestões e reenviar uma vez
        const suggestibles = results.filter((r) => r.status === 'error' && r.suggested_slot && r.suggested_slot.slot_id);
        if (allowRetry && suggestibles.length > 0) {
          suggestibles.forEach((r) => applySuggestion(r.slot_id, r.suggested_slot));
          setTimeout(() => {
            confirmMulti(false);
          }, 0);
        } else {
          // manter modal aberto para correções manuais
          setMultiError({ message: resp?.message || t('bookings.multi.partial_failed', 'Alguns itens falharam. Ajuste abaixo e tente novamente.') });
        }
      }
    } catch (err) {
      const data = err && err.response && err.response.data;
      const results = normalizeResults(data);
      if (results && results.length > 0) {
        setMultiFeedback(results);
        // Em erro de validação, também tentar auto-aplicar sugestões uma vez
        const suggestibles = results.filter((r) => r.status === 'error' && r.suggested_slot && r.suggested_slot.slot_id);
        if (allowRetry && suggestibles.length > 0) {
          suggestibles.forEach((r) => applySuggestion(r.slot_id, r.suggested_slot));
          setTimeout(() => {
            confirmMulti(false);
          }, 0);
        } else {
          setMultiError({ message: (data && data.message) || t('bookings.multi.partial_failed', 'Alguns itens falharam. Ajuste abaixo e tente novamente.') });
        }
      } else {
        setMultiError(parseApiError(err, t('common.save_error', 'Falha ao salvar.')));
      }
    } finally {
      setMultiSubmitting(false);
    }
  };

  return (
    <FullPageLayout>
      <div className="rounded-xl bg-brand-surface p-6 shadow-sm ring-1 ring-brand-border">
        <h1 className="text-2xl font-semibold text-brand-surfaceForeground">
          {t('bookings.title')}
        </h1>

        <section className="mt-4 grid gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
              {t('bookings.filters.customer', 'Cliente')}
            </label>
            <select
                value={filters.customerId}
                onChange={(e) => handleFilterChange('customerId', e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <option value="" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  {t('bookings.filters.customer_all', 'Todos')}
                </option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id} style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    {customer.name}
                  </option>
                ))}
              </select>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
              {t('bookings.filters.status', 'Status')}
            </label>
            <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <option value="" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  {t('bookings.filters.status_all', 'Todos')}
                </option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status} style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    {t(`bookings.status.${status}`, status)}
                  </option>
                ))}
              </select>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
              {t('bookings.filters.date_from', 'Data inicial')}
            </label>
            <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)',
                  colorScheme: 'light dark'
                }}
              />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
              {t('bookings.filters.date_to', 'Data final')}
            </label>
            <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)',
                  colorScheme: 'light dark'
                }}
              />
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-brand-border bg-brand-surface/60 p-4">
          <h2 className="text-lg font-medium text-brand-surfaceForeground">
            {t('bookings.create.title', 'Criar novo agendamento')}
          </h2>
          <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" onSubmit={handleCreateAppointment}>
            <div className="col-span-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                {t('bookings.form.customer', 'Cliente')}
              </label>
              <select
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                value={formData.customerId}
                onChange={(e) => handleFormChange('customerId', e.target.value)}
                disabled={lookupLoading || customers.length === 0}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <option value="" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  {t('bookings.form.select_customer', 'Selecione um cliente')}
                </option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id} style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {customers.length === 0 && !lookupLoading && (
                <p className="mt-1 text-xs text-brand-surfaceForeground/60">
                  {t('bookings.form.empty_customer', 'Cadastre clientes antes de criar agendamentos.')}
                </p>
              )}
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                {t('bookings.service', 'Serviço')}
              </label>
              <select
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                value={formData.serviceId}
                onChange={(e) => handleFormChange('serviceId', e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <option value="" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  {t('bookings.form.select_service', 'Selecione um serviço')}
                </option>
                {services.map((service) => (
                  <option key={service.id} value={service.id} style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    {formatServiceOption(service)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                {t('bookings.professional', 'Profissional')}
              </label>
              {(() => {
                const svcId = formData.serviceId ? Number.parseInt(formData.serviceId, 10) : null;
                const profOptions = svcId
                  ? professionalsWithServices.filter((p) => Array.isArray(p.service_ids) && p.service_ids.map((id) => Number.parseInt(id, 10)).includes(svcId))
                  : professionalsWithServices;
                return (
                  <select
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                    value={formData.professionalId}
                    onChange={(e) => handleFormChange('professionalId', e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-primary)'
                    }}
                  >
                    <option value="" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                      {t('bookings.form.select_professional', 'Selecione um profissional')}
                    </option>
                    {profOptions.map((professional) => (
                      <option key={professional.id} value={professional.id} style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                        {formatProfessionalOption(professional)}
                      </option>
                    ))}
                  </select>
                );
              })()}
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                {t('bookings.form.slot', 'Horário')}
              </label>
              <select
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                value={formData.slotId}
                onChange={(e) => handleFormChange('slotId', e.target.value)}
                disabled={!formData.professionalId}
                onFocus={() => {
                  if (formData.professionalId) {
                    refreshSlotsForProfessional(formData.professionalId);
                  }
                }}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <option value="" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  {t('bookings.form.select_slot', 'Selecione um horário')}
                </option>
                {formSlots.map((slot) => (
                  <option key={slot.id} value={slot.id} style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    {formatDateTimeRange(slot.start_time, slot.end_time)}
                  </option>
                ))}
              </select>
              {formSlotsLoading && (
                <p className="mt-1 text-xs text-brand-surfaceForeground/60">
                  {t('bookings.form.loading_slots', 'Carregando horários disponíveis...')}
                </p>
              )}
              {!formSlotsLoading && formData.professionalId && formSlots.length === 0 && (
                <p className="mt-1 text-xs text-brand-surfaceForeground/60">
                  {t('bookings.form.no_slots', 'Nenhum horário disponível para este profissional.')}
                </p>
              )}
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                {t('bookings.notes', 'Observações')}
              </label>
              <textarea
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                rows={1}
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder={t('bookings.form.notes_placeholder', 'Notas opcionais')}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)'
                }}
              />
            </div>

            <div className="col-span-full grid gap-2 sm:grid-cols-2 lg:grid-cols-5 items-center">
              <div className="lg:col-span-4 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={formSubmitting || customers.length === 0}
                  className="text-brand-primary hover:text-brand-accent underline font-medium transition"
                >
                  {formSubmitting ? t('common.saving', 'Salvando...') : t('bookings.form.submit', 'Agendar')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{ color: '#7F7EED' }}
                  className="hover:text-brand-accent underline font-medium transition"
                >
                  {t('bookings.form.reset', 'Limpar')}
                </button>
              </div>
              <div className="lg:col-start-5 lg:col-span-1 flex lg:justify-end">
                {(() => {
                  const disabled = !formData.customerId; // apenas cliente é obrigatório para abrir
                  const title = disabled ? t('bookings.form.customer_required', 'Selecione o cliente para continuar.') : undefined;
                  return (
                    <button
                      type="button"
                      onClick={openSeriesModal}
                      disabled={disabled}
                      title={title}
                      className={`font-medium transition ${disabled ? 'text-brand-surfaceForeground/40 cursor-not-allowed' : 'text-brand-surfaceForeground hover:underline'}`}
                    >
                      {t('bookings.form.multi_series_short', 'Multi/Série')}
                    </button>
                  );
                })()}
              </div>
            </div>
          </form>
          {formError && (
            <p className="mt-2 text-sm text-red-600">{formError.message}</p>
          )}
        </section>

        {error && (
          <p className="mt-4 text-sm text-red-600">{error.message}</p>
        )}

        <section className="mt-6">
          {loading ? (
            <p className="text-sm text-brand-surfaceForeground/70">{t('common.loading', 'Carregando...')}</p>
          ) : appointments.length === 0 ? (
            <p className="text-sm text-brand-surfaceForeground/70">{t('bookings.empty', 'Nenhum agendamento encontrado.')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-border text-left text-sm text-brand-surfaceForeground">
                <thead className="bg-brand-light/60 text-xs uppercase tracking-wide text-brand-surfaceForeground/70">
                  <tr>
                    <th className="px-4 py-2">{t('bookings.client')}</th>
                    <th className="px-4 py-2">{t('bookings.professional')}</th>
                    <th className="px-4 py-2">{t('bookings.datetime')}</th>
                    <th className="px-4 py-2">{t('bookings.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="align-top">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openEdit(appointment)}
                            className="font-medium text-left text-brand-primary hover:underline"
                          >
                            {appointment.customerName || appointment.clientName || t('bookings.client_placeholder', 'Cliente')}
                          </button>
                          {appointment.customerEmail && (
                            <div className="text-xs text-brand-surfaceForeground/70">{appointment.customerEmail}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">{appointment.professionalName}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-brand-surfaceForeground/80">
                            {formatDateTimeRange(appointment.slotStart, appointment.slotEnd)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium uppercase ${APPOINTMENT_STATUS_STYLES[appointment.status] || 'border-brand-border bg-brand-light text-brand-surfaceForeground/80'}`}
                          >
                            {t(`bookings.statuses.${appointment.status}`, appointment.status)}
                          </span>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalCount > 0 && (
            <PaginationControls
              totalCount={totalCount}
              limit={limit}
              offset={offset}
              onChangeLimit={(n) => { setLimit(n); setOffset(0); }}
              onPrev={() => setOffset((prev) => Math.max(0, prev - limit))}
              onNext={() => setOffset((prev) => (prev + limit < totalCount ? prev + limit : prev))}
              className="mt-4"
            />
          )}
        </section>
      </div>
      {/* overlay removido */}
      {isSeriesModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-lg bg-brand-surface p-6 shadow-xl border border-brand-border flex flex-col max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-surfaceForeground">
                {activeSeriesTab === 'multi'
                  ? t('bookings.multi.title', 'Multi agendamento')
                  : t('bookings.series.title', 'Agendamento em Série')}
              </h2>
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  className={`px-3 py-1 rounded border ${activeSeriesTab === 'series' ? 'bg-brand-light text-brand-surfaceForeground' : 'text-brand-surfaceForeground/70'}`}
                  onClick={() => setActiveSeriesTab('series')}
                >
                  {t('bookings.series.tab_series', 'Série')}
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded border ${activeSeriesTab === 'multi' ? 'bg-brand-light text-brand-surfaceForeground' : 'text-brand-surfaceForeground/70'}`}
                  onClick={() => setActiveSeriesTab('multi')}
                >
                  {t('bookings.series.tab_multi', 'Multi')}
                </button>
              </div>
            </div>
            {activeSeriesTab === 'series' && (
              <div className="mt-4 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between sticky top-0 z-10 bg-brand-surface/95 backdrop-blur supports-[backdrop-filter]:bg-brand-surface/80 py-2">
                  <div className="text-sm text-brand-surfaceForeground/70">
                    {t('bookings.multi.hint', 'Selecione de 2 a 20 horários. Serviço e profissional podem ser definidos por item.')}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="text-brand-surfaceForeground hover:underline" onClick={prevWeek}>
                      {t('bookings.series.prev_week', 'Semana anterior')}
                    </button>
                    <button type="button" className="text-brand-surfaceForeground hover:underline" onClick={nextWeek}>
                      {t('bookings.series.next_week', 'Próxima semana')}
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-7 md:gap-3 md:overflow-visible md:snap-none -mx-2 px-2">
                  {[0,1,2,3,4,5,6].map((offset) => {
                    const day = new Date(visibleWeekStart);
                    day.setDate(day.getDate() + offset);
                    const dayLabel = day.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: '2-digit' });
                    const daySlots = (formSlots || []).filter((s) => isInCurrentWeek(s.start_time) && new Date(s.start_time).getDate() === day.getDate() && new Date(s.start_time).getMonth() === day.getMonth());
                    return (
                      <div key={offset} className="min-w-[160px] snap-start rounded border border-brand-border p-2 md:min-w-0">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-surfaceForeground/70">{dayLabel}</div>
                        <div className="flex flex-col gap-2">
                          {daySlots.length === 0 ? (
                            <div className="text-xs text-brand-surfaceForeground/60">{t('bookings.series.no_slots_day', 'Sem horários')}</div>
                          ) : (
                            daySlots.map((slot) => {
                              const selected = seriesSelections.some((s) => s.id === slot.id);
                              const isPast = new Date(slot.start_time) < new Date();
                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => { if (!isPast) toggleSeriesSelection(slot); }}
                                  disabled={isPast}
                                  className={`w-full rounded border px-2 py-1 text-xs text-left ${
                                    isPast
                                      ? 'border-brand-border/60 text-brand-surfaceForeground/40 cursor-not-allowed opacity-50'
                                      : selected
                                      ? 'border-brand-primary bg-brand-light/60 text-brand-primary'
                                      : 'border-brand-border hover:border-brand-primary'
                                  }`}
                                >
                                  {formatDateTimeRange(slot.start_time, slot.end_time)}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between sticky bottom-0 z-10 bg-brand-surface/95 backdrop-blur supports-[backdrop-filter]:bg-brand-surface/80 py-2">
                  <div className="text-sm text-brand-surfaceForeground">
                    {t('bookings.series.count', 'Selecionados:')} {seriesSelections.length}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="text-brand-surfaceForeground hover:underline" onClick={closeSeriesModal}>
                      {t('common.cancel', 'Cancelar')}
                    </button>
                    <button
                      type="button"
                      disabled={seriesSubmitting}
                      onClick={confirmSeries}
                      className="text-brand-primary hover:underline font-medium transition disabled:opacity-50"
                    >
                      {seriesSubmitting ? t('common.saving', 'Salvando...') : t('bookings.series.confirm', 'Confirmar série')}
                    </button>
                  </div>
                </div>
                {seriesError && (
                  <p className="mt-2 text-sm text-red-600">{seriesError.message}</p>
                )}
              </div>
            )}
            {activeSeriesTab === 'multi' && (
              <div className="mt-4 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between sticky top-0 z-10 bg-brand-surface/95 backdrop-blur supports-[backdrop-filter]:bg-brand-surface/80 py-2">
                  <div className="text-sm text-brand-surfaceForeground/70">
                    {t('bookings.series.hint', 'Selecione de 2 a 20 horários. Navegue por semanas.')}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="text-brand-surfaceForeground hover:underline" onClick={prevWeek}>
                      {t('bookings.series.prev_week', 'Semana anterior')}
                    </button>
                    <button type="button" className="text-brand-surfaceForeground hover:underline" onClick={nextWeek}>
                      {t('bookings.series.next_week', 'Próxima semana')}
                    </button>
                  </div>
                </div>
                {/* Configurações do lote (visualização de horários, notas padrão) */}
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                      {t('bookings.multi.batch_professional', 'Profissional para visualizar horários')}
                    </label>
                    <select
                            value={multiProfessionalId}
                      onChange={(e) => {
                          const v = e.target.value;
                          logMultiEvent('global_professional_change', {
                            slot_id: activeMultiSlotId,
                            professionalId: v,
                            serviceId: (multiSelections.find((s) => s.id === activeMultiSlotId)?.serviceId) || '',
                          });
                          // Seletor global: não altera itens existentes. Define default para novas seleções e recarrega slots.
                          setMultiProfessionalId(v);
                          refreshSlotsForProfessional(v);
                        }}
                      className="mt-1 w-full rounded border px-2 py-1 text-xs"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-primary)'
                      }}
                    >
                      <option value="">
                        {t('bookings.multi.batch_professional_default', 'Usar profissional do formulário')}
                      </option>
                      {(() => {
                        // Não filtrar profissionais pelo serviço do item ativo no seletor global.
                        // O seletor global deve listar todos os profissionais; a validação de compatibilidade é feita ao aplicar no item.
                        const options = professionalsWithServices;
                        return options.map((prof) => (
                          <option key={prof.id} value={prof.id}>
                            {formatProfessionalOption(prof)}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                      {t('bookings.multi.batch_notes', 'Notas padrão (opcional)')}
                    </label>
                    <input
                      type="text"
                      value={multiDefaultNotes}
                      onChange={(e) => setMultiDefaultNotes(e.target.value)}
                      className="mt-1 w-full rounded border px-2 py-1 text-xs"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-primary)',
                        colorScheme: 'light dark'
                      }}
                      placeholder={t('bookings.multi.batch_notes_placeholder', 'Notas aplicadas aos itens sem nota')}
                    />
                  </div>
                </div>
                {/* Debug Multi removido */}
                {!multiProfessionalId ? (
                  <div className="mt-3 text-sm text-brand-surfaceForeground/70">
                    {t('bookings.multi.pick_professional_hint', 'Selecione um profissional para visualizar horários.')}
                  </div>
                ) : (
                  <div className="mt-3 flex flex-col gap-3 -mx-2 px-2">
                    {[0,1,2,3,4,5,6].map((offset) => {
                      const day = new Date(visibleWeekStart);
                      day.setDate(day.getDate() + offset);
                      const dayLabel = day.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: '2-digit' });
                      const daySlots = (formSlots || []).filter((s) => isInCurrentWeek(s.start_time) && new Date(s.start_time).getDate() === day.getDate() && new Date(s.start_time).getMonth() === day.getMonth());
                      return (
                        <div key={offset} className="rounded border border-brand-border p-2">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-surfaceForeground/70">{dayLabel}</div>
                          <div className="flex flex-wrap gap-2">
                            {daySlots.length === 0 ? (
                              <div className="text-xs text-brand-surfaceForeground/60">{t('bookings.series.no_slots_day', 'Sem horários')}</div>
                            ) : (
                              (function(){
                                const activeItem = multiSelections.find((s) => s.id === activeMultiSlotId);
                                const svcId = activeItem?.serviceId ? Number.parseInt(activeItem.serviceId, 10) : null;
                                const itemProfId = activeItem?.professionalId ? Number.parseInt(activeItem.professionalId, 10) : null;
                                const gridProfId = multiProfessionalId ? Number.parseInt(multiProfessionalId, 10) : null;
                                const shouldFilter = Boolean(activeItem && svcId && itemProfId && gridProfId && itemProfId === gridProfId);
                                const duration = shouldFilter ? (servicesById.get(svcId)?.duration_minutes || 0) : 0;
                                const filteredSlots = daySlots.filter((slot) => {
                                  const isPast = new Date(slot.start_time) < new Date();
                                  if (isPast) return false;
                                  const fits = duration ? hasContiguousBlockFrom(slot, duration) : true;
                                  return fits;
                                });
                                return filteredSlots.map((slot) => {
                                  const selected = multiSelections.some((s) => s.id === slot.id);
                                  return (
                                    <button
                                      key={slot.id}
                                      type="button"
                                      onClick={() => {
                                        toggleMultiSelection(slot);
                                      }}
                                      className={`rounded border px-2 py-1 text-xs ${selected ? 'border-brand-primary bg-brand-light/60 text-brand-primary' : 'border-brand-border hover:border-brand-primary'}`}
                                    >
                                      {formatDateTimeRange(slot.start_time, slot.end_time)}
                                    </button>
                                  );
                                });
                              })()
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Lista editável de itens selecionados (Multi) */}
                {multiSelections.length > 0 ? (
                  <div className="mt-4 border-t border-brand-border pt-4">
                    <h3 className="text-sm font-semibold text-brand-surfaceForeground mb-2">
                      {t('bookings.multi.items_title', 'Itens selecionados')}
                    </h3>
                    {multiFeedback.length > 0 && (
                      <div className="mb-3 rounded border border-yellow-600/40 bg-yellow-200/10 p-2">
                        <div className="text-xs text-yellow-700 mb-2">
                          {t('bookings.multi.feedback_title', 'Observações e erros detectados nos itens')}
                        </div>
                        <ul className="space-y-2">
                          {multiFeedback.map((r) => (
                            <li key={`fb-${r.slot_id}`} className="text-xs flex items-center justify-between gap-2">
                              <span className={`${r.status === 'error' ? 'text-red-700' : 'text-yellow-700'}`}>
                                #{r.slot_id}: {r.message || (r.status === 'error' ? t('bookings.multi.item_error', 'Item com erro') : t('bookings.multi.item_warning', 'Item com observação'))}
                              </span>
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const s = r.suggested_slot;
                                  if (!s) {
                                    return <span className="text-brand-surfaceForeground/60">{t('bookings.multi.no_suggestion', 'Sem sugestão disponível')}</span>;
                                  }
                                  const prof = professionals.find((p) => String(p.id) === String(s.professional_id));
                                  const profName = prof ? prof.name : '';
                                  const suggestionText = `${t('bookings.multi.suggestion', 'Sugestão:')} ${formatDateTimeRange(s.start_time, s.end_time)}${profName ? ` • ${profName}` : ''}`;
                                  return (
                                    <>
                                      <span className="text-brand-surfaceForeground/70">{suggestionText}</span>
                                      <button
                                        type="button"
                                        className="text-brand-primary hover:underline"
                                        onClick={() => {
                                          logMultiEvent('apply_suggestion_click', {
                                            slot_id: r.slot_id,
                                            professionalId: undefined,
                                            serviceId: undefined,
                                            suggested_slot_id: s.slot_id,
                                          });
                                          applySuggestion(r.slot_id, s);
                                        }}
                                      >
                                        {t('bookings.multi.apply_suggestion', 'Aplicar sugestão')}
                                      </button>
                                    </>
                                  );
                                })()}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex flex-col gap-3">
                      {multiSelections.map((s) => (
                        <div key={s.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start">
                          <div className="text-xs text-brand-surfaceForeground/80">
                            {formatDateTimeRange(s.start_time, s.end_time)}
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                              {t('bookings.multi.service', 'Serviço')}
                            </label>
                            {(() => {
                              const chosenProfId = s.professionalId || '';
                              const offered = chosenProfId ? (professionalServices.get(Number.parseInt(chosenProfId, 10)) || []) : [];
                              const allowedServices = services.filter((svc) => {
                                const offeredOk = !chosenProfId || offered.includes(Number.parseInt(svc.id, 10));
                                return offeredOk;
                              });
                              return (
                                <>
                                <select
                                  value={s.serviceId || ''}
                                  onFocus={() => onFocusMultiItem(s.id)}
                                  onChange={(e) => {
                                    logMultiEvent('item_service_change', {
                                      slot_id: s.id,
                                      serviceId: e.target.value,
                                      professionalId: s.professionalId || '',
                                    });
                                    updateMultiItemField(s.id, 'serviceId', e.target.value);
                                  }}
                                  disabled={!chosenProfId}
                                  className="mt-1 w-full rounded border px-2 py-1 text-xs"
                                  style={{
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    borderColor: 'var(--border-primary)',
                                    maxWidth: '220px',
                                    minWidth: '160px'
                                  }}
                                >
                                  <option value="">
                                    {t('bookings.multi.service_select', 'Selecione um serviço')}
                                  </option>
                                  {allowedServices.map((svc) => (
                                    <option key={svc.id} value={svc.id}>
                                      {formatServiceOption(svc)}
                                    </option>
                                  ))}
                                </select>
                                {(() => {
                                  const svc = s.serviceId ? servicesById.get(Number.parseInt(s.serviceId, 10)) : null;
                                  const slotMinutes = getSlotMinutes(s);
                                  if (svc && svc.duration_minutes && svc.duration_minutes > slotMinutes) {
                                    return (
                                      <div className="mt-1 text-[11px] text-yellow-700">
                                        {t('bookings.multi.service_not_fit', 'Serviço não cabe no slot.')}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                </>
                              );
                            })()}
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                              {t('bookings.multi.professional', 'Profissional')}
                            </label>
                            {(() => {
                              // Filtra profissionais pelo serviço escolhido (se houver)
                              const svcId = s.serviceId ? Number.parseInt(s.serviceId, 10) : null;
                              // Se o slot tiver um profissional vinculado, limitar as opções a ele para evitar seleção inválida
                              const boundProfId = (() => {
                                const bound = slotMap.get(s.id)?.professional;
                                return bound != null ? Number.parseInt(bound, 10) : null;
                              })();
                              let profOptions = professionalsWithServices;
                              if (boundProfId != null) {
                                profOptions = professionalsWithServices.filter((p) => Number.parseInt(p.id, 10) === boundProfId);
                              } else if (svcId) {
                                // Caso não haja profissional vinculado no slot, filtra por serviço escolhido
                                profOptions = professionalsWithServices.filter((p) => Array.isArray(p.service_ids) && p.service_ids.map((id) => Number.parseInt(id, 10)).includes(svcId));
                              }
                              return (
                                <select
                                  value={s.professionalId || ''}
                                  onFocus={() => onFocusMultiItem(s.id)}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    // Se o serviço atual não for oferecido pelo novo profissional ou não couber, limpamos.
                                    const offered = professionalServices.get(Number.parseInt(v, 10)) || [];
                                    let nextServiceId = s.serviceId || '';
                                    if (nextServiceId) {
                                      const offeredOk = offered.includes(Number.parseInt(nextServiceId, 10));
                                      if (!offeredOk) {
                                        nextServiceId = '';
                                      }
                                    }
                                    logMultiEvent('item_professional_change', {
                                      slot_id: s.id,
                                      professionalId: v,
                                      serviceId: nextServiceId || '',
                                    });
                                    updateMultiItemField(s.id, 'professionalId', v);
                                    if (nextServiceId !== (s.serviceId || '')) {
                                      updateMultiItemField(s.id, 'serviceId', nextServiceId);
                                    }
                                  }}
                                  className="mt-1 w-full rounded border px-2 py-1 text-xs"
                                  style={{
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    borderColor: 'var(--border-primary)',
                                    maxWidth: '220px',
                                    minWidth: '160px'
                                  }}
                                >
                                  <option value="">
                                    {t('bookings.multi.professional_select', 'Selecione um profissional')}
                                  </option>
                                  {profOptions.map((prof) => (
                                    <option key={prof.id} value={prof.id}>
                                      {formatProfessionalOption(prof)}
                                    </option>
                                  ))}
                                </select>
                              );
                            })()}
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                              {t('bookings.multi.customer', 'Cliente')}
                            </label>
                             <select
                               value={s.customerId || ''}
                               onFocus={() => onFocusMultiItem(s.id)}
                               onChange={(e) => {
                                 logMultiEvent('item_customer_change', {
                                   slot_id: s.id,
                                   professionalId: s.professionalId || '',
                                   serviceId: s.serviceId || '',
                                 });
                                 updateMultiItemField(s.id, 'customerId', e.target.value);
                               }}
                              className="mt-1 w-full rounded border px-2 py-1 text-xs"
                              style={{
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-primary)',
                                maxWidth: '220px',
                                minWidth: '160px'
                              }}
                             >
                             <option value="">
                               {t('bookings.multi.customer_default', 'Usar cliente do formulário')}
                             </option>
                             {customers.map((customer) => (
                               <option key={customer.id} value={customer.id}>
                                 {customer.name}
                               </option>
                             ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                              {t('bookings.multi.notes', 'Notas (opcional)')}
                            </label>
                             <input
                               type="text"
                               value={s.notes || ''}
                               onFocus={() => onFocusMultiItem(s.id)}
                               onChange={(e) => {
                                 logMultiEvent('item_notes_change', {
                                   slot_id: s.id,
                                   professionalId: s.professionalId || '',
                                   serviceId: s.serviceId || '',
                                 });
                                 updateMultiItemField(s.id, 'notes', e.target.value);
                               }}
                              className="mt-1 w-full rounded border px-2 py-1 text-xs"
                              style={{
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-primary)',
                                colorScheme: 'light dark',
                                maxWidth: '280px',
                                minWidth: '180px'
                              }}
                               placeholder={t('bookings.multi.notes_placeholder', 'Adicionar notas para este item')}
                             />
                             <div className="mt-2">
                               <button
                                 type="button"
                                 className="text-red-600 hover:underline text-xs font-medium"
                                 onClick={() => removeMultiItem(s.id)}
                               >
                                 {t('bookings.multi.remove_item', 'Remover item')}
                               </button>
                             </div>
                          </div>
                          {(() => {
                            const v = validateMultiItem(s);
                             if (!v) return null;
                             return (
                              <div className="md:col-span-5 -mt-1 text-[11px] text-red-500/80">
                                {v.message}
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 border-t border-brand-border pt-4 text-sm text-brand-surfaceForeground/70">
                    {t('bookings.multi.no_items', 'Nenhum horário selecionado ainda. Selecione na grade acima.')}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between sticky bottom-0 z-10 bg-brand-surface/95 backdrop-blur supports-[backdrop-filter]:bg-brand-surface/80 py-2">
                  <div className="text-sm text-brand-surfaceForeground">
                    {t('bookings.series.count', 'Selecionados:')} {multiSelections.length}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="text-brand-surfaceForeground hover:underline" onClick={closeSeriesModal}>
                      {t('common.cancel', 'Cancelar')}
                    </button>
                    <button
                      type="button"
                      disabled={multiSubmitting}
                      onClick={() => {
                        logMultiEvent('confirm_multi_click', {
                          slot_id: activeMultiSlotId,
                          professionalId: multiProfessionalId || '',
                          serviceId: (multiSelections.find((s) => s.id === activeMultiSlotId)?.serviceId) || '',
                          count: multiSelections.length,
                          ids: multiSelections.map((s) => s.id),
                        });
                        confirmMulti();
                      }}
                      className="text-brand-primary hover:underline font-medium transition disabled:opacity-50"
                    >
                      {multiSubmitting ? t('common.saving', 'Salvando...') : t('bookings.series.confirm_multi', 'Confirmar multi')}
                    </button>
                  </div>
                </div>
                {multiError && (
                  <p className="mt-2 text-sm text-red-600">{multiError.message}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {selectedAppointment && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg bg-brand-surface p-6 shadow-xl border border-brand-border">
            <div className="flex items-start gap-4">
              <div>
                <h2 className="text-lg font-semibold text-brand-surfaceForeground">
                  {selectedAppointment.customerName || selectedAppointment.clientName || t('bookings.client_placeholder', 'Cliente')}
                </h2>
                {selectedAppointment.customerEmail && (
                  <p className="text-sm text-brand-surfaceForeground/70">{selectedAppointment.customerEmail}</p>
                )}
                {selectedAppointment.customerPhone && (
                  <p className="text-sm text-brand-surfaceForeground/70">{selectedAppointment.customerPhone}</p>
                )}
              </div>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-brand-surfaceForeground">{t('bookings.professional', 'Profissional')}</dt>
                <dd className="text-brand-surfaceForeground">{selectedAppointment.professionalName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-brand-surfaceForeground">{t('bookings.service', 'Serviço')}</dt>
                <dd className="text-brand-surfaceForeground">{selectedAppointment.serviceName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-brand-surfaceForeground">{t('bookings.datetime', 'Data e hora')}</dt>
                <dd className="text-brand-surfaceForeground">{formatDateTimeRange(selectedAppointment.slotStart, selectedAppointment.slotEnd)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-brand-surfaceForeground">{t('bookings.status', 'Status')}</dt>
                <dd>
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-medium uppercase ${APPOINTMENT_STATUS_STYLES[selectedAppointment.status] || 'border-brand-border bg-brand-light text-brand-surfaceForeground/80'}`}
                  >
                    {t(`bookings.statuses.${selectedAppointment.status}`, selectedAppointment.status)}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-brand-surfaceForeground/60">
                  {t('bookings.status')}
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-primary)'
                  }}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status} style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                      {t(`bookings.statuses.${status}`, status)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-brand-surfaceForeground/60">
                  {t('bookings.form.slot', 'Horário')}
                </label>
                <select
                  value={editForm.slotId}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, slotId: e.target.value }))}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  disabled={editingSlotsLoading}
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-primary)'
                  }}
                >
                  <option value="" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    {t('bookings.edit.keep_slot', 'Manter horário atual')}
                  </option>
                  {editingSlots.map((slot) => (
                    <option key={slot.id} value={slot.id} style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                      {formatDateTimeRange(slot.start_time, slot.end_time)}
                    </option>
                  ))}
                </select>
                {editingSlotsLoading && (
                  <p className="mt-1 text-xs text-brand-surfaceForeground/60">
                    {t('bookings.form.loading_slots', 'Carregando horários disponíveis...')}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-brand-surfaceForeground/60">
                  {t('bookings.notes', 'Observações')}
                </label>
                <textarea
                  rows={2}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  value={editForm.notes}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-primary)'
                  }}
                />
              </div>
            </div>
            {editError && (
              <p className="mt-3 text-sm text-red-600">{editError.message}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
              {selectedAppointment.status !== 'cancelled' ? (
                <button
                  type="button"
                  onClick={() => handleStatusQuickChange(selectedAppointment, 'cancelled')}
                  className="text-[#CF3B1D] hover:underline font-medium transition"
                >
                  {t('bookings.actions.cancel', 'Cancelar agendamento')}
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeDetails}
                  className="text-brand-surfaceForeground hover:underline font-medium transition"
                >
                  {t('common.close', 'Fechar')}
                </button>
                <button
                  type="button"
                  disabled={editSubmitting}
                  onClick={() => submitEdit(selectedAppointment)}
                  className="text-brand-primary hover:underline font-medium transition disabled:opacity-50"
                >
                  {editSubmitting ? t('common.saving', 'Salvando...') : t('bookings.actions.save', 'Salvar alterações')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </FullPageLayout>
  );
}

export default Bookings;
