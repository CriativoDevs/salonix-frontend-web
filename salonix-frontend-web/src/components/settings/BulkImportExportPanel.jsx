import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import JSZip from 'jszip';
import { useTenant } from '../../hooks/useTenant';
import { downloadBlob } from '../../api/reports';
import {
  exportCustomersCSV,
  fetchCustomersImportTemplate,
  importCustomersCSV,
} from '../../api/customers';
import {
  exportServicesCSV,
  fetchServicesImportTemplate,
  importServicesCSV,
} from '../../api/services';
import { exportStaffCSV, fetchStaffImportTemplate, importStaffCSV } from '../../api/staff';
import {
  exportAppointmentsCSV,
  fetchAppointmentsImportTemplate,
  importAppointmentsCSV,
} from '../../api/appointments';

const ENTITY_CONFIG = [
  { key: 'customers', fileName: 'customers.csv', importFn: importCustomersCSV },
  { key: 'services', fileName: 'services.csv', importFn: importServicesCSV },
  { key: 'staff', fileName: 'staff.csv', importFn: importStaffCSV },
  { key: 'appointments', fileName: 'appointments.csv', importFn: importAppointmentsCSV },
];

const ENTITY_FILE_NAMES = ENTITY_CONFIG.reduce((acc, entity) => {
  acc[entity.key] = entity.fileName;
  return acc;
}, {});

function interpolate(template, values) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (match, token) =>
    Object.prototype.hasOwnProperty.call(values, token) ? String(values[token]) : match
  );
}

async function readZipEntities(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);
  const entries = {};
  await Promise.all(
    ENTITY_CONFIG.map(async ({ key, fileName }) => {
      const entry = zip.files[fileName];
      if (!entry || entry.dir) return;
      const blob = await entry.async('blob');
      entries[key] = new File([blob], fileName, { type: 'text/csv' });
    })
  );
  return entries;
}

function BulkImportExportPanel() {
  const { t } = useTranslation();
  const { slug } = useTenant();
  const [exporting, setExporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [error, setError] = useState(null);

  const [zipFile, setZipFile] = useState(null);
  const [zipEntities, setZipEntities] = useState(null);
  const [previewSummaries, setPreviewSummaries] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const fileInputRef = useRef(null);

  const handleExportAll = async () => {
    if (exporting) return;
    setExporting(true);
    setError(null);
    try {
      const [customers, services, staff, appointments] = await Promise.all([
        exportCustomersCSV({ slug }),
        exportServicesCSV({ slug }),
        exportStaffCSV({ slug }),
        exportAppointmentsCSV({ slug }),
      ]);
      const zip = new JSZip();
      zip.file(ENTITY_FILE_NAMES.customers, customers);
      zip.file(ENTITY_FILE_NAMES.services, services);
      zip.file(ENTITY_FILE_NAMES.staff, staff);
      zip.file(ENTITY_FILE_NAMES.appointments, appointments);
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, `dados-${slug || 'salao'}.zip`);
    } catch {
      setError(t('settings.bulk.errors.export', 'Não foi possível exportar os dados.'));
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplateZip = async () => {
    if (downloadingTemplate) return;
    setDownloadingTemplate(true);
    setError(null);
    try {
      const [customers, services, staff, appointments] = await Promise.all([
        fetchCustomersImportTemplate({ slug }),
        fetchServicesImportTemplate({ slug }),
        fetchStaffImportTemplate({ slug }),
        fetchAppointmentsImportTemplate({ slug }),
      ]);
      const zip = new JSZip();
      zip.file(ENTITY_FILE_NAMES.customers, customers);
      zip.file(ENTITY_FILE_NAMES.services, services);
      zip.file(ENTITY_FILE_NAMES.staff, staff);
      zip.file(ENTITY_FILE_NAMES.appointments, appointments);
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, 'modelo-dados.zip');
    } catch {
      setError(t('settings.bulk.errors.template', 'Não foi possível baixar o modelo.'));
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleZipFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setError(null);
    setPreviewSummaries(null);
    setImportDone(false);
    setZipEntities(null);
    setZipFile(file);
  };

  const handlePreview = async () => {
    if (!zipFile || previewing) return;
    setPreviewing(true);
    setError(null);
    try {
      const entities = await readZipEntities(zipFile);
      const presentEntities = ENTITY_CONFIG.filter((entity) => entities[entity.key]);
      if (presentEntities.length === 0) {
        setError(
          t(
            'settings.bulk.errors.zip_empty',
            'O ficheiro .zip não contém nenhum CSV reconhecido.'
          )
        );
        return;
      }
      const results = await Promise.all(
        presentEntities.map(async (entity) => {
          const data = await entity.importFn(entities[entity.key], {
            dryRun: true,
            slug,
          });
          return { key: entity.key, summary: data?.summary };
        })
      );
      const summaries = {};
      results.forEach(({ key, summary }) => {
        summaries[key] = summary;
      });
      setZipEntities(entities);
      setPreviewSummaries(summaries);
    } catch {
      setError(
        t('settings.bulk.errors.preview', 'Não foi possível validar o ficheiro .zip.')
      );
    } finally {
      setPreviewing(false);
    }
  };

  const hasBlockingErrors =
    previewSummaries &&
    Object.values(previewSummaries).some((summary) => (summary?.errors?.length || 0) > 0);

  const handleConfirm = async () => {
    if (!zipEntities || !previewSummaries || hasBlockingErrors || confirming) return;
    setConfirming(true);
    setError(null);
    try {
      const presentEntities = ENTITY_CONFIG.filter((entity) => zipEntities[entity.key]);
      await Promise.all(
        presentEntities.map((entity) =>
          entity.importFn(zipEntities[entity.key], { dryRun: false, slug })
        )
      );
      setImportDone(true);
    } catch {
      setError(t('settings.bulk.errors.confirm', 'Não foi possível importar os dados.'));
    } finally {
      setConfirming(false);
    }
  };

  const handleImportAnother = () => {
    setZipFile(null);
    setZipEntities(null);
    setPreviewSummaries(null);
    setImportDone(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4 rounded-2xl border border-brand-border bg-brand-surface/95 p-5">
      <div>
        <h2 className="text-lg font-semibold text-brand-surfaceForeground">
          {t('settings.bulk.title', 'Importar/Exportar tudo')}
        </h2>
        <p className="mt-1 text-sm text-brand-surfaceForeground/70">
          {t(
            'settings.bulk.description',
            'Exporte ou importe clientes, serviços, staff e agendamentos de uma vez, num único ficheiro .zip.'
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleDownloadTemplateZip}
          disabled={downloadingTemplate}
          className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50"
        >
          {downloadingTemplate
            ? t('settings.bulk.actions.downloading_template', 'A preparar...')
            : t('settings.bulk.actions.download_template', 'Baixar modelo ZIP')}
        </button>
        <button
          type="button"
          onClick={handleExportAll}
          disabled={exporting}
          className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50"
        >
          {exporting
            ? t('settings.bulk.actions.exporting', 'A exportar...')
            : t('settings.bulk.actions.export_all', 'Exportar tudo (.zip)')}
        </button>
      </div>

      <div className="border-t border-brand-border pt-4">
        {importDone ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {t('settings.bulk.success', 'Dados importados com sucesso!')}
            </div>
            <button
              type="button"
              onClick={handleImportAnother}
              className="text-sm font-medium text-brand-primary hover:underline"
            >
              {t('settings.bulk.actions.import_another', 'Importar outro ficheiro')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-brand-surfaceForeground">
                {t('settings.bulk.fields.file', 'Ficheiro ZIP')}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,application/zip"
                aria-label={t('settings.bulk.fields.file', 'Ficheiro ZIP')}
                onChange={handleZipFileChange}
                className="mt-2 block w-full text-sm text-brand-surfaceForeground/80"
              />
            </div>

            {previewSummaries ? (
              <div className="space-y-3">
                {ENTITY_CONFIG.filter((entity) => previewSummaries[entity.key]).map(
                  (entity) => {
                    const summary = previewSummaries[entity.key];
                    return (
                      <div
                        key={entity.key}
                        className="rounded-lg border border-brand-border bg-brand-light/40 p-3"
                      >
                        <p className="text-sm font-medium text-brand-surfaceForeground">
                          {entity.fileName}
                        </p>
                        <ul className="mt-1 space-y-1 text-sm text-brand-surfaceForeground/80">
                          <li>
                            {t(
                              'settings.bulk.summary.created',
                              interpolate('Criados: {{count}}', {
                                count: summary.created ?? 0,
                              }),
                              { count: summary.created ?? 0 }
                            )}
                          </li>
                          <li>
                            {t(
                              'settings.bulk.summary.updated',
                              interpolate('Atualizados: {{count}}', {
                                count: summary.updated ?? 0,
                              }),
                              { count: summary.updated ?? 0 }
                            )}
                          </li>
                        </ul>
                        {(summary.errors || []).length > 0 ? (
                          <div className="mt-2 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                            {summary.errors.map((rowError, index) => (
                              <p key={`${entity.key}-${rowError.line}-${index}`}>
                                {t(
                                  'settings.bulk.summary.row_error',
                                  interpolate('Linha {{line}}: {{error}}', {
                                    line: rowError.line,
                                    error: rowError.error,
                                  }),
                                  { line: rowError.line, error: rowError.error }
                                )}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  }
                )}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="flex justify-end gap-3">
              {previewSummaries ? (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={hasBlockingErrors || confirming}
                  className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {confirming
                    ? t('settings.bulk.actions.confirming', 'A importar...')
                    : t('settings.bulk.actions.confirm', 'Confirmar importação')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={!zipFile || previewing}
                  className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {previewing
                    ? t('settings.bulk.actions.previewing', 'A validar...')
                    : t('settings.bulk.actions.preview', 'Pré-visualizar')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BulkImportExportPanel;
