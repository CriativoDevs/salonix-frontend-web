import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';

const STEP_SELECT = 'select';
const STEP_PREVIEW = 'preview';
const STEP_DONE = 'done';

function ImportCustomersModal({
  open,
  onClose,
  onSubmit,
  onDownloadTemplate,
  onImported,
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState(STEP_SELECT);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setStep(STEP_SELECT);
      setFile(null);
      setSubmitting(false);
      setError(null);
      setSummary(null);
    }
  }, [open]);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setFile(nextFile);
    setError(null);
    setSummary(null);
    setStep(STEP_SELECT);
  };

  const handlePreview = async () => {
    if (!file || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await onSubmit(file, { dryRun: true });
      if (!result?.success) {
        setError(
          result?.error || {
            message: t(
              'customers.import.errors.generic',
              'Não foi possível processar o ficheiro.'
            ),
          }
        );
        return;
      }
      setSummary(result.summary);
      setStep(STEP_PREVIEW);
    } catch (err) {
      setError({
        message:
          err?.message ||
          t(
            'customers.import.errors.generic',
            'Não foi possível processar o ficheiro.'
          ),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!file || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await onSubmit(file, { dryRun: false });
      if (!result?.success) {
        setError(
          result?.error || {
            message: t(
              'customers.import.errors.generic',
              'Não foi possível importar os clientes.'
            ),
          }
        );
        return;
      }
      setSummary(result.summary);
      setStep(STEP_DONE);
      onImported?.();
    } catch (err) {
      setError({
        message:
          err?.message ||
          t(
            'customers.import.errors.generic',
            'Não foi possível importar os clientes.'
          ),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportAnother = () => {
    setStep(STEP_SELECT);
    setFile(null);
    setSummary(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const errorsList = summary?.errors || [];

  const footer =
    step === STEP_DONE ? (
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleImportAnother}
          className="text-sm font-medium text-brand-primary hover:underline"
        >
          {t('customers.import.actions.import_another', 'Importar outro ficheiro')}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-brand-surfaceForeground/60 hover:underline"
        >
          {t('common.close', 'Fechar')}
        </button>
      </div>
    ) : (
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-brand-surfaceForeground/60 hover:underline"
        >
          {t('common.cancel', 'Cancelar')}
        </button>
        {step === STEP_PREVIEW ? (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? t('customers.import.actions.confirming', 'A importar...')
              : t('customers.import.actions.confirm', 'Confirmar importação')}
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePreview}
            disabled={!file || submitting}
            className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? t('customers.import.actions.previewing', 'A validar...')
              : t('customers.import.actions.preview', 'Pré-visualizar')}
          </button>
        )}
      </div>
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('customers.import.title', 'Importar clientes')}
      description={t(
        'customers.import.description',
        'Importe clientes a partir de um ficheiro CSV. O ficheiro é validado antes de gravar.'
      )}
      footer={footer}
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={onDownloadTemplate}
          className="text-sm font-medium text-brand-primary hover:underline"
        >
          {t('customers.import.actions.download_template', 'Baixar modelo CSV')}
        </button>

        {step === STEP_DONE ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p>
              {t(
                'customers.import.success',
                'Clientes importados com sucesso!'
              )}
            </p>
            {summary ? (
              <p className="mt-2 text-xs text-emerald-700">
                {t(
                  'customers.import.summary.created',
                  'Criados: {{count}}',
                  { count: summary.created ?? 0 }
                )}
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-brand-surfaceForeground">
                {t('customers.import.fields.file', 'Ficheiro CSV')}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                aria-label={t('customers.import.fields.file', 'Ficheiro CSV')}
                onChange={handleFileChange}
                className="mt-2 block w-full text-sm text-brand-surfaceForeground/80"
              />
            </div>

            {step === STEP_PREVIEW && summary ? (
              <div className="space-y-3 rounded-lg border border-brand-border bg-brand-light/40 p-4">
                <p className="text-sm font-medium text-brand-surfaceForeground">
                  {t('customers.import.summary.title', 'Resumo da pré-visualização')}
                </p>
                <ul className="space-y-1 text-sm text-brand-surfaceForeground/80">
                  <li>
                    {t('customers.import.summary.created', 'Criados: {{count}}', {
                      count: summary.created ?? 0,
                    })}
                  </li>
                  <li>
                    {t('customers.import.summary.updated', 'Atualizados: {{count}}', {
                      count: summary.updated ?? 0,
                    })}
                  </li>
                  <li>
                    {t('customers.import.summary.skipped', 'Ignorados: {{count}}', {
                      count: summary.skipped ?? 0,
                    })}
                  </li>
                </ul>
                {errorsList.length > 0 ? (
                  <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    {errorsList.map((rowError, index) => (
                      <p key={`${rowError.line}-${index}`}>
                        {t(
                          'customers.import.summary.row_error',
                          'Linha {{line}}: {{error}}',
                          { line: rowError.line, error: rowError.error }
                        )}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <p>{error.message}</p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}

export default ImportCustomersModal;
