import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FormButton from './ui/FormButton';

function ServiceForm({ onAdd }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onAdd({ ...form, id: Date.now() });
    setForm({ name: '', price: '', duration: '' });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm mb-1">{t('services.name')}</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border px-3 py-2 rounded"
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm mb-1">{t('services.price')}</label>
        <input
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full border px-3 py-2 rounded"
        />
        {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
      </div>

      <div>
        <label className="block text-sm mb-1">{t('services.duration')}</label>
        <input
          type="number"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
          className="w-full border px-3 py-2 rounded"
        />
        {errors.duration && (
          <p className="text-sm text-red-500">{errors.duration}</p>
        )}
      </div>

      <FormButton type="submit" variant="success" className="w-full">
        {t('services.submit')}
      </FormButton>
    </form>
  );
}

export default ServiceForm;
