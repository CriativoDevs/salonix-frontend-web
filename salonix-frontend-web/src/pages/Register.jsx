import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../layouts/AuthLayout';
import FormButton from '../components/ui/FormButton';

function Register() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = t('auth.errors.name_required');
    if (!form.email) newErrors.email = t('auth.errors.email_required');
    if (!form.password) newErrors.password = t('auth.errors.password_required');
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.password_mismatch');
    }
    if (!form.phone) newErrors.phone = t('auth.errors.phone_required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // TODO: implementar lógica de cadastro
    console.log('Cadastro:', form);
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">{t('auth.name')}</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm mb-1">{t('auth.email')}</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">{t('auth.password')}</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">
            {t('auth.confirm_password')}
          </label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            className="w-full border px-3 py-2 rounded"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">{t('auth.phone')}</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone}</p>
          )}
        </div>

        <FormButton type="submit" variant="primary" className="w-full">
          {t('auth.register')}
        </FormButton>

        <div className="text-center text-sm">
          <span className="text-gray-600">
            {t('auth.already_have_account')}{' '}
          </span>
          <Link to="/login" className="text-brand-primary hover:underline">
            {t('auth.login')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Register;
