import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeftIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ClientLayout from '../layouts/ClientLayout';
import PageHeader from '../components/ui/PageHeader';
import FormButton from '../components/ui/FormButton';
import client from '../api/client';
import { fetchServices } from '../api/services';
import { createClientAppointment } from '../api/clientMe';
import { useTenant } from '../hooks/useTenant';

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
      try {
        const payload = {
          service: Number(serviceId),
          professional: Number(professionalId),
          slot: Number(slotId),
          notes: String(notes || ''),
        };
        await createClientAppointment(payload);
        window.location.replace('/client/appointments');
      } catch (err) {
        setError(err);
        setSubmitting(false);
      }
    },
    [canSubmit, serviceId, professionalId, slotId, notes]
  );

  return (
    <ClientLayout>
      <div className="sm:hidden mb-2">
        <NavLink
          to="/client/appointments"
          className="inline-flex items-center text-brand-primary underline font-medium transition hover:text-brand-accent"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-2" />
          {t('Voltar')}
        </NavLink>
      </div>
      <PageHeader title={t('Novo agendamento')} />
      {loading ? (
        <p className="text-sm text-brand-surfaceForeground/60">
          {t('Carregando…')}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
            <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
              {t('Serviço')}
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
                {t('Selecione')}
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
              {t('Profissional')}
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
                {t('Selecione')}
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
              {t('Horário')}
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
                {t('Selecione')}
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

          <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
            <label className="block text-xs font-medium uppercase tracking-wide text-brand-surfaceForeground/60">
              {t('Observações')}
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
              {submitting ? t('Agendando…') : t('Agendar')}
            </FormButton>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error?.response?.data?.detail ||
                  error?.message ||
                  t('Não foi possível agendar.')}
              </p>
            )}
          </div>
        </form>
      )}
    </ClientLayout>
  );
}
