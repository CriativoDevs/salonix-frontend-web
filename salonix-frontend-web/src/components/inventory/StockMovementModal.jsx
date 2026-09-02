import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';

const inputStyle = {
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border-primary)',
};

const MOVEMENT_IN = 'in';
const MOVEMENT_OUT = 'out';

function StockMovementModal({ open, item = null, busy = false, error = null, onClose, onSubmit }) {
  const { t } = useTranslation();
  const formId = useId();
  const [form, setForm] = useState({
    movement_type: MOVEMENT_IN,
    quantity: '',
    notes: '',
  });
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm({ movement_type: MOVEMENT_IN, quantity: '', notes: '' });
    setLocalError(null);
  }, [open, item]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setLocalError(null);
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    const quantityNumber = Number(form.quantity);
    if (form.quantity === '' || Number.isNaN(quantityNumber) || quantityNumber <= 0) {
      setLocalError(
        t(
          'inventory.movements.errors.quantity_invalid',
          'Informe uma quantidade maior que zero.'
        )
      );
      return;
    }

    await onSubmit?.({
      item: item?.id,
      movement_type: form.movement_type,
      quantity: form.quantity,
      notes: form.notes.trim(),
    });
  };

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        disabled={busy}
        className="text-sm font-medium text-brand-surfaceForeground/60 hover:underline disabled:opacity-50"
      >
        {t('common.cancel', 'Cancelar')}
      </button>
      <button
        type="submit"
        form={formId}
        disabled={busy}
        className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50"
      >
        {busy
          ? t('inventory.movements.saving', 'Registrando...')
          : t('inventory.movements.submit', 'Registrar movimentação')}
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('inventory.movements.title', 'Registrar movimentação')}
      description={
        item?.name
          ? t('inventory.movements.description', {
              defaultValue: 'Registre uma entrada ou saída para {{name}}.',
              name: item.name,
            })
          : undefined
      }
      size="sm"
      footer={footer}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-brand-surfaceForeground/80">
            {t('inventory.movements.type', 'Tipo de movimentação')}
          </legend>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleChange('movement_type', MOVEMENT_IN)}
              aria-pressed={form.movement_type === MOVEMENT_IN}
              className={`flex-1 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                form.movement_type === MOVEMENT_IN
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                  : 'border-brand-border bg-brand-light/40 text-brand-surfaceForeground/70'
              }`}
            >
              {t('inventory.movements.type_in', 'Entrada')}
            </button>
            <button
              type="button"
              onClick={() => handleChange('movement_type', MOVEMENT_OUT)}
              aria-pressed={form.movement_type === MOVEMENT_OUT}
              className={`flex-1 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                form.movement_type === MOVEMENT_OUT
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-700'
                  : 'border-brand-border bg-brand-light/40 text-brand-surfaceForeground/70'
              }`}
            >
              {t('inventory.movements.type_out', 'Saída')}
            </button>
          </div>
        </fieldset>

        <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
          {t('inventory.movements.quantity', 'Quantidade')}
          <input
            type="number"
            min="0"
            step="1"
            value={form.quantity}
            onChange={(event) => handleChange('quantity', event.target.value)}
            style={inputStyle}
            className="mt-1 rounded-lg border px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
          {t('inventory.movements.notes', 'Notas (opcional)')}
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) => handleChange('notes', event.target.value)}
            style={inputStyle}
            className="mt-1 rounded-lg border px-3 py-2 text-sm"
          />
        </label>

        {error?.message || localError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error?.message || localError}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}

export default StockMovementModal;
