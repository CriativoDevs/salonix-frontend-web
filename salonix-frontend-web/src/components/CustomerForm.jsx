import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function CustomerForm({ onAdd, busy = false }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    notes: '',
    marketing_opt_in: false,
  });
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone_number.trim();
    if (!name) {
      setError(
        t('customers.errors.name_required', 'Informe o nome do cliente.')
      );
      return;
    }
    if (!email && !phone) {
      setError(
        t(
          'customers.errors.contact_required',
          'Informe e-mail ou telefone para contato.'
        )
      );
      return;
    }
    try {
      await onAdd({
        name,
        email,
        phone_number: phone,
        notes: form.notes.trim(),
        marketing_opt_in: Boolean(form.marketing_opt_in),
      });
      setForm({
        name: '',
        email: '',
        phone_number: '',
        notes: '',
        marketing_opt_in: false,
      });
    } catch (err) {
      setError(err?.message || t('common.save_error', 'Falha ao salvar.'));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-brand-border bg-brand-surface/80 p-4 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
          {t('customers.form.name', 'Nome')}
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={t('customers.form.name_placeholder', 'Nome completo')}
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-primary)',
            }}
            className="mt-1 rounded border px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
          {t('customers.form.email', 'E-mail')}
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder={t(
              'customers.form.email_placeholder',
              'cliente@email.com'
            )}
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-primary)',
            }}
            className="mt-1 rounded border px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
          {t('customers.form.phone', 'Telefone')}
          <input
            type="tel"
            value={form.phone_number}
            onChange={(e) => handleChange('phone_number', e.target.value)}
            placeholder={t('customers.form.phone_placeholder', '+351912345678')}
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-primary)',
            }}
            className="mt-1 rounded border px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
          {t('customers.form.notes', 'Notas')}
          <input
            type="text"
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder={t(
              'customers.form.notes_placeholder',
              'Preferências, observações...'
            )}
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-primary)',
            }}
            className="mt-1 rounded border px-3 py-2 text-sm"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-brand-surfaceForeground/80">
        <input
          type="checkbox"
          checked={form.marketing_opt_in}
          onChange={(e) => handleChange('marketing_opt_in', e.target.checked)}
          className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
        />
        {t(
          'customers.form.marketing_opt_in',
          'Aceita receber comunicações de marketing'
        )}
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="text-sm font-medium text-[#7F7EED] hover:underline disabled:opacity-50"
        >
          {busy
            ? t('common.saving', 'Salvando...')
            : t('customers.form.submit', 'Adicionar cliente')}
        </button>
      </div>
    </form>
  );
}

export default CustomerForm;
