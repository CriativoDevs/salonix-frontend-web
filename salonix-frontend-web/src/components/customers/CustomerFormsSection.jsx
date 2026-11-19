import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  fetchForms,
  fetchCustomerFormResponses,
  createFormResponse,
  updateFormResponse,
} from '../../api/forms';
import { parseApiError } from '../../utils/apiError';
import FormFieldInput from '../forms/FormFieldInput';

function initialAnswers(form, response) {
  const byField = {};
  (response?.answers || []).forEach((answer) => {
    byField[answer.field_id] = answer.value ?? '';
  });
  const values = {};
  (form.fields || []).forEach((field) => {
    const stored = byField[field.id];
    values[field.id] =
      stored !== undefined ? stored : field.field_type === 'boolean' ? 'false' : '';
  });
  return values;
}

function CustomerFormsSection({ customerId, slug }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  // Respostas de saúde/ficha vivem só neste estado: nada em storage, URL ou log.
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState({});
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [savedFormId, setSavedFormId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [allForms, allResponses] = await Promise.all([
        fetchForms({ slug }),
        fetchCustomerFormResponses(customerId, { slug }),
      ]);
      const activeForms = allForms.filter((form) => form.is_active);
      const byForm = {};
      allResponses.forEach((response) => {
        byForm[response.form] = response;
      });
      const nextValues = {};
      activeForms.forEach((form) => {
        nextValues[form.id] = initialAnswers(form, byForm[form.id]);
      });
      setForms(activeForms);
      setResponses(byForm);
      setValues(nextValues);
      setLoaded(true);
    } catch (err) {
      setLoadError(
        parseApiError(err, t('forms.fill.load_error', 'Não foi possível carregar as fichas.'))
      );
    } finally {
      setLoading(false);
    }
  }, [customerId, slug, t]);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !loaded && !loading) load();
  };

  const setValue = (formId, fieldId, value) => {
    setValues((prev) => ({
      ...prev,
      [formId]: { ...prev[formId], [fieldId]: value },
    }));
    setFormErrors((prev) => ({ ...prev, [formId]: null }));
    setSavedFormId(null);
  };

  const save = async (form) => {
    const formValues = values[form.id] || {};
    for (const field of form.fields || []) {
      if (field.required && !String(formValues[field.id] ?? '').trim()) {
        setFormErrors((prev) => ({
          ...prev,
          [form.id]: t(
            'forms.fill.required_error',
            'Preencha o campo obrigatório: {{label}}',
            { label: field.label }
          ),
        }));
        return;
      }
    }

    const answers = (form.fields || []).map((field) => ({
      field_id: field.id,
      value: String(formValues[field.id] ?? ''),
    }));

    setSaving(form.id);
    try {
      const existing = responses[form.id];
      const saved = existing
        ? await updateFormResponse(existing.id, { answers }, { slug })
        : await createFormResponse(
            { form: form.id, customer: customerId, answers },
            { slug }
          );
      setResponses((prev) => ({ ...prev, [form.id]: saved }));
      setSavedFormId(form.id);
    } catch (err) {
      setFormErrors((prev) => ({
        ...prev,
        [form.id]: parseApiError(
          err,
          t('forms.fill.save_error', 'Não foi possível salvar a ficha.')
        ).message,
      }));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-light/10 p-4">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-brand-surfaceForeground"
      >
        {t('forms.fill.title', 'Fichas do cliente')}
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {expanded ? (
        <div className="mt-3 space-y-4">
          {loading ? (
            <p className="text-xs text-brand-surfaceForeground/60">
              {t('common.loading', 'Carregando...')}
            </p>
          ) : null}
          {loadError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {loadError.message}
            </div>
          ) : null}
          {loaded && forms.length === 0 ? (
            <p className="text-xs text-brand-surfaceForeground/60">
              {t('forms.fill.empty', 'Nenhuma ficha ativa. Crie uma em Fichas.')}
            </p>
          ) : null}

          {forms.map((form) => (
            <section
              key={form.id}
              aria-label={form.title}
              className="space-y-3 rounded-xl border border-brand-border bg-brand-surface/80 p-3"
            >
              <h4 className="text-sm font-semibold text-brand-surfaceForeground">
                {form.title}
              </h4>
              {(form.fields || []).map((field) => (
                <FormFieldInput
                  key={field.id}
                  field={field}
                  value={values[form.id]?.[field.id] ?? ''}
                  onChange={(value) => setValue(form.id, field.id, value)}
                  t={t}
                />
              ))}
              {formErrors[form.id] ? (
                <p role="alert" className="text-xs text-rose-700">
                  {formErrors[form.id]}
                </p>
              ) : null}
              {savedFormId === form.id ? (
                <p role="status" className="text-xs text-emerald-700">
                  {t('forms.fill.saved', 'Ficha salva.')}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => save(form)}
                disabled={saving === form.id}
                className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50"
              >
                {saving === form.id
                  ? t('common.saving', 'Salvando...')
                  : t('forms.fill.save', 'Salvar ficha')}
              </button>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default CustomerFormsSection;
