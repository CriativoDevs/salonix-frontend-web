import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ClientLayout from '../layouts/ClientLayout';
import PageHeader from '../components/ui/PageHeader';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';
import { fetchClientProfile, updateClientProfile } from '../api/clientMe';

export default function ClientProfile() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    phone_number: '',
    notes: '',
    marketing_opt_in: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClientProfile();
        if (!cancelled)
          setProfile({
            name: data?.name || '',
            phone_number: data?.phone_number || '',
            notes: data?.notes || '',
            marketing_opt_in: Boolean(data?.marketing_opt_in),
          });
      } catch {
        if (!cancelled) setError({ message: t('Falha ao carregar perfil.') });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateClientProfile(profile);
      setProfile({
        name: updated?.name || '',
        phone_number: updated?.phone_number || '',
        notes: updated?.notes || '',
        marketing_opt_in: Boolean(updated?.marketing_opt_in),
      });
      setSaved(true);
    } catch {
      setError({ message: t('Falha ao salvar perfil.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClientLayout>
      <PageHeader title={t('Perfil do Cliente')} />
      {loading ? (
        <p className="text-sm text-gray-500">{t('Carregando…')}</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 max-w-xl space-y-4">
          <FormInput
            label={t('Nome')}
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
          <FormInput
            label={t('Telefone')}
            value={profile.phone_number}
            onChange={(e) =>
              setProfile({ ...profile, phone_number: e.target.value })
            }
          />
          <FormInput
            label={t('Notas')}
            value={profile.notes}
            onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={profile.marketing_opt_in}
              onChange={(e) =>
                setProfile({ ...profile, marketing_opt_in: e.target.checked })
              }
            />
            <span>{t('Receber comunicações de marketing')}</span>
          </label>
          <FormButton type="submit" variant="link" disabled={saving}>
            {saving ? t('Salvando…') : t('Salvar')}
          </FormButton>
          {error && <p className="text-sm text-red-600">{error.message}</p>}
          {saved && <p className="text-sm text-green-700">{t('Salvo')}</p>}
        </form>
      )}
    </ClientLayout>
  );
}
