import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, ImagePlus } from 'lucide-react';
import Avatar from './ui/Avatar';

function CustomerForm({ onAdd, busy = false }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    birthday: '',
    notes: '',
    marketing_opt_in: false,
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [error, setError] = useState(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

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
        birthday: form.birthday || null,
        notes: form.notes.trim(),
        marketing_opt_in: Boolean(form.marketing_opt_in),
        photo: photoFile || undefined,
      });
      setForm({
        name: '',
        email: '',
        phone_number: '',
        birthday: '',
        notes: '',
        marketing_opt_in: false,
      });
      setPhotoFile(null);
    } catch (err) {
      setError(err?.message || t('common.save_error', 'Falha ao salvar.'));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-brand-border bg-brand-surface/80 p-4 shadow-sm"
    >
      <div className="rounded-2xl border border-dashed border-brand-border bg-brand-light/20 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-brand-surfaceForeground">
              {t('customers.form.photo', 'Foto do cliente')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-2 text-sm font-medium text-brand-primary transition hover:bg-brand-primary/15"
              >
                {photoPreview ? (
                  <Camera className="h-4 w-4" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {photoPreview
                  ? t('customers.form.change_photo', 'Alterar foto')
                  : t('customers.form.add_photo', 'Adicionar foto')}
              </button>
              {photoFile ? (
                <span className="text-xs text-brand-surfaceForeground/60">
                  {photoFile.name}
                </span>
              ) : null}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              aria-label={t('customers.form.photo', 'Foto do cliente')}
              className="hidden"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] || null;
                setPhotoFile(nextFile);
                setError(null);
              }}
            />
            <p className="max-w-md text-xs leading-5 text-brand-surfaceForeground/60">
              {t(
                'customers.form.photo_requirements',
                'Use JPG, PNG, GIF ou WEBP com ate 2MB e dimensoes entre 50x50 e 2000x2000 pixels.'
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-brand-border bg-brand-surface/80 px-4 py-3">
            <Avatar
              src={photoPreview}
              alt={
                form.name || t('customers.form.photo_alt', 'Foto do cliente')
              }
            />
            <div className="text-xs text-brand-surfaceForeground/60">
              <p className="font-medium text-brand-surfaceForeground/80">
                {photoPreview
                  ? t('customers.form.photo_ready', 'Preview pronto')
                  : t('customers.form.photo_empty', 'Sem foto adicionada')}
              </p>
              <p>
                {photoPreview
                  ? t(
                      'customers.form.photo_ready_hint',
                      'Clique no botao para trocar a imagem.'
                    )
                  : t(
                      'customers.form.photo_empty_hint',
                      'Adicione uma foto para facilitar a identificacao.'
                    )}
              </p>
            </div>
          </div>
        </div>
      </div>

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
          {t('customers.form.birthday', 'Aniversario')}
          <input
            type="date"
            value={form.birthday}
            onChange={(e) => handleChange('birthday', e.target.value)}
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

      {/* <label className="flex items-center gap-2 text-sm text-brand-surfaceForeground/80">
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
      </label> */}

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
