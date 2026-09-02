import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';

const inputStyle = {
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border-primary)',
};

function InventoryItemModal({
  open,
  item = null,
  busy = false,
  error = null,
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation();
  const isEditing = Boolean(item?.id);
  const formId = useId();
  const [form, setForm] = useState({
    name: '',
    unit: '',
    quantity: '',
    minimum_quantity: '',
  });
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: item?.name || '',
      unit: item?.unit || '',
      quantity: item?.quantity != null ? String(item.quantity) : '0',
      minimum_quantity:
        item?.minimum_quantity != null ? String(item.minimum_quantity) : '',
    });
    setLocalError(null);
  }, [open, item]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setLocalError(null);
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    const name = form.name.trim();
    const unit = form.unit.trim();

    if (!name) {
      setLocalError(
        t('inventory.errors.name_required', 'Informe o nome do item.')
      );
      return;
    }
    if (!unit) {
      setLocalError(
        t('inventory.errors.unit_required', 'Informe a unidade do item.')
      );
      return;
    }
    if (form.quantity !== '' && Number.isNaN(Number(form.quantity))) {
      setLocalError(
        t('inventory.errors.quantity_invalid', 'Informe uma quantidade válida.')
      );
      return;
    }
    if (
      form.minimum_quantity !== '' &&
      Number.isNaN(Number(form.minimum_quantity))
    ) {
      setLocalError(
        t(
          'inventory.errors.minimum_invalid',
          'Informe um estoque mínimo válido.'
        )
      );
      return;
    }

    await onSubmit?.({
      name,
      unit,
      quantity: form.quantity === '' ? 0 : form.quantity,
      minimum_quantity:
        form.minimum_quantity === '' ? null : form.minimum_quantity,
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
        {busy ? t('common.saving', 'Salvando...') : t('common.save', 'Salvar')}
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isEditing
          ? t('inventory.editor.edit_title', 'Editar item de estoque')
          : t('inventory.editor.create_title', 'Adicionar item de estoque')
      }
      description={t(
        'inventory.editor.description',
        'Cadastre o item e defina um estoque mínimo para receber alertas quando estiver acabando.'
      )}
      size="md"
      footer={footer}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
          {t('inventory.form.name', 'Nome do item')}
          <input
            type="text"
            value={form.name}
            onChange={(event) => handleChange('name', event.target.value)}
            placeholder={t(
              'inventory.form.name_placeholder',
              'Ex.: Shampoo profissional 1L'
            )}
            style={inputStyle}
            className="mt-1 rounded-lg border px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
          {t('inventory.form.unit', 'Unidade')}
          <input
            type="text"
            value={form.unit}
            onChange={(event) => handleChange('unit', event.target.value)}
            placeholder={t('inventory.form.unit_placeholder', 'Ex.: un, ml, kg')}
            style={inputStyle}
            className="mt-1 rounded-lg border px-3 py-2 text-sm"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
            {isEditing
              ? t('inventory.form.quantity', 'Quantidade atual')
              : t('inventory.form.initial_quantity', 'Quantidade inicial')}
            <input
              type="number"
              min="0"
              step="1"
              value={form.quantity}
              onChange={(event) =>
                handleChange('quantity', event.target.value)
              }
              style={inputStyle}
              className="mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
            {t('inventory.form.minimum_quantity', 'Estoque mínimo')}
            <input
              type="number"
              min="0"
              step="1"
              value={form.minimum_quantity}
              onChange={(event) =>
                handleChange('minimum_quantity', event.target.value)
              }
              placeholder={t(
                'inventory.form.minimum_quantity_placeholder',
                'Opcional'
              )}
              style={inputStyle}
              className="mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </label>
        </div>
        <p className="text-xs text-brand-surfaceForeground/55">
          {t(
            'inventory.form.minimum_quantity_hint',
            'Quando a quantidade ficar igual ou abaixo do estoque mínimo, o item aparece nos alertas.'
          )}
        </p>

        {error?.message || localError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error?.message || localError}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}

export default InventoryItemModal;
