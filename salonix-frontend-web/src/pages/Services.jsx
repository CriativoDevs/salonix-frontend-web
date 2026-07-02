import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Filter, Plus, Upload } from 'lucide-react';
import FullPageLayout from '../layouts/FullPageLayout';
import ServiceForm from '../components/ServiceForm';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Dropdown from '../components/ui/Dropdown';
import ImportServicesModal from '../components/services/ImportServicesModal';
import {
  fetchServices,
  createService,
  updateService,
  deleteService,
  importServicesCSV,
  fetchServicesImportTemplate,
  exportServicesCSV,
} from '../api/services';
import { downloadBlob } from '../api/reports';
import { parseApiError } from '../utils/apiError';
import { useTenant } from '../hooks/useTenant';
import PaginationControls from '../components/ui/PaginationControls';

function Services() {
  const { t, i18n } = useTranslation();
  const { slug } = useTenant();
  const currentLanguage = i18n?.language || 'pt';
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [exportingServices, setExportingServices] = useState(false);

  const handleImportServices = async (file, { dryRun }) => {
    try {
      const data = await importServicesCSV(file, { dryRun, slug });
      return { success: true, summary: data?.summary };
    } catch (err) {
      return {
        success: false,
        error: parseApiError(
          err,
          t('services.import.errors.generic', 'Não foi possível processar o ficheiro.')
        ),
      };
    }
  };

  const handleDownloadServicesTemplate = async () => {
    try {
      const blob = await fetchServicesImportTemplate({ slug });
      downloadBlob(blob, 'modelo-servicos.csv');
    } catch (err) {
      setError(
        parseApiError(err, t('services.import.errors.template', 'Não foi possível baixar o modelo.'))
      );
    }
  };

  const handleExportServices = async () => {
    if (exportingServices) return;
    setExportingServices(true);
    try {
      const blob = await exportServicesCSV({ slug });
      downloadBlob(blob, `servicos-${slug || 'salao'}.csv`);
    } catch (err) {
      setError(
        parseApiError(err, t('services.export.error', 'Não foi possível exportar os serviços.'))
      );
    } finally {
      setExportingServices(false);
    }
  };
  const [createBusy, setCreateBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState({
    name: '',
    price_eur: '',
    duration_minutes: '',
  });
  const [busyId, setBusyId] = useState(null);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
  const SORT_RECENT = 'recent';
  const SORT_NAME = 'name';
  const [sortOption, setSortOption] = useState(SORT_RECENT);

  // ordenação derivada de sortOption
  const orderingFromSort = sortOption === SORT_NAME ? 'name' : '-created_at';

  // Inicializa ordering a partir da URL (se presente)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ord = params.get('ordering');
      if (ord === 'name') {
        setSortOption(SORT_NAME);
      } else if (ord === '-created_at') {
        setSortOption(SORT_RECENT);
      }
    } catch {
      // noop
    }
  }, []);

  // Sincroniza ordering na URL quando mudar
  useEffect(() => {
    try {
      const next = orderingFromSort;
      const params = new URLSearchParams(window.location.search);
      if (params.get('ordering') !== next) {
        params.set('ordering', next);
        const url = window.location.pathname + '?' + params.toString();
        window.history.replaceState(null, '', url);
      }
    } catch {
      // noop
    }
    // reset de offset ao mudar ordenação
    setOffset(0);
  }, [sortOption, orderingFromSort]);

  const loadServices = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchServices({ slug, params: { ordering: orderingFromSort } })
      .then((payload) => {
        if (cancelled) return;
        const list = Array.isArray(payload) ? payload : [];
        setServices(list);
      })
      .catch(
        (e) => !cancelled && setError(parseApiError(e, t('common.load_error')))
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [orderingFromSort, slug, t]);

  useEffect(() => {
    const cleanup = loadServices();
    return cleanup;
  }, [loadServices]);

  const handleAddService = async (newService) => {
    try {
      setCreateBusy(true);
      setError(null);
      await createService({ ...newService, slug });
      loadServices();
      setOffset(0);
    } catch (e) {
      setError(parseApiError(e, t('common.save_error', 'Falha ao salvar.')));
      throw e;
    } finally {
      setCreateBusy(false);
    }
  };

  const startEdit = (svc) => {
    setEditingId(svc.id);
    setEditingForm({
      name: svc.name || '',
      price_eur: svc.price_eur ?? '',
      duration_minutes: svc.duration_minutes ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingForm({ name: '', price_eur: '', duration_minutes: '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      setBusyId(editingId);
      await updateService(editingId, editingForm);
      loadServices();
      cancelEdit();
    } catch (e) {
      setError(parseApiError(e, t('common.save_error', 'Falha ao salvar.')));
    } finally {
      setBusyId(null);
    }
  };

  const removeService = async (id) => {
    if (!window.confirm(t('common.confirm_delete', 'Confirmar exclusão?')))
      return;
    try {
      setBusyId(id);
      await deleteService(id);
      loadServices();
    } catch (e) {
      setError(parseApiError(e, t('common.delete_error', 'Falha ao excluir.')));
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    setOffset(0);
  }, [search, sortOption]);

  const filteredServices = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return services;
    return services.filter((service) =>
      String(service?.name || '')
        .toLocaleLowerCase()
        .includes(term)
    );
  }, [search, services]);

  const pagedServices = useMemo(
    () => filteredServices.slice(offset, offset + limit),
    [filteredServices, limit, offset]
  );

  const hasActiveFilters = Boolean(search.trim()) || sortOption !== SORT_RECENT;
  const totalServices = services.length;

  const formatMoney = (value) => {
    const numericValue = Number.parseFloat(value);
    if (Number.isNaN(numericValue)) return `€${value ?? '0'}`;
    return new Intl.NumberFormat(currentLanguage === 'pt' ? 'pt-PT' : 'en-IE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(numericValue);
  };

  return (
    <FullPageLayout>
      <div className="space-y-6">
        <PageHeader
          title={t('services.title', 'Serviços')}
          subtitle={t(
            'services.subtitle',
            'Organize os serviços como um catálogo claro, com preço e duração fáceis de comparar no dia a dia.'
          )}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={() => setCreatePanelOpen((current) => !current)}
            aria-expanded={createPanelOpen}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15"
          >
            <Plus className="h-4 w-4" />
            {createPanelOpen
              ? t('services.form.hide', 'Fechar adicionar serviço')
              : t('services.form.show', 'Adicionar serviço')}
            {createPanelOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <Dropdown
            trigger={
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-border bg-brand-light/50 px-4 py-2 text-sm font-semibold text-brand-surfaceForeground/80 transition hover:bg-brand-light"
              >
                <Upload className="h-4 w-4" />
                {t('services.import_export.trigger', 'Importar/Exportar')}
              </button>
            }
            items={[
              {
                label: t('services.import_export.import', 'Importar serviços'),
                onClick: () => setIsImportModalOpen(true),
              },
              {
                label: exportingServices
                  ? t('services.import_export.exporting', 'A exportar...')
                  : t('services.import_export.export', 'Exportar serviços'),
                onClick: handleExportServices,
              },
            ]}
          />

          <button
            type="button"
            onClick={() => setFiltersPanelOpen((current) => !current)}
            aria-expanded={filtersPanelOpen}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-border bg-brand-light/50 px-4 py-2 text-sm font-semibold text-brand-surfaceForeground/80 transition hover:bg-brand-light"
          >
            <Filter className="h-4 w-4" />
            {filtersPanelOpen
              ? t('services.filters.hide', 'Fechar filtros')
              : t('services.filters.show', 'Filtros')}
            {filtersPanelOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-brand-surfaceForeground/65">
              {search.trim() ? (
                <span className="rounded-full border border-brand-border bg-brand-light/40 px-3 py-1">
                  {t('services.filters.search_active', {
                    defaultValue: 'Busca: {{term}}',
                    term: search.trim(),
                  })}
                </span>
              ) : null}
              {sortOption !== SORT_RECENT ? (
                <span className="rounded-full border border-brand-border bg-brand-light/40 px-3 py-1">
                  {t('services.filters.order_active', 'Ordenação: nome')}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {createPanelOpen ? (
          <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-5 shadow-sm ring-1 ring-brand-border/70 sm:p-6">
            <div className="max-w-5xl">
              <h2 className="text-xl font-semibold text-brand-surfaceForeground">
                {t('services.form.title', 'Adicionar serviço')}
              </h2>
              <p className="mt-1 text-sm text-brand-surfaceForeground/70">
                {t(
                  'services.form.description',
                  'Cadastre serviços com nome comercial claro, preço bem definido e duração coerente para melhorar agenda e conversão.'
                )}
              </p>
              <div className="mt-4 rounded-2xl border border-brand-border bg-brand-light/35 p-4 text-sm text-brand-surfaceForeground/75">
                {t(
                  'services.form.tip',
                  'Serviços bem padronizados deixam a equipa mais rápida no atendimento e reduzem erros de preço e duração.'
                )}
              </div>
              <div className="mt-5">
                <ServiceForm onAdd={handleAddService} busy={createBusy} />
              </div>
            </div>
          </Card>
        ) : null}

        {filtersPanelOpen ? (
          <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-5 shadow-sm ring-1 ring-brand-border/70 sm:p-6">
            <div
              className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)] md:items-end"
              key={i18n.language}
            >
              <label className="flex flex-col gap-2 text-sm font-medium text-brand-surfaceForeground/80">
                {t('services.filters.order', 'Ordenar por')}
                <select
                  id="svc-ordering"
                  className="rounded-xl border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-primary)',
                  }}
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value={SORT_RECENT}>
                    {t('common.recent', 'Mais recentes')}
                  </option>
                  <option value={SORT_NAME}>{t('common.name', 'Nome')}</option>
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-brand-surfaceForeground/80">
                {t('services.filters.search', 'Busca')}
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t(
                    'services.filters.search_placeholder',
                    'Buscar serviço por nome'
                  )}
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-primary)',
                  }}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </label>
            </div>
          </Card>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-4 shadow-sm ring-1 ring-brand-border/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-surfaceForeground/45">
              {t('services.stats.total', 'Total de serviços')}
            </p>
            <p className="mt-3 text-3xl font-semibold text-brand-surfaceForeground">
              {totalServices}
            </p>
          </Card>
          <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-4 shadow-sm ring-1 ring-brand-border/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-surfaceForeground/45">
              {t('services.stats.visible', 'Visíveis agora')}
            </p>
            <p className="mt-3 text-3xl font-semibold text-brand-surfaceForeground">
              {filteredServices.length}
            </p>
          </Card>
        </div>

        {loading ? (
          <p className="text-sm text-gray-600">{t('common.loading')}</p>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error.message}</p> : null}

        {!loading && !error && filteredServices.length > 0 ? (
          <div className="space-y-3">
            {pagedServices.map((service) => (
              <Card
                key={service.id}
                className="rounded-2xl border border-brand-border bg-brand-surface/95 p-4 shadow-sm ring-1 ring-brand-border/70"
              >
                {editingId === service.id ? (
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)]">
                    <input
                      className="w-full rounded-xl border px-3 py-2.5 text-sm"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-primary)',
                      }}
                      value={editingForm.name}
                      onChange={(e) =>
                        setEditingForm({ ...editingForm, name: e.target.value })
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-xl border px-3 py-2.5 text-sm"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-primary)',
                      }}
                      value={editingForm.price_eur}
                      onChange={(e) =>
                        setEditingForm({
                          ...editingForm,
                          price_eur: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="w-full rounded-xl border px-3 py-2.5 text-sm"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-primary)',
                      }}
                      value={editingForm.duration_minutes}
                      onChange={(e) =>
                        setEditingForm({
                          ...editingForm,
                          duration_minutes: e.target.value,
                        })
                      }
                    />
                    <div className="lg:col-span-3 flex flex-wrap gap-2 pt-1">
                      <button
                        disabled={busyId === service.id}
                        onClick={saveEdit}
                        className="inline-flex items-center justify-center rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15 disabled:opacity-50"
                      >
                        {t('common.save', 'Salvar')}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center justify-center rounded-full border border-brand-border bg-brand-light/50 px-4 py-2 text-sm font-semibold text-brand-surfaceForeground/80 transition hover:bg-brand-light"
                      >
                        {t('common.cancel', 'Cancelar')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-brand-surfaceForeground">
                          {service.name}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {t('services.list.price', 'Preço')}:{' '}
                          {formatMoney(service.price_eur ?? service.price)}
                        </span>
                        <span className="rounded-full border border-sky-500/15 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700">
                          {t('services.list.duration', 'Duração')}:{' '}
                          {service.duration_minutes ?? service.duration} min
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        onClick={() => startEdit(service)}
                        className="inline-flex items-center justify-center rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15"
                      >
                        {t('common.edit', 'Editar')}
                      </button>
                      <button
                        disabled={busyId === service.id}
                        onClick={() => removeService(service.id)}
                        className="inline-flex items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/15 disabled:opacity-50"
                      >
                        {t('common.delete', 'Excluir')}
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            ))}

            <PaginationControls
              totalCount={filteredServices.length}
              limit={limit}
              offset={offset}
              onChangeLimit={(n) => {
                setLimit(n);
                setOffset(0);
              }}
              onPrev={() => setOffset((prev) => Math.max(0, prev - limit))}
              onNext={() =>
                setOffset((prev) =>
                  prev + limit < filteredServices.length ? prev + limit : prev
                )
              }
              className="mt-6"
            />
          </div>
        ) : null}

        {!loading && !error && filteredServices.length === 0 ? (
          <EmptyState
            title={t('services.empty_title', 'Nenhum serviço encontrado')}
            description={
              services.length === 0
                ? t(
                    'services.empty_description',
                    'Comece cadastrando os serviços principais do salão para montar seu catálogo operacional.'
                  )
                : t(
                    'services.empty_filtered',
                    'Nenhum serviço corresponde aos filtros atuais.'
                  )
            }
          />
        ) : null}
      </div>

      <ImportServicesModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSubmit={handleImportServices}
        onDownloadTemplate={handleDownloadServicesTemplate}
        onImported={() => {
          setOffset(0);
          loadServices();
        }}
      />
    </FullPageLayout>
  );
}

export default Services;
