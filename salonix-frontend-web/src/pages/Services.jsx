import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import ServiceForm from '../components/ServiceForm';
import {
  fetchServicesWithMeta,
  createService,
  updateService,
  deleteService,
} from '../api/services';
import { parseApiError } from '../utils/apiError';
import { useTenant } from '../hooks/useTenant';
import PaginationControls from '../components/ui/PaginationControls';

function Services() {
  const { t, i18n } = useTranslation();
  const { slug } = useTenant();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState({
    name: '',
    price_eur: '',
    duration_minutes: '',
  });
  const [busyId, setBusyId] = useState(null);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchServicesWithMeta({
      slug,
      params: { limit, offset, ordering: orderingFromSort },
    })
      .then((payload) => {
        if (cancelled) return;
        const list = Array.isArray(payload?.results)
          ? payload.results
          : Array.isArray(payload)
            ? payload
            : [];
        setServices(list);
      })
      .catch(
        (e) => !cancelled && setError(parseApiError(e, t('common.load_error')))
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, t, limit, offset, sortOption, orderingFromSort]);

  const handleAddService = async (newService) => {
    try {
      const created = await createService({ ...newService, slug });
      setServices((prev) => [created, ...prev]);
    } catch (e) {
      setError(parseApiError(e, t('common.save_error', 'Falha ao salvar.')));
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
      const updated = await updateService(editingId, editingForm);
      setServices((prev) =>
        prev.map((s) => (s.id === editingId ? updated : s))
      );
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
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(parseApiError(e, t('common.delete_error', 'Falha ao excluir.')));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <FullPageLayout>
      <div className="rounded-xl bg-brand-surface p-6 shadow-sm ring-1 ring-brand-border">
        <h1 className="mb-4 text-2xl font-semibold text-brand-surfaceForeground">
          {t('services.title')}
        </h1>

        {/* Controles de ordenação */}
        <div className="mt-2 flex items-center gap-3" key={i18n.language}>
          <label
            className="text-sm text-brand-surfaceForeground/80"
            htmlFor="svc-ordering"
          >
            {t('common.order_by', 'Ordenar por')}
          </label>
          <select
            id="svc-ordering"
            className="rounded border px-2 py-1 text-sm"
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
        </div>

        <div className="form-light">
          <ServiceForm onAdd={handleAddService} />
        </div>

        {loading && (
          <p className="mt-4 text-sm text-gray-600">{t('common.loading')}</p>
        )}
        {error && <p className="mt-4 text-sm text-red-600">{error.message}</p>}
        {!loading && !error && services.length > 0 && (
          <ul className="mt-6 space-y-2">
            {services.slice(offset, offset + limit).map((service) => (
              <li
                key={service.id}
                className="rounded-lg border border-brand-border bg-brand-surface p-3 text-sm text-brand-surfaceForeground"
              >
                {editingId === service.id ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      className="w-full rounded border px-2 py-1"
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
                      className="w-full rounded border px-2 py-1"
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
                      className="w-full rounded border px-2 py-1"
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
                    <div className="sm:col-span-3 flex gap-2 mt-2">
                      <button
                        disabled={busyId === service.id}
                        onClick={saveEdit}
                        className="rounded bg-brand-primary px-3 py-1 text-white transition hover:bg-brand-accent disabled:opacity-50"
                      >
                        {t('common.save', 'Salvar')}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded bg-brand-light px-3 py-1 text-brand-surfaceForeground hover:bg-brand-light/80"
                      >
                        {t('common.cancel', 'Cancelar')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-brand-surfaceForeground">
                        {service.name}
                      </div>
                      <div className="text-brand-surfaceForeground/80">
                        €{service.price_eur ?? service.price} ·{' '}
                        {service.duration_minutes ?? service.duration}min
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(service)}
                        className="text-sm font-medium text-[#1D29CF] hover:underline"
                      >
                        {t('common.edit', 'Editar')}
                      </button>
                      <button
                        disabled={busyId === service.id}
                        onClick={() => removeService(service.id)}
                        className="text-sm font-medium text-[#CF3B1D] hover:underline disabled:opacity-50"
                      >
                        {t('common.delete', 'Excluir')}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {!loading && !error && services.length > 0 && (
          <PaginationControls
            totalCount={services.length}
            limit={limit}
            offset={offset}
            onChangeLimit={(n) => {
              setLimit(n);
              setOffset(0);
            }}
            onPrev={() => setOffset((prev) => Math.max(0, prev - limit))}
            onNext={() =>
              setOffset((prev) =>
                prev + limit < services.length ? prev + limit : prev
              )
            }
            className="mt-6"
          />
        )}
        {!loading && !error && services.length === 0 && (
          <p className="mt-4 text-sm text-gray-600">
            {t('common.empty_list', 'Nenhum serviço cadastrado.')}
          </p>
        )}
      </div>
    </FullPageLayout>
  );
}

export default Services;
