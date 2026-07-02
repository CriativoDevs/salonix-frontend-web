import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import Modal from '../ui/Modal';
import Dropdown from '../ui/Dropdown';
import { createAppointment } from '../../api/appointments';
import { fetchSlots } from '../../api/slots';
import { parseApiError } from '../../utils/apiError';

const INITIAL_FORM = {
  customerId: '',
  serviceId: '',
  professionalId: '',
  slotId: '',
  notes: '',
};

function formatSlotOption(slot) {
  if (!slot) return '';
  const start = new Date(slot.start_time);
  const end = new Date(slot.end_time);
  const dateLabel = start.toLocaleDateString();
  const timeLabel = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return `${dateLabel}, ${timeLabel}`;
}

function formatServiceOption(service) {
  if (!service) return '';
  const parts = [service.name].filter(Boolean);
  if (service.duration_minutes) parts.push(`${service.duration_minutes} min`);
  if (service.price_eur != null && service.price_eur !== '') {
    const priceValue = Number.parseFloat(service.price_eur);
    if (!Number.isNaN(priceValue)) {
      parts.push(
        new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(priceValue)
      );
    }
  }
  return parts.join(' • ');
}

function AppointmentModal({
  open,
  onClose,
  onCreated,
  customers = [],
  services = [],
  professionals = [],
  lookupLoading = false,
  slug,
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [, setSuccess] = useState(false);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setGlobalError(null);
    setSuccess(false);
    setSlots([]);
  }, [open]);

  useEffect(() => {
    if (!open || !form.professionalId) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    fetchSlots({ professionalId: form.professionalId, slug })
      .then((data) => {
        if (!cancelled) setSlots(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, form.professionalId, slug]);

  const setField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'professionalId') next.slotId = '';
      return next;
    });
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setGlobalError(null);
  };

  const validate = () => {
    const errors = {};
    if (!form.customerId) errors.customerId = t('bookings.form.customer_required', 'Selecione um cliente.');
    if (!form.serviceId) errors.serviceId = t('bookings.form.service_required', 'Selecione um serviço.');
    if (!form.professionalId) errors.professionalId = t('bookings.form.professional_required', 'Selecione um profissional.');
    if (!form.slotId) errors.slotId = t('bookings.form.slot_required', 'Selecione um horário.');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      customer: Number.parseInt(form.customerId, 10),
      service: Number.parseInt(form.serviceId, 10),
      professional: Number.parseInt(form.professionalId, 10),
      slot: Number.parseInt(form.slotId, 10),
    };
    if (form.notes.trim()) payload.notes = form.notes.trim();

    try {
      setSubmitting(true);
      setGlobalError(null);
      await createAppointment(payload, { slug });
      setSuccess(true);
      onCreated?.();
      onClose?.();
    } catch (err) {
      setGlobalError(parseApiError(err, t('common.save_error', 'Falha ao salvar.')));
    } finally {
      setSubmitting(false);
    }
  };

  const customerItems = customers.map((c) => ({
    label: c.name,
    onClick: () => setField('customerId', String(c.id)),
  }));

  const serviceItems = services.map((s) => ({
    label: formatServiceOption(s),
    onClick: () => setField('serviceId', String(s.id)),
  }));

  const professionalItems = professionals.map((p) => ({
    label: p.name,
    onClick: () => setField('professionalId', String(p.id)),
  }));

  const slotItems = slots.map((s) => ({
    label: formatSlotOption(s),
    onClick: () => setField('slotId', String(s.id)),
  }));

  const selectedCustomer = customers.find((c) => String(c.id) === form.customerId);
  const selectedService = services.find((s) => String(s.id) === form.serviceId);
  const selectedProfessional = professionals.find((p) => String(p.id) === form.professionalId);
  const selectedSlot = slots.find((s) => String(s.id) === form.slotId);

  const inputBase =
    'mt-1 w-full rounded border px-3 py-2 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50';

  const dropdownTrigger = (label, disabled = false) => (
    <button
      type="button"
      disabled={disabled}
      className={`mt-1 w-full flex items-center justify-between rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 ${disabled ? 'cursor-not-allowed' : ''}`}
    >
      <span className="truncate">{label}</span>
      <ChevronDown size={16} className="shrink-0 text-brand-surfaceForeground/70" />
    </button>
  );

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      title={t('bookings.create.title', 'Criar novo agendamento')}
      description={t('bookings.create.description', 'Preencha os dados do agendamento.')}
      size="lg"
      footer={
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full border border-brand-border bg-brand-light/50 px-4 py-2 text-sm font-semibold text-brand-surfaceForeground/80 transition hover:bg-brand-light disabled:opacity-50"
          >
            {t('common.cancel', 'Cancelar')}
          </button>
          <button
            type="submit"
            form="appointment-modal-form"
            disabled={submitting || lookupLoading}
            className="inline-flex items-center justify-center rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? t('common.saving', 'Salvando...')
              : t('bookings.form.submit', 'Agendar')}
          </button>
        </div>
      }
    >
      <form id="appointment-modal-form" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Cliente */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
              {t('bookings.form.customer', 'Cliente')} <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <Dropdown
              trigger={dropdownTrigger(
                selectedCustomer?.name ?? t('bookings.form.select_customer', 'Selecione um cliente'),
                lookupLoading || customers.length === 0
              )}
              items={customerItems}
              searchable
              searchPlaceholder={t('common.search', 'Pesquisar...')}
              className="w-full"
            />
            {fieldErrors.customerId && (
              <p role="alert" className="mt-1 text-xs text-red-500">{fieldErrors.customerId}</p>
            )}
            {customers.length === 0 && !lookupLoading && (
              <p className="mt-1 text-xs text-brand-surfaceForeground/60">
                {t('bookings.form.empty_customer', 'Cadastre clientes antes de criar agendamentos.')}
              </p>
            )}
          </div>

          {/* Serviço */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
              {t('bookings.service', 'Serviço')} <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <Dropdown
              trigger={dropdownTrigger(
                selectedService ? formatServiceOption(selectedService) : t('bookings.form.select_service', 'Selecione um serviço'),
                lookupLoading
              )}
              items={serviceItems}
              searchable
              searchPlaceholder={t('common.search', 'Pesquisar...')}
              className="w-full"
            />
            {fieldErrors.serviceId && (
              <p role="alert" className="mt-1 text-xs text-red-500">{fieldErrors.serviceId}</p>
            )}
          </div>

          {/* Profissional */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
              {t('bookings.professional', 'Profissional')} <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <Dropdown
              trigger={dropdownTrigger(
                selectedProfessional?.name ?? t('bookings.form.select_professional', 'Selecione um profissional'),
                lookupLoading
              )}
              items={professionalItems}
              searchable
              searchPlaceholder={t('common.search', 'Pesquisar...')}
              className="w-full"
            />
            {fieldErrors.professionalId && (
              <p role="alert" className="mt-1 text-xs text-red-500">{fieldErrors.professionalId}</p>
            )}
          </div>

          {/* Horário */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
              {t('bookings.form.slot', 'Horário')} <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <Dropdown
              trigger={dropdownTrigger(
                selectedSlot
                  ? formatSlotOption(selectedSlot)
                  : t('bookings.form.select_slot', 'Selecione um horário'),
                !form.professionalId || slotsLoading
              )}
              items={slotItems}
              searchable
              searchPlaceholder={t('common.search', 'Pesquisar...')}
              className="w-full"
            />
            {fieldErrors.slotId && (
              <p role="alert" className="mt-1 text-xs text-red-500">{fieldErrors.slotId}</p>
            )}
            {form.professionalId && !slotsLoading && slots.length === 0 && (
              <p className="mt-1 text-xs text-brand-surfaceForeground/60">
                {t(
                  'bookings.form.empty_slots',
                  'Sem horários disponíveis para este profissional. Abra horários em "Horários" primeiro.'
                )}
              </p>
            )}
          </div>

          {/* Observações */}
          <div className="sm:col-span-2">
            <label
              htmlFor="appt-modal-notes"
              className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60"
            >
              {t('bookings.notes', 'Observações')}
            </label>
            <textarea
              id="appt-modal-notes"
              rows={2}
              className={inputBase}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder={t('bookings.form.notes_placeholder', 'Notas opcionais')}
            />
          </div>
        </div>

        {globalError && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {globalError.message ?? globalError}
          </p>
        )}
      </form>
    </Modal>
  );
}

export default AppointmentModal;
