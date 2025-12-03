import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ClientLayout from '../layouts/ClientLayout';
import PageHeader from '../components/ui/PageHeader';
import {
  fetchClientUpcoming,
  fetchClientHistory,
  cancelClientAppointment,
} from '../api/clientMe';
import { API_BASE_URL } from '../api/client';
import { getAppointmentStatusBadge } from '../utils/badgeStyles';

export default function ClientDashboard() {
  const { t } = useTranslation();
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const next = upcoming?.[0] || null;

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
        if (!cancelled) setError({ message: t('Falha ao carregar dados.') });
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
      const h = await fetchClientHistory();
      setUpcoming(u);
      setHistory(h);
    } catch {
      setError({ message: t('Não foi possível cancelar.') });
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

  return (
    <ClientLayout>
      <PageHeader title={t('Área do Cliente')} />

      <div className="mt-2 flex flex-wrap gap-4">
        <NavLink
          to="/client/agendar"
          className="text-brand-primary underline font-medium transition hover:text-brand-accent"
        >
          {t('Novo agendamento')}
        </NavLink>
        <NavLink
          to="/client/appointments"
          className="text-brand-primary underline font-medium transition hover:text-brand-accent"
        >
          {t('Meus agendamentos')}
        </NavLink>
        <NavLink
          to="/client/profile"
          className="text-brand-primary underline font-medium transition hover:text-brand-accent"
        >
          {t('Atualizar perfil')}
        </NavLink>
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-brand-surfaceForeground/70">
          {t('Carregando…')}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6">
          <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
            <h2 className="text-lg font-medium text-brand-surfaceForeground">
              {t('Próximo agendamento')}
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
                    href={`${API_BASE_URL}public/appointments/${next?.id}/ics/`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-primary hover:text-brand-accent underline underline-offset-4"
                  >
                    {t('Adicionar ao calendário')}
                  </a>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="text-brand-primary underline font-medium hover:text-brand-accent"
                  >
                    {t('Cancelar')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-brand-surfaceForeground/70">
                {t('Sem agendamentos futuros.')}{' '}
                {t('Crie seu primeiro agendamento.')}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
            <h2 className="text-lg font-medium text-brand-surfaceForeground">
              {t('Histórico recente')}
            </h2>
            {history && history.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {history.slice(0, 3).map((h) => (
                  <li key={h.id} className="text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{h?.service?.name}</div>
                        <div className="text-brand-surfaceForeground/70">
                          {h?.professional?.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div>{fmt(h?.slot?.start_time)}</div>
                        <div
                          className={getAppointmentStatusBadge(h?.status)}
                          style={{ display: 'inline-block', marginTop: 6 }}
                        >
                          {h?.status}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-end">
                      <a
                        href={`${API_BASE_URL}public/appointments/${h?.id}/ics/`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-primary hover:text-brand-accent underline underline-offset-4"
                      >
                        {t('Adicionar ao calendário')}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 text-sm text-brand-surfaceForeground/70">
                {t('Sem histórico ainda.')}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error.message}
        </p>
      )}
    </ClientLayout>
  );
}
