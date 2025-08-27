import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function ProfessionalForm({ onAdd }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', specialty: '', phone: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = t('professionals.errors.name_required');
    if (!form.specialty)
      newErrors.specialty = t('professionals.errors.specialty_required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onAdd({ ...form, id: Date.now() });
    setForm({ name: '', specialty: '', phone: '' });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm mb-1">{t('professionals.name')}</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border px-3 py-2 rounded"
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm mb-1">
          {t('professionals.specialty')}
        </label>
        <input
          type="text"
          value={form.specialty}
          onChange={(e) => setForm({ ...form, specialty: e.target.value })}
          className="w-full border px-3 py-2 rounded"
        />
        {errors.specialty && (
          <p className="text-sm text-red-500">{errors.specialty}</p>
        )}
      </div>

      <div>
        <label className="block text-sm mb-1">{t('professionals.phone')}</label>
        <input
          type="text"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full border px-3 py-2 rounded"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded"
      >
        {t('professionals.submit')}
      </button>
    </form>
  );
}

export default ProfessionalForm;
