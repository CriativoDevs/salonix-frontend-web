import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Filter, Plus, Upload } from 'lucide-react';
import FullPageLayout from '../layouts/FullPageLayout';
import CustomerForm from '../components/CustomerForm';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import Dropdown from '../components/ui/Dropdown';
import CustomerEditorModal from '../components/customers/CustomerEditorModal';
import CustomerPhotoPreviewModal from '../components/customers/CustomerPhotoPreviewModal';
import ImportCustomersModal from '../components/customers/ImportCustomersModal';
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  resendCustomerInvite,
  importCustomersCSV,
  fetchCustomersImportTemplate,
  exportCustomersCSV,
} from '../api/customers';
import { downloadBlob } from '../api/reports';
import { useTenant } from '../hooks/useTenant';
import useCreditGate from '../hooks/useCreditGate';
import { parseApiError } from '../utils/apiError';
import {
  buildInviteTooltipLines,
  mapInviteStatusToKey,
  normalizeInviteMeta,
  resolveInviteStatusLabel,
  resolveInviteVariant,
} from '../utils/inviteStatus';
import PaginationControls from '../components/ui/PaginationControls';
import CreditBlockModal from '../components/credits/CreditBlockModal';
import CreditPurchaseModal from '../components/credits/CreditPurchaseModal';
import { resolveTenantAssetUrl } from '../utils/tenant';

const SORT_RECENT = 'recent';
const SORT_NAME = 'name';

function sortCustomers(list = [], option = SORT_RECENT) {
  const copy = Array.isArray(list) ? [...list] : [];
  if (option === SORT_NAME) {
    return copy.sort((a, b) => {
      const nameA = (a?.name || '').toLocaleLowerCase();
      const nameB = (b?.name || '').toLocaleLowerCase();
      return nameA.localeCompare(nameB);
    });
  }
  return copy.sort((a, b) => {
    const timeA = new Date(a?.created_at || 0).getTime();
    const timeB = new Date(b?.created_at || 0).getTime();
    if (Number.isNaN(timeA) && Number.isNaN(timeB)) {
      const nameA = (a?.name || '').toLocaleLowerCase();
      const nameB = (b?.name || '').toLocaleLowerCase();
      return nameA.localeCompare(nameB);
    }
    if (Number.isNaN(timeA)) return 1;
    if (Number.isNaN(timeB)) return -1;
    if (timeA === timeB) {
      const nameA = (a?.name || '').toLocaleLowerCase();
      const nameB = (b?.name || '').toLocaleLowerCase();
      return nameA.localeCompare(nameB);
    }
    return timeB - timeA;
  });
}

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString();
}

function formatBirthday(value) {
  if (!value) return '—';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

function getInitials(name) {
  const tokens = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!tokens.length) return 'CL';
  return tokens.map((token) => token.charAt(0).toUpperCase()).join('');
}

function CustomerAvatarButton({ customer, onClick, t }) {
  const photoSrc = resolveTenantAssetUrl(customer?.photo || '');
  const customerName = customer?.name || t('customers.card.unknown', 'Cliente');
  const content = photoSrc ? (
    <img
      src={photoSrc}
      alt={customerName}
      className="h-full w-full object-cover"
    />
  ) : (
    <span className="text-lg font-semibold text-brand-primary/75">
      {getInitials(customerName)}
    </span>
  );

  const className =
    'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand-border bg-brand-light transition hover:border-brand-primary/50 hover:shadow-sm';

  if (!onClick) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-label={t('customers.card.preview_photo', {
        defaultValue: 'Abrir foto de {{name}}',
        name: customerName,
      })}
    >
      {content}
    </button>
  );
}

function ActionButton({
  children,
  tone = 'secondary',
  className = '',
  ...props
}) {
  const toneClass =
    tone === 'primary'
      ? 'border-brand-primary/20 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15'
      : tone === 'danger'
        ? 'border-rose-500/20 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15'
        : tone === 'success'
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15'
          : 'border-brand-border bg-brand-light/50 text-brand-surfaceForeground/80 hover:bg-brand-light';

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

function Customers() {
  const { t } = useTranslation();
  const { slug, flags, featureFlagsRaw } = useTenant();
  const { checkCredits, getCost } = useCreditGate();
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockAction, setBlockAction] = useState(null);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [exportingCustomers, setExportingCustomers] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [createBusy, setCreateBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [inviteBusyId, setInviteBusyId] = useState(null);
  const [inviteStatuses, setInviteStatuses] = useState({});
  const [activeInviteTooltip, setActiveInviteTooltip] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingError, setEditingError] = useState(null);
  const [previewCustomer, setPreviewCustomer] = useState(null);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [sortOption, setSortOption] = useState(SORT_RECENT);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);

  // ordenação derivada de sortOption (evita missing deps em efeitos)
  const orderingFromSort = sortOption === SORT_NAME ? 'name' : '-created_at';

  // Inicializa ordering a partir da URL
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

  // Sincroniza ordering na URL e reseta offset ao mudar
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
    setOffset(0);
  }, [sortOption, orderingFromSort]);

  const updateInviteStatus = useCallback((customerId, status) => {
    if (!customerId) return;
    setInviteStatuses((prev) => {
      if (!status) {
        if (!prev[customerId]) {
          return prev;
        }
        const next = { ...prev };
        delete next[customerId];
        return next;
      }
      const existing = prev[customerId];
      if (
        existing &&
        existing.type === status.type &&
        existing.text === status.text &&
        existing.statusOverride === status.statusOverride &&
        existing.messageOverride === status.messageOverride &&
        existing.timestampOverride === status.timestampOverride
      ) {
        return prev;
      }
      return {
        ...prev,
        [customerId]: status,
      };
    });
  }, []);

  const clearInviteStatus = useCallback(
    (customerId) => {
      updateInviteStatus(customerId, null);
      setActiveInviteTooltip((current) =>
        current === customerId ? null : current
      );
    },
    [updateInviteStatus]
  );

  const closeInviteTooltip = useCallback(() => {
    setActiveInviteTooltip(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCustomers({
      slug,
      params: { limit, offset, ordering: orderingFromSort },
    })
      .then((payload) => {
        if (cancelled) return;
        const list = Array.isArray(payload?.results)
          ? payload.results
          : payload;
        setCustomers(list || []);
        setInviteStatuses({});
        closeInviteTooltip();
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          parseApiError(err, t('common.load_error', 'Falha ao carregar.'))
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, t, closeInviteTooltip, limit, offset, orderingFromSort, refreshToken]);

  const handleImportCustomers = async (file, { dryRun }) => {
    try {
      const data = await importCustomersCSV(file, { dryRun, slug });
      return { success: true, summary: data?.summary };
    } catch (err) {
      return {
        success: false,
        error: parseApiError(
          err,
          t('customers.import.errors.generic', 'Não foi possível processar o ficheiro.')
        ),
      };
    }
  };

  const handleDownloadCustomersTemplate = async () => {
    try {
      const blob = await fetchCustomersImportTemplate({ slug });
      downloadBlob(blob, 'modelo-clientes.csv');
    } catch (err) {
      setError(
        parseApiError(err, t('customers.import.errors.template', 'Não foi possível baixar o modelo.'))
      );
    }
  };

  const handleExportCustomers = async () => {
    if (exportingCustomers) return;
    setExportingCustomers(true);
    try {
      const blob = await exportCustomersCSV({ slug });
      downloadBlob(blob, `clientes-${slug || 'salao'}.csv`);
    } catch (err) {
      setError(
        parseApiError(err, t('customers.export.error', 'Não foi possível exportar os clientes.'))
      );
    } finally {
      setExportingCustomers(false);
    }
  };

  const sortedCustomers = useMemo(
    () => sortCustomers(customers, sortOption),
    [customers, sortOption]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return sortedCustomers.filter((customer) => {
      if (!showInactive && customer.is_active === false) {
        return false;
      }
      if (!term) return true;
      const haystack = [
        customer.name,
        customer.email,
        customer.phone_number,
        customer.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();
      return haystack.includes(term);
    });
  }, [sortedCustomers, search, showInactive]);

  // Página atual (client-side) usando limit/offset
  const paged = useMemo(
    () => filtered.slice(offset, offset + limit),
    [filtered, offset, limit]
  );

  const handleAdd = async (payload) => {
    setCreateBusy(true);
    try {
      const created = await createCustomer(payload, { slug });
      setCustomers((prev) => [created, ...prev]);
      setError(null);
    } catch (err) {
      const parsed = parseApiError(
        err,
        t('common.save_error', 'Falha ao salvar.')
      );
      setError(parsed);
      throw parsed;
    } finally {
      setCreateBusy(false);
    }
  };

  const startEdit = (customer) => {
    setEditingCustomer(customer);
    setEditingError(null);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingCustomer(null);
    setEditingError(null);
  };

  const saveEdit = async (payload) => {
    if (!editingCustomer?.id) return;
    try {
      setBusyId(editingCustomer.id);
      const updated = await updateCustomer(editingCustomer.id, payload, {
        slug,
      });
      setCustomers((prev) =>
        prev.map((item) => (item.id === editingCustomer.id ? updated : item))
      );
      setError(null);
      setEditingError(null);
      clearInviteStatus(editingCustomer.id);
      if (previewCustomer?.id === updated.id) {
        setPreviewCustomer(updated);
      }
      cancelEdit();
    } catch (err) {
      setEditingError(
        parseApiError(err, t('common.save_error', 'Falha ao salvar.'))
      );
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (customer) => {
    try {
      setBusyId(customer.id);
      const updated = await updateCustomer(
        customer.id,
        { is_active: !customer.is_active },
        { slug }
      );
      setCustomers((prev) =>
        prev.map((item) => (item.id === customer.id ? updated : item))
      );
      if (previewCustomer?.id === updated.id) {
        setPreviewCustomer(updated);
      }
      if (editingCustomer?.id === updated.id) {
        setEditingCustomer(updated);
      }
      clearInviteStatus(customer.id);
    } catch (err) {
      setError(parseApiError(err, t('common.save_error', 'Falha ao salvar.')));
    } finally {
      setBusyId(null);
    }
  };

  const removeCustomer = async (customer) => {
    if (
      !window.confirm(t('customers.confirm_delete', 'Remover este cliente?'))
    ) {
      return;
    }
    if (!customer?.id) return;
    try {
      setBusyId(customer.id);
      await deleteCustomer(customer.id, { slug });
      setCustomers((prev) => prev.filter((item) => item.id !== customer.id));
      if (previewCustomer?.id === customer.id) {
        setPreviewCustomer(null);
      }
      if (editingCustomer?.id === customer.id) {
        cancelEdit();
      }
      clearInviteStatus(customer.id);
    } catch (err) {
      const parsed = parseApiError(
        err,
        t(
          'customers.errors.delete_failed',
          'Não foi possível remover o cliente.'
        )
      );
      const status = err?.response?.status;
      const message =
        status === 409 ||
        status === 423 ||
        status === 500 ||
        (typeof parsed.message === 'string' &&
          parsed.message.toLowerCase().includes('cannot delete'))
          ? t(
              'customers.errors.delete_protected',
              'Clientes com histórico de agendamentos não podem ser excluídos. Utilize a ação "Desativar".'
            )
          : parsed.message;
      setError({ ...parsed, message });
    } finally {
      setBusyId(null);
    }
  };

  const pwaClientEnabled = useMemo(() => {
    if (
      featureFlagsRaw?.modules &&
      Object.prototype.hasOwnProperty.call(
        featureFlagsRaw.modules,
        'pwa_client_enabled'
      )
    ) {
      return Boolean(featureFlagsRaw.modules.pwa_client_enabled);
    }
    if (
      featureFlagsRaw?.modules &&
      Object.prototype.hasOwnProperty.call(
        featureFlagsRaw.modules,
        'pwa_client'
      )
    ) {
      return Boolean(featureFlagsRaw.modules.pwa_client);
    }
    return Boolean(flags?.enableCustomerPwa);
  }, [featureFlagsRaw, flags]);

  const resendInvite = async (customer) => {
    if (!customer?.id) return;
    const customerId = customer.id;
    updateInviteStatus(customerId, null);
    setActiveInviteTooltip((current) =>
      current === customerId ? null : current
    );

    if (!customer.email) {
      updateInviteStatus(customerId, {
        type: 'error',
        text: t(
          'customers.errors.invite_missing_email',
          'Cadastre um e-mail antes de reenviar o convite.'
        ),
        statusOverride: 'failed',
        messageOverride: t(
          'customers.errors.invite_missing_email',
          'Cadastre um e-mail antes de reenviar o convite.'
        ),
      });
      return;
    }

    if (customer.is_active === false) {
      updateInviteStatus(customerId, {
        type: 'error',
        text: t(
          'customers.errors.invite_inactive',
          'Ative o cliente para reenviar convites.'
        ),
        statusOverride: 'failed',
        messageOverride: t(
          'customers.errors.invite_inactive',
          'Ative o cliente para reenviar convites.'
        ),
      });
      return;
    }

    // FEW-314: Block if credits are insufficient for enabled channels
    const smsEnabled = Boolean(flags?.enableSms);
    const whatsappEnabled = Boolean(flags?.enableWhatsapp);

    if (smsEnabled && !checkCredits('sms')) {
      setBlockAction(t('settings.channels.sms', 'SMS'));
      setBlockModalOpen(true);
      return;
    }

    if (whatsappEnabled && !checkCredits('whatsapp')) {
      setBlockAction(t('settings.channels.whatsapp', 'WhatsApp'));
      setBlockModalOpen(true);
      return;
    }

    try {
      setInviteBusyId(customerId);
      await resendCustomerInvite(customerId, { slug });
      updateInviteStatus(customerId, {
        type: 'success',
        text: t(
          'customers.success.invite_sent',
          'Convite reenviado com sucesso.'
        ),
        statusOverride: 'queued',
        timestampOverride: new Date().toISOString(),
        messageOverride: t(
          'customers.invite.tooltip.refresh_hint',
          'O status será atualizado assim que o backend confirmar o envio.'
        ),
      });
    } catch (err) {
      const parsed = parseApiError(
        err,
        t(
          'customers.errors.invite_failed',
          'Não foi possível reenviar o convite.'
        )
      );
      const status = err?.response?.status;
      let message = parsed.message;
      if (status === 404 || status === 501) {
        message = t(
          'customers.errors.invite_unavailable',
          'Reenvio ainda não disponível. Aguarde a atualização do backend.'
        );
      } else if (status === 429) {
        message = t(
          'customers.errors.invite_rate_limit',
          'Muitos convites em sequência. Tente novamente em instantes.'
        );
      }
      updateInviteStatus(customerId, {
        type: 'error',
        text: message,
        statusOverride: 'failed',
        messageOverride: message,
      });
    } finally {
      setInviteBusyId(null);
    }
  };

  const totalCustomers = customers.length;
  const activeCustomers = useMemo(
    () => customers.filter((customer) => customer.is_active !== false).length,
    [customers]
  );
  const hasActiveFilters = Boolean(search.trim()) || showInactive;

  return (
    <FullPageLayout>
      <div className="space-y-6">
        <PageHeader
          title={t('customers.title', 'Clientes')}
          subtitle={t(
            'customers.subtitle',
            'Organize a base de clientes com identificacao visual mais clara para desktop e PWA.'
          )}
        />

        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => setCreatePanelOpen((current) => !current)}
              aria-expanded={createPanelOpen}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15"
            >
              <Plus className="h-4 w-4" />
              {createPanelOpen
                ? t('customers.form.hide', 'Fechar adicionar cliente')
                : t('customers.form.show', 'Adicionar cliente')}
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
                  {t('customers.import_export.trigger', 'Importar/Exportar')}
                </button>
              }
              items={[
                {
                  label: t('customers.import_export.import', 'Importar clientes'),
                  onClick: () => setIsImportModalOpen(true),
                },
                {
                  label: exportingCustomers
                    ? t('customers.import_export.exporting', 'A exportar...')
                    : t('customers.import_export.export', 'Exportar clientes'),
                  onClick: handleExportCustomers,
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
                ? t('customers.filters.hide', 'Fechar filtros')
                : t('customers.filters.show', 'Filtros')}
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
                    {t('customers.filters.search_active', {
                      defaultValue: 'Busca: {{term}}',
                      term: search.trim(),
                    })}
                  </span>
                ) : null}
                {showInactive ? (
                  <span className="rounded-full border border-brand-border bg-brand-light/40 px-3 py-1">
                    {t(
                      'customers.filters.inactive_active',
                      'Exibindo inativos'
                    )}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {createPanelOpen ? (
            <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-5 shadow-sm ring-1 ring-brand-border/70 sm:p-6">
              <div className="max-w-4xl">
                <h2 className="text-xl font-semibold text-brand-surfaceForeground">
                  {t('customers.form.title', 'Adicionar cliente')}
                </h2>
                <p className="mt-1 text-sm text-brand-surfaceForeground/70">
                  {t(
                    'customers.form.description',
                    'Cadastre dados de contato e uma foto clara para identificar rapidamente quem e quem.'
                  )}
                </p>
                <div className="mt-4 rounded-2xl border border-brand-border bg-brand-light/35 p-4 text-sm text-brand-surfaceForeground/75">
                  {t(
                    'customers.form.tip',
                    'Fotos e aniversarios ajudam a diferenciar homonimos e melhoram a busca visual no atendimento.'
                  )}
                </div>
                <div className="mt-5">
                  <CustomerForm onAdd={handleAdd} busy={createBusy} />
                </div>
              </div>
            </Card>
          ) : null}

          {filtersPanelOpen ? (
            <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-5 shadow-sm ring-1 ring-brand-border/70 sm:p-6">
              <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-end">
                <label className="flex flex-col gap-2 text-sm font-medium text-brand-surfaceForeground/80">
                  {t('customers.filters.order', 'Ordenacao')}
                  <select
                    value={sortOption}
                    onChange={(e) => {
                      setSortOption(e.target.value);
                      setOffset(0);
                    }}
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-primary)',
                    }}
                    className="rounded-xl border px-3 py-2 text-sm"
                  >
                    <option value={SORT_RECENT}>
                      {t('customers.list.sort_recent', 'Mais recentes')}
                    </option>
                    <option value={SORT_NAME}>
                      {t('customers.list.sort_name', 'Nome (A-Z)')}
                    </option>
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-brand-surfaceForeground/80">
                  {t('customers.filters.search_label', 'Busca')}
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setOffset(0);
                    }}
                    placeholder={t(
                      'customers.list.search',
                      'Buscar cliente...'
                    )}
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-primary)',
                    }}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  />
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-light/25 px-3 py-2 text-sm text-brand-surfaceForeground/70 md:self-center">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => {
                      setShowInactive(e.target.checked);
                      setOffset(0);
                    }}
                    className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                  />
                  {t('customers.list.show_inactive', 'Exibir inativos')}
                </label>
              </div>
            </Card>
          ) : null}

          <section className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="rounded-2xl border border-brand-border bg-brand-surface/90 p-4 shadow-sm ring-1 ring-brand-border/70">
                <p className="text-xs uppercase tracking-wide text-brand-surfaceForeground/55">
                  {t('customers.stats.total', 'Total cadastrados')}
                </p>
                <p className="mt-2 text-2xl font-semibold text-brand-surfaceForeground">
                  {totalCustomers}
                </p>
              </Card>
              <Card className="rounded-2xl border border-brand-border bg-brand-surface/90 p-4 shadow-sm ring-1 ring-brand-border/70">
                <p className="text-xs uppercase tracking-wide text-brand-surfaceForeground/55">
                  {t('customers.stats.active', 'Clientes ativos')}
                </p>
                <p className="mt-2 text-2xl font-semibold text-brand-surfaceForeground">
                  {activeCustomers}
                </p>
              </Card>
              <Card className="rounded-2xl border border-brand-border bg-brand-surface/90 p-4 shadow-sm ring-1 ring-brand-border/70">
                <p className="text-xs uppercase tracking-wide text-brand-surfaceForeground/55">
                  {t('customers.stats.visible', 'Visiveis no filtro')}
                </p>
                <p className="mt-2 text-2xl font-semibold text-brand-surfaceForeground">
                  {filtered.length}
                </p>
              </Card>
            </div>

            <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-5 shadow-sm ring-1 ring-brand-border/70 sm:p-6">
              <div className="flex flex-col gap-3 border-b border-brand-border pb-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-brand-surfaceForeground">
                    {t('customers.list.title', 'Lista de clientes')}
                  </h2>
                  <p className="mt-1 text-sm text-brand-surfaceForeground/70">
                    {t(
                      'customers.list.subtitle',
                      'A foto ganha prioridade visual para evitar confusao entre clientes com nomes parecidos.'
                    )}
                  </p>
                  <p className="mt-2 text-xs text-brand-surfaceForeground/55">
                    {t(
                      'customers.list.removal_hint',
                      'Clientes com historico nao podem ser excluidos; desative para manter o cadastro fora da agenda.'
                    )}
                  </p>
                </div>
                <p className="text-xs text-brand-surfaceForeground/55">
                  {t(
                    'customers.list.quick_hint',
                    'Use os botoes acima para abrir filtros e cadastro apenas quando precisar.'
                  )}
                </p>
              </div>

              {error ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {error.message}
                </div>
              ) : null}

              {loading ? (
                <p className="mt-5 text-sm text-brand-surfaceForeground/70">
                  {t('common.loading', 'Carregando...')}
                </p>
              ) : filtered.length === 0 ? (
                <p className="mt-5 text-sm text-brand-surfaceForeground/70">
                  {search
                    ? t(
                        'customers.list.no_results',
                        'Nenhum cliente encontrado para esta busca.'
                      )
                    : t(
                        'customers.list.empty',
                        'Nenhum cliente cadastrado ate o momento.'
                      )}
                </p>
              ) : (
                <div className="mt-5 grid gap-4">
                  {paged.map((customer) => {
                    const disabled = busyId === customer.id;
                    const inviteStatus = inviteStatuses[customer.id];
                    const inviteInFlight = inviteBusyId === customer.id;
                    const inviteButtonDisabled =
                      inviteInFlight || customer.is_active === false;
                    const inviteMeta = normalizeInviteMeta(
                      customer,
                      inviteStatus
                    );
                    const mappedStatusKey = inviteMeta.status
                      ? mapInviteStatusToKey(inviteMeta.status)
                      : 'none';
                    const inviteStatusKey = pwaClientEnabled
                      ? mappedStatusKey
                      : 'disabled';
                    const inviteVariant = resolveInviteVariant(inviteStatusKey);
                    const inviteStatusLabel = resolveInviteStatusLabel(
                      t,
                      inviteStatusKey,
                      inviteMeta.status
                    );
                    const inviteTooltipLinesBase = buildInviteTooltipLines(
                      t,
                      inviteStatusKey,
                      inviteMeta,
                      inviteStatusLabel
                    );
                    const smsEnabled = Boolean(flags?.enableSms);
                    const whatsappEnabled = Boolean(flags?.enableWhatsapp);
                    const smsAllowed = !smsEnabled || checkCredits('sms');
                    const whatsappAllowed =
                      !whatsappEnabled || checkCredits('whatsapp');
                    const inviteTooltipLines = [
                      ...inviteTooltipLinesBase,
                      ...(smsEnabled && !smsAllowed
                        ? [
                            {
                              label: t(
                                'credits.block.title',
                                'Limite de creditos'
                              ),
                              value: t(
                                'credits.block.sms_unavailable',
                                `Envio por SMS indisponivel. Necessario pelo menos ${getCost(
                                  'sms'
                                )} credito.`
                              ),
                            },
                          ]
                        : []),
                      ...(whatsappEnabled && !whatsappAllowed
                        ? [
                            {
                              label: t(
                                'credits.block.title',
                                'Limite de creditos'
                              ),
                              value: t(
                                'credits.block.whatsapp_unavailable',
                                `Envio por WhatsApp indisponivel. Necessario pelo menos ${getCost(
                                  'whatsapp'
                                )} credito.`
                              ),
                            },
                          ]
                        : []),
                    ];
                    const inviteTooltipOpen =
                      activeInviteTooltip === customer.id;
                    const showInviteDot =
                      inviteStatusKey !== 'none' &&
                      inviteStatusKey !== 'disabled';
                    const inviteBadgeClass = [
                      'inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium leading-4 ring-1 transition',
                      showInviteDot ? 'gap-1' : '',
                      inviteVariant.toneClass,
                    ]
                      .filter(Boolean)
                      .join(' ');
                    const inviteDotClass = [
                      'h-1.5 w-1.5 rounded-full',
                      inviteVariant.dotClass,
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <Card
                        key={customer.id}
                        className="rounded-2xl border border-brand-border bg-brand-surface/80 p-5 shadow-sm ring-1 ring-brand-border/60"
                      >
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1 space-y-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                              <CustomerAvatarButton
                                customer={customer}
                                t={t}
                                onClick={
                                  customer.photo
                                    ? () => setPreviewCustomer(customer)
                                    : undefined
                                }
                              />

                              <div className="min-w-0 flex-1 space-y-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h3 className="text-lg font-semibold text-brand-surfaceForeground">
                                      {customer.name}
                                    </h3>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                      <span
                                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                          customer.is_active !== false
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-brand-light text-brand-surfaceForeground/70'
                                        }`}
                                      >
                                        {customer.is_active !== false
                                          ? t(
                                              'customers.status.active',
                                              'Ativo'
                                            )
                                          : t(
                                              'customers.status.inactive',
                                              'Inativo'
                                            )}
                                      </span>

                                      <span className="inline-flex items-center rounded-full border border-brand-border bg-brand-light/40 px-2 py-1 text-xs font-medium text-brand-surfaceForeground/70">
                                        {t(
                                          'customers.table.created',
                                          'Criado em'
                                        )}
                                        : {formatDate(customer.created_at)}
                                      </span>
                                    </div>
                                  </div>
                                  <div
                                    className="relative shrink-0"
                                    onMouseEnter={() =>
                                      setActiveInviteTooltip(customer.id)
                                    }
                                    onMouseLeave={() =>
                                      setActiveInviteTooltip((current) =>
                                        current === customer.id ? null : current
                                      )
                                    }
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveInviteTooltip((current) =>
                                          current === customer.id
                                            ? null
                                            : customer.id
                                        )
                                      }
                                      className={`${inviteBadgeClass} focus:outline-none focus:ring-2 focus:ring-brand-primary/60`}
                                      aria-expanded={inviteTooltipOpen}
                                    >
                                      {showInviteDot ? (
                                        <span
                                          className={inviteDotClass}
                                          aria-hidden="true"
                                        />
                                      ) : null}
                                      <span>{inviteStatusLabel}</span>
                                    </button>

                                    {inviteTooltipOpen ? (
                                      <div className="absolute left-0 z-20 mt-2 w-64 max-w-xs rounded-xl border border-brand-border bg-brand-surface p-3 text-left text-xs shadow-lg">
                                        <div className="flex flex-col gap-2 text-brand-surfaceForeground/80">
                                          {inviteTooltipLines.map(
                                            (line, index) => (
                                              <div key={index}>
                                                {line.label ? (
                                                  <p className="font-semibold text-brand-surfaceForeground/65">
                                                    {line.label}
                                                  </p>
                                                ) : null}
                                                <p>{line.value}</p>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                  <div className="rounded-xl border border-brand-border/70 bg-brand-light/20 p-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-surfaceForeground/55">
                                      {t('customers.table.email', 'E-mail')}
                                    </p>
                                    <p className="mt-1 break-words text-sm text-brand-surfaceForeground/85">
                                      {customer.email || '—'}
                                    </p>
                                  </div>
                                  <div className="rounded-xl border border-brand-border/70 bg-brand-light/20 p-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-surfaceForeground/55">
                                      {t('customers.table.phone', 'Telefone')}
                                    </p>
                                    <p className="mt-1 break-words text-sm text-brand-surfaceForeground/85">
                                      {customer.phone_number || '—'}
                                    </p>
                                  </div>
                                  <div className="rounded-xl border border-brand-border/70 bg-brand-light/20 p-3 sm:col-span-2 lg:col-span-1">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-surfaceForeground/55">
                                      {t(
                                        'customers.table.birthday',
                                        'Aniversario'
                                      )}
                                    </p>
                                    <p className="mt-1 text-sm text-brand-surfaceForeground/85">
                                      {formatBirthday(customer.birthday)}
                                    </p>
                                  </div>
                                </div>

                                <div className="rounded-xl border border-brand-border/70 bg-brand-light/35 p-4">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-surfaceForeground/55">
                                    {t('customers.table.notes', 'Notas')}
                                  </p>
                                  <p className="mt-2 text-sm leading-6 text-brand-surfaceForeground/85">
                                    {customer.notes ||
                                      t(
                                        'customers.table.no_notes',
                                        'Sem notas.'
                                      )}
                                  </p>
                                </div>

                                {pwaClientEnabled && inviteStatus ? (
                                  <div
                                    className={`text-xs ${
                                      inviteStatus.type === 'success'
                                        ? 'text-emerald-600'
                                        : 'text-rose-600'
                                    }`}
                                  >
                                    {inviteStatus.text}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 xl:max-w-[260px] xl:justify-end">
                            <ActionButton
                              tone="primary"
                              onClick={() => startEdit(customer)}
                            >
                              {t('common.edit', 'Editar')}
                            </ActionButton>

                            {pwaClientEnabled ? (
                              <ActionButton
                                disabled={inviteButtonDisabled}
                                onClick={() => {
                                  if (inviteButtonDisabled) return;
                                  resendInvite(customer);
                                }}
                                title={
                                  inviteButtonDisabled &&
                                  customer.is_active === false
                                    ? t(
                                        'customers.actions.invite.require_active',
                                        'Ative o cliente para reenviar convites.'
                                      )
                                    : !customer.email
                                      ? t(
                                          'customers.actions.invite.require_email',
                                          'Cadastre um e-mail para reenviar convites.'
                                        )
                                      : undefined
                                }
                              >
                                {inviteInFlight
                                  ? t(
                                      'customers.actions.resending',
                                      'Reenviando...'
                                    )
                                  : t(
                                      'customers.actions.resend_invite',
                                      'Reenviar convite'
                                    )}
                              </ActionButton>
                            ) : null}

                            <ActionButton
                              tone={
                                customer.is_active !== false
                                  ? 'danger'
                                  : 'success'
                              }
                              disabled={disabled}
                              onClick={() => toggleActive(customer)}
                            >
                              {customer.is_active !== false
                                ? t('customers.actions.deactivate', 'Desativar')
                                : t('customers.actions.activate', 'Reativar')}
                            </ActionButton>

                            {customer.is_active === false ? (
                              <ActionButton
                                tone="danger"
                                disabled={disabled}
                                onClick={() => removeCustomer(customer)}
                              >
                                {t('common.delete', 'Excluir')}
                              </ActionButton>
                            ) : null}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {!loading && !error && filtered.length > 0 ? (
                <PaginationControls
                  totalCount={filtered.length}
                  limit={limit}
                  offset={offset}
                  onChangeLimit={(n) => {
                    setLimit(n);
                    setOffset(0);
                  }}
                  onPrev={() => setOffset((prev) => Math.max(0, prev - limit))}
                  onNext={() =>
                    setOffset((prev) =>
                      prev + limit < filtered.length ? prev + limit : prev
                    )
                  }
                  className="mt-6"
                />
              ) : null}
            </Card>
          </section>
        </div>
      </div>

      <CustomerEditorModal
        open={Boolean(editingCustomer)}
        customer={editingCustomer}
        busy={Boolean(editingCustomer && busyId === editingCustomer.id)}
        error={editingError}
        onClose={cancelEdit}
        onSubmit={saveEdit}
      />
      <CustomerPhotoPreviewModal
        open={Boolean(previewCustomer)}
        customer={previewCustomer}
        onClose={() => setPreviewCustomer(null)}
      />
      <CreditPurchaseModal
        open={creditsModalOpen}
        onClose={() => setCreditsModalOpen(false)}
      />
      <CreditBlockModal
        open={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        onBuy={() => {
          setBlockModalOpen(false);
          setCreditsModalOpen(true);
        }}
        action={blockAction}
      />
      <ImportCustomersModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSubmit={handleImportCustomers}
        onDownloadTemplate={handleDownloadCustomersTemplate}
        onImported={() => {
          setOffset(0);
          setRefreshToken((prev) => prev + 1);
        }}
      />
    </FullPageLayout>
  );
}

export default Customers;
