import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import FullPageLayout from '../layouts/FullPageLayout';
import Card from '../components/ui/Card';
import Label from '../components/ui/Label';
import Dropdown from '../components/ui/Dropdown';
import { fetchProfessionals } from '../api/professionals';
import { fetchSlotsWithMeta, createSlot, deleteSlot } from '../api/slots';
import { useTenant } from '../hooks/useTenant';
import { parseApiError } from '../utils/apiError';
import PaginationControls from '../components/ui/PaginationControls';

function AvailableSlots() {
  const { t } = useTranslation();
  const { slug } = useTenant();
  const [professionals, setProfessionals] = useState([]);
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [slotItems, setSlotItems] = useState([]);

  // Memoize professional items for Dropdown
  const professionalItems = useMemo(() => {
    return professionals.map((p) => ({
      label: p.name,
      onClick: () => setSelectedProfessional(String(p.id)),
    }));
  }, [professionals]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    date: '',
    sh: '09',
    sm: '00',
    eh: '10',
    em: '00',
  });
  const [busyId, setBusyId] = useState(null);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sortOption, setSortOption] = useState('-start_time');

  // Inicializar estado a partir da URL
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const l = parseInt(sp.get('limit') || '', 10);
      const o = parseInt(sp.get('offset') || '', 10);
      const ord = sp.get('ordering') || '';
      if (!Number.isNaN(l) && l > 0) setLimit(l);
      if (!Number.isNaN(o) && o >= 0) setOffset(o);
      if (ord) setSortOption(ord);
    } catch {
      // ignore URL parse errors
    }
  }, []);

  // Sincronizar mudanças com a URL
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      sp.set('limit', String(limit));
      sp.set('offset', String(offset));
      sp.set('ordering', sortOption);
      const newUrl = `${window.location.pathname}?${sp.toString()}`;
      window.history.replaceState({}, '', newUrl);
    } catch {
      // ignore
    }
  }, [limit, offset, sortOption]);

  useEffect(() => {
    let cancelled = false;
    fetchProfessionals(slug)
      .then((data) => {
        if (cancelled) return;
        setProfessionals(data);
        if (data?.length) {
          setSelectedProfessional((prev) => prev || String(data[0].id));
        }
      })
      .catch(
        (e) => !cancelled && setError(parseApiError(e, t('common.load_error')))
      );
    return () => {
      cancelled = true;
    };
  }, [slug, t]);

  const loadSlots = useCallback(async () => {
    if (!selectedProfessional) {
      setSlotItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchSlotsWithMeta({
        professionalId: selectedProfessional,
        slug,
        params: { limit, offset, ordering: sortOption },
      });
      const list = Array.isArray(payload?.results)
        ? payload.results
        : Array.isArray(payload)
          ? payload
          : [];
      setSlotItems(list);
      const tc = payload?.meta?.totalCount ?? payload?.count ?? list.length;
      setTotalCount(tc || 0);
    } catch (e) {
      setError(parseApiError(e, t('common.load_error')));
    } finally {
      setLoading(false);
    }
  }, [selectedProfessional, slug, t, limit, offset, sortOption]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const dates = useMemo(() => {
    const set = new Set(
      slotItems.map((s) => (s.start_time ? s.start_time.slice(0, 10) : ''))
    );
    return Array.from(set).filter(Boolean).sort();
  }, [slotItems]);

  const filteredSlots = useMemo(() => {
    if (!selectedDate) return slotItems;
    return slotItems.filter((s) => s.start_time?.startsWith(selectedDate));
  }, [slotItems, selectedDate]);

  const pad2 = (n) => String(n).padStart(2, '0');
  // Backend envia "YYYY-MM-DD HH:MM" (sem timezone). Vamos formatar sem segundos.
  const parseBackendDate = (s) => {
    if (!s) return null;
    // Formatos aceitos: 'YYYY-MM-DD HH:MM' ou 'YYYY-MM-DD HH:MM:SS'
    const m = /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(s);
    if (!m) return null;
    const [, Y, M, D, h, mnt, sec = '0'] = m;
    return new Date(
      Number(Y),
      Number(M) - 1,
      Number(D),
      Number(h),
      Number(mnt),
      Number(sec),
      0
    );
  };

  const fmtDate = (d) =>
    `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
  const fmtTime = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const formatDateOnly = (startStr) => {
    const sd = parseBackendDate(startStr);
    return sd ? fmtDate(sd) : startStr;
  };

  const formatTimeRangeOnly = (startStr, endStr) => {
    const sd = parseBackendDate(startStr);
    const ed = parseBackendDate(endStr);
    if (!sd || !ed) return '';
    return `${fmtTime(sd)}–${fmtTime(ed)}`;
  };

  const MINUTE_STEP = 15; // ajuste fácil para 5 ou 15
  const minuteOptions = useMemo(() => {
    const arr = [];
    for (let m = 0; m < 60; m += MINUTE_STEP) arr.push(m);
    return arr;
  }, []);

  const composeISO = (dateStr, hourStr, minuteStr) => {
    if (!dateStr) return '';
    const [y, mo, d] = dateStr.split('-').map((x) => parseInt(x, 10));
    const h = parseInt(hourStr || '0', 10);
    const mi = parseInt(minuteStr || '0', 10);
    if (!y || !mo || !d) return '';
    const dt = new Date(y, mo - 1, d, h, mi, 0, 0);
    return dt.toISOString();
  };

  const handleCreate = async (e) => {
    e?.preventDefault?.();
    if (!selectedProfessional || !form.date) {
      setError({
        message: t(
          'common.validation_error',
          'Preencha profissional e horários.'
        ),
      });
      return;
    }
    const startISO = composeISO(form.date, form.sh, form.sm);
    const endISO = composeISO(form.date, form.eh, form.em);
    if (!startISO || !endISO || new Date(endISO) <= new Date(startISO)) {
      setError({
        message: t('common.validation_error', 'Horários inválidos.'),
      });
      return;
    }
    try {
      setCreating(true);
      const created = await createSlot({
        professionalId: selectedProfessional,
        startTime: startISO,
        endTime: endISO,
        slug,
      });
      await loadSlots();
      setForm({
        date: created.start_time.slice(0, 10),
        sh: '09',
        sm: '00',
        eh: '10',
        em: '00',
      });
      // Atualiza lista por profissional/data
      setSelectedDate(created.start_time.slice(0, 10));
    } catch (e2) {
      setError(
        parseApiError(e2, t('common.save_error', 'Falha ao criar slot.'))
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (slot) => {
    const msg = `${formatDateOnly(slot.start_time)} — ${formatTimeRangeOnly(slot.start_time, slot.end_time)}`;
    if (
      !window.confirm(
        t('common.confirm_delete', 'Confirmar exclusão?') + `\n${msg}`
      )
    )
      return;
    try {
      setBusyId(slot.id);
      const ok = await deleteSlot(slot.id, { slug });
      if (ok) await loadSlots();
    } catch (e2) {
      setError(
        parseApiError(e2, t('common.delete_error', 'Falha ao excluir slot.'))
      );
      await loadSlots();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <FullPageLayout>
      <Card className="p-6 text-brand-surfaceForeground">
        <h1 className="mb-4 text-2xl font-semibold text-brand-surfaceForeground">
          {t('slots.title')}
        </h1>

        <div className="mb-4 form-light">
          <Label className="mb-1 block">
            {t('slots.professional', 'Profissional')}
          </Label>
          <Dropdown
            trigger={
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <span className="truncate">
                  {selectedProfessional
                    ? professionals.find(
                        (p) => String(p.id) === selectedProfessional
                      )?.name || t('common.select', 'Selecione...')
                    : t('common.select', 'Selecione...')}
                </span>
                <ChevronDown
                  size={16}
                  className="text-brand-surfaceForeground/70"
                />
              </button>
            }
            items={professionalItems}
            searchable={true}
            searchPlaceholder={t('common.search', 'Pesquisar...')}
            className="w-full"
            align="left"
          />
        </div>

        <div className="mb-4 form-light">
          <Label className="mb-1 block">
            {t('slots.ordering', 'Ordenação')}
          </Label>
          <select
            value={sortOption}
            onChange={(e) => {
              setSortOption(e.target.value);
              setOffset(0);
            }}
            className="w-full"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.375rem',
              padding: '0.5rem 0.75rem',
              colorScheme: 'light dark',
            }}
          >
            <option
              value="-start_time"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            >
              {t('slots.order_newest', 'Mais recentes primeiro')}
            </option>
            <option
              value="start_time"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            >
              {t('slots.order_oldest', 'Data mais antiga primeiro')}
            </option>
          </select>
        </div>

        {/* Controles de paginação movidos para o rodapé */}

        <div className="mb-4 form-light">
          <Label className="mb-1 block">{t('slots.select_date')}</Label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.375rem',
              padding: '0.5rem 0.75rem',
              colorScheme: 'light dark',
            }}
          >
            <option
              value=""
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            >
              {t('common.all', 'Todas')}
            </option>
            {dates.map((date) => (
              <option
                key={date}
                value={date}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                {date}
              </option>
            ))}
          </select>
        </div>

        {/* Formulário de criação */}
        <form onSubmit={handleCreate} className="mb-4">
          <Label className="mb-1 block">
            {t('slots.slot_date', 'Data do slot')}
          </Label>
          {/* Linha única: Data + Início + Término + Botão no fim */}
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={form.date || selectedDate}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-44 md:w-56"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  colorScheme: 'light dark',
                }}
              />
            </div>
            <div>
              <Label className="mb-1 block md:mb-0">
                {t('slots.start_time', 'Início')}
              </Label>
              <div className="flex gap-2">
                <select
                  value={form.sh}
                  onChange={(e) => setForm({ ...form, sh: e.target.value })}
                  className="w-20 font-mono"
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    colorScheme: 'light dark',
                  }}
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option
                      key={h}
                      value={String(h).padStart(2, '0')}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {String(h).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <select
                  value={form.sm}
                  onChange={(e) => setForm({ ...form, sm: e.target.value })}
                  className="w-20 font-mono"
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    colorScheme: 'light dark',
                  }}
                >
                  {minuteOptions.map((m) => (
                    <option
                      key={m}
                      value={String(m).padStart(2, '0')}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label className="mb-1 block md:mb-0">
                {t('slots.end_time', 'Término')}
              </Label>
              <div className="flex gap-2">
                <select
                  value={form.eh}
                  onChange={(e) => setForm({ ...form, eh: e.target.value })}
                  className="w-20 font-mono"
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    colorScheme: 'light dark',
                  }}
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option
                      key={h}
                      value={String(h).padStart(2, '0')}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {String(h).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <select
                  value={form.em}
                  onChange={(e) => setForm({ ...form, em: e.target.value })}
                  className="w-20 font-mono"
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    colorScheme: 'light dark',
                  }}
                >
                  {minuteOptions.map((m) => (
                    <option
                      key={m}
                      value={String(m).padStart(2, '0')}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="md:ml-auto">
              <button
                type="submit"
                disabled={creating || !selectedProfessional}
                className="text-sm font-medium text-[#1D29CF] hover:underline disabled:opacity-50"
              >
                {t('slots.create_slot', 'Criar slot')}
              </button>
            </div>
          </div>
        </form>

        {loading && (
          <p className="text-sm text-gray-600">{t('common.loading')}</p>
        )}
        {error && <p className="text-sm text-red-600">{error.message}</p>}
        {!loading && !error && filteredSlots.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredSlots.map((slot) => (
              <li
                key={slot.id}
                className="rounded-lg bg-brand-surface px-3 py-2 text-center text-sm font-medium text-brand-surfaceForeground ring-1 ring-brand-border hover:bg-brand-light"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-left">
                    <div className="text-brand-surfaceForeground">
                      {formatDateOnly(slot.start_time)}
                    </div>
                    <div
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                      className="font-mono text-brand-surfaceForeground/80"
                    >
                      {formatTimeRangeOnly(slot.start_time, slot.end_time)}
                    </div>
                  </div>
                  <button
                    disabled={busyId === slot.id}
                    onClick={() => handleDelete(slot)}
                    className="text-sm font-medium text-[#CF3B1D] hover:underline disabled:opacity-50"
                  >
                    {t('common.delete', 'Excluir')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-700">{t('slots.no_slots')}</p>
        )}
        {!loading && !error && totalCount > 0 && (
          <PaginationControls
            totalCount={totalCount}
            limit={limit}
            offset={offset}
            onChangeLimit={(n) => {
              setLimit(n);
              setOffset(0);
            }}
            onPrev={() => setOffset((prev) => Math.max(0, prev - limit))}
            onNext={() =>
              setOffset((prev) =>
                prev + limit < totalCount ? prev + limit : prev
              )
            }
            className="mt-6"
          />
        )}
      </Card>
    </FullPageLayout>
  );
}

export default AvailableSlots;
