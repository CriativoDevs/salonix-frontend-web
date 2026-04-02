import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, ImagePlus } from 'lucide-react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';

function CustomerEditorModal({
  open,
  customer,
  busy = false,
  error = null,
  onClose,
  onSubmit,
}) {
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
  const [localError, setLocalError] = useState(null);
  const photoInputRef = useRef(null);
  const formId = useId();

  useEffect(() => {
    if (!open || !customer) return;
    setForm({
      name: customer.name || '',
      email: customer.email || '',
      phone_number: customer.phone_number || '',
      birthday: customer.birthday || '',
      notes: customer.notes || '',
      marketing_opt_in: Boolean(customer.marketing_opt_in),
    });
    setPhotoFile(null);
    setPhotoPreview(customer.photo || '');
    setLocalError(null);
  }, [open, customer]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(customer?.photo || '');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile, customer?.photo]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setLocalError(null);
  };

  const handleSave = async (event) => {
    event?.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone_number.trim();

    if (!name) {
      setLocalError(
        t('customers.errors.name_required', 'Informe o nome do cliente.')
      );
      return;
    }

    if (!email && !phone) {
      setLocalError(
        t(
          'customers.errors.contact_required',
          'Informe e-mail ou telefone para contato.'
        )
      );
      return;
    }

    await onSubmit?.({
      name,
      email,
      phone_number: phone,
      birthday: form.birthday || null,
      notes: form.notes.trim(),
      marketing_opt_in: Boolean(form.marketing_opt_in),
      photo: photoFile || undefined,
    });
  };

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        disabled={busy}
        className="text-sm font-medium text-brand-surfaceForeground/60 hover:underline disabled:opacity-50"
      >
        {t('common.cancel', 'Cancelar')}
      </button>
      <button
        type="submit"
        form={formId}
        disabled={busy}
        className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50"
      >
        {busy ? t('common.saving', 'Salvando...') : t('common.save', 'Salvar')}
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('customers.editor.title', 'Gerenciar cliente')}
      description={t(
        'customers.editor.description',
        'Atualize a identificacao visual e os dados principais do cliente.'
      )}
      size="lg"
      footer={footer}
    >
      <form id={formId} onSubmit={handleSave} className="space-y-5">
        <div className="rounded-2xl border border-dashed border-brand-border bg-brand-light/20 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-brand-surfaceForeground">
                {t('customers.editor.photo', 'Foto do cliente')}
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
                    ? t('customers.editor.change_photo', 'Alterar foto')
                    : t('customers.editor.add_photo', 'Adicionar foto')}
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
                aria-label={t('customers.editor.photo', 'Foto do cliente')}
                className="hidden"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] || null;
                  setPhotoFile(nextFile);
                  setLocalError(null);
                }}
              />
              <p className="max-w-md text-xs leading-5 text-brand-surfaceForeground/60">
                {t(
                  'customers.editor.photo_requirements',
                  'Use JPG, PNG, GIF ou WEBP com ate 2MB e dimensoes entre 50x50 e 2000x2000 pixels.'
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-brand-border bg-brand-surface/80 px-4 py-3">
              <Avatar
                src={photoPreview}
                alt={
                  form.name ||
                  t('customers.editor.photo_alt', 'Foto do cliente')
                }
              />
              <div className="text-xs text-brand-surfaceForeground/60">
                <p className="font-medium text-brand-surfaceForeground/80">
                  {photoPreview
                    ? t('customers.editor.photo_ready', 'Preview pronto')
                    : t('customers.editor.photo_empty', 'Sem foto adicionada')}
                </p>
                <p>
                  {photoPreview
                    ? t(
                        'customers.editor.photo_ready_hint',
                        'Clique no botao para trocar a imagem.'
                      )
                    : t(
                        'customers.editor.photo_empty_hint',
                        'Adicione uma foto para facilitar a identificacao.'
                      )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
            {t('customers.form.name', 'Nome')}
            <input
              type="text"
              value={form.name}
              onChange={(event) => handleChange('name', event.target.value)}
              className="mt-1 rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground"
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
            {t('customers.form.birthday', 'Aniversario')}
            <input
              type="date"
              value={form.birthday}
              onChange={(event) => handleChange('birthday', event.target.value)}
              className="mt-1 rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground"
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
            {t('customers.form.email', 'E-mail')}
            <input
              type="email"
              value={form.email}
              onChange={(event) => handleChange('email', event.target.value)}
              className="mt-1 rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground"
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
            {t('customers.form.phone', 'Telefone')}
            <input
              type="tel"
              value={form.phone_number}
              onChange={(event) =>
                handleChange('phone_number', event.target.value)
              }
              className="mt-1 rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground"
            />
          </label>
        </div>

        <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
          {t('customers.form.notes', 'Notas')}
          <textarea
            rows={4}
            value={form.notes}
            onChange={(event) => handleChange('notes', event.target.value)}
            className="mt-1 rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground"
          />
        </label>

        {error?.message || localError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error?.message || localError}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}

export default CustomerEditorModal;
