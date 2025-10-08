import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import { fetchAppointments, fetchAppointmentDetail, createAppointment, updateAppointment } from '../api/appointments';
import { fetchServices } from '../api/services';
import { fetchProfessionals } from '../api/professionals';
import { fetchSlots, fetchSlotDetail } from '../api/slots';
import { useTenant } from '../hooks/useTenant';
import { parseApiError } from '../utils/apiError';

const STATUS_OPTIONS = ['scheduled', 'completed', 'paid', 'cancelled'];

const INITIAL_FORM = {
  serviceId: '',
  professionalId: '',
  slotId: '',
  notes: '',
};

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

function combineAppointment(base, detail, serviceName, professionalName, slotDetail = null) {
  const slotInfo = slotDetail || detail?.slot || null;
  const slotStart = slotInfo?.start_time ?? detail?.slot?.start_time ?? null;
  const slotEnd = slotInfo?.end_time ?? detail?.slot?.end_time ?? null;
  const slotId = slotInfo?.id ?? detail?.slot?.id ?? base.slot ?? null;
  return {
    id: base.id,
    serviceId: detail?.service?.id ?? base.service,
    professionalId: detail?.professional?.id ?? base.professional,
    slotId,
    status: detail?.status || base.status || 'scheduled',
    notes: detail?.notes || base.notes || '',
    clientName: detail?.client_username || '',
    clientEmail: detail?.client_email || '',
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

function Bookings() {
  const { t } = useTranslation();
  const { slug } = useTenant();

  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  const [page, setPage] = useState(1);

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

  const serviceMap = useMemo(() => buildServiceMap(services), [services]);
  const professionalMap = useMemo(() => buildServiceMap(professionals), [professionals]);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLookupLoading(true);
    Promise.all([fetchServices(slug), fetchProfessionals(slug)])
      .then(([svc, profs]) => {
        if (!active) return;
        setServices(svc || []);
        setProfessionals(profs || []);
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

    const params = {
      page,
      page_size: 20,
    };
    if (filters.status) params.status = filters.status;
    if (filters.dateFrom) params.date_from = filters.dateFrom;
    if (filters.dateTo) params.date_to = filters.dateTo;

    const slotCache = new Map();

    fetchAppointments({ slug, params })
      .then(async (payload) => {
        if (!active) return;
        const baseResults = Array.isArray(payload.results) ? payload.results : [];
        setAppointmentsCount(payload.count || baseResults.length);

        const detailed = await Promise.all(
          baseResults.map(async (item) => {
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

              return combineAppointment(item, detail, svcName, profName, slotDetail);
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
              return combineAppointment(item, null, svcName, profName, slotDetail);
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
        setAppointmentsCount(0);
      })
      .finally(() => {
        if (!active) return;
        setLoadingList(false);
      });

    return () => {
      active = false;
    };
  }, [slug, filters, page, lookupLoading, serviceMap, professionalMap, t]);

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setFormSlots([]);
    setFormError(null);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'professionalId') {
      setFormSlots([]);
      setFormData((prev) => ({ ...prev, slotId: '' }));
      if (!value) return;
      setFormSlotsLoading(true);
      fetchSlots({ professionalId: value, slug })
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
    }
    if (field !== 'professionalId' && field !== 'slotId') {
      setFormError(null);
    }
  };

  const handleCreateAppointment = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!formData.serviceId || !formData.professionalId || !formData.slotId) {
      setFormError({ message: t('bookings.form.required', 'Selecione serviço, profissional e horário.') });
      return;
    }

    const payload = {
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
      setPage(1);
      // trigger effect by updating filters (force rerender). We'll update to new object to re-run effect.
      setFilters((prev) => ({ ...prev }));
    } catch (err) {
      setFormError(parseApiError(err, t('common.save_error', 'Falha ao salvar.')));
    } finally {
      setFormSubmitting(false);
    }
  };

  const openEdit = (appointment) => {
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
      setFilters((prev) => ({ ...prev }));
    } catch (err) {
      setEditError(parseApiError(err, t('common.save_error', 'Falha ao salvar.')));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleStatusQuickChange = async (appointment, status) => {
    try {
      await updateAppointment(appointment.id, { status }, { slug });
      setFilters((prev) => ({ ...prev }));
    } catch (err) {
      setError(parseApiError(err, t('common.save_error', 'Falha ao salvar.')));
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const loading = lookupLoading || loadingList;

  return (
    <FullPageLayout>
      <div className="rounded-xl bg-brand-surface p-6 shadow-sm ring-1 ring-brand-border">
        <h1 className="text-2xl font-semibold text-brand-surfaceForeground">
          {t('bookings.title')}
        </h1>

        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
              {t('bookings.filters.status', 'Status')}
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="mt-1 w-full rounded border border-brand-border px-3 py-2 text-sm"
            >
              <option value="">{t('bookings.filters.status_all', 'Todos')}</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {t(`bookings.statuses.${status}`, status)}
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
              className="mt-1 w-full rounded border border-brand-border px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded border border-brand-border px-3 py-2 text-sm"
            />
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-brand-border bg-brand-surface/60 p-4">
          <h2 className="text-lg font-medium text-brand-surfaceForeground">
            {t('bookings.create.title', 'Criar novo agendamento')}
          </h2>
          <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={handleCreateAppointment}>
            <div className="col-span-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                {t('bookings.service', 'Serviço')}
              </label>
              <select
                className="mt-1 w-full rounded border border-brand-border px-3 py-2 text-sm"
                value={formData.serviceId}
                onChange={(e) => handleFormChange('serviceId', e.target.value)}
              >
                <option value="">{t('bookings.form.select_service', 'Selecione um serviço')}</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {formatServiceOption(service)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                {t('bookings.professional', 'Profissional')}
              </label>
              <select
                className="mt-1 w-full rounded border border-brand-border px-3 py-2 text-sm"
                value={formData.professionalId}
                onChange={(e) => handleFormChange('professionalId', e.target.value)}
              >
                <option value="">{t('bookings.form.select_professional', 'Selecione um profissional')}</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {formatProfessionalOption(professional)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                {t('bookings.form.slot', 'Horário')}
              </label>
              <select
                className="mt-1 w-full rounded border border-brand-border px-3 py-2 text-sm"
                value={formData.slotId}
                onChange={(e) => handleFormChange('slotId', e.target.value)}
                disabled={!formData.professionalId || formSlotsLoading}
              >
                <option value="">{t('bookings.form.select_slot', 'Selecione um horário')}</option>
                {formSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
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
                className="mt-1 w-full rounded border border-brand-border px-3 py-2 text-sm"
                rows={1}
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder={t('bookings.form.notes_placeholder', 'Notas opcionais')}
              />
            </div>

            <div className="col-span-full flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={formSubmitting}
                className="rounded bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-accent disabled:opacity-50"
              >
                {formSubmitting ? t('common.saving', 'Salvando...') : t('bookings.form.submit', 'Agendar')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded border border-brand-border px-4 py-2 text-sm text-brand-surfaceForeground hover:bg-brand-light"
              >
                {t('bookings.form.reset', 'Limpar')}
              </button>
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
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">{t('bookings.client')}</th>
                    <th className="px-4 py-2">{t('bookings.service')}</th>
                    <th className="px-4 py-2">{t('bookings.professional')}</th>
                    <th className="px-4 py-2">{t('bookings.datetime')}</th>
                    <th className="px-4 py-2">{t('bookings.status')}</th>
                    <th className="px-4 py-2">{t('bookings.notes')}</th>
                    <th className="px-4 py-2 text-right">{t('bookings.actions.title', 'Ações')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {appointments.map((appointment) => (
                    <>
                      <tr key={appointment.id} className="align-top">
                        <td className="px-4 py-3 font-mono text-xs text-brand-surfaceForeground/80">#{appointment.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{appointment.clientName || t('bookings.client_placeholder', 'Cliente')}</div>
                          {appointment.clientEmail && (
                            <div className="text-xs text-brand-surfaceForeground/70">{appointment.clientEmail}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">{appointment.serviceName}</td>
                        <td className="px-4 py-3">{appointment.professionalName}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-brand-surfaceForeground/80">
                            {formatDateTimeRange(appointment.slotStart, appointment.slotEnd)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-brand-border bg-brand-light px-2 py-1 text-xs font-medium uppercase text-brand-surfaceForeground/80">
                            {t(`bookings.statuses.${appointment.status}`, appointment.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-brand-surfaceForeground/80">
                          {appointment.notes || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-2 text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => openEdit(appointment)}
                              className="text-[#1D29CF] hover:underline"
                            >
                              {t('bookings.actions.manage', 'Gerir')}
                            </button>
                            {appointment.status !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={() => handleStatusQuickChange(appointment, 'cancelled')}
                                className="text-[#CF3B1D] hover:underline"
                              >
                                {t('bookings.actions.cancel', 'Cancelar')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {editingId === appointment.id && (
                        <tr key={`${appointment.id}-edit`}>
                          <td colSpan={8} className="bg-brand-light/40 px-4 py-4">
                            <div className="space-y-3">
                              <div className="grid gap-3 sm:grid-cols-3">
                                <div>
                                  <label className="block text-xs font-semibold uppercase tracking-wide text-brand-surfaceForeground/60">
                                    {t('bookings.status')}
                                  </label>
                                  <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                                    className="mt-1 w-full rounded border border-brand-border px-3 py-2 text-sm"
                                  >
                                    {STATUS_OPTIONS.map((status) => (
                                      <option key={status} value={status}>
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
                                    className="mt-1 w-full rounded border border-brand-border px-3 py-2 text-sm"
                                    disabled={editingSlotsLoading}
                                  >
                                    <option value="">
                                      {t('bookings.edit.keep_slot', 'Manter horário atual')}
                                    </option>
                                    {editingSlots.map((slot) => (
                                      <option key={slot.id} value={slot.id}>
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
                                    className="mt-1 w-full rounded border border-brand-border px-3 py-2 text-sm"
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                                  />
                                </div>
                              </div>
                              {editError && (
                                <p className="text-sm text-red-600">{editError.message}</p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={editSubmitting}
                                  onClick={() => submitEdit(appointment)}
                                  className="rounded bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-accent disabled:opacity-50"
                                >
                                  {editSubmitting ? t('common.saving', 'Salvando...') : t('bookings.actions.save', 'Salvar alterações')}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="rounded border border-brand-border px-4 py-2 text-sm text-brand-surfaceForeground hover:bg-brand-light"
                                >
                                  {t('common.cancel', 'Cancelar')}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {appointmentsCount > appointments.length && (
            <div className="mt-4 flex items-center justify-between text-sm text-brand-surfaceForeground/70">
              <span>
                {t('bookings.pagination.summary', {
                  defaultValue: 'Total de {{count}} agendamentos',
                  count: appointmentsCount,
                })}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="rounded border border-brand-border px-3 py-1 text-brand-surfaceForeground hover:bg-brand-light disabled:opacity-40"
                >
                  {t('bookings.pagination.prev', 'Anterior')}
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => prev + 1)}
                  className="rounded border border-brand-border px-3 py-1 text-brand-surfaceForeground hover:bg-brand-light"
                >
                  {t('bookings.pagination.next', 'Próxima')}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </FullPageLayout>
  );
}

export default Bookings;
