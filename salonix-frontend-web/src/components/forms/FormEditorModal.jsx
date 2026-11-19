import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';

const FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'boolean',
  'select',
  'date',
];

const inputClass =
  'mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground';

let draftSeq = 0;
const nextKey = () => {
  draftSeq += 1;
  return `draft-${draftSeq}`;
};

function emptyField() {
  return {
    key: nextKey(),
    id: undefined,
    label: '',
    field_type: 'text',
    required: false,
    optionsText: '',
  };
}

function fieldFromApi(field) {
  return {
    key: `field-${field.id}`,
    id: field.id,
    label: field.label || '',
    field_type: field.field_type || 'text',
    required: Boolean(field.required),
    optionsText: Array.isArray(field.options) ? field.options.join('\n') : '',
  };
}

function parseOptions(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function FormEditorModal({
  open,
  form,
  busy = false,
  error = null,
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation();
  const formId = useId();
  const [title, setTitle] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [clientEditable, setClientEditable] = useState(false);
  const [fields, setFields] = useState([]);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setTitle(form?.title || '');
    setIsActive(form ? Boolean(form.is_active) : true);
    setClientEditable(Boolean(form?.client_editable));
    setFields(
      Array.isArray(form?.fields) ? form.fields.map(fieldFromApi) : []
    );
    setLocalError(null);
  }, [open, form]);

  const updateField = (key, patch) => {
    setFields((prev) =>
      prev.map((field) => (field.key === key ? { ...field, ...patch } : field))
    );
    setLocalError(null);
  };

  const moveField = (index, delta) => {
    setFields((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeField = (key) => {
    setFields((prev) => prev.filter((field) => field.key !== key));
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setLocalError(t('forms.errors.title_required', 'Informe o título da ficha.'));
      return;
    }

    for (const field of fields) {
      if (!field.label.trim()) {
        setLocalError(
          t('forms.errors.label_required', 'Todos os campos precisam de um nome.')
        );
        return;
      }
      if (
        field.field_type === 'select' &&
        parseOptions(field.optionsText).length === 0
      ) {
        setLocalError(
          t(
            'forms.errors.options_required',
            'Campos de seleção precisam de pelo menos uma opção.'
          )
        );
        return;
      }
    }

    await onSubmit?.({
      title: trimmedTitle,
      is_active: isActive,
      client_editable: clientEditable,
      fields: fields.map((field, index) => {
        const payload = {
          label: field.label.trim(),
          field_type: field.field_type,
          required: field.required,
          options:
            field.field_type === 'select' ? parseOptions(field.optionsText) : null,
          order: index,
        };
        // id existente preserva as respostas já gravadas (o BE recria sem id).
        if (field.id) payload.id = field.id;
        return payload;
      }),
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
      title={
        form?.id
          ? t('forms.editor.title_edit', 'Editar ficha')
          : t('forms.editor.title_new', 'Nova ficha')
      }
      description={t(
        'forms.editor.description',
        'Defina os campos que o cliente preenche. Campos já usados mantêm as respostas ao editar.'
      )}
      size="lg"
      footer={footer}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
          {t('forms.editor.form_title', 'Título da ficha')}
          <input
            type="text"
            value={title}
            maxLength={200}
            onChange={(event) => {
              setTitle(event.target.value);
              setLocalError(null);
            }}
            className={inputClass}
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 text-sm text-brand-surfaceForeground/80">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            {t('forms.editor.active', 'Ficha ativa')}
          </label>
          <label className="flex items-center gap-2 text-sm text-brand-surfaceForeground/80">
            <input
              type="checkbox"
              checked={clientEditable}
              onChange={(event) => setClientEditable(event.target.checked)}
            />
            {t(
              'forms.editor.client_editable',
              'Permitir que o cliente edite as próprias respostas'
            )}
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-surfaceForeground">
              {t('forms.editor.fields', 'Campos')}
            </h3>
            <button
              type="button"
              onClick={() => setFields((prev) => [...prev, emptyField()])}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1.5 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/15"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('forms.editor.add_field', 'Adicionar campo')}
            </button>
          </div>

          {fields.length === 0 ? (
            <p className="text-xs text-brand-surfaceForeground/60">
              {t(
                'forms.editor.no_fields',
                'Nenhum campo ainda. Adicione o primeiro campo.'
              )}
            </p>
          ) : (
            <ul className="space-y-3">
              {fields.map((field, index) => (
                <li
                  key={field.key}
                  data-testid="form-field-row"
                  className="rounded-2xl border border-brand-border bg-brand-light/10 p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <label className="flex flex-col text-xs font-medium text-brand-surfaceForeground/80">
                      {t('forms.editor.field_label', 'Nome do campo')}
                      <input
                        type="text"
                        value={field.label}
                        maxLength={200}
                        onChange={(event) =>
                          updateField(field.key, { label: event.target.value })
                        }
                        className={inputClass}
                      />
                    </label>
                    <label className="flex flex-col text-xs font-medium text-brand-surfaceForeground/80">
                      {t('forms.editor.field_type', 'Tipo')}
                      <select
                        value={field.field_type}
                        onChange={(event) =>
                          updateField(field.key, {
                            field_type: event.target.value,
                          })
                        }
                        className={inputClass}
                      >
                        {FIELD_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {t(`forms.field_types.${type}`, type)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {field.field_type === 'select' ? (
                    <label className="mt-3 flex flex-col text-xs font-medium text-brand-surfaceForeground/80">
                      {t('forms.editor.options', 'Opções (uma por linha)')}
                      <textarea
                        rows={3}
                        value={field.optionsText}
                        onChange={(event) =>
                          updateField(field.key, {
                            optionsText: event.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </label>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs text-brand-surfaceForeground/80">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(event) =>
                          updateField(field.key, {
                            required: event.target.checked,
                          })
                        }
                      />
                      {t('forms.editor.required', 'Obrigatório')}
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveField(index, -1)}
                        disabled={index === 0}
                        aria-label={t('forms.editor.move_up', 'Subir campo')}
                        className="rounded-full border border-brand-border p-1.5 text-brand-surfaceForeground/70 hover:bg-brand-light disabled:opacity-40"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveField(index, 1)}
                        disabled={index === fields.length - 1}
                        aria-label={t('forms.editor.move_down', 'Descer campo')}
                        className="rounded-full border border-brand-border p-1.5 text-brand-surfaceForeground/70 hover:bg-brand-light disabled:opacity-40"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeField(field.key)}
                        aria-label={t('forms.editor.remove_field', 'Remover campo')}
                        className="rounded-full border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-700 hover:bg-rose-500/15"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {form?.id ? (
            <p className="text-xs text-brand-surfaceForeground/60">
              {t(
                'forms.editor.remove_warning',
                'Remover um campo apaga as respostas já dadas a ele.'
              )}
            </p>
          ) : null}
        </div>

        {error?.message || localError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error?.message || localError}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}

export default FormEditorModal;
