import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';

const inputStyle = {
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border-primary)',
};

function VoucherEditorModal({
  open,
  voucher = null,
  services = [],
  busy = false,
  error = null,
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation();
  const isEditing = Boolean(voucher?.id);
  const formId = useId();
  const [form, setForm] = useState({
    code: '',
    type: 'percent',
    value: '',
    service: '',
    max_uses: '1',
    valid_until: '',
    notes: '',
  });
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      code: voucher?.code || '',
      type: voucher?.type || 'percent',
      value: voucher?.value != null ? String(voucher.value) : '',
      service: voucher?.service != null ? String(voucher.service) : '',
      max_uses: voucher?.max_uses != null ? String(voucher.max_uses) : '1',
      valid_until: voucher?.valid_until || '',
      notes: voucher?.notes || '',
    });
    setLocalError(null);
  }, [open, voucher]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setLocalError(null);
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();

    if (form.type === 'free_service') {
      if (!form.service) {
        setLocalError(
          t('vouchers.errors.service_required', 'Selecione o serviço gratuito.')
        );
        return;
      }
    } else if (form.value === '' || Number.isNaN(Number(form.value))) {
      setLocalError(
        t('vouchers.errors.value_required', 'Informe um valor válido.')
      );
      return;
    }

    const maxUses = Number.parseInt(form.max_uses, 10);
    if (!Number.isFinite(maxUses) || maxUses < 1) {
      setLocalError(
        t('vouchers.errors.max_uses_invalid', 'Informe um número de usos válido.')
      );
      return;
    }

    const payload = {
      type: form.type,
      max_uses: maxUses,
      valid_until: form.valid_until || null,
      notes: form.notes.trim(),
    };

    if (form.code.trim()) {
      payload.code = form.code.trim();
    }

    if (form.type === 'free_service') {
      payload.service = Number.parseInt(form.service, 10);
      payload.value = null;
    } else {
      payload.value = form.value;
      payload.service = null;
    }

    await onSubmit?.(payload);
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
          ? t('vouchers.editor.edit_title', 'Editar voucher')
          : t('vouchers.editor.create_title', 'Criar voucher')
      }
      description={t(
        'vouchers.editor.description',
        'Defina o benefício, a validade e o limite de utilizações do voucher.'
      )}
      size="md"
      footer={footer}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
          {t('vouchers.form.code', 'Código')}
          <input
            type="text"
            value={form.code}
            onChange={(event) =>
              handleChange('code', event.target.value.toUpperCase())
            }
            placeholder={t(
              'vouchers.form.code_placeholder',
              'Deixe em branco para gerar automaticamente'
            )}
            style={inputStyle}
            className="mt-1 rounded-lg border px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
          {t('vouchers.form.type', 'Tipo de voucher')}
          <select
            value={form.type}
            onChange={(event) => handleChange('type', event.target.value)}
            style={inputStyle}
            className="mt-1 rounded-lg border px-3 py-2 text-sm"
          >
            <option value="percent">
              {t('vouchers.types.percent', 'Desconto percentual')}
            </option>
            <option value="fixed">
              {t('vouchers.types.fixed', 'Desconto em valor fixo')}
            </option>
            <option value="free_service">
              {t('vouchers.types.free_service', 'Serviço grátis')}
            </option>
          </select>
        </label>

        {form.type === 'free_service' ? (
          <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
            {t('vouchers.form.service', 'Serviço')}
            <select
              value={form.service}
              onChange={(event) => handleChange('service', event.target.value)}
              style={inputStyle}
              className="mt-1 rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">
                {t('vouchers.form.service_placeholder', 'Selecione um serviço')}
              </option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
            {form.type === 'percent'
              ? t('vouchers.form.value_percent', 'Percentual de desconto (%)')
              : t('vouchers.form.value_fixed', 'Valor do desconto')}
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.value}
              onChange={(event) => handleChange('value', event.target.value)}
              style={inputStyle}
              className="mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </label>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
            {t('vouchers.form.max_uses', 'Máximo de atribuições')}
            <input
              type="number"
              min="1"
              step="1"
              value={form.max_uses}
              onChange={(event) => handleChange('max_uses', event.target.value)}
              style={inputStyle}
              className="mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
            {t('vouchers.form.valid_until', 'Válido até')}
            <input
              type="date"
              value={form.valid_until || ''}
              onChange={(event) =>
                handleChange('valid_until', event.target.value)
              }
              style={inputStyle}
              className="mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
          {t('vouchers.form.notes', 'Notas (opcional)')}
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

export default VoucherEditorModal;
