import { useEffect, useMemo, useState } from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ClientLayout from '../layouts/ClientLayout';
import PageHeader from '../components/ui/PageHeader';
import { fetchClientUpcoming, cancelClientAppointment } from '../api/clientMe';
import { API_BASE_URL } from '../api/client';
import { useClientTenant } from '../hooks/useClientTenant';
import { downloadFile } from '../utils/downloadFile';

export default function ClientDashboard() {
  const { t } = useTranslation();
  const { tenant } = useClientTenant();
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const next = upcoming?.[0] || null;
  const [mapsConfirmOpen, setMapsConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const u = await fetchClientUpcoming();
        if (!cancelled) {
          setUpcoming(u);
        }
      } catch {
        if (!cancelled)
          setError({
            message: t(
              'client.dashboard.load_error',
              'Falha ao carregar dados.'
            ),
          });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const onCancel = async () => {
    if (!next) return;
    try {
      await cancelClientAppointment(next.id);
      const u = await fetchClientUpcoming();
      setUpcoming(u);
    } catch {
      setError({
        message: t(
          'client.dashboard.cancel_error',
          'Não foi possível cancelar.'
        ),
      });
    }
  };

  const handleDownloadICS = async (e) => {
    e.preventDefault();
    if (!next?.ics_token) return;

    const serviceName = next?.service?.name || 'Serviço';
    const filename = `agendamento_${serviceName.replace(/\s+/g, '_')}_${next?.id}.ics`;
    const icsUrl = `${API_BASE_URL}public/appointments/${next?.id}/ics/?token=${next.ics_token}`;

    try {
      await downloadFile(icsUrl, filename);
    } catch (error) {
      console.error('Failed to download ICS file:', error);
      // Fallback: try opening in new window
      window.open(icsUrl, '_blank');
    }
  };

  const fmt = (iso) => {
    try {
      const d = new Date(iso);
      const date = d.toLocaleDateString();
      const time = d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${date} ${time}`;
    } catch {
      return String(iso || '');
    }
  };

  const addressParts = [
    [tenant?.address_street, tenant?.address_number].filter(Boolean).join(', '),
    [tenant?.address_complement, tenant?.address_neighborhood]
      .filter(Boolean)
      .join(' - '),
    [tenant?.address_city, tenant?.address_state, tenant?.address_zip]
      .filter(Boolean)
      .join(' - '),
    tenant?.address_country,
  ].filter((p) => p && String(p).trim());

  const addressText = addressParts.join('\n');
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const isIOS = useMemo(() => /(iPhone|iPad|iPod)/i.test(ua), [ua]);
  const isAndroid = useMemo(() => /Android/i.test(ua), [ua]);
  const buildQuery = () => encodeURIComponent(addressParts.join(', '));
  const buildAppleMaps = () => `maps://?q=${buildQuery()}`;
  const buildGoogleMapsIOS = () => `comgooglemaps://?q=${buildQuery()}`;
  const buildGoogleMapsAndroid = () => `geo:0,0?q=${buildQuery()}`;
  const buildWaze = () => `waze://?q=${buildQuery()}`;
  const buildWebFallback = () =>
    `https://www.google.com/maps/search/?api=1&query=${buildQuery()}`;

  const onRequestAddress = () => {
    const email = tenant?.profile?.email || '';
    if (typeof email === 'string' && email.trim()) {
      const subject = encodeURIComponent('Solicitação de morada do salão');
      const body = encodeURIComponent(
        'Olá, poderia informar a morada do salão para abrir no Maps?'
      );
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    }
  };

  const tenantEmail = (tenant?.profile?.email || '').trim();
  const tenantPhoneRaw = (tenant?.profile?.phone || '').trim();
  const tenantPhoneDigits = tenantPhoneRaw.replace(/\D+/g, '');
  const telHref = tenantPhoneRaw
    ? `tel:${tenantPhoneRaw.replace(/\s+/g, '')}`
    : '';
  const waHref = tenantPhoneDigits ? `https://wa.me/${tenantPhoneDigits}` : '';

  return (
    <ClientLayout>
      <PageHeader title={t('client.dashboard.title', 'Área do Cliente')} />

      <div className="mt-2 flex flex-wrap gap-4">
        <NavLink
          to="/client/agendar"
          className="text-brand-primary underline font-medium transition hover:text-brand-accent"
        >
          {t('client.dashboard.new_booking', 'Novo agendamento')}
        </NavLink>
        <NavLink
          to="/client/appointments"
          className="text-brand-primary underline font-medium transition hover:text-brand-accent"
        >
          {t('client.dashboard.my_appointments', 'Meus agendamentos')}
        </NavLink>
        <NavLink
          to="/client/profile"
          className="text-brand-primary underline font-medium transition hover:text-brand-accent"
        >
          {t('client.dashboard.update_profile', 'Atualizar perfil')}
        </NavLink>
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-brand-surfaceForeground/70">
          {t('client.dashboard.loading', 'Carregando…')}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6">
          <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
            <h2 className="text-lg font-medium text-brand-surfaceForeground">
              {t('client.dashboard.next_appointment', 'Próximo agendamento')}
            </h2>
            {next ? (
              <div className="mt-3 text-sm text-brand-surfaceForeground">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{next?.service?.name}</div>
                    <div className="text-brand-surfaceForeground/70">
                      {next?.professional?.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div>{fmt(next?.slot?.start_time)}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-3">
                  <a
                    href={
                      next?.ics_token
                        ? `${API_BASE_URL}public/appointments/${next?.id}/ics/?token=${next.ics_token}`
                        : '#'
                    }
                    onClick={handleDownloadICS}
                    className="text-brand-primary hover:text-brand-accent underline underline-offset-4 cursor-pointer"
                  >
                    {t(
                      'client.dashboard.add_to_calendar',
                      'Adicionar ao calendário'
                    )}
                  </a>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="text-brand-primary underline font-medium hover:text-brand-accent"
                  >
                    {t('common.cancel', 'Cancelar')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-brand-surfaceForeground/70">
                {t('client.dashboard.no_upcoming', 'Sem agendamentos futuros.')}{' '}
                {t(
                  'client.dashboard.create_first',
                  'Crie seu primeiro agendamento.'
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {(tenantEmail || tenantPhoneRaw) && (
        <div className="mt-6 rounded-lg border border-brand-border bg-brand-surface p-4">
          <h2 className="text-lg font-medium text-brand-surfaceForeground">
            {t('client.dashboard.contact_title', 'Entre em contacto')}
          </h2>
          {tenantEmail && (
            <div className="mt-2 text-sm">
              <a
                href={`mailto:${tenantEmail}`}
                className="text-brand-primary underline font-medium hover:text-brand-accent"
              >
                {tenantEmail}
              </a>
            </div>
          )}
          {tenantPhoneRaw && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm text-brand-surfaceForeground/80">
                {tenantPhoneRaw}
              </div>
              <div className="flex items-center gap-3">
                {telHref && (
                  <a
                    href={telHref}
                    aria-label={t('client.dashboard.call', 'Chamar')}
                    title={t('client.dashboard.call', 'Chamar')}
                    className="text-brand-primary hover:text-brand-accent"
                  >
                    <Phone className="h-5 w-5" />
                  </a>
                )}
                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    title="WhatsApp"
                    className="text-brand-primary hover:text-brand-accent"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {addressParts.length > 0 && (
        <div className="mt-6 rounded-lg border border-brand-border bg-brand-surface p-4">
          <h2 className="text-lg font-medium text-brand-surfaceForeground">
            {t('client.dashboard.address_title', 'Morada do salão')}
          </h2>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-brand-surfaceForeground/80">
            {addressText}
          </pre>
          <div className="mt-3 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setMapsConfirmOpen(true)}
              className="text-brand-primary underline font-medium hover:text-brand-accent"
            >
              {t('client.dashboard.open_maps', 'Abrir no Maps?')}
            </button>
          </div>
        </div>
      )}

      {addressParts.length === 0 && (
        <div className="mt-6 rounded-lg border border-brand-border bg-brand-surface p-4">
          <h2 className="text-lg font-medium text-brand-surfaceForeground">
            {t('client.dashboard.address_title', 'Morada do salão')}
          </h2>
          <p className="mt-2 text-sm text-brand-surfaceForeground/80">
            {t('client.dashboard.address_missing', 'Endereço não cadastrado.')}
          </p>
          <div className="mt-3 flex items-center justify-end">
            <button
              type="button"
              onClick={onRequestAddress}
              className="text-brand-primary underline font-medium hover:text-brand-accent"
            >
              {t('client.dashboard.request_address', 'Solicitar endereço')}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error.message}
        </p>
      )}

      {mapsConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMapsConfirmOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-lg border border-brand-border bg-brand-surface p-4">
            <p className="text-sm text-brand-surfaceForeground">
              {t('client.dashboard.open_maps', 'Abrir no Maps?')}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {isIOS && (
                <a
                  href={buildAppleMaps()}
                  className="text-brand-primary underline font-medium hover:text-brand-accent"
                  onClick={() => setMapsConfirmOpen(false)}
                >
                  {t('client.maps.apple', 'Apple Maps')}
                </a>
              )}
              {isIOS && (
                <a
                  href={buildGoogleMapsIOS()}
                  className="text-brand-primary underline font-medium hover:text-brand-accent"
                  onClick={() => setMapsConfirmOpen(false)}
                >
                  {t('client.maps.google', 'Google Maps')}
                </a>
              )}
              {isAndroid && (
                <a
                  href={buildGoogleMapsAndroid()}
                  className="text-brand-primary underline font-medium hover:text-brand-accent"
                  onClick={() => setMapsConfirmOpen(false)}
                >
                  {t('client.maps.google', 'Google Maps')}
                </a>
              )}
              <a
                href={buildWaze()}
                className="text-brand-primary underline font-medium hover:text-brand-accent"
                onClick={() => setMapsConfirmOpen(false)}
              >
                {t('client.maps.waze', 'Waze')}
              </a>
              <a
                href={buildWebFallback()}
                target="_blank"
                rel="noreferrer"
                className="text-brand-primary underline font-medium hover:text-brand-accent"
                onClick={() => setMapsConfirmOpen(false)}
              >
                {t('client.dashboard.open_in_browser', 'Abrir no navegador')}
              </a>
              <button
                type="button"
                onClick={() => setMapsConfirmOpen(false)}
                className="text-brand-primary underline font-medium hover:text-brand-accent"
              >
                {t('common.cancel', 'Cancelar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  );
}
