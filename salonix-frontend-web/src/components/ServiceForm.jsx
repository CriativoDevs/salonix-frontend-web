import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function ServiceForm({ onAdd, busy = false }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', price: '', duration: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = t('services.errors.name_required');
    if (!form.price || isNaN(form.price))
      newErrors.price = t('services.errors.price_invalid');
    if (!form.duration || isNaN(form.duration))
      newErrors.duration = t('services.errors.duration_invalid');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await onAdd({ ...form, id: Date.now() });
    setForm({ name: '', price: '', duration: '' });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)]">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-surfaceForeground/85">
            {t('services.name')}
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t(
              'services.form.name_placeholder',
              'Ex.: Corte masculino premium'
            )}
            className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-sm text-brand-surfaceForeground outline-none transition focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/10"
          />
          {errors.name ? (
            <p className="mt-1.5 text-sm text-rose-500">{errors.name}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-surfaceForeground/85">
            {t('services.price')}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-brand-surfaceForeground/45">
              €
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder={t('services.form.price_placeholder', '25.00')}
              className="w-full rounded-xl border border-brand-border bg-brand-surface py-2.5 pl-8 pr-3 text-sm text-brand-surfaceForeground outline-none transition focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/10"
            />
          </div>
          {errors.price ? (
            <p className="mt-1.5 text-sm text-rose-500">{errors.price}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-surfaceForeground/85">
            {t('services.duration')}
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder={t('services.form.duration_placeholder', '45')}
              className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 pr-12 text-sm text-brand-surfaceForeground outline-none transition focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/10"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold uppercase tracking-wide text-brand-surfaceForeground/45">
              {t('services.form.duration_suffix', 'min')}
            </span>
          </div>
          {errors.duration ? (
            <p className="mt-1.5 text-sm text-rose-500">{errors.duration}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-brand-surfaceForeground/65">
          {t(
            'services.form.helper',
            'Defina um nome claro, preço objetivo e duração realista para melhorar a agenda e a leitura dos relatórios.'
          )}
        </p>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center rounded-full border border-brand-primary/20 bg-brand-primary/10 px-5 py-2.5 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy
            ? t('services.form.submitting', 'Salvando...')
            : t('services.submit')}
        </button>
      </div>
    </form>
  );
}

export default ServiceForm;
