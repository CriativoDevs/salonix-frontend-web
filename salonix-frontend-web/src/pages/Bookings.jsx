import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  MoreHorizontal,
  Eye,
  RefreshCw,
  XCircle,
  Copy,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
} from 'lucide-react';
import FullPageLayout from '../layouts/FullPageLayout';
import Dropdown, { DropdownItem } from '../components/ui/Dropdown';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import {
  fetchAppointments,
  fetchAppointmentDetail,
  updateAppointment,
  createAppointmentsSeries,
  createAppointmentsMixedBulk,
} from '../api/appointments';
import { fetchCustomers } from '../api/customers';
import { fetchServices } from '../api/services';
import { fetchProfessionals } from '../api/professionals';
import { fetchSlots, fetchSlotDetail } from '../api/slots';
import { useTenant } from '../hooks/useTenant';
import { parseApiError } from '../utils/apiError';
import { APPOINTMENT_STATUS_STYLES } from '../utils/badgeStyles';
import PaginationControls from '../components/ui/PaginationControls';
import AppointmentModal from '../components/appointments/AppointmentModal';

const STATUS_OPTIONS = ['scheduled', 'completed', 'paid', 'cancelled'];

const INITIAL_FORM = {
  customerId: '',
  serviceId: '',
  professionalId: '',
  startTime: '',
  endTime: '',
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
    return endTime
      ? `${datePart} ${startTime} – ${endTime}`
      : `${datePart} ${startTime}`;
  } catch {
    return endDate ? `${start} – ${end}` : String(start);
  }
}

function formatTimeRange(start, end) {
  const startDate = parseSlotDate(start);
  if (!startDate) return '--';
  const endDate = parseSlotDate(end);
  try {
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
    const startTime = formatter.format(startDate);
    const endTime = endDate ? formatter.format(endDate) : null;
    return endTime ? `${startTime} - ${endTime}` : startTime;
  } catch {
    return '--';
  }
}

function formatShortDate(value) {
  const date = parseSlotDate(value);
  if (!date) return '--';
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
      .format(date)
      .replace('.', '');
  } catch {
    return '--';
  }
}

function startOfCalendarDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addCalendarDays(value, days) {
  const date = startOfCalendarDay(value);
  date.setDate(date.getDate() + days);
  return date;
}

function startOfCalendarWeek(value) {
  const date = startOfCalendarDay(value);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addCalendarDays(date, diffToMonday);
}

function formatDateParam(value) {
  const date = startOfCalendarDay(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCalendarAppointmentTone(status) {
  if (status === 'cancelled') {
    return 'border-rose-200/70 bg-rose-50/70 hover:bg-rose-50';
  }
  if (status === 'completed') {
    return 'border-sky-200/70 bg-sky-50/70 hover:bg-sky-50';
  }
  if (status === 'paid') {
    return 'border-emerald-300/70 bg-emerald-100/80 hover:bg-emerald-100';
  }
  return 'border-emerald-200/70 bg-emerald-50/70 hover:bg-emerald-50';
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
  return professional.name;
}

function combineAppointment(
  base,
  detail,
  serviceName,
  professionalName,
  slotDetail = null,
  fallbackCustomer = null
) {
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
    professionalName:
      detail?.professional?.name || professionalName || `#${base.professional}`,
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
  const { t, i18n } = useTranslation();
  const { slug } = useTenant();
  const currentLanguage = i18n?.language || 'pt';

  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [viewMode, setViewMode] = useState('agenda');
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
  const [calendarCursor, setCalendarCursor] = useState(() =>
    startOfCalendarDay(new Date())
  );
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(() =>
    formatDateParam(new Date())
  );
  const [calendarJumpLoading, setCalendarJumpLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    customerId: '',
  });

  // paginação baseada em limit/offset

  const calendarWeekStart = useMemo(
    () => startOfCalendarWeek(calendarCursor),
    [calendarCursor]
  );

  const calendarWeekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        addCalendarDays(calendarWeekStart, index)
      ),
    [calendarWeekStart]
  );

  const calendarRangeStart = useMemo(
    () => formatDateParam(calendarWeekStart),
    [calendarWeekStart]
  );

  const calendarRangeEnd = useMemo(
    () => formatDateParam(addCalendarDays(calendarWeekStart, 6)),
    [calendarWeekStart]
  );

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formSlots, setFormSlots] = useState([]);
  const [formSlotsLoading, setFormSlotsLoading] = useState(false);

  const [formError, setFormError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    status: 'scheduled',
    notes: '',
    slotId: '',
  });
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
  const professionalMap = useMemo(
    () => buildServiceMap(professionals),
    [professionals]
  );
  const customerMap = useMemo(() => buildCustomerMap(customers), [customers]);
  // Apenas profissionais com serviços atribuídos (evita itens sem oferta)
  const professionalsWithServices = useMemo(
    () =>
      professionals.filter(
        (p) => Array.isArray(p?.service_ids) && p.service_ids.length > 0
      ),
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
          setFormError(
            parseApiError(err, t('common.load_error', 'Falha ao carregar.'))
          );
        })
        .finally(() => {
          setFormSlotsLoading(false);
        });
    },
    [slug, t]
  );

  // Helpers para validação de itens Multi
  const slotMap = useMemo(() => {
    const m = new Map();
    (formSlots || []).forEach((s) => {
      if (s?.id != null) m.set(s.id, s);
    });
    return m;
  }, [formSlots]);

  const servicesById = useMemo(() => buildServiceMap(services), [services]);
  const professionalServices = useMemo(() => {
    const m = new Map();
    professionals.forEach((p) => {
      const ids = Array.isArray(p?.service_ids)
        ? p.service_ids.map((id) => Number.parseInt(id, 10))
        : [];
      m.set(Number.parseInt(p.id, 10), ids);
    });
    return m;
  }, [professionals]);

  const getSlotMinutes = useCallback(
    (selection) => {
      const slot = slotMap.get(selection?.id);
      const start = parseSlotDate(slot?.start_time || selection?.start_time);
      const end = parseSlotDate(slot?.end_time || selection?.end_time);
      if (!start || !end) return 0;
      const diff = (end.getTime() - start.getTime()) / 60000;
      return Math.max(0, Math.round(diff));
    },
    [slotMap]
  );

  const formSlotsByStart = useMemo(() => {
    const m = new Map();
    (formSlots || []).forEach((s) => {
      const dt = parseSlotDate(s?.start_time);
      if (dt) m.set(dt.getTime(), s);
    });
    return m;
  }, [formSlots]);

  const hasContiguousBlockFrom = useCallback(
    (slot, requiredMinutes) => {
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
    },
    [formSlotsByStart]
  );

  const validateMultiItem = useCallback(
    (s) => {
      const slot = slotMap.get(s.id);
      const svcId = s.serviceId;
      const profId = s.professionalId;
      if (!svcId || !profId)
        return {
          code: 'missing',
          message: t(
            'bookings.multi.missing_fields_item',
            'Selecione serviço e profissional.'
          ),
        };
      const offered =
        professionalServices.get(Number.parseInt(profId, 10)) || [];
      if (
        offered.length > 0 &&
        svcId != null &&
        !offered.includes(Number.parseInt(svcId, 10))
      ) {
        return {
          code: 'prof_not_offer',
          message: t(
            'bookings.multi.prof_not_offer',
            'Profissional não oferece o serviço.'
          ),
        };
      }
      if (
        slot?.professional != null &&
        Number.parseInt(slot.professional, 10) !== Number.parseInt(profId, 10)
      ) {
        return {
          code: 'slot_wrong_professional',
          message: t(
            'bookings.multi.slot_wrong_professional',
            'Horário pertence a outro profissional.'
          ),
        };
      }
      return null;
    },
    [slotMap, professionalServices, t]
  );

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
        setError(
          parseApiError(err, t('common.load_error', 'Falha ao carregar.'))
        );
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

    const params =
      viewMode === 'calendar'
        ? {
            limit: 300,
            offset: 0,
            ordering: '-created_at',
            date_from: calendarRangeStart,
            date_to: calendarRangeEnd,
          }
        : {
            limit,
            offset,
            ordering: '-created_at',
          };
    if (filters.status) params.status = filters.status;
    if (viewMode !== 'calendar' && filters.dateFrom) {
      params.date_from = filters.dateFrom;
    }
    if (viewMode !== 'calendar' && filters.dateTo) {
      params.date_to = filters.dateTo;
    }
    if (filters.customerId) params.customer_id = filters.customerId;

    const slotCache = new Map();

    fetchAppointments({ slug, params })
      .then(async (payload) => {
        if (!active) return;
        const baseResults = Array.isArray(payload.results)
          ? payload.results
          : [];
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

              return combineAppointment(
                item,
                detail,
                svcName,
                profName,
                slotDetail,
                customerFallback
              );
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
              return combineAppointment(
                item,
                null,
                svcName,
                profName,
                slotDetail,
                customerFallback
              );
            }
          })
        );

        if (!active) return;
        setAppointments(detailed);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          parseApiError(err, t('common.load_error', 'Falha ao carregar.'))
        );
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
  }, [
    slug,
    filters,
    limit,
    offset,
    viewMode,
    calendarRangeStart,
    calendarRangeEnd,
    lookupLoading,
    serviceMap,
    professionalMap,
    customerMap,
    t,
  ]);

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


  const handleAppointmentCreated = () => {
    setOffset(0);
    setFilters((prev) => ({ ...prev }));
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
        setEditError(
          parseApiError(err, t('common.load_error', 'Falha ao carregar.'))
        );
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
        Number.parseInt(formData.professionalId, 10) ===
          appointment.professionalId &&
        (payload.status === 'cancelled' ||
          Object.prototype.hasOwnProperty.call(payload, 'slot'))
      ) {
        refreshSlotsForProfessional(formData.professionalId);
      }
    } catch (err) {
      setEditError(
        parseApiError(err, t('common.save_error', 'Falha ao salvar.'))
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleQuickCancel = async (e, appointment) => {
    e.stopPropagation();
    if (
      !window.confirm(
        t(
          'bookings.actions.cancel_confirm',
          'Tem certeza que deseja cancelar este agendamento?'
        )
      )
    ) {
      return;
    }
    try {
      await updateAppointment(
        appointment.id,
        { status: 'cancelled' },
        { slug }
      );
      setFilters((prev) => ({ ...prev }));
    } catch {
      alert(t('common.error', 'Erro ao cancelar'));
    }
  };

  const handleQuickReschedule = (e, appointment) => {
    e.stopPropagation();
    setFormData({
      customerId: String(appointment.customerId || ''),
      serviceId: String(appointment.serviceId || ''),
      professionalId: String(appointment.professionalId || ''),
      slotId: '',
      notes: appointment.notes || '',
    });
    if (appointment.professionalId) {
      refreshSlotsForProfessional(appointment.professionalId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetails = (e, appointment) => {
    e.stopPropagation();
    openEdit(appointment);
  };

  const handleCopyContact = (e, appointment) => {
    e.stopPropagation();
    const contact =
      appointment.customerPhone ||
      appointment.customerEmail ||
      appointment.clientEmail;
    if (contact) {
      navigator.clipboard.writeText(contact);
      // Feedback visual simples via alert (pode ser melhorado para Toast)
      alert(t('bookings.actions.contact_copied', 'Contato copiado!'));
    } else {
      alert(t('bookings.actions.no_contact', 'Sem contato'));
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
        Number.parseInt(formData.professionalId, 10) ===
          appointment.professionalId
      ) {
        refreshSlotsForProfessional(formData.professionalId);
      }
    } catch (err) {
      setError(parseApiError(err, t('common.save_error', 'Falha ao salvar.')));
    }
  };

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setOffset(0);
  }, []);

  const openCalendarView = useCallback(() => {
    if (viewMode === 'calendar') return;

    const firstAppointmentDate = parseSlotDate(appointments[0]?.slotStart);
    if (firstAppointmentDate) {
      const normalizedDate = startOfCalendarDay(firstAppointmentDate);
      setCalendarCursor(normalizedDate);
      setCalendarSelectedDate(formatDateParam(normalizedDate));
    }

    setViewMode('calendar');
  }, [appointments, viewMode]);

  const jumpToNextUpcomingAppointment = useCallback(async () => {
    try {
      setCalendarJumpLoading(true);
      const params = {
        limit: 1,
        offset: 0,
        ordering: 'start_time',
        date_from: new Date().toISOString(),
      };

      if (filters.status) params.status = filters.status;
      if (filters.customerId) params.customer_id = filters.customerId;

      const payload = await fetchAppointments({ slug, params });
      const nextItem = Array.isArray(payload?.results)
        ? payload.results[0]
        : null;

      if (!nextItem?.id) {
        setError({
          message: t(
            'bookings.calendar.no_next',
            'Não existem próximos agendamentos para os filtros atuais.'
          ),
        });
        return;
      }

      const detail = await fetchAppointmentDetail(nextItem.id, { slug });
      const nextStart =
        detail?.slot?.start_time ||
        detail?.slot_start ||
        detail?.start_time ||
        null;

      const parsedDate = parseSlotDate(nextStart);
      if (!parsedDate) {
        setError({
          message: t(
            'bookings.calendar.jump_error',
            'Não foi possível localizar a data do próximo agendamento.'
          ),
        });
        return;
      }

      const normalizedDate = startOfCalendarDay(parsedDate);
      setCalendarCursor(normalizedDate);
      setCalendarSelectedDate(formatDateParam(normalizedDate));
      setError(null);
    } catch (err) {
      setError(
        parseApiError(
          err,
          t(
            'bookings.calendar.jump_error',
            'Não foi possível localizar a data do próximo agendamento.'
          )
        )
      );
    } finally {
      setCalendarJumpLoading(false);
    }
  }, [filters.customerId, filters.status, slug, t]);

  useEffect(() => {
    const isInsideVisibleWeek = calendarWeekDays.some(
      (day) => formatDateParam(day) === calendarSelectedDate
    );
    if (!isInsideVisibleWeek) {
      setCalendarSelectedDate(calendarRangeStart);
    }
  }, [calendarWeekDays, calendarRangeStart, calendarSelectedDate]);

  const loading = lookupLoading || loadingList;
  const hasActiveFilters = Boolean(
    filters.status ||
      filters.customerId ||
      (viewMode === 'agenda' && (filters.dateFrom || filters.dateTo))
  );
  const closeDetails = () => {
    cancelEdit();
    setSelectedAppointment(null);
  };

  const groupedAppointments = useMemo(() => {
    const groups = {};
    appointments.forEach((appointment) => {
      const date = appointment.slotStart
        ? new Date(appointment.slotStart)
        : null;
      if (!date) return;

      const dateKey = date.toLocaleDateString('en-CA'); // YYYY-MM-DD

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: date,
          items: [],
        };
      }
      groups[dateKey].items.push(appointment);
    });

    // Sort groups by date descending (since default order is newest first)
    // or ascending? The user example shows 09:00 - 10:00. Usually upcoming agenda is ascending.
    // The fetchAppointments default ordering is '-start_time' (descending) in the code:
    // const params = { ..., ordering: '-start_time' };
    // If the user wants an agenda view, they usually want to see what's coming next (ascending).
    // But the current implementation forces '-start_time'.
    // I will respect the current ordering of the list for now, just grouping it.
    // If the list is descending, the groups should probably be descending too.

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => groups[key]);
  }, [appointments]);

  const getGroupLabel = (groupDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const d = new Date(groupDate);
    d.setHours(0, 0, 0, 0);

    if (d.getTime() === today.getTime()) return t('date.today', 'Hoje');
    if (d.getTime() === tomorrow.getTime()) return t('date.tomorrow', 'Amanhã');

    const locale = i18n?.language || undefined;
    try {
      return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(groupDate);
    } catch {
      return new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(groupDate);
    }
  };

  const calendarAppointmentsByDay = useMemo(() => {
    const grouped = new Map(
      calendarWeekDays.map((day) => [formatDateParam(day), []])
    );

    appointments.forEach((appointment) => {
      const date = parseSlotDate(appointment.slotStart);
      if (!date) return;
      const key = formatDateParam(date);
      if (!grouped.has(key)) return;
      grouped.get(key).push(appointment);
    });

    grouped.forEach((items) => {
      items.sort((left, right) => {
        const leftTime = parseSlotDate(left.slotStart)?.getTime() || 0;
        const rightTime = parseSlotDate(right.slotStart)?.getTime() || 0;
        return leftTime - rightTime;
      });
    });

    return grouped;
  }, [appointments, calendarWeekDays]);

  const selectedCalendarItems = useMemo(
    () => calendarAppointmentsByDay.get(calendarSelectedDate) || [],
    [calendarAppointmentsByDay, calendarSelectedDate]
  );

  const formatCalendarRange = useCallback(
    (start, end) => {
      try {
        const formatter = new Intl.DateTimeFormat(
          currentLanguage === 'pt' ? 'pt-PT' : 'en-IE',
          {
            day: '2-digit',
            month: 'short',
          }
        );
        return `${formatter.format(start).replace('.', '')} - ${formatter.format(end).replace('.', '')}`;
      } catch {
        return `${formatDateParam(start)} - ${formatDateParam(end)}`;
      }
    },
    [currentLanguage]
  );

  const formatCalendarDayHeading = useCallback(
    (value) => {
      try {
        return new Intl.DateTimeFormat(
          currentLanguage === 'pt' ? 'pt-PT' : 'en-IE',
          {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
          }
        )
          .format(value)
          .replace('.', '');
      } catch {
        return formatDateParam(value);
      }
    },
    [currentLanguage]
  );

  const summaryStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayCount = 0;
    let scheduledCount = 0;
    let cancelledCount = 0;
    let upcomingCount = 0;

    appointments.forEach((appointment) => {
      const startDate = parseSlotDate(appointment.slotStart);
      if (!startDate) return;

      const normalizedDate = new Date(startDate);
      normalizedDate.setHours(0, 0, 0, 0);

      if (normalizedDate.getTime() === today.getTime()) {
        todayCount += 1;
      }
      if (appointment.status === 'scheduled') {
        scheduledCount += 1;
      }
      if (appointment.status === 'cancelled') {
        cancelledCount += 1;
      }
      if (startDate.getTime() >= Date.now()) {
        upcomingCount += 1;
      }
    });

    return [
      {
        key: 'today',
        label: t('bookings.stats.today', 'Hoje'),
        value: todayCount,
      },
      {
        key: 'scheduled',
        label: t('bookings.stats.scheduled', 'Agendados'),
        value: scheduledCount,
      },
      {
        key: 'cancelled',
        label: t('bookings.stats.cancelled', 'Cancelados'),
        value: cancelledCount,
      },
      {
        key: 'upcoming',
        label: t('bookings.stats.upcoming', 'Próximos'),
        value: upcomingCount,
      },
    ];
  }, [appointments, t]);

  // Série/Multi helpers
  const openSeriesModal = () => {
    setSeriesError(null);
    setMultiProfessionalId('');
    setMultiDefaultNotes('');
    setActiveSeriesTab('multi');
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
      const next = [
        ...prev,
        { id: slot.id, start_time: slot.start_time, end_time: slot.end_time },
      ];
      return next;
    });
  };

  const toggleMultiSelection = (slot) => {
    setMultiSelections((prev) => {
      const now = new Date();
      if (new Date(slot.start_time) < now) {
        logMultiEvent('slot_click_blocked_past', {
          slot_id: slot.id,
          professionalId:
            slot?.professional != null
              ? String(slot.professional)
              : multiProfessionalId || '',
          serviceId: '',
        });
        return prev;
      }
      const exists = prev.some((s) => s.id === slot.id);
      if (exists) {
        logMultiEvent('multi_remove', {
          slot_id: slot.id,
          professionalId:
            slot?.professional != null
              ? String(slot.professional)
              : multiProfessionalId || '',
          serviceId: '',
        });
        return prev.filter((s) => s.id !== slot.id);
      }
      if (prev.length >= 20) {
        logMultiEvent('multi_limit_reached', {
          slot_id: slot.id,
          professionalId:
            slot?.professional != null
              ? String(slot.professional)
              : multiProfessionalId || '',
          serviceId: '',
        });
        return prev;
      }
      const nextItem = {
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        serviceId: '',
        professionalId:
          slot?.professional != null
            ? String(slot.professional)
            : multiProfessionalId || '',
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
      professionalId:
        field === 'professionalId'
          ? value || ''
          : current?.professionalId || '',
      serviceId: field === 'serviceId' ? value || '' : current?.serviceId || '',
    });
    setMultiSelections((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, [field]: value } : s))
    );
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
      professionalId:
        suggested?.professional_id != null
          ? String(suggested.professional_id)
          : undefined,
      serviceId: undefined,
      suggested_slot_id: suggested.slot_id,
    });
    setMultiSelections((prev) =>
      prev.map((s) =>
        s.id === currentSlotId
          ? {
              ...s,
              id: suggested.slot_id,
              start_time: suggested.start_time || s.start_time,
              end_time: suggested.end_time || s.end_time,
              professionalId:
                suggested.professional_id != null
                  ? String(suggested.professional_id)
                  : s.professionalId,
            }
          : s
      )
    );
    // Recarregar slots para refletir alterações e atualizar validações locais
    const profToRefresh =
      suggested?.professional_id != null
        ? String(suggested.professional_id)
        : multiProfessionalId || '';
    refreshSlotsForProfessional(profToRefresh);
    setMultiFeedback((prev) => prev.filter((r) => r.slot_id !== currentSlotId));
  };

  const confirmSeries = async () => {
    const count = seriesSelections.length;
    if (count < 2) {
      setSeriesError({
        message: t(
          'bookings.series.min_selection',
          'Selecione pelo menos 2 horários.'
        ),
      });
      return;
    }
    if (count > 20) {
      setSeriesError({
        message: t(
          'bookings.series.max_selection',
          'Máximo de 20 horários por série.'
        ),
      });
      return;
    }
    // Validação: nenhum horário no passado
    const now = new Date();
    const hasPast = seriesSelections.some((s) => new Date(s.start_time) < now);
    if (hasPast) {
      setSeriesError({
        message: t(
          'bookings.series.past_not_allowed',
          'Alguns horários estão no passado. Selecione horários futuros.'
        ),
      });
      return;
    }
    const payload = {
      service_id: Number.parseInt(formData.serviceId, 10),
      professional_id: Number.parseInt(formData.professionalId, 10),
      customer_id: Number.parseInt(formData.customerId, 10),
      appointments: seriesSelections.map((s) => ({
        slot_id: s.id,
        notes: (formData.notes || '').trim() || undefined,
      })),
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
      setSeriesError(
        parseApiError(err, t('common.save_error', 'Falha ao salvar.'))
      );
    } finally {
      setSeriesSubmitting(false);
    }
  };

  const confirmMulti = async (allowRetry = true) => {
    const count = multiSelections.length;
    if (count < 2) {
      setMultiError({
        message: t(
          'bookings.series.min_selection',
          'Selecione pelo menos 2 horários.'
        ),
      });
      return;
    }
    if (count > 20) {
      setMultiError({
        message: t(
          'bookings.series.max_selection',
          'Máximo de 20 horários por lote.'
        ),
      });
      return;
    }
    const now = new Date();
    const hasPast = multiSelections.some((s) => new Date(s.start_time) < now);
    if (hasPast) {
      setMultiError({
        message: t(
          'bookings.series.past_not_allowed',
          'Alguns horários estão no passado. Selecione horários futuros.'
        ),
      });
      return;
    }
    // Garantir customer_id presente em todos os itens (fallback do formulário)
    if (!formData.customerId) {
      setMultiError({
        message: t(
          'bookings.form.customer_required',
          'Selecione o cliente para continuar.'
        ),
      });
      return;
    }
    const appointments = multiSelections.map((s) => ({
      slot_id: s.id,
      service_id: s.serviceId ? Number.parseInt(s.serviceId, 10) : NaN,
      professional_id: s.professionalId
        ? Number.parseInt(s.professionalId, 10)
        : NaN,
      notes:
        s.notes?.trim() ||
        multiDefaultNotes.trim() ||
        (formData.notes || '').trim() ||
        undefined,
    }));
    const invalid = appointments.filter(
      (a) => Number.isNaN(a.service_id) || Number.isNaN(a.professional_id)
    );
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
    const itemsWithValidation = multiSelections.map((s) => ({
      s,
      v: validateMultiItem(s),
    }));
    const clientInvalids = itemsWithValidation.filter((x) => x.v);
    const clientWarnings = multiSelections
      .map((s) => {
        const svc = s.serviceId
          ? servicesById.get(Number.parseInt(s.serviceId, 10))
          : null;
        const slotMinutes = getSlotMinutes(s);
        if (svc && svc.duration_minutes && svc.duration_minutes > slotMinutes) {
          return {
            slot_id: s.id,
            status: 'warning',
            message: t(
              'bookings.multi.service_not_fit',
              'Serviço não cabe no slot.'
            ),
          };
        }
        return null;
      })
      .filter(Boolean);
    if (clientInvalids.length > 0) {
      const errorFeedback = clientInvalids.map(({ s, v }) => ({
        slot_id: s.id,
        status: 'error',
        message: v.message,
      }));
      setMultiFeedback([...clientWarnings, ...errorFeedback]);
      setMultiError({
        message: t(
          'bookings.multi.precheck_failed',
          'Alguns itens estão inválidos. Corrija os erros destacados abaixo.'
        ),
      });
      return;
    }
    // Avisos não bloqueantes: permitir envio e deixar BE reservar bloco contíguo
    if (clientWarnings.length > 0) {
      setMultiFeedback(clientWarnings);
    } else {
      setMultiFeedback([]);
    }
    const payload = {
      customer_id: Number.parseInt(formData.customerId, 10),
      items: appointments,
    };
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
        const suggestibles = results.filter(
          (r) =>
            r.status === 'error' && r.suggested_slot && r.suggested_slot.slot_id
        );
        if (allowRetry && suggestibles.length > 0) {
          suggestibles.forEach((r) =>
            applySuggestion(r.slot_id, r.suggested_slot)
          );
          setTimeout(() => {
            confirmMulti(false);
          }, 0);
        } else {
          // manter modal aberto para correções manuais
          setMultiError({
            message:
              resp?.message ||
              t(
                'bookings.multi.partial_failed',
                'Alguns itens falharam. Ajuste abaixo e tente novamente.'
              ),
          });
        }
      }
    } catch (err) {
      const data = err && err.response && err.response.data;
      const results = normalizeResults(data);
      if (results && results.length > 0) {
        setMultiFeedback(results);
        // Em erro de validação, também tentar auto-aplicar sugestões uma vez
        const suggestibles = results.filter(
          (r) =>
            r.status === 'error' && r.suggested_slot && r.suggested_slot.slot_id
        );
        if (allowRetry && suggestibles.length > 0) {
          suggestibles.forEach((r) =>
            applySuggestion(r.slot_id, r.suggested_slot)
          );
          setTimeout(() => {
            confirmMulti(false);
          }, 0);
        } else {
          setMultiError({
            message:
              (data && data.message) ||
              t(
                'bookings.multi.partial_failed',
                'Alguns itens falharam. Ajuste abaixo e tente novamente.'
              ),
          });
        }
      } else {
        setMultiError(
          parseApiError(err, t('common.save_error', 'Falha ao salvar.'))
        );
      }
    } finally {
      setMultiSubmitting(false);
    }
  };

  const customerFilterItems = useMemo(() => {
    const allOption = {
      label: t('bookings.filters.customer_all', 'Todos'),
      onClick: () => handleFilterChange('customerId', ''),
    };
    const customerOptions = customers.map((c) => ({
      label: c.name,
      onClick: () => handleFilterChange('customerId', String(c.id)),
    }));
    return [allOption, ...customerOptions];
  }, [customers, t, handleFilterChange]);


  return (
    <FullPageLayout>
      <div className="space-y-6">
        <PageHeader
          title={t('bookings.title', 'Agendamentos')}
          subtitle={t(
            'bookings.subtitle',
            'Organize a operação do dia com filtros rápidos, criação guiada e leitura mais clara da agenda.'
          )}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="inline-flex w-fit items-center rounded-full border border-brand-border bg-brand-surface/80 p-1 shadow-sm ring-1 ring-brand-border/60">
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${viewMode === 'agenda' ? 'bg-brand-primary text-brand-primaryForeground' : 'text-brand-surfaceForeground/70 hover:bg-brand-light/60 hover:text-brand-surfaceForeground'}`}
            >
              <List className="h-4 w-4" />
              {t('bookings.views.agenda', 'Agenda')}
            </button>
            <button
              type="button"
              onClick={openCalendarView}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${viewMode === 'calendar' ? 'bg-brand-primary text-brand-primaryForeground' : 'text-brand-surfaceForeground/70 hover:bg-brand-light/60 hover:text-brand-surfaceForeground'}`}
            >
              <CalendarDays className="h-4 w-4" />
              {t('bookings.views.calendar', 'Calendário')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAppointmentModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15"
          >
            <Plus className="h-4 w-4" />
            {t('bookings.create.show', 'Novo agendamento')}
          </button>

          <button
            type="button"
            onClick={() => setFiltersPanelOpen((current) => !current)}
            aria-expanded={filtersPanelOpen}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-border bg-brand-light/50 px-4 py-2 text-sm font-semibold text-brand-surfaceForeground/80 transition hover:bg-brand-light"
          >
            <Filter className="h-4 w-4" />
            {filtersPanelOpen
              ? t('bookings.filters.hide', 'Fechar filtros')
              : t('bookings.filters.show', 'Filtros')}
            {filtersPanelOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={openSeriesModal}
            className="inline-flex items-center justify-center rounded-full border border-brand-border bg-brand-light/50 px-4 py-2 text-sm font-semibold text-brand-surfaceForeground/80 transition hover:bg-brand-light"
          >
            {t('bookings.form.multi_series_short', 'Multi/Série')}
          </button>

          <button
            type="button"
            onClick={() => setIsCompact((c) => !c)}
            className={`inline-flex items-center justify-center rounded-full border p-2 transition ${isCompact ? 'border-brand-primary/20 bg-brand-primary/10 text-brand-primary' : 'border-brand-border bg-brand-light/50 text-brand-surfaceForeground/70 hover:bg-brand-light hover:text-brand-surfaceForeground'}`}
            title={t('bookings.toggle_compact', 'Modo Compacto')}
            aria-pressed={isCompact}
          >
            <List className="h-4 w-4" />
          </button>

          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-brand-surfaceForeground/65">
              {filters.customerId ? (
                <span className="rounded-full border border-brand-border bg-brand-light/40 px-3 py-1">
                  {t('bookings.filters.customer_active', {
                    defaultValue: 'Cliente: {{name}}',
                    name:
                      customers.find((c) => String(c.id) === filters.customerId)
                        ?.name || filters.customerId,
                  })}
                </span>
              ) : null}
              {filters.status ? (
                <span className="rounded-full border border-brand-border bg-brand-light/40 px-3 py-1">
                  {t('bookings.filters.status_active', {
                    defaultValue: 'Status: {{status}}',
                    status: t(
                      `bookings.statuses.${filters.status}`,
                      filters.status
                    ),
                  })}
                </span>
              ) : null}
              {viewMode === 'agenda' && filters.dateFrom ? (
                <span className="rounded-full border border-brand-border bg-brand-light/40 px-3 py-1">
                  {t('bookings.filters.from_active', {
                    defaultValue: 'De: {{date}}',
                    date: filters.dateFrom,
                  })}
                </span>
              ) : null}
              {viewMode === 'agenda' && filters.dateTo ? (
                <span className="rounded-full border border-brand-border bg-brand-light/40 px-3 py-1">
                  {t('bookings.filters.to_active', {
                    defaultValue: 'Até: {{date}}',
                    date: filters.dateTo,
                  })}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
          {summaryStats.map((item) => (
            <Card
              key={item.key}
              className="flex min-h-[92px] flex-col items-start justify-center gap-3 rounded-xl border border-brand-border bg-brand-surface/95 px-4 py-3 shadow-sm ring-1 ring-brand-border/70 sm:min-h-[132px] sm:justify-between sm:gap-0 sm:rounded-2xl sm:p-4 xl:min-h-0"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-surfaceForeground/45 sm:text-xs sm:tracking-[0.18em]">
                {item.label}
              </p>
              <p className="text-[1.9rem] font-semibold leading-none text-brand-surfaceForeground sm:mt-3 sm:text-3xl">
                {item.value}
              </p>
            </Card>
          ))}
        </div>

        {filtersPanelOpen ? (
          <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-5 shadow-sm ring-1 ring-brand-border/70 sm:p-6">
            <div
              className={`grid gap-3 sm:grid-cols-2 ${viewMode === 'agenda' ? 'xl:grid-cols-4' : 'xl:grid-cols-2'}`}
            >
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                  {t('bookings.filters.customer', 'Cliente')}
                </label>
                <Dropdown
                  trigger={
                    <button
                      type="button"
                      className="mt-1 w-full flex items-center justify-between rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      <span className="truncate">
                        {filters.customerId
                          ? customers.find(
                              (c) => String(c.id) === filters.customerId
                            )?.name ||
                            t('bookings.filters.customer_all', 'Todos')
                          : t('bookings.filters.customer_all', 'Todos')}
                      </span>
                      <ChevronDown
                        size={16}
                        className="text-brand-surfaceForeground/70"
                      />
                    </button>
                  }
                  items={customerFilterItems}
                  searchable={true}
                  searchPlaceholder={t('common.search', 'Pesquisar...')}
                  className="w-full"
                />
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
                    borderColor: 'var(--border-primary)',
                  }}
                >
                  <option
                    value=""
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={jumpToNextUpcomingAppointment}
                      disabled={calendarJumpLoading}
                      className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {calendarJumpLoading
                        ? t('common.loading', 'Carregando...')
                        : t(
                            'bookings.calendar.next_appointment',
                            'Próximo agendamento'
                          )}
                    </button>
                    {t('bookings.filters.status_all', 'Todos')}
                  </option>
                  {STATUS_OPTIONS.map((status) => (
                    <option
                      key={status}
                      value={status}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {t(`bookings.status.${status}`, status)}
                    </option>
                  ))}
                </select>
              </div>
              {viewMode === 'agenda' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                      {t('bookings.filters.date_from', 'Data inicial')}
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) =>
                        handleFilterChange('dateFrom', e.target.value)
                      }
                      className="mt-1 w-full rounded border px-3 py-2 text-sm"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-primary)',
                        colorScheme: 'light dark',
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
                      onChange={(e) =>
                        handleFilterChange('dateTo', e.target.value)
                      }
                      className="mt-1 w-full rounded border px-3 py-2 text-sm"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-primary)',
                        colorScheme: 'light dark',
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2 rounded-2xl border border-brand-border bg-brand-light/25 p-4 text-sm text-brand-surfaceForeground/72">
                  <p className="font-medium text-brand-surfaceForeground/85">
                    {t('bookings.calendar.week_label', 'Semana visível')}
                  </p>
                  <p className="mt-1">
                    {formatCalendarRange(
                      calendarWeekStart,
                      addCalendarDays(calendarWeekStart, 6)
                    )}
                  </p>
                  <p className="mt-2 text-xs text-brand-surfaceForeground/58">
                    {t(
                      'bookings.filters.calendar_range_note',
                      'No modo calendário, o período é controlado pela navegação semanal.'
                    )}
                  </p>
                </div>
              )}
            </div>
          </Card>
        ) : null}

        <AppointmentModal
          open={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          onCreated={handleAppointmentCreated}
          customers={customers}
          services={services}
          professionals={professionals}
          lookupLoading={lookupLoading}
          slug={slug}
        />

        {error && <p className="mt-4 text-sm text-red-600">{error.message}</p>}

        <section>
          {loading ? (
            <p className="text-sm text-brand-surfaceForeground/70">
              {t('common.loading', 'Carregando...')}
            </p>
          ) : appointments.length === 0 ? (
            <EmptyState
              title={t('bookings.empty_title', 'Nenhum agendamento encontrado')}
              description={t(
                'bookings.empty',
                'Nenhum agendamento encontrado.'
              )}
            />
          ) : viewMode === 'calendar' ? (
            <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-5 shadow-sm ring-1 ring-brand-border/70 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-brand-surfaceForeground">
                    {t('bookings.calendar.title', 'Calendário semanal')}
                  </h2>
                  <p className="mt-1 text-sm text-brand-surfaceForeground/70">
                    {t('bookings.calendar.description', {
                      defaultValue: '{{count}} agendamentos entre {{range}}.',
                      count: appointments.length,
                      range: formatCalendarRange(
                        calendarWeekStart,
                        addCalendarDays(calendarWeekStart, 6)
                      ),
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarCursor((current) =>
                        addCalendarDays(current, -7)
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-light/50 px-4 py-2 text-sm font-semibold text-brand-surfaceForeground/80 transition hover:bg-brand-light"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('bookings.calendar.previous_week', 'Semana anterior')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarCursor(startOfCalendarDay(new Date()))
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15"
                  >
                    {t('bookings.calendar.today', 'Hoje')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarCursor((current) =>
                        addCalendarDays(current, 7)
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-light/50 px-4 py-2 text-sm font-semibold text-brand-surfaceForeground/80 transition hover:bg-brand-light"
                  >
                    {t('bookings.calendar.next_week', 'Próxima semana')}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-1 md:hidden">
                {calendarWeekDays.map((day) => {
                  const dayKey = formatDateParam(day);
                  const dayItems = calendarAppointmentsByDay.get(dayKey) || [];
                  const active = calendarSelectedDate === dayKey;
                  return (
                    <button
                      key={dayKey}
                      type="button"
                      onClick={() => setCalendarSelectedDate(dayKey)}
                      className={`flex min-w-[92px] shrink-0 flex-col rounded-2xl border px-3 py-3 text-left transition ${active ? 'border-brand-primary/30 bg-brand-primary/10 text-brand-primary' : 'border-brand-border bg-brand-light/20 text-brand-surfaceForeground/75 hover:bg-brand-light/40'}`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                        {formatCalendarDayHeading(day)}
                      </span>
                      <span className="mt-2 text-lg font-semibold leading-none">
                        {dayItems.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 hidden gap-3 md:grid md:grid-cols-7">
                {calendarWeekDays.map((day) => {
                  const dayKey = formatDateParam(day);
                  const dayItems = calendarAppointmentsByDay.get(dayKey) || [];
                  return (
                    <div
                      key={dayKey}
                      className="flex min-h-[320px] flex-col rounded-2xl border border-brand-border bg-brand-light/15 p-3"
                    >
                      <div className="border-b border-brand-border/70 pb-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-surfaceForeground/50">
                          {formatCalendarDayHeading(day)}
                        </p>
                        <p className="mt-2 text-sm text-brand-surfaceForeground/65">
                          {t('bookings.calendar.day_count', {
                            defaultValue: '{{count}} agendamentos',
                            count: dayItems.length,
                          })}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-1 flex-col gap-2">
                        {dayItems.length === 0 ? (
                          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-brand-border bg-brand-surface/60 p-4 text-center text-xs text-brand-surfaceForeground/55">
                            {t(
                              'bookings.calendar.empty_day',
                              'Sem agendamentos neste dia.'
                            )}
                          </div>
                        ) : (
                          dayItems.map((appointment) => (
                            <button
                              key={appointment.id}
                              type="button"
                              onClick={() => openEdit(appointment)}
                              className={`rounded-2xl border px-3 py-3 text-left shadow-sm transition ${getCalendarAppointmentTone(appointment.status)}`}
                            >
                              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-surfaceForeground/60">
                                {formatTimeRange(
                                  appointment.slotStart,
                                  appointment.slotEnd
                                )}
                              </div>
                              <div className="mt-2 text-sm font-semibold leading-snug text-brand-surfaceForeground">
                                {appointment.customerName ||
                                  appointment.clientName ||
                                  t('bookings.client_placeholder', 'Cliente')}
                              </div>
                              <div className="mt-1 text-xs leading-snug text-brand-surfaceForeground/58">
                                {appointment.professionalName}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 md:hidden">
                <div className="rounded-2xl border border-brand-border bg-brand-light/15 p-3">
                  <div className="border-b border-brand-border/70 pb-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-surfaceForeground/50">
                      {formatCalendarDayHeading(
                        calendarWeekDays.find(
                          (day) => formatDateParam(day) === calendarSelectedDate
                        ) || calendarWeekDays[0]
                      )}
                    </p>
                    <p className="mt-2 text-sm text-brand-surfaceForeground/65">
                      {t('bookings.calendar.day_count', {
                        defaultValue: '{{count}} agendamentos',
                        count: selectedCalendarItems.length,
                      })}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-col gap-2">
                    {selectedCalendarItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface/60 p-5 text-center text-sm text-brand-surfaceForeground/55">
                        {t(
                          'bookings.calendar.empty_day',
                          'Sem agendamentos neste dia.'
                        )}
                      </div>
                    ) : (
                      selectedCalendarItems.map((appointment) => (
                        <button
                          key={appointment.id}
                          type="button"
                          onClick={() => openEdit(appointment)}
                          className={`rounded-2xl border p-3 text-left shadow-sm transition ${getCalendarAppointmentTone(appointment.status)}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-surfaceForeground/60">
                                {formatTimeRange(
                                  appointment.slotStart,
                                  appointment.slotEnd
                                )}
                              </div>
                              <div className="mt-2 text-sm font-semibold leading-snug text-brand-surfaceForeground">
                                {appointment.customerName ||
                                  appointment.clientName ||
                                  t('bookings.client_placeholder', 'Cliente')}
                              </div>
                              <div className="mt-1 text-xs leading-snug text-brand-surfaceForeground/58">
                                {appointment.professionalName}
                              </div>
                            </div>
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase ${APPOINTMENT_STATUS_STYLES[appointment.status] || 'border-brand-border bg-brand-light text-brand-surfaceForeground/80'}`}
                            >
                              {t(
                                `bookings.statuses.${appointment.status}`,
                                appointment.status
                              )}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <div className="flex flex-col gap-6">
                {groupedAppointments.map((group) => (
                  <div key={group.date.toISOString()}>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-surfaceForeground/60 pl-1">
                      {getGroupLabel(group.date)}
                    </h3>
                    <div className="flex flex-col gap-2">
                      {group.items.map((appointment) => (
                        <div
                          key={appointment.id}
                          onClick={() => openEdit(appointment)}
                          className={`group relative flex cursor-pointer flex-col rounded-2xl border border-brand-border bg-brand-surface/95 shadow-sm ring-1 ring-brand-border/70 transition hover:bg-brand-surface/75 sm:flex-row sm:items-center ${isCompact ? 'p-2 gap-2 sm:gap-3 text-sm' : 'p-4 gap-4 sm:gap-5'}`}
                        >
                          <div className="flex-shrink-0 rounded-2xl border border-brand-border bg-brand-light/30 px-3 py-2 sm:min-w-[160px]">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-surfaceForeground/45">
                              {formatShortDate(appointment.slotStart)}
                            </div>
                            <div className="mt-1 font-mono text-base font-semibold text-brand-surfaceForeground">
                              {formatTimeRange(
                                appointment.slotStart,
                                appointment.slotEnd
                              )}
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col min-w-0">
                            <div className="font-semibold text-brand-surfaceForeground truncate">
                              {appointment.serviceName}
                            </div>
                            <div className="mt-1 text-sm text-brand-primary truncate">
                              {appointment.customerName ||
                                appointment.clientName ||
                                t('bookings.client_placeholder', 'Cliente')}
                            </div>
                            <div className="mt-1 text-xs text-brand-surfaceForeground/68 truncate">
                              {t('bookings.card.with_professional', {
                                defaultValue: 'com {{name}}',
                                name: appointment.professionalName,
                              })}
                            </div>
                            {(appointment.customerPhone ||
                              appointment.customerEmail ||
                              appointment.clientEmail) && (
                              <div className="mt-2 text-xs text-brand-surfaceForeground/55 truncate">
                                {[
                                  appointment.customerPhone,
                                  appointment.customerEmail ||
                                    appointment.clientEmail,
                                ]
                                  .filter(Boolean)
                                  .join(' • ')}
                              </div>
                            )}
                            {appointment.notes ? (
                              <div className="mt-2 text-xs text-brand-surfaceForeground/60 line-clamp-2">
                                {appointment.notes}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex-shrink-0 flex items-center gap-3 sm:text-right justify-end">
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase ${APPOINTMENT_STATUS_STYLES[appointment.status] || 'border-brand-border bg-brand-light text-brand-surfaceForeground/80'}`}
                            >
                              {t(
                                `bookings.statuses.${appointment.status}`,
                                appointment.status
                              )}
                            </span>

                            <div onClick={(e) => e.stopPropagation()}>
                              <Dropdown
                                trigger={
                                  <button
                                    type="button"
                                    className="rounded-full p-2 text-brand-surfaceForeground/60 transition hover:bg-brand-light hover:text-brand-surfaceForeground"
                                  >
                                    <MoreHorizontal className="h-5 w-5" />
                                  </button>
                                }
                                className="ml-1"
                              >
                                <DropdownItem
                                  onClick={(e) =>
                                    handleViewDetails(e, appointment)
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    {t('bookings.actions.details', 'Detalhes')}
                                  </div>
                                </DropdownItem>

                                {(appointment.status === 'scheduled' ||
                                  appointment.status === 'cancelled') && (
                                  <DropdownItem
                                    onClick={(e) =>
                                      handleQuickReschedule(e, appointment)
                                    }
                                  >
                                    <div className="flex items-center gap-2">
                                      <RefreshCw className="w-4 h-4" />
                                      {t(
                                        'bookings.actions.reschedule',
                                        'Reagendar'
                                      )}
                                    </div>
                                  </DropdownItem>
                                )}

                                {appointment.status === 'scheduled' && (
                                  <DropdownItem
                                    onClick={(e) =>
                                      handleQuickCancel(e, appointment)
                                    }
                                  >
                                    <div className="flex items-center gap-2 text-red-600">
                                      <XCircle className="w-4 h-4" />
                                      {t('bookings.actions.cancel', 'Cancelar')}
                                    </div>
                                  </DropdownItem>
                                )}

                                <DropdownItem
                                  onClick={(e) =>
                                    handleCopyContact(e, appointment)
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    <Copy className="w-4 h-4" />
                                    {t(
                                      'bookings.actions.copy_contact',
                                      'Copiar Contato'
                                    )}
                                  </div>
                                </DropdownItem>
                              </Dropdown>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {viewMode !== 'calendar' && totalCount > 0 && (
            <PaginationControls
              totalCount={totalCount}
              limit={limit}
              offset={offset}
              onChangeLimit={(n) => {
                setLimit(n);
                setOffset(0);
              }}
              onPrev={() => setOffset((prev) => Math.max(0, prev - limit))}
              onNext={() =>
                setOffset((prev) =>
                  prev + limit < totalCount ? prev + limit : prev
                )
              }
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
                    {t(
                      'bookings.series.hint',
                      'Selecione de 2 a 20 horários. Navegue por semanas.'
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-brand-surfaceForeground hover:underline"
                      onClick={prevWeek}
                    >
                      {t('bookings.series.prev_week', 'Semana anterior')}
                    </button>
                    <button
                      type="button"
                      className="text-brand-surfaceForeground hover:underline"
                      onClick={nextWeek}
                    >
                      {t('bookings.series.next_week', 'Próxima semana')}
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-7 md:gap-3 md:overflow-visible md:snap-none -mx-2 px-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                    const day = new Date(visibleWeekStart);
                    day.setDate(day.getDate() + offset);
                    const locale = i18n?.language || undefined;
                    const dayLabel = day.toLocaleDateString(
                      locale || undefined,
                      {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                      }
                    );
                    const daySlots = (formSlots || []).filter(
                      (s) =>
                        isInCurrentWeek(s.start_time) &&
                        new Date(s.start_time).getDate() === day.getDate() &&
                        new Date(s.start_time).getMonth() === day.getMonth()
                    );
                    return (
                      <div
                        key={offset}
                        className="min-w-[160px] snap-start rounded border border-brand-border p-2 md:min-w-0"
                      >
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-surfaceForeground/70">
                          {dayLabel}
                        </div>
                        <div className="flex flex-col gap-2">
                          {daySlots.length === 0 ? (
                            <div className="text-xs text-brand-surfaceForeground/60">
                              {t(
                                'bookings.series.no_slots_day',
                                'Sem horários'
                              )}
                            </div>
                          ) : (
                            daySlots.map((slot) => {
                              const selected = seriesSelections.some(
                                (s) => s.id === slot.id
                              );
                              const isPast =
                                new Date(slot.start_time) < new Date();
                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => {
                                    if (!isPast) toggleSeriesSelection(slot);
                                  }}
                                  disabled={isPast}
                                  className={`w-full rounded border px-2 py-1 text-xs text-left ${
                                    isPast
                                      ? 'border-brand-border/60 text-brand-surfaceForeground/40 cursor-not-allowed opacity-50'
                                      : selected
                                        ? 'border-brand-primary bg-brand-light/60 text-brand-primary'
                                        : 'border-brand-border hover:border-brand-primary'
                                  }`}
                                >
                                  {formatDateTimeRange(
                                    slot.start_time,
                                    slot.end_time
                                  )}
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
                    {t('bookings.series.count', 'Selecionados:')}{' '}
                    {seriesSelections.length}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-brand-surfaceForeground hover:underline"
                      onClick={closeSeriesModal}
                    >
                      {t('common.cancel', 'Cancelar')}
                    </button>
                    <button
                      type="button"
                      disabled={seriesSubmitting}
                      onClick={confirmSeries}
                      className="text-brand-primary hover:underline font-medium transition disabled:opacity-50"
                    >
                      {seriesSubmitting
                        ? t('common.saving', 'Salvando...')
                        : t('bookings.series.confirm', 'Confirmar série')}
                    </button>
                  </div>
                </div>
                {seriesError && (
                  <p className="mt-2 text-sm text-red-600">
                    {seriesError.message}
                  </p>
                )}
              </div>
            )}
            {activeSeriesTab === 'multi' && (
              <div className="mt-4 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between sticky top-0 z-10 bg-brand-surface/95 backdrop-blur supports-[backdrop-filter]:bg-brand-surface/80 py-2">
                  <div className="text-sm text-brand-surfaceForeground/70">
                    {t(
                      'bookings.series.hint',
                      'Selecione de 2 a 20 horários. Navegue por semanas.'
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-brand-surfaceForeground hover:underline"
                      onClick={prevWeek}
                    >
                      {t('bookings.series.prev_week', 'Semana anterior')}
                    </button>
                    <button
                      type="button"
                      className="text-brand-surfaceForeground hover:underline"
                      onClick={nextWeek}
                    >
                      {t('bookings.series.next_week', 'Próxima semana')}
                    </button>
                  </div>
                </div>
                {/* Configurações do lote (visualização de horários, notas padrão) */}
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                      {t(
                        'bookings.multi.batch_professional',
                        'Profissional para visualizar horários'
                      )}
                    </label>
                    <select
                      value={multiProfessionalId}
                      onChange={(e) => {
                        const v = e.target.value;
                        logMultiEvent('global_professional_change', {
                          slot_id: activeMultiSlotId,
                          professionalId: v,
                          serviceId:
                            multiSelections.find(
                              (s) => s.id === activeMultiSlotId
                            )?.serviceId || '',
                        });
                        // Seletor global: não altera itens existentes. Define default para novas seleções e recarrega slots.
                        setMultiProfessionalId(v);
                        refreshSlotsForProfessional(v);
                      }}
                      className="mt-1 w-full rounded border px-2 py-1 text-xs"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-primary)',
                      }}
                    >
                      <option value="">
                        {t(
                          'bookings.multi.batch_professional_default',
                          'Usar profissional do formulário'
                        )}
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
                      {t(
                        'bookings.multi.batch_notes',
                        'Notas padrão (opcional)'
                      )}
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
                        colorScheme: 'light dark',
                      }}
                      placeholder={t(
                        'bookings.multi.batch_notes_placeholder',
                        'Notas aplicadas aos itens sem nota'
                      )}
                    />
                  </div>
                </div>
                {/* Debug Multi removido */}
                {!multiProfessionalId ? (
                  <div className="mt-3 text-sm text-brand-surfaceForeground/70">
                    {t(
                      'bookings.multi.pick_professional_hint',
                      'Selecione um profissional para visualizar horários.'
                    )}
                  </div>
                ) : (
                  <div className="mt-3 flex flex-col gap-3 -mx-2 px-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                      const day = new Date(visibleWeekStart);
                      day.setDate(day.getDate() + offset);
                      const locale = i18n?.language || undefined;
                      const dayLabel = day.toLocaleDateString(
                        locale || undefined,
                        {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                        }
                      );
                      const daySlots = (formSlots || []).filter(
                        (s) =>
                          isInCurrentWeek(s.start_time) &&
                          new Date(s.start_time).getDate() === day.getDate() &&
                          new Date(s.start_time).getMonth() === day.getMonth()
                      );
                      return (
                        <div
                          key={offset}
                          className="rounded border border-brand-border p-2"
                        >
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-surfaceForeground/70">
                            {dayLabel}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {daySlots.length === 0 ? (
                              <div className="text-xs text-brand-surfaceForeground/60">
                                {t(
                                  'bookings.series.no_slots_day',
                                  'Sem horários'
                                )}
                              </div>
                            ) : (
                              (function () {
                                const activeItem = multiSelections.find(
                                  (s) => s.id === activeMultiSlotId
                                );
                                const svcId = activeItem?.serviceId
                                  ? Number.parseInt(activeItem.serviceId, 10)
                                  : null;
                                const itemProfId = activeItem?.professionalId
                                  ? Number.parseInt(
                                      activeItem.professionalId,
                                      10
                                    )
                                  : null;
                                const gridProfId = multiProfessionalId
                                  ? Number.parseInt(multiProfessionalId, 10)
                                  : null;
                                const shouldFilter = Boolean(
                                  activeItem &&
                                    svcId &&
                                    itemProfId &&
                                    gridProfId &&
                                    itemProfId === gridProfId
                                );
                                const duration = shouldFilter
                                  ? servicesById.get(svcId)?.duration_minutes ||
                                    0
                                  : 0;
                                const filteredSlots = daySlots.filter(
                                  (slot) => {
                                    const isPast =
                                      new Date(slot.start_time) < new Date();
                                    if (isPast) return false;
                                    const fits = duration
                                      ? hasContiguousBlockFrom(slot, duration)
                                      : true;
                                    return fits;
                                  }
                                );
                                return filteredSlots.map((slot) => {
                                  const selected = multiSelections.some(
                                    (s) => s.id === slot.id
                                  );
                                  return (
                                    <button
                                      key={slot.id}
                                      type="button"
                                      onClick={() => {
                                        toggleMultiSelection(slot);
                                      }}
                                      className={`rounded border px-2 py-1 text-xs ${selected ? 'border-brand-primary bg-brand-light/60 text-brand-primary' : 'border-brand-border hover:border-brand-primary'}`}
                                    >
                                      {formatDateTimeRange(
                                        slot.start_time,
                                        slot.end_time
                                      )}
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
                          {t(
                            'bookings.multi.feedback_title',
                            'Observações e erros detectados nos itens'
                          )}
                        </div>
                        <ul className="space-y-2">
                          {multiFeedback.map((r) => (
                            <li
                              key={`fb-${r.slot_id}`}
                              className="text-xs flex items-center justify-between gap-2"
                            >
                              <span
                                className={`${r.status === 'error' ? 'text-red-700' : 'text-yellow-700'}`}
                              >
                                #{r.slot_id}:{' '}
                                {r.message ||
                                  (r.status === 'error'
                                    ? t(
                                        'bookings.multi.item_error',
                                        'Item com erro'
                                      )
                                    : t(
                                        'bookings.multi.item_warning',
                                        'Item com observação'
                                      ))}
                              </span>
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const s = r.suggested_slot;
                                  if (!s) {
                                    return (
                                      <span className="text-brand-surfaceForeground/60">
                                        {t(
                                          'bookings.multi.no_suggestion',
                                          'Sem sugestão disponível'
                                        )}
                                      </span>
                                    );
                                  }
                                  const prof = professionals.find(
                                    (p) =>
                                      String(p.id) === String(s.professional_id)
                                  );
                                  const profName = prof ? prof.name : '';
                                  const suggestionText = `${t('bookings.multi.suggestion', 'Sugestão:')} ${formatDateTimeRange(s.start_time, s.end_time)}${profName ? ` • ${profName}` : ''}`;
                                  return (
                                    <>
                                      <span className="text-brand-surfaceForeground/70">
                                        {suggestionText}
                                      </span>
                                      <button
                                        type="button"
                                        className="text-brand-primary hover:underline"
                                        onClick={() => {
                                          logMultiEvent(
                                            'apply_suggestion_click',
                                            {
                                              slot_id: r.slot_id,
                                              professionalId: undefined,
                                              serviceId: undefined,
                                              suggested_slot_id: s.slot_id,
                                            }
                                          );
                                          applySuggestion(r.slot_id, s);
                                        }}
                                      >
                                        {t(
                                          'bookings.multi.apply_suggestion',
                                          'Aplicar sugestão'
                                        )}
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
                        <div
                          key={s.id}
                          className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start"
                        >
                          <div className="text-xs text-brand-surfaceForeground/80">
                            {formatDateTimeRange(s.start_time, s.end_time)}
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                              {t('bookings.multi.service', 'Serviço')}
                            </label>
                            {(() => {
                              const chosenProfId = s.professionalId || '';
                              const offered = chosenProfId
                                ? professionalServices.get(
                                    Number.parseInt(chosenProfId, 10)
                                  ) || []
                                : [];
                              const allowedServices = services.filter((svc) => {
                                const offeredOk =
                                  !chosenProfId ||
                                  offered.includes(Number.parseInt(svc.id, 10));
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
                                      updateMultiItemField(
                                        s.id,
                                        'serviceId',
                                        e.target.value
                                      );
                                    }}
                                    disabled={!chosenProfId}
                                    className="mt-1 w-full rounded border px-2 py-1 text-xs"
                                    style={{
                                      backgroundColor: 'var(--bg-primary)',
                                      color: 'var(--text-primary)',
                                      borderColor: 'var(--border-primary)',
                                      maxWidth: '220px',
                                      minWidth: '160px',
                                    }}
                                  >
                                    <option value="">
                                      {t(
                                        'bookings.multi.service_select',
                                        'Selecione um serviço'
                                      )}
                                    </option>
                                    {allowedServices.map((svc) => (
                                      <option key={svc.id} value={svc.id}>
                                        {formatServiceOption(svc)}
                                      </option>
                                    ))}
                                  </select>
                                  {(() => {
                                    const svc = s.serviceId
                                      ? servicesById.get(
                                          Number.parseInt(s.serviceId, 10)
                                        )
                                      : null;
                                    const slotMinutes = getSlotMinutes(s);
                                    if (
                                      svc &&
                                      svc.duration_minutes &&
                                      svc.duration_minutes > slotMinutes
                                    ) {
                                      return (
                                        <div className="mt-1 text-[11px] text-yellow-700">
                                          {t(
                                            'bookings.multi.service_not_fit',
                                            'Serviço não cabe no slot.'
                                          )}
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
                              const svcId = s.serviceId
                                ? Number.parseInt(s.serviceId, 10)
                                : null;
                              // Se o slot tiver um profissional vinculado, limitar as opções a ele para evitar seleção inválida
                              const boundProfId = (() => {
                                const bound = slotMap.get(s.id)?.professional;
                                return bound != null
                                  ? Number.parseInt(bound, 10)
                                  : null;
                              })();
                              let profOptions = professionalsWithServices;
                              if (boundProfId != null) {
                                profOptions = professionalsWithServices.filter(
                                  (p) =>
                                    Number.parseInt(p.id, 10) === boundProfId
                                );
                              } else if (svcId) {
                                // Caso não haja profissional vinculado no slot, filtra por serviço escolhido
                                profOptions = professionalsWithServices.filter(
                                  (p) =>
                                    Array.isArray(p.service_ids) &&
                                    p.service_ids
                                      .map((id) => Number.parseInt(id, 10))
                                      .includes(svcId)
                                );
                              }
                              return (
                                <select
                                  value={s.professionalId || ''}
                                  onFocus={() => onFocusMultiItem(s.id)}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    // Se o serviço atual não for oferecido pelo novo profissional ou não couber, limpamos.
                                    const offered =
                                      professionalServices.get(
                                        Number.parseInt(v, 10)
                                      ) || [];
                                    let nextServiceId = s.serviceId || '';
                                    if (nextServiceId) {
                                      const offeredOk = offered.includes(
                                        Number.parseInt(nextServiceId, 10)
                                      );
                                      if (!offeredOk) {
                                        nextServiceId = '';
                                      }
                                    }
                                    logMultiEvent('item_professional_change', {
                                      slot_id: s.id,
                                      professionalId: v,
                                      serviceId: nextServiceId || '',
                                    });
                                    updateMultiItemField(
                                      s.id,
                                      'professionalId',
                                      v
                                    );
                                    if (nextServiceId !== (s.serviceId || '')) {
                                      updateMultiItemField(
                                        s.id,
                                        'serviceId',
                                        nextServiceId
                                      );
                                    }
                                  }}
                                  className="mt-1 w-full rounded border px-2 py-1 text-xs"
                                  style={{
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    borderColor: 'var(--border-primary)',
                                    maxWidth: '220px',
                                    minWidth: '160px',
                                  }}
                                >
                                  <option value="">
                                    {t(
                                      'bookings.multi.professional_select',
                                      'Selecione um profissional'
                                    )}
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
                                updateMultiItemField(
                                  s.id,
                                  'customerId',
                                  e.target.value
                                );
                              }}
                              className="mt-1 w-full rounded border px-2 py-1 text-xs"
                              style={{
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-primary)',
                                maxWidth: '220px',
                                minWidth: '160px',
                              }}
                            >
                              <option value="">
                                {t(
                                  'bookings.multi.customer_default',
                                  'Usar cliente do formulário'
                                )}
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
                                updateMultiItemField(
                                  s.id,
                                  'notes',
                                  e.target.value
                                );
                              }}
                              className="mt-1 w-full rounded border px-2 py-1 text-xs"
                              style={{
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-primary)',
                                colorScheme: 'light dark',
                                maxWidth: '280px',
                                minWidth: '180px',
                              }}
                              placeholder={t(
                                'bookings.multi.notes_placeholder',
                                'Adicionar notas para este item'
                              )}
                            />
                            <div className="mt-2">
                              <button
                                type="button"
                                className="text-red-600 hover:underline text-xs font-medium"
                                onClick={() => removeMultiItem(s.id)}
                              >
                                {t(
                                  'bookings.multi.remove_item',
                                  'Remover item'
                                )}
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
                    {t(
                      'bookings.multi.no_items',
                      'Nenhum horário selecionado ainda. Selecione na grade acima.'
                    )}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between sticky bottom-0 z-10 bg-brand-surface/95 backdrop-blur supports-[backdrop-filter]:bg-brand-surface/80 py-2">
                  <div className="text-sm text-brand-surfaceForeground">
                    {t('bookings.series.count', 'Selecionados:')}{' '}
                    {multiSelections.length}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-brand-surfaceForeground hover:underline"
                      onClick={closeSeriesModal}
                    >
                      {t('common.cancel', 'Cancelar')}
                    </button>
                    <button
                      type="button"
                      disabled={multiSubmitting}
                      onClick={() => {
                        logMultiEvent('confirm_multi_click', {
                          slot_id: activeMultiSlotId,
                          professionalId: multiProfessionalId || '',
                          serviceId:
                            multiSelections.find(
                              (s) => s.id === activeMultiSlotId
                            )?.serviceId || '',
                          count: multiSelections.length,
                          ids: multiSelections.map((s) => s.id),
                        });
                        confirmMulti();
                      }}
                      className="text-brand-primary hover:underline font-medium transition disabled:opacity-50"
                    >
                      {multiSubmitting
                        ? t('common.saving', 'Salvando...')
                        : t('bookings.series.confirm_multi', 'Confirmar multi')}
                    </button>
                  </div>
                </div>
                {multiError && (
                  <p className="mt-2 text-sm text-red-600">
                    {multiError.message}
                  </p>
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
                  {selectedAppointment.customerName ||
                    selectedAppointment.clientName ||
                    t('bookings.client_placeholder', 'Cliente')}
                </h2>
                {selectedAppointment.customerEmail && (
                  <p className="text-sm text-brand-surfaceForeground/70">
                    {selectedAppointment.customerEmail}
                  </p>
                )}
                {selectedAppointment.customerPhone && (
                  <p className="text-sm text-brand-surfaceForeground/70">
                    {selectedAppointment.customerPhone}
                  </p>
                )}
              </div>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-brand-surfaceForeground">
                  {t('bookings.professional', 'Profissional')}
                </dt>
                <dd className="text-brand-surfaceForeground">
                  {selectedAppointment.professionalName}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-brand-surfaceForeground">
                  {t('bookings.service', 'Serviço')}
                </dt>
                <dd className="text-brand-surfaceForeground">
                  {selectedAppointment.serviceName}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-brand-surfaceForeground">
                  {t('bookings.datetime', 'Data e hora')}
                </dt>
                <dd className="text-brand-surfaceForeground">
                  {formatDateTimeRange(
                    selectedAppointment.slotStart,
                    selectedAppointment.slotEnd
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-brand-surfaceForeground">
                  {t('bookings.status', 'Status')}
                </dt>
                <dd>
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-medium uppercase ${APPOINTMENT_STATUS_STYLES[selectedAppointment.status] || 'border-brand-border bg-brand-light text-brand-surfaceForeground/80'}`}
                  >
                    {t(
                      `bookings.statuses.${selectedAppointment.status}`,
                      selectedAppointment.status
                    )}
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
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-primary)',
                  }}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option
                      key={status}
                      value={status}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    >
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
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, slotId: e.target.value }))
                  }
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  disabled={editingSlotsLoading}
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-primary)',
                  }}
                >
                  <option
                    value=""
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {t('bookings.edit.keep_slot', 'Manter horário atual')}
                  </option>
                  {editingSlots.map((slot) => (
                    <option
                      key={slot.id}
                      value={slot.id}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {formatDateTimeRange(slot.start_time, slot.end_time)}
                    </option>
                  ))}
                </select>
                {editingSlotsLoading && (
                  <p className="mt-1 text-xs text-brand-surfaceForeground/60">
                    {t(
                      'bookings.form.loading_slots',
                      'Carregando horários disponíveis...'
                    )}
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
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-primary)',
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
                  onClick={() =>
                    handleStatusQuickChange(selectedAppointment, 'cancelled')
                  }
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
                  {editSubmitting
                    ? t('common.saving', 'Salvando...')
                    : t('bookings.actions.save', 'Salvar alterações')}
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
