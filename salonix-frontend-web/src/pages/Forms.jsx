import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import FullPageLayout from '../layouts/FullPageLayout';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import FormEditorModal from '../components/forms/FormEditorModal';
import { fetchForms, createForm, updateForm, deleteForm } from '../api/forms';
import { parseApiError } from '../utils/apiError';
import { useTenant } from '../hooks/useTenant';

function ActionButton({ children, tone = 'secondary', ...props }) {
  const toneClass =
    tone === 'primary'
      ? 'border-brand-primary/20 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15'
      : tone === 'danger'
        ? 'border-rose-500/20 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15'
        : 'border-brand-border bg-brand-light/50 text-brand-surfaceForeground/80 hover:bg-brand-light';
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Forms() {
  const { t } = useTranslation();
  const { slug } = useTenant();

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [editorBusy, setEditorBusy] = useState(false);
  const [editorError, setEditorError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadForms = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchForms({ slug })
      .then((data) => {
        if (!cancelled) setForms(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            parseApiError(err, t('common.load_error', 'Falha ao carregar.'))
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, t]);

  useEffect(() => loadForms(), [loadForms]);

  const openEditor = (form = null) => {
    setEditingForm(form);
    setEditorError(null);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingForm(null);
    setEditorError(null);
  };

  const handleSubmit = async (payload) => {
    setEditorBusy(true);
    try {
      if (editingForm?.id) {
        const updated = await updateForm(editingForm.id, payload, { slug });
        setForms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      } else {
        const created = await createForm(payload, { slug });
        setForms((prev) => [created, ...prev]);
      }
      closeEditor();
    } catch (err) {
      setEditorError(
        parseApiError(err, t('common.save_error', 'Falha ao salvar.'))
      );
    } finally {
      setEditorBusy(false);
    }
  };

  const removeForm = async (form) => {
    if (
      !window.confirm(
        t(
          'forms.confirm_delete',
          'Remover a ficha "{{title}}"? As respostas de todos os clientes também serão apagadas.',
          { title: form.title }
        )
      )
    ) {
      return;
    }
    try {
      setBusyId(form.id);
      await deleteForm(form.id, { slug });
      setForms((prev) => prev.filter((f) => f.id !== form.id));
    } catch (err) {
      setError(
        parseApiError(
          err,
          t('forms.errors.delete_failed', 'Não foi possível remover a ficha.')
        )
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <FullPageLayout>
      <div className="space-y-6">
        <PageHeader
          title={t('forms.title', 'Fichas de cliente')}
          subtitle={t(
            'forms.subtitle',
            'Crie fichas com os campos que a sua equipa precisa registar de cada cliente.'
          )}
        />

        <div>
          <button
            type="button"
            onClick={() => openEditor(null)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15"
          >
            <Plus className="h-4 w-4" />
            {t('forms.actions.create', 'Criar ficha')}
          </button>
        </div>

        <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-5 shadow-sm ring-1 ring-brand-border/70 sm:p-6">
          {error ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error.message}
            </div>
          ) : null}

          {loading ? (
            <p className="text-sm text-brand-surfaceForeground/70">
              {t('common.loading', 'Carregando...')}
            </p>
          ) : forms.length === 0 ? (
            <EmptyState
              title={t('forms.list.empty_title', 'Nenhuma ficha criada')}
              description={t(
                'forms.list.empty_description',
                'Crie a primeira ficha para registar informações adicionais dos clientes.'
              )}
              action={
                <ActionButton tone="primary" onClick={() => openEditor(null)}>
                  <Plus className="h-4 w-4" />
                  {t('forms.actions.create', 'Criar ficha')}
                </ActionButton>
              }
            />
          ) : (
            <div className="grid gap-3">
              {forms.map((form) => (
                <Card
                  key={form.id}
                  className="rounded-2xl border border-brand-border bg-brand-surface/80 p-4 shadow-sm ring-1 ring-brand-border/60"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-brand-surfaceForeground">
                          {form.title}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            form.is_active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-brand-light text-brand-surfaceForeground/70'
                          }`}
                        >
                          {form.is_active
                            ? t('forms.status.active', 'Ativa')
                            : t('forms.status.inactive', 'Inativa')}
                        </span>
                      </div>
                      <p className="text-xs text-brand-surfaceForeground/70">
                        {t('forms.list.fields_count', '{{count}} campos', {
                          count: form.fields?.length || 0,
                        })}
                        {form.client_editable
                          ? ` · ${t('forms.list.client_editable', 'Cliente pode editar')}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <ActionButton tone="primary" onClick={() => openEditor(form)}>
                        <Pencil className="h-3.5 w-3.5" />
                        {t('common.edit', 'Editar')}
                      </ActionButton>
                      <ActionButton
                        tone="danger"
                        disabled={busyId === form.id}
                        onClick={() => removeForm(form)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('common.delete', 'Excluir')}
                      </ActionButton>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>

      <FormEditorModal
        open={editorOpen}
        form={editingForm}
        busy={editorBusy}
        error={editorError}
        onClose={closeEditor}
        onSubmit={handleSubmit}
      />
    </FullPageLayout>
  );
}

export default Forms;
