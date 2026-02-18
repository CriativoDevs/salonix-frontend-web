import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import Card from '../components/ui/Card';
import Label from '../components/ui/Label';
import PaginationControls from '../components/ui/PaginationControls';
import { useTenant } from '../hooks/useTenant';
import { parseApiError } from '../utils/apiError';
import { fetchProfessionals } from '../api/professionals';
import { fetchServices } from '../api/services';
import { fetchSlotsWithMeta } from '../api/slots';
import { AGENDA_VIEWS } from '../constants/scheduling';

function Agenda() {
  const { t } = useTranslation();
  const { slug } = useTenant();

  const [view, setView] = useState(AGENDA_VIEWS.day);
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [slotsPayload, setSlotsPayload] = useState({ results: [], meta: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([fetchProfessionals(slug), fetchServices(slug)])
      .then(([profs, svcs]) => {
        if (cancelled) return;
        setProfessionals(Array.isArray(profs) ? profs : []);
        setServices(Array.isArray(svcs) ? svcs : []);
        if (Array.isArray(profs) && profs.length) {
          setSelectedProfessional((prev) => prev || String(profs[0].id));
        }
      })
      .catch((e) => !cancelled && setError(parseApiError(e, t('common.load_error'))));
    return () => { cancelled = true; };
  }, [slug, t]);

  const loadSlots = useCallback(async () => {
    if (!selectedProfessional) {
      setSlotsPayload({ results: [], meta: {} });
      setTotalCount(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchSlotsWithMeta({ professionalId: selectedProfessional, slug, params: { limit, offset, ordering: '-start_time' } });
      const list = Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload) ? payload : []);
      setSlotsPayload({ results: list, meta: payload?.meta || {} });
      const tc = payload?.meta?.totalCount ?? payload?.count ?? list.length;
      setTotalCount(tc || 0);
    } catch (e) {
      setError(parseApiError(e, t('common.load_error')));
    } finally {
      setLoading(false);
    }
  }, [selectedProfessional, slug, t, limit, offset]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const daySlots = useMemo(() => {
    const list = Array.isArray(slotsPayload.results) ? slotsPayload.results : [];
    if (!selectedDate) return list;
    return list.filter((s) => s.start_time?.slice(0, 10) === selectedDate);
  }, [slotsPayload, selectedDate]);

  const fmtTime = (s) => {
    if (!s) return '';
    const raw = s.includes('T') ? s : s.replace(' ', 'T');
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <FullPageLayout>
      <Card className="p-6 text-brand-surfaceForeground">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">{t('agenda.title', 'Agenda')}</h1>
          <div className="flex gap-2">
            <button
              type="button"
              className={`px-3 py-1 rounded ${view === AGENDA_VIEWS.day ? 'bg-brand-primary text-brand-on-primary' : 'border border-brand-border'}`}
              onClick={() => setView(AGENDA_VIEWS.day)}
            >
              Dia
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded ${view === AGENDA_VIEWS.week ? 'bg-brand-primary text-brand-on-primary' : 'border border-brand-border'}`}
              onClick={() => setView(AGENDA_VIEWS.week)}
              disabled
              title="Em breve"
            >
              Semana
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <Label className="mb-1 block">Profissional</Label>
            <select
              value={selectedProfessional}
              onChange={(e) => { setSelectedProfessional(e.target.value); setOffset(0); }}
              className="w-full"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.375rem',
                padding: '0.5rem 0.75rem',
                colorScheme: 'light dark'
              }}
            >
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-1 block">Serviço</Label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.375rem',
                padding: '0.5rem 0.75rem',
                colorScheme: 'light dark'
              }}
            >
              <option value="">Todos</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-1 block">Data</Label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.375rem',
                padding: '0.5rem 0.75rem',
                colorScheme: 'light dark'
              }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600">{error?.message || String(error)}</div>
        )}

        <div className="mb-4">
          <PaginationControls
            limit={limit}
            onLimitChange={setLimit}
            offset={offset}
            onOffsetChange={setOffset}
            totalCount={totalCount}
            loading={loading}
          />
        </div>

        {view === AGENDA_VIEWS.day && (
          <div className="space-y-3">
            {daySlots.length === 0 && (
              <div className="text-sm text-brand-surfaceForeground/70">Sem slots para a data selecionada.</div>
            )}
            {daySlots.map((slot) => (
              <div key={slot.id} className="grid grid-cols-12 gap-2 items-center border border-brand-border rounded p-3">
                <div className="col-span-3 font-medium">{fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}</div>
                <div className="col-span-6 text-sm text-brand-surfaceForeground/70">{slot.note || '—'}</div>
                <div className="col-span-3 text-right text-xs text-brand-surfaceForeground/50">#{slot.id}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </FullPageLayout>
  );
}

export default Agenda;