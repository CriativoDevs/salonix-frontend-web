import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Loader2, Zap } from 'lucide-react';
import Modal from '../ui/Modal';
import Label from '../ui/Label';
import Dropdown from '../ui/Dropdown';
import { createSlot } from '../../api/slots';

const DURATIONS = [15, 20, 30, 45, 60, 90, 120];
const WEEKDAYS = [
  { value: 1, key: 'mon', fallback: 'Mon' },
  { value: 2, key: 'tue', fallback: 'Tue' },
  { value: 3, key: 'wed', fallback: 'Wed' },
  { value: 4, key: 'thu', fallback: 'Thu' },
  { value: 5, key: 'fri', fallback: 'Fri' },
  { value: 6, key: 'sat', fallback: 'Sat' },
  { value: 0, key: 'sun', fallback: 'Sun' },
];

const inputStyle = {
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-primary)',
  borderRadius: '0.75rem',
  padding: '0.625rem 0.875rem',
  colorScheme: 'light dark',
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

function getDatesBetween(from, to, weekdays) {
  const dates = [];
  const cur = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cur <= end) {
    if (weekdays.includes(cur.getDay())) {
      dates.push(
        `${cur.getFullYear()}-${pad2(cur.getMonth() + 1)}-${pad2(cur.getDate())}`
      );
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function generateSlots(dates, startH, startM, endH, endM, duration) {
  const slots = [];
  for (const date of dates) {
    const [year, month, day] = date.split('-').map(Number);
    let cur = new Date(
      year,
      month - 1,
      day,
      Number(startH),
      Number(startM),
      0,
      0
    );
    const endTime = new Date(
      year,
      month - 1,
      day,
      Number(endH),
      Number(endM),
      0,
      0
    );
    while (true) {
      const slotEnd = new Date(cur.getTime() + duration * 60 * 1000);
      if (slotEnd > endTime) break;
      slots.push({
        startISO: cur.toISOString(),
        endISO: slotEnd.toISOString(),
      });
      cur = slotEnd;
    }
  }
  return slots;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function weekRangeStr() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (dt) =>
    `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
  return { from: fmt(mon), to: fmt(sun) };
}

function monthRangeStr() {
  const d = new Date();
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return {
    from: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`,
    to: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(lastDay)}`,
  };
}

function SlotBulkModal({
  open,
  onClose,
  onCreated,
  professionals,
  slug,
  businessHoursPreset,
}) {
  const { t } = useTranslation();
  const [professionalId, setProfessionalId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [startH, setStartH] = useState('09');
  const [startM, setStartM] = useState('00');
  const [endH, setEndH] = useState('18');
  const [endM, setEndM] = useState('00');
  const [duration, setDuration] = useState(60);
  const [weekdays, setWeekdays] = useState([1, 2, 3, 4, 5]);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;

    const presetWeekdays = Array.isArray(businessHoursPreset?.weekdays)
      ? businessHoursPreset.weekdays.filter((value) => Number.isInteger(value))
      : [];
    const safeWeekdays = presetWeekdays.length
      ? presetWeekdays
      : [1, 2, 3, 4, 5];

    const startTime = String(businessHoursPreset?.startTime || '').trim();
    const endTime = String(businessHoursPreset?.endTime || '').trim();

    const [presetStartH, presetStartM] = /^\d{2}:\d{2}$/.test(startTime)
      ? startTime.split(':')
      : ['09', '00'];
    const [presetEndH, presetEndM] = /^\d{2}:\d{2}$/.test(endTime)
      ? endTime.split(':')
      : ['18', '00'];

    setStartH(presetStartH);
    setStartM(presetStartM);
    setEndH(presetEndH);
    setEndM(presetEndM);
    setWeekdays(safeWeekdays);
  }, [open, businessHoursPreset]);

  const professionalItems = useMemo(
    () =>
      professionals.map((p) => ({
        label: p.name,
        onClick: () => setProfessionalId(String(p.id)),
      })),
    [professionals]
  );

  const selectedProfessionalName = useMemo(
    () =>
      professionals.find((p) => String(p.id) === professionalId)?.name || '',
    [professionals, professionalId]
  );

  const previewSlots = useMemo(() => {
    if (!dateFrom || !dateTo || !professionalId || weekdays.length === 0)
      return [];
    try {
      const dates = getDatesBetween(dateFrom, dateTo, weekdays);
      return generateSlots(dates, startH, startM, endH, endM, duration);
    } catch {
      return [];
    }
  }, [
    dateFrom,
    dateTo,
    professionalId,
    weekdays,
    startH,
    startM,
    endH,
    endM,
    duration,
  ]);

  const setQuickPeriod = (type) => {
    if (type === 'today') {
      const d = todayStr();
      setDateFrom(d);
      setDateTo(d);
    } else if (type === 'week') {
      const { from, to } = weekRangeStr();
      setDateFrom(from);
      setDateTo(to);
    } else if (type === 'month') {
      const { from, to } = monthRangeStr();
      setDateFrom(from);
      setDateTo(to);
    }
  };

  const toggleWeekday = (day) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCreate = async () => {
    if (!professionalId || previewSlots.length === 0) return;
    setCreating(true);
    setError(null);
    setProgress({ done: 0, total: previewSlots.length });
    try {
      for (const slot of previewSlots) {
        // eslint-disable-next-line no-await-in-loop
        await createSlot({
          professionalId,
          startTime: slot.startISO,
          endTime: slot.endISO,
          slug,
        });
        setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      }
      onCreated?.();
      handleClose();
    } catch (e) {
      setError(
        e?.response?.data?.detail ||
          t('common.save_error', 'Falha ao criar horários.')
      );
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (creating) return;
    setProfessionalId('');
    setDateFrom('');
    setDateTo('');
    setStartH('09');
    setStartM('00');
    setEndH('18');
    setEndM('00');
    setDuration(60);
    setWeekdays([1, 2, 3, 4, 5]);
    setProgress(null);
    setError(null);
    onClose?.();
  };

  const hours = Array.from({ length: 24 }, (_, i) => pad2(i));
  const minutes = ['00', '15', '30', '45'];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('slots.bulk.title', 'Gerar horários em massa')}
      size="lg"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brand-surfaceForeground/65">
            {previewSlots.length > 0
              ? t('slots.bulk.preview_count', {
                  defaultValue: '{{count}} horários serão criados',
                  count: previewSlots.length,
                })
              : t(
                  'slots.bulk.preview_empty',
                  'Configure o período para ver uma prévia'
                )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={creating}
              className="rounded-full border border-brand-border bg-brand-light/50 px-4 py-2 text-sm font-medium text-brand-surfaceForeground/80 transition hover:bg-brand-light disabled:opacity-50"
            >
              {t('common.cancel', 'Cancelar')}
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || previewSlots.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('slots.bulk.creating', {
                    defaultValue: '{{done}}/{{total}}',
                    done: progress?.done ?? 0,
                    total: progress?.total ?? 0,
                  })}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  {previewSlots.length > 0
                    ? t('slots.bulk.create_btn', {
                        defaultValue: 'Gerar {{count}} horários',
                        count: previewSlots.length,
                      })
                    : t('slots.bulk.create_btn_empty', 'Gerar horários')}
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* Profissional */}
        <div>
          <Label className="mb-2 block font-medium">
            {t('slots.bulk.professional', 'Profissional')}
            <span className="ml-1 text-red-500">*</span>
          </Label>
          <Dropdown
            trigger={
              <button
                type="button"
                className="flex w-full items-center justify-between text-left"
                style={inputStyle}
              >
                <span
                  className={
                    selectedProfessionalName
                      ? ''
                      : 'text-brand-surfaceForeground/40'
                  }
                >
                  {selectedProfessionalName ||
                    t('common.select', 'Selecione...')}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-brand-surfaceForeground/70" />
              </button>
            }
            items={professionalItems}
            searchable={true}
            searchPlaceholder={t('common.search', 'Pesquisar...')}
            align="left"
          />
        </div>

        {/* Período */}
        <div>
          <Label className="mb-2 block font-medium">
            {t('slots.bulk.period', 'Período')}
          </Label>
          <div className="mb-3 flex flex-wrap gap-2">
            {[
              { key: 'today', label: t('slots.bulk.period_today', 'Hoje') },
              {
                key: 'week',
                label: t('slots.bulk.period_week', 'Esta semana'),
              },
              {
                key: 'month',
                label: t('slots.bulk.period_month', 'Este mês'),
              },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setQuickPeriod(item.key)}
                className="rounded-full border border-brand-border bg-brand-light/50 px-3 py-1.5 text-xs font-medium text-brand-surfaceForeground/80 transition hover:bg-brand-light"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs text-brand-surfaceForeground/65">
                {t('slots.bulk.date_from', 'De')}
              </Label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full"
                style={inputStyle}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-brand-surfaceForeground/65">
                {t('slots.bulk.date_to', 'Até')}
              </Label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Dias da semana */}
        <div>
          <Label className="mb-2 block font-medium">
            {t('slots.bulk.weekdays', 'Dias da semana')}
          </Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleWeekday(day.value)}
                className={`min-w-[44px] rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  weekdays.includes(day.value)
                    ? 'border-brand-primary/30 bg-brand-primary/10 text-brand-primary'
                    : 'border-brand-border bg-brand-light/50 text-brand-surfaceForeground/60'
                }`}
              >
                {t(`slots.bulk.weekdays_short.${day.key}`, day.fallback)}
              </button>
            ))}
          </div>
        </div>

        {/* Horário e intervalo */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label className="mb-2 block font-medium">
              {t('slots.start_time', 'Início')}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={startH}
                onChange={(e) => setStartH(e.target.value)}
                className="w-full font-mono"
                style={inputStyle}
              >
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <select
                value={startM}
                onChange={(e) => setStartM(e.target.value)}
                className="w-full font-mono"
                style={inputStyle}
              >
                {minutes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label className="mb-2 block font-medium">
              {t('slots.end_time', 'Término')}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={endH}
                onChange={(e) => setEndH(e.target.value)}
                className="w-full font-mono"
                style={inputStyle}
              >
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <select
                value={endM}
                onChange={(e) => setEndM(e.target.value)}
                className="w-full font-mono"
                style={inputStyle}
              >
                {minutes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label className="mb-2 block font-medium">
              {t('slots.bulk.interval', 'Duração por slot')}
            </Label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full"
              style={inputStyle}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default SlotBulkModal;
