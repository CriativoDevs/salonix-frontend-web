import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ClientLayout from '../layouts/ClientLayout';
import PageHeader from '../components/ui/PageHeader';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';
import { fetchClientProfile, updateClientProfile } from '../api/clientMe';

export default function ClientProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone_number: '',
    notes: '',
    marketing_opt_in: false,
  });
  const [saved, setSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (saved) {
      setStatusMessage(t('Salvo'));
      const timer = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [saved, t]);

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
            email: data?.email || '',
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
        email: updated?.email || '',
        phone_number: updated?.phone_number || '',
        notes: updated?.notes || '',
        marketing_opt_in: Boolean(updated?.marketing_opt_in),
      });
      setSaved(true);
      setStatusMessage(t('Perfil salvo com sucesso.'));
    } catch {
      setError({ message: t('Falha ao salvar perfil.') });
      setStatusMessage(t('Falha ao salvar perfil.'));
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
        <form onSubmit={onSubmit} className="mt-6 max-w-xl space-y-4 pb-24">
          <FormInput
            label={t('Nome')}
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
          <FormInput
            label={t('E-mail')}
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
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
          <FormButton
            type="submit"
            variant="link"
            disabled={saving}
            aria-label={saving ? t('Salvando…') : t('Salvar perfil')}
          >
            {saving ? t('Salvando…') : t('Salvar')}
          </FormButton>

          <div aria-live="polite" role="status" className="mt-2">
            {saving && (
              <div className="rounded-md border border-brand-border bg-brand-light px-3 py-2 text-xs text-brand-surfaceForeground">
                {t('Salvando…')}
              </div>
            )}
            {saved && (
              <div className="rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                {statusMessage}
              </div>
            )}
            {error && (
              <div
                role="alert"
                className="rounded-md border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-400"
              >
                {error.message}
              </div>
            )}
          </div>
        </form>
      )}

      <div className="mt-8 flex items-center justify-center">
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem('client_access_token');
              localStorage.removeItem('client_refresh_token');
            } catch {
              void 0;
            }
            navigate('/client/enter', { replace: true });
          }}
          className="text-brand-primary underline font-medium transition hover:text-brand-accent"
        >
          {t('nav.logout', 'Sair')}
        </button>
      </div>
    </ClientLayout>
  );
}
