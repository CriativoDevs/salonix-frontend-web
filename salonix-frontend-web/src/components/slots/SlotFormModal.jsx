import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Loader2, Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import Label from '../ui/Label';
import Dropdown from '../ui/Dropdown';
import { createSlot } from '../../api/slots';

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

function buildISO(date, hour, minute) {
  if (!date) return null;
  const [year, month, day] = date.split('-').map(Number);
  const dt = new Date(year, month - 1, day, Number(hour), Number(minute), 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

function SlotFormModal({ open, onClose, onCreated, professionals, slug }) {
  const { t } = useTranslation();
  const [professionalId, setProfessionalId] = useState('');
  const [date, setDate] = useState('');
  const [startH, setStartH] = useState('09');
  const [startM, setStartM] = useState('00');
  const [endH, setEndH] = useState('10');
  const [endM, setEndM] = useState('00');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(todayStr());
  }, [open]);

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

  const startISO = useMemo(
    () => buildISO(date, startH, startM),
    [date, startH, startM]
  );
  const endISO = useMemo(
    () => buildISO(date, endH, endM),
    [date, endH, endM]
  );

  const isRangeValid = Boolean(
    startISO && endISO && new Date(endISO) > new Date(startISO)
  );

  const validationError = useMemo(() => {
    if (!touched) return null;
    if (!professionalId) {
      return t('slots.form.errors.professional_required', 'Selecione um profissional.');
    }
    if (!date) {
      return t('slots.form.errors.date_required', 'Selecione uma data.');
    }
    if (!isRangeValid) {
      return t(
        'slots.form.errors.range_invalid',
        'O horário de término deve ser depois do horário de início.'
      );
    }
    return null;
  }, [touched, professionalId, date, isRangeValid, t]);

  const handleClose = () => {
    if (creating) return;
    setProfessionalId('');
    setDate('');
    setStartH('09');
    setStartM('00');
    setEndH('10');
    setEndM('00');
    setError(null);
    setTouched(false);
    onClose?.();
  };

  const handleCreate = async () => {
    setTouched(true);
    if (!professionalId || !date || !isRangeValid) return;
    setCreating(true);
    setError(null);
    try {
      await createSlot({
        professionalId,
        startTime: startISO,
        endTime: endISO,
        slug,
      });
      onCreated?.();
      handleClose();
    } catch (e) {
      setError(
        e?.response?.data?.detail ||
          t('common.save_error', 'Falha ao criar horário.')
      );
    } finally {
      setCreating(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => pad2(i));
  const minutes = ['00', '15', '30', '45'];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('slots.create.title', 'Criar novo horário')}
      description={t(
        'slots.create.description',
        'Defina a data e o intervalo do horário para o profissional selecionado. Depois da criação, a lista é atualizada automaticamente.'
      )}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
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
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {t('slots.create_slot', 'Criar slot')}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {validationError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {validationError}
          </div>
        ) : null}

        <div>
          <Label className="mb-2 block font-medium">
            {t('slots.form.professional', 'Profissional')}
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

        <div>
          <Label className="mb-2 block font-medium">
            {t('slots.form.date', 'Data')}
            <span className="ml-1 text-red-500">*</span>
          </Label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full"
            style={inputStyle}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block font-medium">
              {t('slots.start_time', 'Início')}
              <span className="ml-1 text-red-500">*</span>
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
              <span className="ml-1 text-red-500">*</span>
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
        </div>
      </div>
    </Modal>
  );
}

export default SlotFormModal;
