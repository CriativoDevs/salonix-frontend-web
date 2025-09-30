import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import ServiceForm from '../components/ServiceForm';
import { fetchServices, createService, updateService, deleteService } from '../api/services';
import { parseApiError } from '../utils/apiError';
import { useTenant } from '../hooks/useTenant';

function Services() {
  const { t } = useTranslation();
  const { slug } = useTenant();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState({ name: '', price_eur: '', duration_minutes: '' });
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchServices(slug)
      .then((data) => {
        if (!cancelled) setServices(data);
      })
      .catch((e) => !cancelled && setError(parseApiError(e, t('common.load_error'))))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, t]);

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
      setServices((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
      cancelEdit();
    } catch (e) {
      setError(parseApiError(e, t('common.save_error', 'Falha ao salvar.')));
    } finally {
      setBusyId(null);
    }
  };

  const removeService = async (id) => {
    if (!window.confirm(t('common.confirm_delete', 'Confirmar exclusão?'))) return;
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
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">
          {t('services.title')}
        </h1>

        <div className="form-light">
          <ServiceForm onAdd={handleAddService} />
        </div>

        {loading && (
          <p className="mt-4 text-sm text-gray-600">{t('common.loading')}</p>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-600">{error.message}</p>
        )}
        {!loading && !error && services.length > 0 && (
          <ul className="mt-6 space-y-2">
            {services.map((service) => (
              <li key={service.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                {editingId === service.id ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      className="w-full border px-2 py-1 rounded"
                      value={editingForm.name}
                      onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                    />
                    <input
                      type="number"
                      className="w-full border px-2 py-1 rounded"
                      value={editingForm.price_eur}
                      onChange={(e) => setEditingForm({ ...editingForm, price_eur: e.target.value })}
                    />
                    <input
                      type="number"
                      className="w-full border px-2 py-1 rounded"
                      value={editingForm.duration_minutes}
                      onChange={(e) =>
                        setEditingForm({ ...editingForm, duration_minutes: e.target.value })
                      }
                    />
                    <div className="sm:col-span-3 flex gap-2 mt-2">
                      <button disabled={busyId === service.id} onClick={saveEdit} className="rounded bg-emerald-600 px-3 py-1 text-white disabled:opacity-50">
                        {t('common.save', 'Salvar')}
                      </button>
                      <button onClick={cancelEdit} className="rounded bg-gray-200 px-3 py-1">
                        {t('common.cancel', 'Cancelar')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-800">{service.name}</div>
                      <div className="text-gray-600">
                        €{service.price_eur ?? service.price} · {service.duration_minutes ?? service.duration}min
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(service)} className="text-sm font-medium text-[#1D29CF] hover:underline">
                        {t('common.edit', 'Editar')}
                      </button>
                      <button disabled={busyId === service.id} onClick={() => removeService(service.id)} className="text-sm font-medium text-[#CF3B1D] hover:underline disabled:opacity-50">
                        {t('common.delete', 'Excluir')}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {!loading && !error && services.length === 0 && (
          <p className="mt-4 text-sm text-gray-600">{t('common.empty_list', 'Nenhum serviço cadastrado.')}</p>
        )}
      </div>
    </FullPageLayout>
  );
}

export default Services;
