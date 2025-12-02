import { useEffect, useState } from 'react';
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
  const start = item?.slot?.start_time;
  const end = item?.slot?.end_time;
  const serviceName = item?.service?.name || 'Serviço';
  const professionalName = item?.professional?.name || 'Profissional';
  const canCancel = item?.status === 'scheduled';
  const icsHref = `${API_BASE_URL}public/appointments/${item?.id}/ics/`;

  const dtStart = parseSlotDate(start);
  const dtEnd = parseSlotDate(end);
  const dateLabel = dtStart
    ? `${dtStart.toLocaleDateString()} ${dtStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '—';
  const timeRange = dtEnd
    ? `${dtStart?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${dtEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : null;

  const label = `Agendamento: ${serviceName} com ${professionalName} • ${dateLabel}`;

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
          href={icsHref}
          target="_blank"
          rel="noreferrer"
          className="text-brand-primary hover:text-brand-accent underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
          aria-label={`Adicionar ao calendário: ${serviceName} com ${professionalName} em ${dateLabel}`}
          title="Adicionar ao calendário (atalho: A)"
          data-action="calendar"
        >
          Adicionar ao calendário
        </a>
        {canCancel && (
          <FormButton
            type="button"
            variant="link"
            onClick={() => onCancel(item)}
            aria-label={`Cancelar: ${serviceName} com ${professionalName} em ${dateLabel}`}
            aria-keyshortcuts="C"
            className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            title="Cancelar agendamento (atalho: C)"
          >
            Cancelar
          </FormButton>
        )}
      </div>

      {/* Dica de atalhos (desktop) */}
      <div className="mt-2 text-xs text-brand-surfaceForeground/60 hidden sm:block">
        Dica: A abre calendário; C cancela.
      </div>

      {/* Ações (mobile) */}
      <div className="mt-3 flex sm:hidden flex-col gap-2 items-center">
        <a
          href={icsHref}
          target="_blank"
          rel="noreferrer"
          className="self-center rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-surfaceForeground transition hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label={`Adicionar ao calendário: ${serviceName} com ${professionalName} em ${dateLabel}`}
          title="Adicionar ao calendário"
          data-action="calendar"
        >
          Adicionar ao calendário
        </a>
        {canCancel && (
          <FormButton
            type="button"
            variant="link"
            onClick={() => onCancel(item)}
            aria-label={`Cancelar: ${serviceName} com ${professionalName} em ${dateLabel}`}
            className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-surfaceForeground"
            title="Cancelar agendamento"
          >
            Cancelar
          </FormButton>
        )}
      </div>
    </div>
  );
}

function HistoryCard({ item }) {
  const start = item?.slot?.start_time;
  const end = item?.slot?.end_time;
  const serviceName = item?.service?.name || 'Serviço';
  const professionalName = item?.professional?.name || 'Profissional';
  const icsHref = `${API_BASE_URL}public/appointments/${item?.id}/ics/`;

  const dtStart = parseSlotDate(start);
  const dtEnd = parseSlotDate(end);
  const dateLabel = dtStart
    ? `${dtStart.toLocaleDateString()} ${dtStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '—';
  const timeRange = dtEnd
    ? `${dtStart?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${dtEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : null;

  const label = `Histórico: ${serviceName} com ${professionalName} • ${dateLabel}`;

  const handleKeyDown = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const key = e.key.toLowerCase();
    if (key === 'a') {
      e.preventDefault();
      const link = e.currentTarget.querySelector('a[data-action="calendar"]');
      if (link) link.click();
    }
  };

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
            {item?.status}
          </div>
        </div>
      </div>
      <div className="mt-3 hidden sm:flex items-center justify-end gap-3">
        <a
          href={icsHref}
          target="_blank"
          rel="noreferrer"
          className="text-brand-primary hover:text-brand-accent underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
          aria-label={`Adicionar ao calendário: ${serviceName} com ${professionalName} em ${dateLabel}`}
          title="Adicionar ao calendário (atalho: A)"
          data-action="calendar"
        >
          Adicionar ao calendário
        </a>
      </div>
      <div className="mt-2 text-xs text-brand-surfaceForeground/60 hidden sm:block">
        Dica: A abre calendário.
      </div>
      <div className="mt-3 flex sm:hidden flex-col gap-2 items-center">
        <a
          href={icsHref}
          target="_blank"
          rel="noreferrer"
          className="self-center rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-surfaceForeground transition hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label={`Adicionar ao calendário: ${serviceName} com ${professionalName} em ${dateLabel}`}
          title="Adicionar ao calendário"
          data-action="calendar"
        >
          Adicionar ao calendário
        </a>
      </div>
    </div>
  );
}

export default function ClientAppointments() {
  const { t } = useTranslation();
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
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
          setUpcoming(u);
          setHistory(h);
        }
      } catch {
        if (!cancelled)
          setError({ message: t('Falha ao carregar agendamentos.') });
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
      setActionError({ message: t('Não foi possível cancelar.') });
    }
  };

  return (
    <ClientLayout>
      <PageHeader title={t('Agendamentos')} />
      {loading ? (
        <p className="text-sm text-gray-500">{t('Carregando…')}</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
          <div>
            <h2 className="font-semibold mb-2">{t('Próximos')}</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t('Nenhum agendamento futuro.')}
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
              </div>
            )}
          </div>
          <div>
            <h2 className="font-semibold mb-2">{t('Histórico')}</h2>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t('Nenhum histórico disponível.')}
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <HistoryCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
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
