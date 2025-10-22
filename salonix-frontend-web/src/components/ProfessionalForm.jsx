import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FormButton from './ui/FormButton';

const formatStaffName = (member) => {
  if (!member) return '';
  const parts = [member.first_name, member.last_name].filter(Boolean);
  const display = parts.length ? parts.join(' ') : member.email || member.username;
  return display || `#${member.id}`;
};

function ProfessionalForm({
  onAdd,
  staffOptions = [],
  staffLoading = false,
  staffError = null,
  canManageAll = false,
  currentStaffId = null,
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', specialty: '', phone: '' });
  const [staffMemberId, setStaffMemberId] = useState('');
  const [errors, setErrors] = useState({});

  const activeStaff = useMemo(
    () =>
      Array.isArray(staffOptions)
        ? staffOptions.filter((item) => item?.status === 'active')
        : [],
    [staffOptions]
  );

  useEffect(() => {
    if (!activeStaff.length) {
      setStaffMemberId('');
      return;
    }

    if (!canManageAll && currentStaffId) {
      setStaffMemberId(String(currentStaffId));
      return;
    }

    const exists = activeStaff.some((member) => String(member.id) === String(staffMemberId));
    if (!exists) {
      setStaffMemberId(String(activeStaff[0].id));
    }
  }, [activeStaff, canManageAll, currentStaffId, staffMemberId]);

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = t('professionals.errors.name_required');
    if (!form.specialty) newErrors.specialty = t('professionals.errors.specialty_required');
    if (!staffMemberId) newErrors.staff_member = t('professionals.errors.staff_required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    onAdd({
      ...form,
      staffMemberId: Number(staffMemberId),
    });
    setForm({ name: '', specialty: '', phone: '' });
    setErrors({});
  };

  const isDisabled = staffLoading || activeStaff.length === 0 || Boolean(staffError);
  const selectionDisabled = isDisabled || !canManageAll;

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
        <label className="block text-sm mb-1">{t('professionals.specialty')}</label>
        <input
          type="text"
          value={form.specialty}
          onChange={(e) => setForm({ ...form, specialty: e.target.value })}
          className="w-full border px-3 py-2 rounded"
        />
        {errors.specialty && <p className="text-sm text-red-500">{errors.specialty}</p>}
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

      <div>
        <label className="block text-sm mb-1">{t('professionals.staff_member')}</label>
        {staffError ? (
          <p className="text-sm text-red-500">
            {staffError.message || t('professionals.staff_error')}
          </p>
        ) : (
          <select
            disabled={selectionDisabled}
            value={staffMemberId}
            onChange={(e) => setStaffMemberId(e.target.value)}
            className="w-full rounded border px-3 py-2 disabled:bg-gray-100"
          >
            <option value="" disabled>
              {staffLoading
                ? t('professionals.staff_loading')
                : t('professionals.staff_placeholder')}
            </option>
            {activeStaff.map((member) => (
              <option key={member.id} value={member.id}>
                {formatStaffName(member)} • {t(`team.manage.roles.${member.role}`, member.role)}
              </option>
            ))}
          </select>
        )}
        {activeStaff.length === 0 && !staffLoading && !staffError && (
          <p className="mt-1 text-sm text-gray-500">
            {t('professionals.staff_required_hint')}
          </p>
        )}
        {errors.staff_member && <p className="text-sm text-red-500">{errors.staff_member}</p>}
      </div>

      <FormButton type="submit" variant="success" className="w-full" disabled={isDisabled}>
        {t('professionals.submit')}
      </FormButton>
    </form>
  );
}

export default ProfessionalForm;
