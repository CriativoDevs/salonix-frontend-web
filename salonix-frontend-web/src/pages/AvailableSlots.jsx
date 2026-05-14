import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  Filter,
  Info,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import FullPageLayout from '../layouts/FullPageLayout';
import Card from '../components/ui/Card';
import Label from '../components/ui/Label';
import Dropdown from '../components/ui/Dropdown';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import SlotBulkModal from '../components/slots/SlotBulkModal';
import { fetchProfessionals } from '../api/professionals';
import { fetchSlotsWithMeta, deleteSlot } from '../api/slots';
import { fetchTenantBusinessHours } from '../api/tenant';
import { useTenant } from '../hooks/useTenant';
import { parseApiError } from '../utils/apiError';
import PaginationControls from '../components/ui/PaginationControls';

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
  const [busyId, setBusyId] = useState(null);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sortOption, setSortOption] = useState('-start_time');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [businessHoursPreset, setBusinessHoursPreset] = useState(null);
  const [hasConfiguredBusinessHours, setHasConfiguredBusinessHours] =
    useState(null);
  const [businessHoursChecked, setBusinessHoursChecked] = useState(false);

  const handleProfessionalChange = useCallback((professionalId) => {
    setSelectedProfessional(String(professionalId));
    setSelectedDate('');
    setOffset(0);
  }, []);

  const clearProfessional = useCallback(() => {
    setSelectedProfessional('');
    setSelectedDate('');
    setOffset(0);
  }, []);

  const professionalItems = useMemo(
    () => [
      {
        label: t('slots.filters.clear_professional', 'Limpar seleção'),
        onClick: clearProfessional,
      },
      ...professionals.map((professional) => ({
        label: professional.name,
        onClick: () => handleProfessionalChange(professional.id),
      })),
    ],
    [clearProfessional, handleProfessionalChange, professionals, t]
  );

  const selectedProfessionalName = useMemo(
    () =>
      professionals.find(
        (professional) => String(professional.id) === selectedProfessional
      )?.name || '',
    [professionals, selectedProfessional]
  );

  const getProfessionalName = useCallback(
    (id) => professionals.find((p) => String(p.id) === String(id))?.name || '',
    [professionals]
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
        setProfessionals(Array.isArray(data) ? data : []);
      })
      .catch(
        (e) => !cancelled && setError(parseApiError(e, t('common.load_error')))
      );
    return () => {
      cancelled = true;
    };
  }, [slug, t]);

  const loadBusinessHours = useCallback(() => {
    if (!slug) {
      setBusinessHoursPreset(null);
      setHasConfiguredBusinessHours(null);
      setBusinessHoursChecked(false);
      return Promise.resolve();
    }

    const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];
    setBusinessHoursChecked(false);

    return fetchTenantBusinessHours()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const active = list.filter((item) => Boolean(item?.is_active));
        const activeWeekdays = active
          .map((item) => item?.day_of_week)
          .filter((value) => Number.isInteger(value));

        setHasConfiguredBusinessHours(activeWeekdays.length > 0);

        const sortedActive = [...active].sort(
          (a, b) =>
            weekdayOrder.indexOf(a?.day_of_week) -
            weekdayOrder.indexOf(b?.day_of_week)
        );
        const firstActive = sortedActive[0] || null;

        setBusinessHoursPreset({
          weekdays: activeWeekdays,
          startTime: String(firstActive?.start_time || '').slice(0, 5),
          endTime: String(firstActive?.end_time || '').slice(0, 5),
        });
      })
      .catch(() => {
        setBusinessHoursPreset(null);
        setHasConfiguredBusinessHours(null);
      })
      .finally(() => {
        setBusinessHoursChecked(true);
      });
  }, [slug]);

  useEffect(() => {
    loadBusinessHours();
  }, [loadBusinessHours]);

  useEffect(() => {
    if (!slug) return;

    const handleWindowFocus = () => {
      loadBusinessHours();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadBusinessHours();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [slug, loadBusinessHours]);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!selectedProfessional) {
      setSlotItems([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSlotsWithMeta({
      professionalId: selectedProfessional,
      slug,
      params: { limit, offset, ordering: sortOption },
    })
      .then((payload) => {
        if (cancelled) return;
        const list = Array.isArray(payload?.results)
          ? payload.results
          : Array.isArray(payload)
            ? payload
            : [];
        setSlotItems(list);
        setTotalCount(
          payload?.meta?.totalCount ?? payload?.count ?? list.length
        );
      })
      .catch((e) => {
        if (!cancelled) setError(parseApiError(e, t('common.load_error')));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedProfessional, slug, t, limit, offset, sortOption, refreshKey]);

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
    const desc = sortOption.startsWith('-');
    return Array.from(grouped.entries()).sort(([left], [right]) =>
      desc ? right.localeCompare(left) : left.localeCompare(right)
    );
  }, [filteredSlots, sortOption]);

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
      if (ok) triggerRefresh();
    } catch (deleteError) {
      setError(
        parseApiError(
          deleteError,
          t('common.delete_error', 'Falha ao excluir slot.')
        )
      );
      triggerRefresh();
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
  const shouldShowBusinessHoursNotice =
    businessHoursChecked && hasConfiguredBusinessHours === false;

  return (
    <FullPageLayout>
      <div className="space-y-6">
        <PageHeader
          title={t('slots.title', 'Agenda dos profissionais')}
          subtitle={t(
            'slots.subtitle',
            'Gerencie os horários disponíveis de cada profissional. Gere em massa por período ou remova individualmente.'
          )}
        />

        {shouldShowBusinessHoursNotice ? (
          <div className="flex items-start gap-2 rounded-xl border border-brand-primary/15 bg-brand-primary/5 px-3 py-2 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3">
            <Info className="mt-0.5 hidden h-4 w-4 shrink-0 text-brand-primary sm:block" />
            <p className="text-xs leading-relaxed text-brand-surfaceForeground/75 sm:text-sm sm:text-brand-surfaceForeground/80">
              {t(
                'slots.hours_notice',
                'Configure o horário de funcionamento do salão para gerar horários automaticamente.'
              )}{' '}
              <Link
                to="/settings"
                className="font-semibold text-brand-primary underline-offset-2 hover:underline"
              >
                <Settings className="inline h-3.5 w-3.5" />{' '}
                {t('slots.hours_notice_cta', 'Ir para configurações')}
              </Link>
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15"
          >
            <Zap className="h-4 w-4" />
            {t('slots.bulk.open', 'Gerar horários')}
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
                            t(
                              'slots.filters.select_professional',
                              'Selecione um profissional'
                            )}
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
          !selectedProfessional ? (
            <EmptyState
              title={t(
                'slots.empty.select_professional_title',
                'Selecione um profissional'
              )}
              description={t(
                'slots.empty.select_professional_description',
                'Abra os filtros e escolha um profissional para visualizar e gerenciar os horários cadastrados.'
              )}
              action={
                <button
                  type="button"
                  onClick={() => setFiltersPanelOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15"
                >
                  <Filter className="h-4 w-4" />
                  {t('slots.filters.show', 'Filtros')}
                </button>
              }
            />
          ) : null}

          {!loading &&
          !error &&
          selectedProfessional &&
          groupedSlots.length === 0 ? (
            <EmptyState
              title={t('slots.empty.title', 'Nenhum horário encontrado')}
              description={t(
                'slots.empty.description',
                'Ajuste os filtros ou gere horários em massa para o profissional selecionado.'
              )}
              action={
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15"
                >
                  <Zap className="h-4 w-4" />
                  {t('slots.bulk.open', 'Gerar horários')}
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
                    {items.map((slot) => {
                      const profName = selectedProfessional
                        ? ''
                        : getProfessionalName(slot.professional);
                      return (
                        <div
                          key={slot.id}
                          className="flex min-h-[100px] flex-col justify-between rounded-2xl border border-brand-border bg-brand-surface px-4 py-4 shadow-sm"
                        >
                          <div className="space-y-1.5">
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
                            {profName ? (
                              <p className="truncate text-xs text-brand-surfaceForeground/60">
                                {profName}
                              </p>
                            ) : null}
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="text-xs text-brand-surfaceForeground/40">
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
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          ) : null}

          {!loading && !error && slotItems.length > 0 ? (
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

      <SlotBulkModal
        open={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onCreated={() => {
          setOffset(0);
          triggerRefresh();
        }}
        professionals={professionals}
        slug={slug}
        businessHoursPreset={businessHoursPreset}
      />
    </FullPageLayout>
  );
}

export default AvailableSlots;
