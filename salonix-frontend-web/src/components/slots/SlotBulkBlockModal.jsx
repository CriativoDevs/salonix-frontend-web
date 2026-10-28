import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Loader2, Lock } from 'lucide-react';
import Modal from '../ui/Modal';
import Label from '../ui/Label';
import Dropdown from '../ui/Dropdown';
import { bulkBlockSlots } from '../../api/slots';

const DURATIONS = [15, 20, 30, 45, 60, 90, 120];

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

function SlotBulkBlockModal({ open, onClose, onBlocked, professionals, slug }) {
  const { t } = useTranslation();
  const [professionalId, setProfessionalId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [startH, setStartH] = useState('09');
  const [startM, setStartM] = useState('00');
  const [endH, setEndH] = useState('18');
  const [endM, setEndM] = useState('00');
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [reason, setReason] = useState('');
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const professionalItems = useMemo(
    () =>
      (professionals || []).map((p) => ({
        label: p.name,
        onClick: () => setProfessionalId(String(p.id)),
      })),
    [professionals]
  );

  const selectedProfessionalName = useMemo(
    () =>
      (professionals || []).find((p) => String(p.id) === professionalId)
        ?.name || '',
    [professionals, professionalId]
  );

  const isValid = Boolean(professionalId && dateFrom && dateTo);

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

  const handleClose = () => {
    if (blocking) return;
    setProfessionalId('');
    setDateFrom('');
    setDateTo('');
    setStartH('09');
    setStartM('00');
    setEndH('18');
    setEndM('00');
    setIntervalMinutes(60);
    setReason('');
    setError(null);
    setResult(null);
    onClose?.();
  };

  const handleBlock = async () => {
    if (!isValid) return;
    setBlocking(true);
    setError(null);
    try {
      const response = await bulkBlockSlots({
        professionalId,
        dateFrom,
        dateTo,
        startTime: `${startH}:${startM}`,
        endTime: `${endH}:${endM}`,
        intervalMinutes,
        reason,
        slug,
      });
      setResult(response || {});
      onBlocked?.();
    } catch (e) {
      setError(
        e?.response?.data?.detail ||
          t('slots.bulk_block.error', 'Falha ao bloquear horários em massa.')
      );
    } finally {
      setBlocking(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => pad2(i));
  const minutes = ['00', '15', '30', '45'];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('slots.bulk_block.title', 'Bloqueio em massa de horários')}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={blocking}
            className="rounded-full border border-brand-border bg-brand-light/50 px-4 py-2 text-sm font-medium text-brand-surfaceForeground/80 transition hover:bg-brand-light disabled:opacity-50"
          >
            {result
              ? t('common.close', 'Fechar')
              : t('common.cancel', 'Cancelar')}
          </button>
          {!result ? (
            <button
              type="button"
              onClick={handleBlock}
              disabled={blocking || !isValid}
              className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {blocking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('slots.bulk_block.blocking', 'Bloqueando...')}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  {t('slots.bulk_block.block_btn', 'Bloquear horários')}
                </>
              )}
            </button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-sm text-brand-surfaceForeground/80">
            <p className="mb-2 font-semibold text-brand-surfaceForeground">
              {t('slots.bulk_block.result.title', 'Bloqueio concluído')}
            </p>
            <ul className="space-y-1">
              <li>
                {t('slots.bulk_block.result.blocked', {
                  defaultValue: 'Horários existentes bloqueados: {{count}}',
                  count: result.blocked ?? 0,
                })}
              </li>
              <li>
                {t('slots.bulk_block.result.created', {
                  defaultValue: 'Novos horários bloqueados criados: {{count}}',
                  count: result.created ?? 0,
                })}
              </li>
              <li>
                {t('slots.bulk_block.result.skipped_booked', {
                  defaultValue:
                    'Ignorados por já estarem reservados: {{count}}',
                  count: result.skipped_booked ?? 0,
                })}
              </li>
            </ul>
          </div>
        ) : (
          <>
            {/* Profissional */}
            <div>
              <Label className="mb-2 block font-medium">
                {t('slots.bulk_block.professional', 'Profissional')}
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
                {t('slots.bulk_block.period', 'Período')}
              </Label>
              <div className="mb-3 flex flex-wrap gap-2">
                {[
                  {
                    key: 'today',
                    label: t('slots.bulk_block.period_today', 'Hoje'),
                  },
                  {
                    key: 'week',
                    label: t('slots.bulk_block.period_week', 'Esta semana'),
                  },
                  {
                    key: 'month',
                    label: t('slots.bulk_block.period_month', 'Este mês'),
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
                    {t('slots.bulk_block.date_from', 'De')}
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
                    {t('slots.bulk_block.date_to', 'Até')}
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

            {/* Horário e granularidade */}
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
                  {t('slots.bulk_block.interval', 'Granularidade')}
                </Label>
                <select
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(Number(e.target.value))}
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

            {/* Motivo */}
            <div>
              <Label className="mb-2 block font-medium">
                {t('slots.bulk_block.reason', 'Motivo (opcional)')}
              </Label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t(
                  'slots.bulk_block.reason_placeholder',
                  'Ex.: Férias, manutenção, feriado...'
                )}
                className="w-full"
                style={inputStyle}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default SlotBulkBlockModal;
