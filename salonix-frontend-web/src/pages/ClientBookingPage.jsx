import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeftIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ClientLayout from '../layouts/ClientLayout';
import PageHeader from '../components/ui/PageHeader';
import FormButton from '../components/ui/FormButton';
import client from '../api/client';
import { fetchServices } from '../api/services';
import {
  createClientAppointment,
  fetchClientVouchers,
  applyClientVoucherToAppointment,
} from '../api/clientMe';
import { useTenant } from '../hooks/useTenant';
import { describeVoucherBenefit } from '../utils/voucherBenefit';
import { parseApiError } from '../utils/apiError';

export default function ClientBookingPage() {
  const { t } = useTranslation();
  const { slug } = useTenant();

  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [slots, setSlots] = useState([]);

  const [serviceId, setServiceId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [slotId, setSlotId] = useState('');
  const [notes, setNotes] = useState('');
  const [vouchers, setVouchers] = useState([]);
  const [voucherId, setVoucherId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [voucherError, setVoucherError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadServices = useCallback(async () => {
    try {
      const data = await fetchServices({ slug, params: { ordering: 'name' } });
      setServices(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e);
    }
  }, [slug]);

  const loadProfessionals = useCallback(async () => {
    if (!serviceId) {
      setProfessionals([]);
      return;
    }
    const headers = {};
    const params = { service_id: serviceId };
    if (slug) {
      headers['X-Tenant-Slug'] = slug;
      params.tenant = slug;
    }
    const { data } = await client.get('public/professionals/', {
      headers,
      params,
    });
    setProfessionals(Array.isArray(data) ? data : []);
  }, [slug, serviceId]);

  const loadSlots = useCallback(async () => {
    if (!professionalId) {
      setSlots([]);
      return;
    }
    const headers = {};
    const params = { professional_id: professionalId };
    if (slug) {
      headers['X-Tenant-Slug'] = slug;
      params.tenant = slug;
    }
    const { data } = await client.get('public/slots/', { headers, params });
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
        ? data.results
        : [];
    setSlots(list);
  }, [slug, professionalId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.resolve()
      .then(() => loadServices())
      .finally(() => setLoading(false));
  }, [loadServices]);

  useEffect(() => {
    fetchClientVouchers()
      .then((data) => {
        const active = Array.isArray(data)
          ? data.filter((v) => v.status === 'active')
          : [];
        setVouchers(active);
      })
      .catch(() => setVouchers([]));
  }, []);

  const activeVoucher = useMemo(
    () => vouchers.find((v) => String(v.id) === String(voucherId)) || null,
    [vouchers, voucherId]
  );

  useEffect(() => {
    setError(null);
    setProfessionals([]);
    setProfessionalId('');
    setSlots([]);
    setSlotId('');
    if (serviceId) {
      loadProfessionals();
    }
  }, [serviceId, loadProfessionals]);

  useEffect(() => {
    setError(null);
    setSlots([]);
    setSlotId('');
    if (professionalId) {
      loadSlots();
    }
  }, [professionalId, loadSlots]);

  const canSubmit = useMemo(() => {
    return Boolean(serviceId && professionalId && slotId) && !submitting;
  }, [serviceId, professionalId, slotId, submitting]);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!canSubmit) return;
      setSubmitting(true);
      setError(null);
      setVoucherError(null);
      try {
        const payload = {
          service: Number(serviceId),
          professional: Number(professionalId),
          slot: Number(slotId),
          notes: String(notes || ''),
        };
        const appointment = await createClientAppointment(payload);

        if (voucherId && appointment?.id) {
          try {
            await applyClientVoucherToAppointment(
              appointment.id,
              Number(voucherId)
            );
          } catch (voucherErr) {
            // O agendamento já foi criado com sucesso — não navegamos
            // automaticamente para que o cliente veja o aviso antes de
            // seguir para a lista de agendamentos.
            setVoucherError(
              parseApiError(
                voucherErr,
                t(
                  'client_booking.voucher.errors.apply_failed',
                  'O agendamento foi criado, mas não foi possível aplicar o voucher.'
                )
              )
            );
            setSubmitting(false);
            return;
          }
        }

        window.location.replace('/client/appointments');
      } catch (err) {
        setError(err);
        setSubmitting(false);
      }
    },
    [canSubmit, serviceId, professionalId, slotId, notes, voucherId, t]
  );

  return (
    <ClientLayout>
      <div className="sm:hidden mb-2">
        <NavLink
          to="/client/appointments"
          className="inline-flex items-center text-brand-primary underline font-medium transition hover:text-brand-accent"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-2" />
          {t('client_booking.back', 'Voltar')}
        </NavLink>
      </div>
      <PageHeader title={t('client_booking.title', 'Novo agendamento')} />
      {loading ? (
        <p className="text-sm text-brand-surfaceForeground/60">
          {t('client_booking.loading', 'Carregando…')}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
            <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
              {t('client_booking.service', 'Serviço')}
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
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
                {t('client_booking.select_placeholder', 'Selecione')}
              </option>
              {services.map((svc) => (
                <option
                  key={svc.id}
                  value={svc.id}
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {svc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
            <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
              {t('client_booking.professional', 'Profissional')}
            </label>
            <select
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              disabled={!serviceId}
              className="mt-1 w-full rounded border px-3 py-2 text-sm disabled:opacity-50"
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
                {t('client_booking.select_placeholder', 'Selecione')}
              </option>
              {professionals.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
            <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
              {t('client_booking.time_slot', 'Horário')}
            </label>
            <select
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
              disabled={!professionalId}
              className="mt-1 w-full rounded border px-3 py-2 text-sm disabled:opacity-50"
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
                {t('client_booking.select_placeholder', 'Selecione')}
              </option>
              {slots.map((s) => (
                <option
                  key={s.id}
                  value={s.id}
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {new Date(s.start_time).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {vouchers.length > 0 ? (
            <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
              <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
                {t('client_booking.voucher.title', 'Usar voucher')}
              </label>
              <select
                value={voucherId}
                onChange={(e) => setVoucherId(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)',
                }}
              >
                <option value="">
                  {t(
                    'client_booking.voucher.select_placeholder',
                    'Não usar voucher'
                  )}
                </option>
                {vouchers.map((voucher) => (
                  <option key={voucher.id} value={voucher.id}>
                    {voucher.voucher_code} —{' '}
                    {describeVoucherBenefit(voucher, t)}
                  </option>
                ))}
              </select>
              {activeVoucher ? (
                <p className="mt-2 text-xs text-brand-surfaceForeground/60">
                  {describeVoucherBenefit(activeVoucher, t)}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
            <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
              {t('client_booking.notes', 'Observações')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-primary)',
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <FormButton
              variant="link"
              type="submit"
              disabled={!canSubmit || submitting}
            >
              {submitting
                ? t('client_booking.submitting', 'Agendando…')
                : t('client_booking.submit', 'Agendar')}
            </FormButton>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error?.response?.data?.detail ||
                  error?.message ||
                  t('client_booking.errors.generic', 'Não foi possível agendar.')}
              </p>
            )}
          </div>
          {voucherError && (
            <div
              role="alert"
              className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800"
            >
              {voucherError.message}
              <NavLink
                to="/client/appointments"
                className="ml-2 underline font-medium"
              >
                {t('client_booking.back', 'Voltar')}
              </NavLink>
            </div>
          )}
        </form>
      )}
    </ClientLayout>
  );
}
