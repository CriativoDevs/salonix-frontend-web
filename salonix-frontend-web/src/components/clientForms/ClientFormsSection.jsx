import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  fetchClientFormResponses,
  updateClientFormResponse,
} from '../../api/clientMe';
import { parseApiError } from '../../utils/apiError';
import FormFieldInput from '../forms/FormFieldInput';

function initialValues(response) {
  const byField = {};
  (response.answers || []).forEach((answer) => {
    byField[answer.field_id] = answer.value ?? '';
  });
  const values = {};
  (response.form_fields || []).forEach((field) => {
    const stored = byField[field.id];
    values[field.id] =
      stored !== undefined ? stored : field.field_type === 'boolean' ? 'false' : '';
  });
  return values;
}

function hasPending(response) {
  if (!response.form_client_editable) return false;
  const answered = {};
  (response.answers || []).forEach((a) => {
    answered[a.field_id] = String(a.value ?? '').trim();
  });
  return (response.form_fields || []).some(
    (field) => field.required && !answered[field.id]
  );
}

function formatDate(value, language) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(language || undefined);
}

function ReadOnlyValue({ field, value, t }) {
  let display = value;
  if (field.field_type === 'boolean') {
    display =
      value === 'true' ? t('common.yes', 'Sim') : t('common.no', 'Não');
  }
  return (
    <div className="text-sm">
      <dt className="text-xs text-brand-surfaceForeground/60">{field.label}</dt>
      <dd className="whitespace-pre-wrap text-brand-surfaceForeground">
        {String(display ?? '').trim() || '—'}
      </dd>
    </div>
  );
}

export default function ClientFormsSection() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  // Respostas de saúde vivem só neste estado: nada em storage, URL ou log.
  const [responses, setResponses] = useState([]);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(null);
  const [errors, setErrors] = useState({});
  const [savedId, setSavedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchClientFormResponses()
      .then((data) => {
        if (cancelled) return;
        setResponses(data);
        const next = {};
        const nextOpen = {};
        data.forEach((response) => {
          next[response.id] = initialValues(response);
          // Aberta se há pendência (obrigatório vazio) ou se é a única ficha.
          nextOpen[response.id] = data.length === 1 || hasPending(response);
        });
        setValues(next);
        setOpen(nextOpen);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          parseApiError(
            err,
            t('client_forms.load_error', 'Não foi possível carregar as suas fichas.')
          )
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const setValue = (responseId, fieldId, value) => {
    setValues((prev) => ({
      ...prev,
      [responseId]: { ...prev[responseId], [fieldId]: value },
    }));
    setErrors((prev) => ({ ...prev, [responseId]: null }));
    setSavedId(null);
  };

  const save = async (response) => {
    const formValues = values[response.id] || {};
    const fields = response.form_fields || [];
    for (const field of fields) {
      if (field.required && !String(formValues[field.id] ?? '').trim()) {
        setErrors((prev) => ({
          ...prev,
          [response.id]: t(
            'client_forms.required_error',
            'Preencha o campo obrigatório: {{label}}',
            { label: field.label }
          ),
        }));
        return;
      }
    }
    const answers = fields.map((field) => ({
      field_id: field.id,
      value: String(formValues[field.id] ?? ''),
    }));

    setSaving(response.id);
    try {
      const saved = await updateClientFormResponse(response.id, { answers });
      setResponses((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      setValues((prev) => ({ ...prev, [saved.id]: initialValues(saved) }));
      setSavedId(response.id);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [response.id]: parseApiError(
          err,
          t('client_forms.save_error', 'Não foi possível guardar a ficha.')
        ).message,
      }));
    } finally {
      setSaving(null);
    }
  };

  if (loading) return null;
  if (loadError) {
    return (
      <div className="mt-8 max-w-xl">
        <p role="alert" className="text-sm text-rose-400">
          {loadError.message}
        </p>
      </div>
    );
  }
  if (responses.length === 0) return null;

  return (
    <div className="mt-8 max-w-xl space-y-3">
      <h2 className="text-sm font-semibold text-brand-surfaceForeground">
        {t('client_forms.title', 'Minhas fichas')}
      </h2>
      {responses.map((response) => {
        const fields = response.form_fields || [];
        const editable = Boolean(response.form_client_editable);
        const isOpen = Boolean(open[response.id]);
        const pending = hasPending(response);
        const updated = formatDate(response.updated_at, i18n?.language);
        const panelId = `client-form-${response.id}`;
        return (
          <section
            key={response.id}
            aria-label={response.form_title}
            className="rounded-xl border border-brand-border bg-brand-surface"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() =>
                setOpen((prev) => ({ ...prev, [response.id]: !prev[response.id] }))
              }
              className="flex w-full items-start justify-between gap-3 p-4 text-left"
            >
              <span className="min-w-0 space-y-1">
                <span className="block text-sm font-semibold text-brand-surfaceForeground">
                  {response.form_title}
                </span>
                <span className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                      editable
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-brand-light text-brand-surfaceForeground/70'
                    }`}
                  >
                    {editable
                      ? t('client_forms.badge_editable', 'Editável')
                      : t('client_forms.badge_read_only', 'Só leitura')}
                  </span>
                  {pending ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                      {t('client_forms.badge_pending', 'Por preencher')}
                    </span>
                  ) : null}
                  {updated ? (
                    <span className="text-brand-surfaceForeground/60">
                      {t('client_forms.updated_at', 'Atualizada em {{date}}', {
                        date: updated,
                      })}
                    </span>
                  ) : null}
                </span>
              </span>
              {isOpen ? (
                <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />
              )}
            </button>

            {isOpen ? (
              <div
                id={panelId}
                className="space-y-4 border-t border-brand-border p-4"
              >
                {editable ? (
                  <>
                    {fields.map((field) => (
                      <FormFieldInput
                        key={field.id}
                        field={field}
                        value={values[response.id]?.[field.id] ?? ''}
                        onChange={(value) =>
                          setValue(response.id, field.id, value)
                        }
                        t={t}
                      />
                    ))}
                    {errors[response.id] ? (
                      <p role="alert" className="text-xs text-rose-400">
                        {errors[response.id]}
                      </p>
                    ) : null}
                    {savedId === response.id ? (
                      <p role="status" className="text-xs text-emerald-500">
                        {t('client_forms.saved', 'Ficha salva.')}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => save(response)}
                      disabled={saving === response.id}
                      className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50"
                    >
                      {saving === response.id
                        ? t('common.saving', 'Salvando...')
                        : t('client_forms.save', 'Salvar ficha')}
                    </button>
                  </>
                ) : (
                  <>
                    <dl className="space-y-3">
                      {fields.map((field) => (
                        <ReadOnlyValue
                          key={field.id}
                          field={field}
                          value={values[response.id]?.[field.id] ?? ''}
                          t={t}
                        />
                      ))}
                    </dl>
                    <p className="text-xs text-brand-surfaceForeground/60">
                      {t(
                        'client_forms.read_only',
                        'Esta ficha só pode ser alterada pelo estabelecimento.'
                      )}
                    </p>
                  </>
                )}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
