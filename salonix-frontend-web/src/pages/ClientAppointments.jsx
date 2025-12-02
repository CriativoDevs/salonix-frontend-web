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

function AppointmentRow({ item, onCancel }) {
  const start = item?.slot?.start_time;
  const serviceName = item?.service?.name || 'Serviço';
  const professionalName = item?.professional?.name || 'Profissional';
  const canCancel = item?.status === 'scheduled';
  const icsHref = `${API_BASE_URL}public/appointments/${item?.id}/ics/`;
  return (
    <tr className="border-b">
      <td className="px-3 py-2">
        {(() => {
          const dt = parseSlotDate(start);
          return dt
            ? `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : '—';
        })()}
      </td>
      <td className="px-3 py-2">{serviceName}</td>
      <td className="px-3 py-2">{professionalName}</td>
      <td className="px-3 py-2">
        <div className="flex gap-2">
          <a
            href={icsHref}
            target="_blank"
            rel="noreferrer"
            className="btn-link text-xs"
          >
            Adicionar ao calendário
          </a>
          {canCancel && (
            <FormButton
              type="button"
              variant="link"
              onClick={() => onCancel(item)}
            >
              Cancelar
            </FormButton>
          )}
        </div>
      </td>
    </tr>
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
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-semibold mb-2">{t('Próximos')}</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t('Nenhum agendamento futuro.')}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="px-3 py-2">{t('Data/Hora')}</th>
                    <th className="px-3 py-2">{t('Serviço')}</th>
                    <th className="px-3 py-2">{t('Profissional')}</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((item) => (
                    <AppointmentRow
                      key={item.id}
                      item={item}
                      onCancel={onCancel}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div>
            <h2 className="font-semibold mb-2">{t('Histórico')}</h2>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t('Nenhum histórico disponível.')}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="px-3 py-2">{t('Data/Hora')}</th>
                    <th className="px-3 py-2">{t('Serviço')}</th>
                    <th className="px-3 py-2">{t('Profissional')}</th>
                    <th className="px-3 py-2">{t('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="px-3 py-2">
                        {(() => {
                          const dt = parseSlotDate(item?.slot?.start_time);
                          return dt
                            ? `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : '—';
                        })()}
                      </td>
                      <td className="px-3 py-2">
                        {item?.service?.name || 'Serviço'}
                      </td>
                      <td className="px-3 py-2">
                        {item?.professional?.name || 'Profissional'}
                      </td>
                      <td className="px-3 py-2">{item?.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600 mt-4">{error.message}</p>}
      {actionError && (
        <p className="text-sm text-red-600 mt-2">{actionError.message}</p>
      )}
    </ClientLayout>
  );
}
