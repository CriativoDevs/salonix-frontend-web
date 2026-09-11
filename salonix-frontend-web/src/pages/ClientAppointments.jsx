import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ClientLayout from '../layouts/ClientLayout';
import PageHeader from '../components/ui/PageHeader';
import FormButton from '../components/ui/FormButton';
import {
  fetchClientUpcoming,
  fetchClientHistory,
  cancelClientAppointment,
} from '../api/clientMe';
import { API_BASE_URL } from '../api/client';
import { getAppointmentStatusBadge } from '../utils/badgeStyles';
import { downloadICSSecure } from '../utils/icsDownload';

function parseSlotDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }
  if (typeof raw === 'number') {
    const numericDate = new Date(raw);
    return Number.isNaN(numericDate.getTime()) ? null : numericDate;
  }
  if (typeof raw === 'string') {
    const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    const fallback = new Date(raw);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  try {
    const candidate = new Date(raw);
    return Number.isNaN(candidate.getTime()) ? null : candidate;
  } catch {
    return null;
  }
}

function AppointmentCard({ item, onCancel }) {
  const { t } = useTranslation();
  const start = item?.slot?.start_time;
  const end = item?.slot?.end_time;
  const serviceName =
    item?.service?.name ||
    t('client_appointments.card.default_service', 'Serviço');
  const professionalName =
    item?.professional?.name ||
    t('client_appointments.card.default_professional', 'Profissional');
  const canCancel = item?.status === 'scheduled';

  // Usar token fornecido pela API para gerar URL do ICS público
  const icsToken = item?.ics_token || '';

  const handleDownloadICS = async (e) => {
    e.preventDefault();
    if (!icsToken) return;

    const filename = `agendamento_${serviceName.replace(/\s+/g, '_')}_${item?.id}.ics`;
    try {
      await downloadICSSecure(API_BASE_URL, item?.id, icsToken, filename);
    } catch (error) {
      console.error('Failed to download ICS file:', error);
    }
  };

  const dtStart = parseSlotDate(start);
  const dtEnd = parseSlotDate(end);
  const dateLabel = dtStart
    ? `${dtStart.toLocaleDateString()} ${dtStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '—';
  const timeRange = dtEnd
    ? `${dtStart?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${dtEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : null;

  const label = t(
    'client_appointments.card.appointment_label',
    'Agendamento: {{service}} com {{professional}} • {{date}}',
    { service: serviceName, professional: professionalName, date: dateLabel }
  );

  const handleKeyDown = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const key = e.key.toLowerCase();
    if (key === 'a') {
      e.preventDefault();
      const link = e.currentTarget.querySelector('a[data-action="calendar"]');
      if (link) link.click();
    } else if (key === 'c' && canCancel) {
      e.preventDefault();
      onCancel(item);
    }
  };

  const addToCalendarLabel = t(
    'client_appointments.card.add_to_calendar_aria',
    'Adicionar ao calendário: {{service}} com {{professional}} em {{date}}',
    { service: serviceName, professional: professionalName, date: dateLabel }
  );
  const cancelLabel = t(
    'client_appointments.card.cancel_aria',
    'Cancelar: {{service}} com {{professional}} em {{date}}',
    { service: serviceName, professional: professionalName, date: dateLabel }
  );

  return (
    <div
      className="rounded-lg border border-brand-border bg-brand-surface p-3 text-sm"
      role="group"
      aria-label={label}
      aria-keyshortcuts={canCancel ? 'A, C' : 'A'}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{serviceName}</div>
          <div className="text-brand-surfaceForeground/70">
            {professionalName}
          </div>
        </div>
        <div className="text-right">
          <div>{dateLabel}</div>
          {timeRange && (
            <div className="text-brand-surfaceForeground/70">{timeRange}</div>
          )}
        </div>
      </div>
      {/* Ações (desktop) */}
      <div className="mt-3 hidden sm:flex items-center justify-end gap-3">
        <a
          href="#"
          onClick={handleDownloadICS}
          rel="noreferrer"
          className="text-brand-primary hover:text-brand-accent underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary cursor-pointer"
          aria-label={addToCalendarLabel}
          title={t(
            'client_appointments.card.add_to_calendar_title_shortcut',
            'Adicionar ao calendário (atalho: A)'
          )}
          data-action="calendar"
        >
          {t(
            'client_appointments.card.add_to_calendar',
            'Adicionar ao calendário'
          )}
        </a>
        {canCancel && (
          <FormButton
            type="button"
            variant="link"
            onClick={() => onCancel(item)}
            aria-label={cancelLabel}
            aria-keyshortcuts="C"
            className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            title={t(
              'client_appointments.card.cancel_title_shortcut',
              'Cancelar agendamento (atalho: C)'
            )}
          >
            {t('client_appointments.card.cancel', 'Cancelar')}
          </FormButton>
        )}
      </div>

      {/* Dica de atalhos (desktop) */}
      <div className="mt-2 text-xs text-brand-surfaceForeground/60 hidden sm:block">
        {t(
          'client_appointments.card.shortcut_hint_both',
          'Dica: A abre calendário; C cancela.'
        )}
      </div>

      {/* Ações (mobile) */}
      <div className="mt-3 flex sm:hidden flex-col gap-2 items-center">
        <a
          href="#"
          onClick={handleDownloadICS}
          rel="noreferrer"
          className="self-center rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-surfaceForeground transition hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
          aria-label={addToCalendarLabel}
          title={t(
            'client_appointments.card.add_to_calendar',
            'Adicionar ao calendário'
          )}
          data-action="calendar"
        >
          {t(
            'client_appointments.card.add_to_calendar',
            'Adicionar ao calendário'
          )}
        </a>
        {canCancel && (
          <FormButton
            type="button"
            variant="link"
            onClick={() => onCancel(item)}
            aria-label={cancelLabel}
            className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-surfaceForeground"
            title={t(
              'client_appointments.card.cancel_title',
              'Cancelar agendamento'
            )}
          >
            {t('client_appointments.card.cancel', 'Cancelar')}
          </FormButton>
        )}
      </div>
    </div>
  );
}

function HistoryCard({ item }) {
  const { t } = useTranslation();
  const start = item?.slot?.start_time;
  const end = item?.slot?.end_time;
  const serviceName =
    item?.service?.name ||
    t('client_appointments.card.default_service', 'Serviço');
  const professionalName =
    item?.professional?.name ||
    t('client_appointments.card.default_professional', 'Profissional');

  // Usar token fornecido pela API para gerar URL do ICS público
  const icsToken = item?.ics_token || '';

  const handleDownloadICS = async (e) => {
    e.preventDefault();
    if (!icsToken) return;

    const filename = `agendamento_${serviceName.replace(/\s+/g, '_')}_${item?.id}.ics`;
    try {
      await downloadICSSecure(API_BASE_URL, item?.id, icsToken, filename);
    } catch (error) {
      console.error('Failed to download ICS file:', error);
    }
  };

  const dtStart = parseSlotDate(start);
  const dtEnd = parseSlotDate(end);
  const dateLabel = dtStart
    ? `${dtStart.toLocaleDateString()} ${dtStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '—';
  const timeRange = dtEnd
    ? `${dtStart?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${dtEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : null;

  const label = t(
    'client_appointments.card.history_label',
    'Histórico: {{service}} com {{professional}} • {{date}}',
    { service: serviceName, professional: professionalName, date: dateLabel }
  );

  const handleKeyDown = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const key = e.key.toLowerCase();
    if (key === 'a') {
      e.preventDefault();
      const link = e.currentTarget.querySelector('a[data-action="calendar"]');
      if (link) link.click();
    }
  };

  const addToCalendarLabel = t(
    'client_appointments.card.add_to_calendar_aria',
    'Adicionar ao calendário: {{service}} com {{professional}} em {{date}}',
    { service: serviceName, professional: professionalName, date: dateLabel }
  );

  return (
    <div
      className="rounded-lg border border-brand-border bg-brand-surface p-3 text-sm"
      role="group"
      aria-label={label}
      aria-keyshortcuts="A"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{serviceName}</div>
          <div className="text-brand-surfaceForeground/70">
            {professionalName}
          </div>
        </div>
        <div className="text-right">
          <div>{dateLabel}</div>
          {timeRange && (
            <div className="text-brand-surfaceForeground/70">{timeRange}</div>
          )}
          <div
            className={getAppointmentStatusBadge(item?.status)}
            style={{ display: 'inline-block', marginTop: '6px' }}
          >
            {t(`bookings.statuses.${item?.status}`, item?.status)}
          </div>
        </div>
      </div>
      <div className="mt-3 hidden sm:flex items-center justify-end gap-3">
        <a
          href="#"
          onClick={handleDownloadICS}
          rel="noreferrer"
          className="text-brand-primary hover:text-brand-accent underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary cursor-pointer"
          aria-label={addToCalendarLabel}
          title={t(
            'client_appointments.card.add_to_calendar_title_shortcut',
            'Adicionar ao calendário (atalho: A)'
          )}
          data-action="calendar"
        >
          {t(
            'client_appointments.card.add_to_calendar',
            'Adicionar ao calendário'
          )}
        </a>
      </div>
      <div className="mt-2 text-xs text-brand-surfaceForeground/60 hidden sm:block">
        {t(
          'client_appointments.card.shortcut_hint_calendar_only',
          'Dica: A abre calendário.'
        )}
      </div>
      <div className="mt-3 flex sm:hidden flex-col gap-2 items-center">
        <a
          href="#"
          onClick={handleDownloadICS}
          rel="noreferrer"
          className="self-center rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-surfaceForeground transition hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
          aria-label={addToCalendarLabel}
          title={t(
            'client_appointments.card.add_to_calendar',
            'Adicionar ao calendário'
          )}
          data-action="calendar"
        >
          {t(
            'client_appointments.card.add_to_calendar',
            'Adicionar ao calendário'
          )}
        </a>
      </div>
    </div>
  );
}

export default function ClientAppointments() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [upcomingHasMore, setUpcomingHasMore] = useState(false);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [loadingMoreUpcoming, setLoadingMoreUpcoming] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [u, h] = await Promise.all([
          fetchClientUpcoming(),
          fetchClientHistory(),
        ]);
        if (!cancelled) {
          setUpcoming(u.results);
          setHistory(h.results);
          setUpcomingHasMore(u.hasMore);
          setHistoryHasMore(h.hasMore);
        }
      } catch {
        if (!cancelled)
          setError({
            message: t(
              'client_appointments.errors.load_failed',
              'Falha ao carregar agendamentos.'
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

  const onCancel = async (item) => {
    setActionError(null);
    try {
      await cancelClientAppointment(item.id);
      setUpcoming((prev) => prev.filter((x) => x.id !== item.id));
      setHistory((prev) => [{ ...item, status: 'cancelled' }, ...prev]);
    } catch {
      setActionError({
        message: t(
          'client_appointments.errors.cancel_failed',
          'Não foi possível cancelar.'
        ),
      });
    }
  };

  const onLoadMoreUpcoming = async () => {
    setLoadingMoreUpcoming(true);
    setError(null);
    try {
      const { results, hasMore } = await fetchClientUpcoming({
        offset: upcoming.length,
      });
      setUpcoming((prev) => [...prev, ...results]);
      setUpcomingHasMore(hasMore);
    } catch {
      setError({
        message: t(
          'client_appointments.errors.load_failed',
          'Falha ao carregar agendamentos.'
        ),
      });
    } finally {
      setLoadingMoreUpcoming(false);
    }
  };

  const onLoadMoreHistory = async () => {
    setLoadingMoreHistory(true);
    setError(null);
    try {
      const { results, hasMore } = await fetchClientHistory({
        offset: history.length,
      });
      setHistory((prev) => [...prev, ...results]);
      setHistoryHasMore(hasMore);
    } catch {
      setError({
        message: t(
          'client_appointments.errors.load_failed',
          'Falha ao carregar agendamentos.'
        ),
      });
    } finally {
      setLoadingMoreHistory(false);
    }
  };

  return (
    <ClientLayout>
      <PageHeader title={t('client_appointments.title', 'Agendamentos')} />
      <div className="mt-4 flex items-center justify-end">
        <NavLink
          to="/client/agendar"
          className="text-brand-primary underline font-medium transition hover:text-brand-accent"
        >
          {t('client_appointments.new_booking', 'Novo agendamento')}
        </NavLink>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">
          {t('client_appointments.loading', 'Carregando…')}
        </p>
      ) : (
        <div className="mt-6 pb-24">
          <div className="border-b border-brand-border">
            <nav className="-mb-px flex space-x-6" role="tablist">
              <button
                type="button"
                role="tab"
                id="tab-upcoming"
                aria-selected={activeTab === 'upcoming'}
                aria-controls="panel-upcoming"
                onClick={() => setActiveTab('upcoming')}
                className={`shrink-0 border-b-2 px-1 py-2 text-sm font-medium transition ${
                  activeTab === 'upcoming'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-brand-surfaceForeground/70 hover:text-brand-surfaceForeground hover:border-brand-surfaceForeground/30'
                }`}
              >
                {t('client_appointments.upcoming', 'Próximos')}
                {upcoming.length > 0 && (
                  <span className="ml-1.5 text-xs text-brand-surfaceForeground/50">
                    ({upcoming.length}
                    {upcomingHasMore ? '+' : ''})
                  </span>
                )}
              </button>
              <button
                type="button"
                role="tab"
                id="tab-history"
                aria-selected={activeTab === 'history'}
                aria-controls="panel-history"
                onClick={() => setActiveTab('history')}
                className={`shrink-0 border-b-2 px-1 py-2 text-sm font-medium transition ${
                  activeTab === 'history'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-brand-surfaceForeground/70 hover:text-brand-surfaceForeground hover:border-brand-surfaceForeground/30'
                }`}
              >
                {t('client_appointments.history', 'Histórico')}
                {history.length > 0 && (
                  <span className="ml-1.5 text-xs text-brand-surfaceForeground/50">
                    ({history.length}
                    {historyHasMore ? '+' : ''})
                  </span>
                )}
              </button>
            </nav>
          </div>

          {activeTab === 'upcoming' && (
            <div
              id="panel-upcoming"
              role="tabpanel"
              aria-labelledby="tab-upcoming"
              className="mt-4"
            >
              {upcoming.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {t(
                    'client_appointments.no_upcoming',
                    'Nenhum agendamento futuro.'
                  )}
                </p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((item) => (
                    <AppointmentCard
                      key={item.id}
                      item={item}
                      onCancel={onCancel}
                    />
                  ))}
                  {upcomingHasMore && (
                    <FormButton
                      type="button"
                      variant="link"
                      onClick={onLoadMoreUpcoming}
                      disabled={loadingMoreUpcoming}
                    >
                      {loadingMoreUpcoming
                        ? t('client_appointments.loading', 'Carregando…')
                        : t('client_appointments.load_more', 'Carregar mais')}
                    </FormButton>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div
              id="panel-history"
              role="tabpanel"
              aria-labelledby="tab-history"
              className="mt-4"
            >
              {history.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {t(
                    'client_appointments.no_history',
                    'Nenhum histórico disponível.'
                  )}
                </p>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <HistoryCard key={item.id} item={item} />
                  ))}
                  {historyHasMore && (
                    <FormButton
                      type="button"
                      variant="link"
                      onClick={onLoadMoreHistory}
                      disabled={loadingMoreHistory}
                    >
                      {loadingMoreHistory
                        ? t('client_appointments.loading', 'Carregando…')
                        : t('client_appointments.load_more', 'Carregar mais')}
                    </FormButton>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 mt-4" role="alert">
          {error.message}
        </p>
      )}
      {actionError && (
        <p className="text-sm text-red-600 mt-2" role="alert">
          {actionError.message}
        </p>
      )}
    </ClientLayout>
  );
}
