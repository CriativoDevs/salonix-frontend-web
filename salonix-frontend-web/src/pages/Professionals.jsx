import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import ProfessionalForm from '../components/ProfessionalForm';
import { fetchProfessionals, createProfessional, updateProfessional, deleteProfessional } from '../api/professionals';
import { useTenant } from '../hooks/useTenant';
import { parseApiError } from '../utils/apiError';

function Professionals() {
  const { t } = useTranslation();
  const { slug } = useTenant();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState({ name: '', bio: '' });
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProfessionals(slug)
      .then((data) => !cancelled && setList(data))
      .catch((e) => !cancelled && setError(parseApiError(e, t('common.load_error'))))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, t]);

  const handleAdd = async (professional) => {
    try {
      const created = await createProfessional({ ...professional, slug });
      setList((prev) => [created, ...prev]);
    } catch (e) {
      setError(parseApiError(e, t('common.save_error', 'Falha ao salvar.')));
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditingForm({ name: p.name || '', bio: p.bio || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingForm({ name: '', bio: '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      setBusyId(editingId);
      const updated = await updateProfessional(editingId, editingForm);
      setList((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      cancelEdit();
    } catch (e) {
      setError(parseApiError(e, t('common.save_error', 'Falha ao salvar.')));
    } finally {
      setBusyId(null);
    }
  };

  const removeItem = async (id) => {
    if (!window.confirm(t('common.confirm_delete', 'Confirmar exclusão?'))) return;
    try {
      setBusyId(id);
      await deleteProfessional(id);
      setList((prev) => prev.filter((p) => p.id !== id));
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
          {t('professionals.title')}
        </h1>

        <div className="form-light">
          <ProfessionalForm onAdd={handleAdd} />
        </div>

        {loading && (
          <p className="mt-4 text-sm text-gray-600">{t('common.loading')}</p>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-600">{error.message}</p>
        )}
        {!loading && !error && list.length > 0 && (
          <ul className="mt-6 space-y-3">
            {list.map((p, idx) => {
              const displayBio = p.bio && p.bio.trim() ? p.bio : t('professionals.no_bio');
              return (
                <li
                  key={p.id ?? idx}
                  className="flex items-start justify-between gap-4 rounded-lg border border-brand-border bg-brand-surface px-4 py-3 shadow-sm"
                >
                  {editingId === p.id ? (
                    <div className="grid flex-1 gap-2 sm:grid-cols-2">
                      <input
                        className="w-full rounded border border-brand-border px-2 py-1"
                        value={editingForm.name}
                        onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                      />
                      <input
                        className="w-full rounded border border-brand-border px-2 py-1"
                        value={editingForm.bio}
                        onChange={(e) => setEditingForm({ ...editingForm, bio: e.target.value })}
                        placeholder={t('professionals.specialty', 'Bio/Especialidade')}
                      />
                      <div className="sm:col-span-2 flex gap-2">
                        <button
                          disabled={busyId === p.id}
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
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-brand-surfaceForeground">{p.name}</div>
                      <div className="text-sm text-brand-surfaceForeground/80">{displayBio}</div>
                    </div>
                  )}
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => startEdit(p)} className="text-sm font-medium text-[#1D29CF] hover:underline">
                      {t('common.edit', 'Editar')}
                    </button>
                    <button disabled={busyId === p.id} onClick={() => removeItem(p.id)} className="text-sm font-medium text-[#CF3B1D] hover:underline disabled:opacity-50">
                      {t('common.delete', 'Excluir')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {!loading && !error && list.length === 0 && (
          <p className="mt-4 text-sm text-gray-600">{t('common.empty_list', 'Nenhum profissional cadastrado.')}</p>
        )}
      </div>
    </FullPageLayout>
  );
}

export default Professionals;
