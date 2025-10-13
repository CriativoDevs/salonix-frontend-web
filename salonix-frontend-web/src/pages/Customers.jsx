import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import CustomerForm from '../components/CustomerForm';
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../api/customers';
import { useTenant } from '../hooks/useTenant';
import { parseApiError } from '../utils/apiError';

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

function Customers() {
  const { t } = useTranslation();
  const { slug } = useTenant();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    notes: '',
    marketing_opt_in: false,
  });
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [sortOption, setSortOption] = useState(SORT_RECENT);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCustomers({ slug })
      .then((payload) => {
        if (cancelled) return;
        const list = Array.isArray(payload?.results) ? payload.results : payload;
        setCustomers(list || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(parseApiError(err, t('common.load_error', 'Falha ao carregar.')));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, t]);

  const sortedCustomers = useMemo(
    () => sortCustomers(customers, sortOption),
    [customers, sortOption],
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

  const handleAdd = async (payload) => {
    setCreateBusy(true);
    try {
      const created = await createCustomer(payload, { slug });
      setCustomers((prev) => [created, ...prev]);
      setError(null);
    } catch (err) {
      const parsed = parseApiError(err, t('common.save_error', 'Falha ao salvar.'));
      setError(parsed);
      throw parsed;
    } finally {
      setCreateBusy(false);
    }
  };

  const startEdit = (customer) => {
    setEditingId(customer.id);
    setEditingForm({
      name: customer.name || '',
      email: customer.email || '',
      phone_number: customer.phone_number || '',
      notes: customer.notes || '',
      marketing_opt_in: Boolean(customer.marketing_opt_in),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingForm({
      name: '',
      email: '',
      phone_number: '',
      notes: '',
      marketing_opt_in: false,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const payload = {
      name: editingForm.name.trim(),
      email: editingForm.email.trim(),
      phone_number: editingForm.phone_number.trim(),
      notes: editingForm.notes.trim(),
      marketing_opt_in: Boolean(editingForm.marketing_opt_in),
    };
    if (!payload.name) {
      setError({ message: t('customers.errors.name_required', 'Informe o nome do cliente.') });
      return;
    }
    if (!payload.email && !payload.phone_number) {
      setError({
        message: t('customers.errors.contact_required', 'Informe e-mail ou telefone para contato.'),
      });
      return;
    }
    try {
      setBusyId(editingId);
      const updated = await updateCustomer(editingId, payload, { slug });
      setCustomers((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      setError(null);
      cancelEdit();
    } catch (err) {
      setError(parseApiError(err, t('common.save_error', 'Falha ao salvar.')));
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
        { slug },
      );
      setCustomers((prev) => prev.map((item) => (item.id === customer.id ? updated : item)));
    } catch (err) {
      setError(parseApiError(err, t('common.save_error', 'Falha ao salvar.')));
    } finally {
      setBusyId(null);
    }
  };

  const removeCustomer = async (customer) => {
    if (!window.confirm(t('customers.confirm_delete', 'Remover este cliente?'))) {
      return;
    }
    if (!customer?.id) return;
    try {
      setBusyId(customer.id);
      await deleteCustomer(customer.id, { slug });
      setCustomers((prev) => prev.filter((item) => item.id !== customer.id));
    } catch (err) {
      const parsed = parseApiError(err, t('customers.errors.delete_failed', 'Não foi possível remover o cliente.'));
      const status = err?.response?.status;
      const message =
        status === 409 ||
        status === 423 ||
        status === 500 ||
        (typeof parsed.message === 'string' && parsed.message.toLowerCase().includes('cannot delete'))
          ? t(
              'customers.errors.delete_protected',
              'Clientes com histórico de agendamentos não podem ser excluídos. Utilize a ação "Desativar".',
            )
          : parsed.message;
      setError({ ...parsed, message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <FullPageLayout>
      <div className="space-y-6">
        <div className="rounded-xl bg-brand-surface p-6 shadow-sm ring-1 ring-brand-border">
          <h1 className="text-2xl font-semibold text-brand-surfaceForeground">
            {t('customers.title', 'Clientes do salão')}
          </h1>
          <p className="mt-1 text-sm text-brand-surfaceForeground/70">
            {t(
              'customers.subtitle',
              'Cadastre clientes para vincular diretamente nos agendamentos e acompanhar contatos.',
            )}
          </p>

          <div className="mt-6">
            <CustomerForm onAdd={handleAdd} busy={createBusy} />
          </div>
        </div>

        <div className="rounded-xl bg-brand-surface p-6 shadow-sm ring-1 ring-brand-border">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-brand-surfaceForeground">
                {t('customers.list.title', 'Lista de clientes')}
              </h2>
              <p className="text-sm text-brand-surfaceForeground/70">
                {t(
                  'customers.list.subtitle',
                  'Use a busca para encontrar rapidamente por nome, e-mail ou telefone.',
                )}
              </p>
              <p className="text-xs text-brand-surfaceForeground/60">
                {t(
                  'customers.list.removal_hint',
                  'Clientes com histórico não podem ser excluídos; desative para manter o cadastro sem aparecer na agenda.',
                )}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="rounded border border-brand-border px-3 py-2 text-sm"
              >
                <option value={SORT_RECENT}>
                  {t('customers.list.sort_recent', 'Mais recentes')}
                </option>
                <option value={SORT_NAME}>
                  {t('customers.list.sort_name', 'Nome (A–Z)')}
                </option>
              </select>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('customers.list.search', 'Buscar cliente...')}
                className="w-full rounded border border-brand-border px-3 py-2 text-sm sm:w-64"
              />
              <label className="flex items-center gap-2 text-sm text-brand-surfaceForeground/70">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                />
                {t('customers.list.show_inactive', 'Exibir inativos')}
              </label>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error.message}</p>
          )}

          {loading ? (
            <p className="mt-4 text-sm text-brand-surfaceForeground/70">
              {t('common.loading', 'Carregando...')}
            </p>
          ) : filtered.length === 0 ? (
            <p className="mt-4 text-sm text-brand-surfaceForeground/70">
              {search
                ? t('customers.list.no_results', 'Nenhum cliente encontrado para esta busca.')
                : t('customers.list.empty', 'Nenhum cliente cadastrado até o momento.')}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-border text-sm text-brand-surfaceForeground">
                <thead className="bg-brand-light/60 text-xs uppercase tracking-wide text-brand-surfaceForeground/70">
                  <tr>
                    <th className="px-3 py-2 text-left">{t('customers.table.name', 'Cliente')}</th>
                    <th className="px-3 py-2 text-left">{t('customers.table.contact', 'Contato')}</th>
                    <th className="px-3 py-2 text-left">{t('customers.table.notes', 'Notas')}</th>
                    <th className="px-3 py-2 text-left">{t('customers.table.status', 'Status')}</th>
                    <th className="px-3 py-2 text-right">{t('customers.table.actions', 'Ações')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {filtered.map((customer) => {
                    const isEditing = editingId === customer.id;
                    const disabled = busyId === customer.id;
                    return (
                      <tr key={customer.id}>
                        <td className="px-3 py-3 align-top">
                          {isEditing ? (
                            <input
                              className="w-full rounded border border-brand-border px-2 py-1 text-sm"
                              value={editingForm.name}
                              onChange={(e) =>
                                setEditingForm((prev) => ({ ...prev, name: e.target.value }))
                              }
                            />
                          ) : (
                            <div className="font-medium">{customer.name}</div>
                          )}
                          <div className="text-xs text-brand-surfaceForeground/60">
                            {t('customers.table.created', 'Criado em:')}{' '}
                            {(() => {
                              const date = customer.created_at ? new Date(customer.created_at) : null;
                              return date && !Number.isNaN(date.getTime())
                                ? date.toLocaleDateString()
                                : t('customers.table.created_unknown', 'Data indisponível');
                            })()}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top">
                          {isEditing ? (
                            <div className="space-y-1">
                              <input
                                className="w-full rounded border border-brand-border px-2 py-1 text-sm"
                                value={editingForm.email}
                                onChange={(e) =>
                                  setEditingForm((prev) => ({ ...prev, email: e.target.value }))
                                }
                                placeholder="cliente@email.com"
                              />
                              <input
                                className="w-full rounded border border-brand-border px-2 py-1 text-sm"
                                value={editingForm.phone_number}
                                onChange={(e) =>
                                  setEditingForm((prev) => ({
                                    ...prev,
                                    phone_number: e.target.value,
                                  }))
                                }
                                placeholder="+351912345678"
                              />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {customer.email && (
                                <div>{customer.email}</div>
                              )}
                              {customer.phone_number && (
                                <div className="text-sm text-brand-surfaceForeground/80">
                                  {customer.phone_number}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          {isEditing ? (
                            <textarea
                              className="w-full rounded border border-brand-border px-2 py-1 text-sm"
                              rows={2}
                              value={editingForm.notes}
                              onChange={(e) =>
                                setEditingForm((prev) => ({ ...prev, notes: e.target.value }))
                              }
                            />
                          ) : (
                            <div className="text-sm text-brand-surfaceForeground/80">
                              {customer.notes || t('customers.table.no_notes', 'Sem notas.')}
                            </div>
                          )}
                          {isEditing && (
                            <label className="mt-2 flex items-center gap-2 text-xs text-brand-surfaceForeground/70">
                              <input
                                type="checkbox"
                                checked={editingForm.marketing_opt_in}
                                onChange={(e) =>
                                  setEditingForm((prev) => ({
                                    ...prev,
                                    marketing_opt_in: e.target.checked,
                                  }))
                                }
                                className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                              />
                              {t('customers.form.marketing_opt_in', 'Aceita receber comunicações de marketing')}
                            </label>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              customer.is_active !== false
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-brand-light text-brand-surfaceForeground/70'
                            }`}
                          >
                            {customer.is_active !== false
                              ? t('customers.status.active', 'Ativo')
                              : t('customers.status.inactive', 'Inativo')}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right align-top">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={saveEdit}
                                disabled={disabled}
                                className="rounded bg-brand-primary px-3 py-1 text-xs font-medium text-white hover:bg-brand-accent disabled:opacity-50"
                              >
                                {t('common.save', 'Salvar')}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="rounded border border-brand-border px-3 py-1 text-xs font-medium text-brand-surfaceForeground hover:bg-brand-light"
                              >
                                {t('common.cancel', 'Cancelar')}
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => startEdit(customer)}
                                className="text-xs font-semibold text-[#1D29CF] hover:underline"
                              >
                                {t('common.edit', 'Editar')}
                              </button>
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => toggleActive(customer)}
                                className="text-xs font-semibold text-brand-surfaceForeground/70 hover:underline disabled:opacity-50"
                              >
                                {customer.is_active !== false
                                  ? t('customers.actions.deactivate', 'Desativar')
                                  : t('customers.actions.activate', 'Reativar')}
                              </button>
                              {customer.is_active === false && (
                                <button
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => removeCustomer(customer)}
                                  className="text-xs font-semibold text-[#CF3B1D] hover:underline disabled:opacity-50"
                                >
                                  {t('common.delete', 'Excluir')}
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </FullPageLayout>
  );
}

export default Customers;
