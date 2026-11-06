import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, UserPlus, Trash2, Pencil } from 'lucide-react';
import FullPageLayout from '../layouts/FullPageLayout';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import VoucherEditorModal from '../components/vouchers/VoucherEditorModal';
import VoucherAssignModal from '../components/vouchers/VoucherAssignModal';
import {
  fetchVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  assignVoucher,
  assignVoucherBulk,
  sendVoucherEmail,
} from '../api/vouchers';
import { fetchServices } from '../api/services';
import { parseApiError } from '../utils/apiError';
import { useTenant } from '../hooks/useTenant';
import useToast from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';

function ActionButton({ children, tone = 'secondary', className = '', ...props }) {
  const toneClass =
    tone === 'primary'
      ? 'border-brand-primary/20 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15'
      : tone === 'danger'
        ? 'border-rose-500/20 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15'
        : 'border-brand-border bg-brand-light/50 text-brand-surfaceForeground/80 hover:bg-brand-light';

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

function statusForVoucher(voucher, t) {
  if (voucher.valid_until) {
    const today = new Date().toISOString().slice(0, 10);
    if (voucher.valid_until < today) {
      return { key: 'expired', label: t('vouchers.status.expired', 'Expirado') };
    }
  }
  return { key: 'active', label: t('vouchers.status.active', 'Ativo') };
}

function typeBadge(voucher, t) {
  if (voucher.type === 'percent') {
    return {
      label: t('vouchers.types.percent_short', '{{value}}% de desconto', {
        value: voucher.value,
      }),
      className: 'bg-sky-100 text-sky-800 border-sky-200',
    };
  }
  if (voucher.type === 'fixed') {
    return {
      label: t('vouchers.types.fixed_short', 'Desconto de {{value}}', {
        value: voucher.value,
      }),
      className: 'bg-violet-100 text-violet-800 border-violet-200',
    };
  }
  return {
    label: t('vouchers.types.free_service_short', 'Serviço grátis'),
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };
}

function Vouchers() {
  const { t } = useTranslation();
  const { slug } = useTenant();

  const [vouchers, setVouchers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [editorBusy, setEditorBusy] = useState(false);
  const [editorError, setEditorError] = useState(null);

  const [assignVoucherTarget, setAssignVoucherTarget] = useState(null);
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignError, setAssignError] = useState(null);
  const { toasts, showSuccess, showWarning, showError, hideToast } = useToast();

  const [busyId, setBusyId] = useState(null);

  const loadVouchers = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchVouchers({ slug })
      .then((data) => {
        if (cancelled) return;
        setVouchers(Array.isArray(data) ? data : []);
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
  }, [slug, t]);

  useEffect(() => {
    const cleanup = loadVouchers();
    fetchServices({ slug })
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => setServices([]));
    return cleanup;
  }, [loadVouchers, slug]);

  const servicesById = useMemo(() => {
    const map = new Map();
    services.forEach((service) => map.set(String(service.id), service));
    return map;
  }, [services]);

  const openCreateModal = () => {
    setEditingVoucher(null);
    setEditorError(null);
    setEditorOpen(true);
  };

  const openEditModal = (voucher) => {
    setEditingVoucher(voucher);
    setEditorError(null);
    setEditorOpen(true);
  };

  const closeEditorModal = () => {
    setEditorOpen(false);
    setEditingVoucher(null);
    setEditorError(null);
  };

  const handleSubmitVoucher = async (payload) => {
    setEditorBusy(true);
    try {
      if (editingVoucher?.id) {
        const updated = await updateVoucher(editingVoucher.id, payload, { slug });
        setVouchers((prev) =>
          prev.map((entry) => (entry.id === updated.id ? updated : entry))
        );
      } else {
        const created = await createVoucher(payload, { slug });
        setVouchers((prev) => [created, ...prev]);
      }
      closeEditorModal();
    } catch (err) {
      setEditorError(
        parseApiError(err, t('common.save_error', 'Falha ao salvar.'))
      );
    } finally {
      setEditorBusy(false);
    }
  };

  const removeVoucher = async (voucher) => {
    if (
      !window.confirm(
        t('vouchers.confirm_delete', 'Remover o voucher {{code}}?', {
          code: voucher.code,
        })
      )
    ) {
      return;
    }
    try {
      setBusyId(voucher.id);
      await deleteVoucher(voucher.id, { slug });
      setVouchers((prev) => prev.filter((entry) => entry.id !== voucher.id));
    } catch (err) {
      setError(
        parseApiError(
          err,
          t('vouchers.errors.delete_failed', 'Não foi possível remover o voucher.')
        )
      );
    } finally {
      setBusyId(null);
    }
  };

  const openAssignModal = (voucher) => {
    setAssignVoucherTarget(voucher);
    setAssignError(null);
  };

  const closeAssignModal = () => {
    setAssignVoucherTarget(null);
    setAssignError(null);
  };

  const handleAssignSubmit = async ({ client, sendEmail }) => {
    if (!assignVoucherTarget) return;
    setAssignBusy(true);
    try {
      if (sendEmail) {
        await sendVoucherEmail(assignVoucherTarget.id, client.id, { slug });
      } else {
        await assignVoucher(assignVoucherTarget.id, client.id, { slug });
      }
      closeAssignModal();
    } catch (err) {
      setAssignError(
        parseApiError(
          err,
          t('vouchers.assign.errors.generic', 'Não foi possível atribuir o voucher.')
        )
      );
    } finally {
      setAssignBusy(false);
    }
  };

  const skipReasonLabel = (reason) => {
    if (reason === 'already_assigned') {
      return t('vouchers.assign.skip_already_assigned', 'já tinha o voucher');
    }
    if (reason === 'max_uses_exceeded') {
      return t('vouchers.assign.skip_max_uses', 'limite de atribuições atingido');
    }
    return t('vouchers.assign.skip_not_found', 'cliente não encontrado');
  };

  const handleAssignBulkSubmit = async (clients) => {
    if (!assignVoucherTarget) return;
    setAssignBusy(true);
    try {
      const result = await assignVoucherBulk(
        assignVoucherTarget.id,
        clients.map((client) => client.id),
        { slug }
      );
      const assignedCount = result?.assigned?.length || 0;
      const skipped = result?.skipped || [];
      if (assignedCount > 0) {
        showSuccess(
          t('vouchers.assign.bulk_success', '{{count}} clientes receberam o voucher.', {
            count: assignedCount,
          })
        );
      }
      if (skipped.length > 0) {
        const detail = skipped
          .map((item) => {
            const client = clients.find((c) => c.id === item.client_id);
            const name = client?.name || `#${item.client_id}`;
            return `${name} (${skipReasonLabel(item.reason)})`;
          })
          .join(', ');
        showWarning(
          t('vouchers.assign.bulk_skipped', '{{count}} não receberam: {{detail}}', {
            count: skipped.length,
            detail,
          })
        );
      }
      closeAssignModal();
      loadVouchers();
    } catch (err) {
      showError(
        parseApiError(
          err,
          t('vouchers.assign.errors.generic', 'Não foi possível atribuir o voucher.')
        ).message
      );
    } finally {
      setAssignBusy(false);
    }
  };

  return (
    <FullPageLayout>
      <div className="space-y-6">
        <PageHeader
          title={t('vouchers.title', 'Vouchers')}
          subtitle={t(
            'vouchers.subtitle',
            'Crie vouchers de desconto ou serviço grátis e atribua-os aos seus clientes.'
          )}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15"
          >
            <Plus className="h-4 w-4" />
            {t('vouchers.form.add', 'Criar voucher')}
          </button>
        </div>

        <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-5 shadow-sm ring-1 ring-brand-border/70 sm:p-6">
          <div className="border-b border-brand-border pb-4">
            <h2 className="text-lg font-semibold text-brand-surfaceForeground">
              {t('vouchers.list.title', 'Vouchers cadastrados')}
            </h2>
            <p className="mt-1 text-sm text-brand-surfaceForeground/70">
              {t(
                'vouchers.list.subtitle',
                'Acompanhe código, benefício, validade e status de cada voucher.'
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
          ) : vouchers.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title={t('vouchers.list.empty_title', 'Nenhum voucher criado')}
                description={t(
                  'vouchers.list.empty_description',
                  'Crie o primeiro voucher para oferecer descontos ou serviços grátis aos seus clientes.'
                )}
                action={
                  <ActionButton tone="primary" onClick={openCreateModal}>
                    <Plus className="h-4 w-4" />
                    {t('vouchers.form.add', 'Criar voucher')}
                  </ActionButton>
                }
              />
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {vouchers.map((voucher) => {
                const disabled = busyId === voucher.id;
                const status = statusForVoucher(voucher, t);
                const badge = typeBadge(voucher, t);
                const service =
                  voucher.type === 'free_service'
                    ? servicesById.get(String(voucher.service))
                    : null;

                return (
                  <Card
                    key={voucher.id}
                    className="rounded-2xl border border-brand-border bg-brand-surface/80 p-4 shadow-sm ring-1 ring-brand-border/60"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-brand-surfaceForeground">
                            {voucher.code}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
                          >
                            {service ? `${badge.label}: ${service.name}` : badge.label}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              status.key === 'expired'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-brand-surfaceForeground/70">
                          <span className="rounded-full border border-brand-border bg-brand-light/40 px-2 py-1">
                            {t('vouchers.list.max_uses', 'Limite de atribuições')}:{' '}
                            {voucher.max_uses}
                          </span>
                          {voucher.valid_until ? (
                            <span className="rounded-full border border-brand-border bg-brand-light/40 px-2 py-1">
                              {t('vouchers.list.valid_until', 'Válido até')}:{' '}
                              {voucher.valid_until}
                            </span>
                          ) : null}
                        </div>
                        {voucher.notes ? (
                          <p className="text-xs text-brand-surfaceForeground/60">
                            {voucher.notes}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <ActionButton onClick={() => openAssignModal(voucher)}>
                          <UserPlus className="h-3.5 w-3.5" />
                          {t('vouchers.actions.assign', 'Atribuir a cliente')}
                        </ActionButton>
                        <ActionButton
                          tone="primary"
                          onClick={() => openEditModal(voucher)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t('common.edit', 'Editar')}
                        </ActionButton>
                        <ActionButton
                          tone="danger"
                          disabled={disabled}
                          onClick={() => removeVoucher(voucher)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t('common.delete', 'Excluir')}
                        </ActionButton>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <VoucherEditorModal
        open={editorOpen}
        voucher={editingVoucher}
        services={services}
        busy={editorBusy}
        error={editorError}
        onClose={closeEditorModal}
        onSubmit={handleSubmitVoucher}
      />

      <VoucherAssignModal
        open={Boolean(assignVoucherTarget)}
        voucher={assignVoucherTarget}
        busy={assignBusy}
        error={assignError}
        onClose={closeAssignModal}
        onSubmit={handleAssignSubmit}
        onSubmitBulk={handleAssignBulkSubmit}
      />

      <ToastContainer toasts={toasts} onClose={hideToast} />
    </FullPageLayout>
  );
}

export default Vouchers;
