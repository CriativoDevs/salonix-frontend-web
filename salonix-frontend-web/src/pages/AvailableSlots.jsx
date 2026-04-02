import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  Filter,
  Plus,
  Trash2,
} from 'lucide-react';
import FullPageLayout from '../layouts/FullPageLayout';
import Card from '../components/ui/Card';
import Label from '../components/ui/Label';
import Dropdown from '../components/ui/Dropdown';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import { fetchProfessionals } from '../api/professionals';
import { fetchSlotsWithMeta, createSlot, deleteSlot } from '../api/slots';
import { useTenant } from '../hooks/useTenant';
import { parseApiError } from '../utils/apiError';
import PaginationControls from '../components/ui/PaginationControls';

const DEFAULT_FORM = {
  date: '',
  sh: '09',
  sm: '00',
  eh: '10',
  em: '00',
};

const inputStyle = {
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-primary)',
  borderRadius: '0.75rem',
  padding: '0.625rem 0.875rem',
  colorScheme: 'light dark',
};

function AvailableSlots() {
  const { t, i18n } = useTranslation();
  const { slug } = useTenant();
  const currentLanguage = i18n?.language || 'pt';
  const [professionals, setProfessionals] = useState([]);
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [slotItems, setSlotItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [busyId, setBusyId] = useState(null);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sortOption, setSortOption] = useState('-start_time');
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);

  const handleProfessionalChange = useCallback((professionalId) => {
    setSelectedProfessional(String(professionalId));
    setSelectedDate('');
    setOffset(0);
  }, []);

  const professionalItems = useMemo(
    () =>
      professionals.map((professional) => ({
        label: professional.name,
        onClick: () => handleProfessionalChange(professional.id),
      })),
    [handleProfessionalChange, professionals]
  );

  const selectedProfessionalName = useMemo(
    () =>
      professionals.find(
        (professional) => String(professional.id) === selectedProfessional
      )?.name || '',
    [professionals, selectedProfessional]
  );

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
      // noop
    }
  }, []);

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      sp.set('limit', String(limit));
      sp.set('offset', String(offset));
      sp.set('ordering', sortOption);
      const newUrl = `${window.location.pathname}?${sp.toString()}`;
      window.history.replaceState({}, '', newUrl);
    } catch {
      // noop
    }
  }, [limit, offset, sortOption]);

  useEffect(() => {
    let cancelled = false;
    fetchProfessionals(slug)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setProfessionals(list);
        if (list.length) {
          setSelectedProfessional((prev) => prev || String(list[0].id));
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
      setTotalCount(0);
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
      const nextTotal =
        payload?.meta?.totalCount ?? payload?.count ?? list.length;
      setTotalCount(nextTotal || 0);
    } catch (e) {
      setError(parseApiError(e, t('common.load_error')));
    } finally {
      setLoading(false);
    }
  }, [selectedProfessional, slug, t, limit, offset, sortOption]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const pad2 = (value) => String(value).padStart(2, '0');

  const parseBackendDate = (value) => {
    if (!value) return null;
    const match =
      /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
    if (!match) return null;
    const [, year, month, day, hour, minute, second = '0'] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      0
    );
  };

  const formatDateOnly = (startStr) => {
    const startDate = parseBackendDate(startStr);
    if (!startDate) return startStr;
    return `${pad2(startDate.getDate())}/${pad2(startDate.getMonth() + 1)}/${startDate.getFullYear()}`;
  };

  const formatDateLabel = (dateString) => {
    if (!dateString) return '--';
    try {
      return new Intl.DateTimeFormat(
        currentLanguage === 'pt' ? 'pt-PT' : 'en-IE',
        {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      )
        .format(new Date(`${dateString}T00:00:00`))
        .replace('.', '');
    } catch {
      return dateString;
    }
  };

  const formatTimeRangeOnly = (startStr, endStr) => {
    const startDate = parseBackendDate(startStr);
    const endDate = parseBackendDate(endStr);
    if (!startDate || !endDate) return '';
    return `${pad2(startDate.getHours())}:${pad2(startDate.getMinutes())} - ${pad2(endDate.getHours())}:${pad2(endDate.getMinutes())}`;
  };

  const dates = useMemo(() => {
    const dateSet = new Set(
      slotItems.map((slot) =>
        slot.start_time ? slot.start_time.slice(0, 10) : ''
      )
    );
    return Array.from(dateSet).filter(Boolean).sort();
  }, [slotItems]);

  const filteredSlots = useMemo(() => {
    if (!selectedDate) return slotItems;
    return slotItems.filter((slot) =>
      slot.start_time?.startsWith(selectedDate)
    );
  }, [slotItems, selectedDate]);

  const groupedSlots = useMemo(() => {
    const grouped = new Map();
    filteredSlots.forEach((slot) => {
      const key = slot.start_time?.slice(0, 10) || 'unknown';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(slot);
    });
    return Array.from(grouped.entries()).sort(([left], [right]) =>
      left.localeCompare(right)
    );
  }, [filteredSlots]);

  const todayKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  }, []);

  const todayCount = useMemo(
    () =>
      filteredSlots.filter((slot) => slot.start_time?.startsWith(todayKey))
        .length,
    [filteredSlots, todayKey]
  );

  const MINUTE_STEP = 15;
  const minuteOptions = useMemo(() => {
    const items = [];
    for (let minute = 0; minute < 60; minute += MINUTE_STEP) items.push(minute);
    return items;
  }, []);

  const composeISO = (dateStr, hourStr, minuteStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr
      .split('-')
      .map((item) => parseInt(item, 10));
    const hour = parseInt(hourStr || '0', 10);
    const minute = parseInt(minuteStr || '0', 10);
    if (!year || !month || !day) return '';
    return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
  };

  const handleCreate = async (event) => {
    event?.preventDefault?.();
    const dateValue = form.date || selectedDate;
    if (!selectedProfessional || !dateValue) {
      setError({
        message: t(
          'common.validation_error',
          'Preencha profissional e horários.'
        ),
      });
      return;
    }
    const startISO = composeISO(dateValue, form.sh, form.sm);
    const endISO = composeISO(dateValue, form.eh, form.em);
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
      const createdDate = created?.start_time?.slice(0, 10) || dateValue;
      setForm({ ...DEFAULT_FORM, date: createdDate });
      setSelectedDate(createdDate);
      setCreatePanelOpen(false);
    } catch (createError) {
      setError(
        parseApiError(
          createError,
          t('common.save_error', 'Falha ao criar slot.')
        )
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (slot) => {
    const message = `${formatDateOnly(slot.start_time)} - ${formatTimeRangeOnly(slot.start_time, slot.end_time)}`;
    if (
      !window.confirm(
        t('common.confirm_delete', 'Confirmar exclusão?') + `\n${message}`
      )
    ) {
      return;
    }
    try {
      setBusyId(slot.id);
      const ok = await deleteSlot(slot.id, { slug });
      if (ok) await loadSlots();
    } catch (deleteError) {
      setError(
        parseApiError(
          deleteError,
          t('common.delete_error', 'Falha ao excluir slot.')
        )
      );
      await loadSlots();
    } finally {
      setBusyId(null);
    }
  };

  const clearFilters = () => {
    setSelectedDate('');
    setSortOption('-start_time');
    setOffset(0);
  };

  const hasActiveFilters =
    Boolean(selectedDate) || sortOption !== '-start_time';

  const summaryCards = [
    {
      key: 'total',
      label: t('slots.stats.total', 'Total disponível'),
      value: totalCount,
    },
    {
      key: 'visible',
      label: t('slots.stats.visible', 'Visíveis agora'),
      value: filteredSlots.length,
    },
    {
      key: 'days',
      label: t('slots.stats.days', 'Dias listados'),
      value: dates.length,
    },
    {
      key: 'today',
      label: t('slots.stats.today', 'Hoje'),
      value: todayCount,
    },
  ];

  return (
    <FullPageLayout>
      <div className="space-y-6">
        <PageHeader
          title={t('slots.title', 'Horários disponíveis')}
          subtitle={t(
            'slots.subtitle',
            'Organize os horários por profissional e data, com criação rápida e leitura mais clara no desktop e no PWA.'
          )}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={() => setCreatePanelOpen((current) => !current)}
            aria-expanded={createPanelOpen}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15"
          >
            <Plus className="h-4 w-4" />
            {createPanelOpen
              ? t('slots.create.hide', 'Fechar criação')
              : t('slots.create.show', 'Criar horário')}
            {createPanelOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setFiltersPanelOpen((current) => !current)}
            aria-expanded={filtersPanelOpen}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-border bg-brand-light/50 px-4 py-2 text-sm font-semibold text-brand-surfaceForeground/80 transition hover:bg-brand-light"
          >
            <Filter className="h-4 w-4" />
            {filtersPanelOpen
              ? t('slots.filters.hide', 'Fechar filtros')
              : t('slots.filters.show', 'Filtros')}
            {filtersPanelOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <div className="flex flex-wrap items-center gap-2 text-xs text-brand-surfaceForeground/65">
            {selectedProfessionalName ? (
              <span className="rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 font-medium text-brand-primary">
                {selectedProfessionalName}
              </span>
            ) : null}
            {selectedDate ? (
              <span className="rounded-full border border-brand-border bg-brand-light/40 px-3 py-1">
                {t('slots.filters.date_active', {
                  defaultValue: 'Data: {{date}}',
                  date: formatDateLabel(selectedDate),
                })}
              </span>
            ) : null}
            {sortOption !== '-start_time' ? (
              <span className="rounded-full border border-brand-border bg-brand-light/40 px-3 py-1">
                {t('slots.filters.order_active', 'Ordenação: mais antigos')}
              </span>
            ) : null}
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-brand-border px-3 py-1 font-medium text-brand-surfaceForeground transition hover:bg-brand-light/50"
              >
                {t('slots.filters.reset', 'Limpar filtros')}
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summaryCards.map((item) => (
            <Card
              key={item.key}
              className="min-h-[112px] rounded-2xl border border-brand-border bg-brand-surface/95 p-4 shadow-sm ring-1 ring-brand-border/70"
            >
              <div className="flex h-full flex-col justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-brand-surfaceForeground/55">
                  {item.label}
                </span>
                <span className="text-2xl font-semibold leading-none text-brand-surfaceForeground sm:text-3xl">
                  {item.value}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {createPanelOpen ? (
          <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-5 shadow-sm ring-1 ring-brand-border/70 sm:p-6">
            <div className="max-w-5xl space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-brand-surfaceForeground">
                  {t('slots.create.title', 'Criar novo horário')}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-surfaceForeground/70">
                  {t(
                    'slots.create.description',
                    'Defina a data e o intervalo do horário para o profissional selecionado. Depois da criação, a lista é atualizada automaticamente.'
                  )}
                </p>
              </div>

              <form
                onSubmit={handleCreate}
                className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
              >
                <div>
                  <Label className="mb-2 block">
                    {t('slots.slot_date', 'Data do slot')}
                  </Label>
                  <input
                    type="date"
                    value={form.date || selectedDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    className="w-full"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <Label className="mb-2 block">
                    {t('slots.start_time', 'Início')}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={form.sh}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          sh: event.target.value,
                        }))
                      }
                      className="w-full font-mono"
                      style={{
                        ...inputStyle,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {Array.from({ length: 24 }).map((_, hour) => (
                        <option
                          key={hour}
                          value={String(hour).padStart(2, '0')}
                        >
                          {String(hour).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <select
                      value={form.sm}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          sm: event.target.value,
                        }))
                      }
                      className="w-full font-mono"
                      style={{
                        ...inputStyle,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {minuteOptions.map((minute) => (
                        <option
                          key={minute}
                          value={String(minute).padStart(2, '0')}
                        >
                          {String(minute).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">
                    {t('slots.end_time', 'Término')}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={form.eh}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          eh: event.target.value,
                        }))
                      }
                      className="w-full font-mono"
                      style={{
                        ...inputStyle,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {Array.from({ length: 24 }).map((_, hour) => (
                        <option
                          key={hour}
                          value={String(hour).padStart(2, '0')}
                        >
                          {String(hour).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <select
                      value={form.em}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          em: event.target.value,
                        }))
                      }
                      className="w-full font-mono"
                      style={{
                        ...inputStyle,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {minuteOptions.map((minute) => (
                        <option
                          key={minute}
                          value={String(minute).padStart(2, '0')}
                        >
                          {String(minute).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creating || !selectedProfessional}
                  className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating
                    ? t('common.saving', 'Salvando...')
                    : t('slots.create_slot', 'Criar slot')}
                </button>
              </form>
            </div>
          </Card>
        ) : null}

        {filtersPanelOpen ? (
          <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-5 shadow-sm ring-1 ring-brand-border/70 sm:p-6">
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-brand-surfaceForeground">
                  {t('slots.filters.title', 'Filtros e contexto')}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-surfaceForeground/70">
                  {t(
                    'slots.filters.description',
                    'Troque o profissional, refine por data e ajuste a ordenação para encontrar ou limpar horários com menos esforço.'
                  )}
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="form-light">
                  <Label className="mb-2 block">
                    {t('slots.professional', 'Profissional')}
                  </Label>
                  <Dropdown
                    trigger={
                      <button
                        type="button"
                        className="flex w-full items-center justify-between text-left"
                        style={inputStyle}
                      >
                        <span className="truncate">
                          {selectedProfessionalName ||
                            t('common.select', 'Selecione...')}
                        </span>
                        <ChevronDown className="h-4 w-4 text-brand-surfaceForeground/70" />
                      </button>
                    }
                    items={professionalItems}
                    searchable={true}
                    searchPlaceholder={t('common.search', 'Pesquisar...')}
                    className="w-full"
                    align="left"
                  />
                </div>

                <div className="form-light">
                  <Label className="mb-2 block">
                    {t('slots.ordering', 'Ordenação')}
                  </Label>
                  <select
                    value={sortOption}
                    onChange={(event) => {
                      setSortOption(event.target.value);
                      setOffset(0);
                    }}
                    className="w-full"
                    style={inputStyle}
                  >
                    <option value="-start_time">
                      {t('slots.order_newest', 'Mais recentes primeiro')}
                    </option>
                    <option value="start_time">
                      {t('slots.order_oldest', 'Data mais antiga primeiro')}
                    </option>
                  </select>
                </div>

                <div className="form-light">
                  <Label className="mb-2 block">
                    {t('slots.select_date', 'Selecionar data')}
                  </Label>
                  <select
                    value={selectedDate}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setOffset(0);
                    }}
                    className="w-full"
                    style={inputStyle}
                  >
                    <option value="">
                      {t('slots.filters.all_dates', 'Todas as datas')}
                    </option>
                    {dates.map((date) => (
                      <option key={date} value={date}>
                        {formatDateLabel(date)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {error ? (
          <Card className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {error.message}
          </Card>
        ) : null}

        <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-5 shadow-sm ring-1 ring-brand-border/70 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-brand-surfaceForeground">
                {t('slots.list.title', 'Horários cadastrados')}
              </h2>
              <p className="mt-1 text-sm text-brand-surfaceForeground/65">
                {t('slots.list.description', {
                  defaultValue: '{{count}} horários nesta página.',
                  count: filteredSlots.length,
                })}
              </p>
            </div>
            {selectedProfessionalName ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-light/40 px-3 py-1.5 text-xs font-medium text-brand-surfaceForeground/70">
                <Clock3 className="h-4 w-4" />
                {selectedProfessionalName}
              </div>
            ) : null}
          </div>

          {loading ? (
            <p className="text-sm text-brand-surfaceForeground/65">
              {t('common.loading', 'Carregando...')}
            </p>
          ) : null}

          {!loading && !error && professionals.length === 0 ? (
            <EmptyState
              title={t(
                'slots.empty.no_professionals_title',
                'Nenhum profissional disponível'
              )}
              description={t(
                'slots.empty.no_professionals_description',
                'Cadastre ou ative um profissional antes de organizar horários disponíveis.'
              )}
            />
          ) : null}

          {!loading &&
          !error &&
          professionals.length > 0 &&
          groupedSlots.length === 0 ? (
            <EmptyState
              title={t('slots.empty.title', 'Nenhum horário encontrado')}
              description={t(
                'slots.empty.description',
                'Ajuste os filtros ou abra a criação para adicionar novos horários ao profissional selecionado.'
              )}
              action={
                <button
                  type="button"
                  onClick={() => setCreatePanelOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15"
                >
                  <Plus className="h-4 w-4" />
                  {t('slots.create.show', 'Criar horário')}
                </button>
              }
            />
          ) : null}

          {!loading && !error && groupedSlots.length > 0 ? (
            <div className="space-y-4">
              {groupedSlots.map(([date, items]) => (
                <Card
                  key={date}
                  className="rounded-2xl border border-brand-border bg-brand-light/20 p-4 shadow-sm sm:p-5"
                >
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-brand-surfaceForeground sm:text-lg">
                          {formatDateLabel(date)}
                        </h3>
                        <p className="text-sm text-brand-surfaceForeground/65">
                          {t('slots.list.group_count', {
                            defaultValue: '{{count}} horários neste dia',
                            count: items.length,
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex w-fit rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-medium text-brand-surfaceForeground/70">
                      {formatDateOnly(items[0]?.start_time)}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex min-h-[120px] flex-col justify-between rounded-2xl border border-brand-border bg-brand-surface px-4 py-4 shadow-sm"
                      >
                        <div className="space-y-2">
                          <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
                            <Clock3 className="h-3.5 w-3.5" />
                            {t('slots.list.slot_label', 'Intervalo')}
                          </div>
                          <div className="text-xl font-semibold text-brand-surfaceForeground sm:text-2xl">
                            {formatTimeRangeOnly(
                              slot.start_time,
                              slot.end_time
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="text-xs text-brand-surfaceForeground/60">
                            #{slot.id}
                          </span>
                          <button
                            type="button"
                            disabled={busyId === slot.id}
                            onClick={() => handleDelete(slot)}
                            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t('common.delete', 'Excluir')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : null}

          {!loading && !error && totalCount > 0 ? (
            <PaginationControls
              totalCount={totalCount}
              limit={limit}
              offset={offset}
              onChangeLimit={(nextLimit) => {
                setLimit(nextLimit);
                setOffset(0);
              }}
              onPrev={() =>
                setOffset((previous) => Math.max(0, previous - limit))
              }
              onNext={() =>
                setOffset((previous) =>
                  previous + limit < totalCount ? previous + limit : previous
                )
              }
              className="mt-6"
            />
          ) : null}
        </Card>
      </div>
    </FullPageLayout>
  );
}

export default AvailableSlots;
