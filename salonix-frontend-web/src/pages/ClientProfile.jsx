import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ClientLayout from '../layouts/ClientLayout';
import PageHeader from '../components/ui/PageHeader';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';
import {
  fetchClientProfile,
  updateClientProfile,
  updateClientProfilePhoto,
} from '../api/clientMe';
import { clearClientTokens } from '../utils/clientAuthStorage';
import { clearTokens } from '../utils/authStorage';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

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
    marketing_opt_in: false,
  });
  const [photo, setPhoto] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const photoInputRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (saved) {
      setStatusMessage(t('client_profile.saved', 'Salvo'));
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
        if (!cancelled) {
          setProfile({
            name: data?.name || '',
            email: data?.email || '',
            phone_number: data?.phone_number || '',
            marketing_opt_in: Boolean(data?.marketing_opt_in),
          });
          setPhoto(data?.photo || '');
        }
      } catch {
        if (!cancelled)
          setError({
            message: t(
              'client_profile.errors.load_failed',
              'Falha ao carregar perfil.'
            ),
          });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const onPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setPhotoError(null);

    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError({
        message: t(
          'client_profile.errors.photo_too_large',
          'A imagem deve ter no máximo 2MB.'
        ),
      });
      return;
    }

    setPhotoUploading(true);
    try {
      const updated = await updateClientProfilePhoto(file);
      setPhoto(updated?.photo || '');
    } catch {
      setPhotoError({
        message: t(
          'client_profile.errors.photo_failed',
          'Falha ao enviar a foto. Verifique o formato e as dimensões.'
        ),
      });
    } finally {
      setPhotoUploading(false);
    }
  };

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
        marketing_opt_in: Boolean(updated?.marketing_opt_in),
      });
      setSaved(true);
      setStatusMessage(
        t('client_profile.success', 'Perfil salvo com sucesso.')
      );
    } catch {
      const message = t(
        'client_profile.errors.save_failed',
        'Falha ao salvar perfil.'
      );
      setError({ message });
      setStatusMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClientLayout>
      <PageHeader title={t('client_profile.title', 'Perfil do Cliente')} />
      {loading ? (
        <p className="text-sm text-gray-500">
          {t('client_profile.loading', 'Carregando…')}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 max-w-xl space-y-4 pb-24">
          <div className="flex items-center gap-4">
            {photo ? (
              <img
                src={photo}
                alt={t('client_profile.photo_alt', 'Foto de perfil')}
                className="h-20 w-20 rounded-full object-cover border border-brand-border"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-brand-border text-xs text-brand-surfaceForeground/60">
                {t('client_profile.photo_empty', 'Sem foto')}
              </div>
            )}
            <div>
              <FormButton
                type="button"
                variant="link"
                disabled={photoUploading}
                onClick={() => photoInputRef.current?.click()}
              >
                {photoUploading
                  ? t('client_profile.photo_uploading', 'A enviar…')
                  : photo
                    ? t('client_profile.photo_change', 'Alterar foto')
                    : t('client_profile.photo_add', 'Adicionar foto')}
              </FormButton>
              <p className="mt-1 text-xs text-brand-surfaceForeground/60">
                {t(
                  'client_profile.photo_requirements',
                  'PNG, JPEG ou WebP até 2MB, entre 50x50 e 2000x2000 pixels.'
                )}
              </p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={onPhotoChange}
                aria-label={t('client_profile.photo', 'Foto de perfil')}
              />
            </div>
          </div>
          {photoError && (
            <div
              role="alert"
              className="rounded-md border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-400"
            >
              {photoError.message}
            </div>
          )}
          <FormInput
            label={t('client_profile.name', 'Nome')}
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
          <FormInput
            label={t('client_profile.email', 'E-mail')}
            value={profile.email}
            disabled
            description={t('client_profile.email_readonly')}
          />
          <FormInput
            label={t('client_profile.phone', 'Telefone')}
            value={profile.phone_number}
            onChange={(e) =>
              setProfile({ ...profile, phone_number: e.target.value })
            }
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={profile.marketing_opt_in}
              onChange={(e) =>
                setProfile({ ...profile, marketing_opt_in: e.target.checked })
              }
            />
            <span>
              {t(
                'client_profile.marketing_opt_in',
                'Receber comunicações de marketing'
              )}
            </span>
          </label>
          <FormButton
            type="submit"
            variant="link"
            disabled={saving}
            aria-label={
              saving
                ? t('client_profile.saving', 'Salvando…')
                : t('client_profile.save', 'Salvar')
            }
          >
            {saving
              ? t('client_profile.saving', 'Salvando…')
              : t('client_profile.save', 'Salvar')}
          </FormButton>

          <div aria-live="polite" role="status" className="mt-2">
            {saving && (
              <div className="rounded-md border border-brand-border bg-brand-light px-3 py-2 text-xs text-brand-surfaceForeground">
                {t('client_profile.saving', 'Salvando…')}
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
              clearClientTokens();
              clearTokens();
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
