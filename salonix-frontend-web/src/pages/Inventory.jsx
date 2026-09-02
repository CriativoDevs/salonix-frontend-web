import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import FullPageLayout from '../layouts/FullPageLayout';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import InventoryItemModal from '../components/inventory/InventoryItemModal';
import StockMovementModal from '../components/inventory/StockMovementModal';
import {
  fetchInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createStockMovement,
} from '../api/inventory';
import { parseApiError } from '../utils/apiError';
import { useTenant } from '../hooks/useTenant';

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
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

function Inventory() {
  const { t } = useTranslation();
  const { slug } = useTenant();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemBusy, setItemBusy] = useState(false);
  const [itemError, setItemError] = useState(null);

  const [busyId, setBusyId] = useState(null);

  const [movementItem, setMovementItem] = useState(null);
  const [movementBusy, setMovementBusy] = useState(false);
  const [movementError, setMovementError] = useState(null);

  const loadItems = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchInventoryItems({ slug })
      .then((data) => {
        if (cancelled) return;
        setItems(Array.isArray(data) ? data : []);
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
    const cleanup = loadItems();
    return cleanup;
  }, [loadItems]);

  const openCreateModal = () => {
    setEditingItem(null);
    setItemError(null);
    setItemModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setItemError(null);
    setItemModalOpen(true);
  };

  const closeItemModal = () => {
    setItemModalOpen(false);
    setEditingItem(null);
    setItemError(null);
  };

  const handleSubmitItem = async (payload) => {
    setItemBusy(true);
    try {
      if (editingItem?.id) {
        const updated = await updateInventoryItem(editingItem.id, payload, {
          slug,
        });
        setItems((prev) =>
          prev.map((entry) => (entry.id === updated.id ? updated : entry))
        );
      } else {
        const created = await createInventoryItem(payload, { slug });
        setItems((prev) => [created, ...prev]);
      }
      closeItemModal();
    } catch (err) {
      setItemError(
        parseApiError(err, t('common.save_error', 'Falha ao salvar.'))
      );
    } finally {
      setItemBusy(false);
    }
  };

  const removeItem = async (item) => {
    if (
      !window.confirm(
        t('inventory.confirm_delete', 'Remover este item de estoque?')
      )
    ) {
      return;
    }
    try {
      setBusyId(item.id);
      await deleteInventoryItem(item.id, { slug });
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
    } catch (err) {
      setError(
        parseApiError(
          err,
          t('inventory.errors.delete_failed', 'Não foi possível remover o item.')
        )
      );
    } finally {
      setBusyId(null);
    }
  };

  const openMovementModal = (item) => {
    setMovementItem(item);
    setMovementError(null);
  };

  const closeMovementModal = () => {
    setMovementItem(null);
    setMovementError(null);
  };

  const handleSubmitMovement = async (payload) => {
    setMovementBusy(true);
    try {
      await createStockMovement(payload, { slug });
      const delta =
        payload.movement_type === 'in'
          ? Number(payload.quantity)
          : -Number(payload.quantity);
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === payload.item
            ? { ...entry, quantity: Number(entry.quantity) + delta }
            : entry
        )
      );
      closeMovementModal();
    } catch (err) {
      setMovementError(
        parseApiError(
          err,
          t(
            'inventory.movements.errors.generic',
            'Não foi possível registrar a movimentação.'
          )
        )
      );
    } finally {
      setMovementBusy(false);
    }
  };

  return (
    <FullPageLayout>
      <div className="space-y-6">
        <PageHeader
          title={t('inventory.title', 'Estoque')}
          subtitle={t(
            'inventory.subtitle',
            'Controle os itens usados no dia a dia do negócio e acompanhe quando é hora de repor.'
          )}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/15"
          >
            <Plus className="h-4 w-4" />
            {t('inventory.form.add', 'Adicionar item')}
          </button>
        </div>

        <Card className="rounded-2xl border border-brand-border bg-brand-surface/95 p-5 shadow-sm ring-1 ring-brand-border/70 sm:p-6">
          <div className="border-b border-brand-border pb-4">
            <h2 className="text-lg font-semibold text-brand-surfaceForeground">
              {t('inventory.list.title', 'Itens de estoque')}
            </h2>
            <p className="mt-1 text-sm text-brand-surfaceForeground/70">
              {t(
                'inventory.list.subtitle',
                'Acompanhe nomes, unidades e quantidades atuais de cada item.'
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
          ) : items.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title={t('inventory.list.empty_title', 'Nenhum item cadastrado')}
                description={t(
                  'inventory.list.empty_description',
                  'Adicione o primeiro item para começar a controlar o seu estoque.'
                )}
                action={
                  <ActionButton tone="primary" onClick={openCreateModal}>
                    <Plus className="mr-1 h-4 w-4" />
                    {t('inventory.form.add', 'Adicionar item')}
                  </ActionButton>
                }
              />
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {items.map((item) => {
                const disabled = busyId === item.id;
                return (
                  <Card
                    key={item.id}
                    className="rounded-2xl border border-brand-border bg-brand-surface/80 p-4 shadow-sm ring-1 ring-brand-border/60"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <h3 className="text-base font-semibold text-brand-surfaceForeground">
                          {item.name}
                        </h3>
                        <div className="flex flex-wrap gap-2 text-xs text-brand-surfaceForeground/70">
                          <span className="rounded-full border border-brand-border bg-brand-light/40 px-2 py-1">
                            {t('inventory.list.quantity', 'Quantidade')}:{' '}
                            {item.quantity} {item.unit}
                          </span>
                          {item.minimum_quantity != null ? (
                            <span className="rounded-full border border-brand-border bg-brand-light/40 px-2 py-1">
                              {t('inventory.list.minimum', 'Mínimo')}:{' '}
                              {item.minimum_quantity} {item.unit}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <ActionButton onClick={() => openMovementModal(item)}>
                          {t('inventory.actions.movement', 'Movimentar')}
                        </ActionButton>
                        <ActionButton
                          tone="primary"
                          onClick={() => openEditModal(item)}
                        >
                          {t('common.edit', 'Editar')}
                        </ActionButton>
                        <ActionButton
                          tone="danger"
                          disabled={disabled}
                          onClick={() => removeItem(item)}
                        >
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

      <InventoryItemModal
        open={itemModalOpen}
        item={editingItem}
        busy={itemBusy}
        error={itemError}
        onClose={closeItemModal}
        onSubmit={handleSubmitItem}
      />

      <StockMovementModal
        open={Boolean(movementItem)}
        item={movementItem}
        busy={movementBusy}
        error={movementError}
        onClose={closeMovementModal}
        onSubmit={handleSubmitMovement}
      />
    </FullPageLayout>
  );
}

export default Inventory;
