import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import Modal from '../ui/Modal';
import { fetchCustomers } from '../../api/customers';
import { useTenant } from '../../hooks/useTenant';
import { parseApiError } from '../../utils/apiError';

const inputStyle = {
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border-primary)',
};

function VoucherAssignModal({
  open,
  voucher,
  busy = false,
  error = null,
  onClose,
  onSubmit,
  onSubmitBulk,
}) {
  const { t } = useTranslation();
  const { slug } = useTenant();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  // Map id -> customer, preserva os dados de quem foi selecionado mesmo
  // que a busca mude e o cliente não esteja mais na lista visível.
  const [selected, setSelected] = useState(new Map());
  const [sendEmail, setSendEmail] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setResults([]);
    setSelected(new Map());
    setSendEmail(false);
    setSearchError(null);
  }, [open, voucher]);

  // Pré-carrega os primeiros clientes (ordenados por nome pelo backend) ao
  // abrir o modal, pra não depender só de digitar uma busca pra ver algo.
  useEffect(() => {
    if (!open) return;
    setSearching(true);
    setSearchError(null);
    fetchCustomers({ slug, params: { limit: 20 } })
      .then((data) => {
        setResults(Array.isArray(data?.results) ? data.results : []);
      })
      .catch((err) => {
        setSearchError(
          parseApiError(
            err,
            t('vouchers.assign.errors.search_failed', 'Falha ao buscar clientes.')
          )
        );
      })
      .finally(() => setSearching(false));
  }, [open, slug, t]);

  useEffect(() => {
    if (!open) return undefined;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const term = search.trim();
    if (term.length === 0) {
      return undefined;
    }
    if (term.length < 2) {
      setResults([]);
      return undefined;
    }

    debounceRef.current = setTimeout(() => {
      setSearching(true);
      setSearchError(null);
      fetchCustomers({ slug, params: { q: term, limit: 10 } })
        .then((data) => {
          setResults(Array.isArray(data?.results) ? data.results : []);
        })
        .catch((err) => {
          setSearchError(
            parseApiError(
              err,
              t('vouchers.assign.errors.search_failed', 'Falha ao buscar clientes.')
            )
          );
        })
        .finally(() => setSearching(false));
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [search, open, slug, t]);

  const selectedCount = selected.size;
  const selectedList = Array.from(selected.values());
  const allVisibleSelected =
    results.length > 0 && results.every((customer) => selected.has(customer.id));

  const toggleCustomer = (customer) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(customer.id)) {
        next.delete(customer.id);
      } else {
        next.set(customer.id, customer);
      }
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (allVisibleSelected) {
        results.forEach((customer) => next.delete(customer.id));
      } else {
        results.forEach((customer) => next.set(customer.id, customer));
      }
      return next;
    });
  };

  const clearSelection = () => setSelected(new Map());

  const handleSubmit = async (event) => {
    event?.preventDefault();
    if (selectedCount === 0) return;
    if (selectedCount === 1) {
      await onSubmit?.({ client: selectedList[0], sendEmail });
      return;
    }
    await onSubmitBulk?.(selectedList);
  };

  const dropdownOpen = searching || !!searchError || results.length > 0;
  const singleSelected = selectedCount === 1 ? selectedList[0] : null;

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        disabled={busy}
        className="text-sm font-medium text-brand-surfaceForeground/60 hover:underline disabled:opacity-50"
      >
        {t('common.cancel', 'Cancelar')}
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={busy || selectedCount === 0}
        className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50"
      >
        {busy
          ? t('common.saving', 'Salvando...')
          : selectedCount > 1
            ? t('vouchers.assign.confirm_bulk', 'Atribuir a {{count}} clientes', {
                count: selectedCount,
              })
            : t('vouchers.assign.confirm', 'Atribuir voucher')}
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('vouchers.assign.title', 'Atribuir a cliente')}
      description={t(
        'vouchers.assign.description',
        'Busque o cliente pelo nome ou e-mail, ou marque vários, para atribuir o voucher {{code}}.',
        { code: voucher?.code || '' }
      )}
      size="lg"
      footer={footer}
    >
      <div className="space-y-4">
        <label className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80">
          {t('vouchers.assign.search_label', 'Cliente')}
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-surfaceForeground/40" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t(
                'vouchers.assign.search_placeholder',
                'Nome ou e-mail do cliente'
              )}
              style={inputStyle}
              className="w-full rounded-lg border px-9 py-2 text-sm"
            />
          </div>
        </label>

        {dropdownOpen ? (
          <div
            className="rounded-lg border border-brand-border"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            {results.length > 0 ? (
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                className="flex w-full items-center gap-2 border-b border-brand-border px-3 py-2 text-xs font-semibold text-brand-surfaceForeground/70 hover:bg-brand-light"
              >
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  readOnly
                  className="pointer-events-none"
                />
                {t('vouchers.assign.select_all', 'Selecionar todos')}
              </button>
            ) : null}

            <ul className="max-h-44 overflow-y-auto p-1">
              {searching ? (
                <li className="px-3 py-2 text-xs text-brand-surfaceForeground/60">
                  {t('common.loading', 'Carregando...')}
                </li>
              ) : null}

              {!searching && searchError ? (
                <li className="px-3 py-2 text-sm text-rose-700">{searchError.message}</li>
              ) : null}

              {!searching && !searchError
                ? results.map((customer) => (
                    <li key={customer.id}>
                      <button
                        type="button"
                        onClick={() => toggleCustomer(customer)}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                          selected.has(customer.id)
                            ? 'bg-brand-primary/10 text-brand-primary'
                            : 'hover:bg-brand-light text-brand-surfaceForeground'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(customer.id)}
                          readOnly
                          className="pointer-events-none"
                        />
                        <span className="flex-1">
                          <span className="block font-medium">{customer.name}</span>
                          <span className="block text-xs text-brand-surfaceForeground/60">
                            {customer.email || customer.phone_number || ''}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))
                : null}
            </ul>
          </div>
        ) : null}

        {selectedCount > 0 ? (
          <div className="rounded-lg border border-brand-primary/20 bg-brand-primary/5 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-brand-surfaceForeground">
                {selectedCount === 1
                  ? t('vouchers.assign.selected', 'Selecionado: {{name}}', {
                      name: singleSelected.name,
                    })
                  : t('vouchers.assign.selected_count', '{{count}} clientes selecionados', {
                      count: selectedCount,
                    })}
              </p>
              <button
                type="button"
                onClick={clearSelection}
                className="shrink-0 text-xs font-semibold text-brand-primary hover:underline"
              >
                {t('vouchers.assign.clear_selection', 'Limpar')}
              </button>
            </div>

            {selectedCount === 1 ? (
              <>
                <label className="mt-2 flex items-center gap-2 text-xs text-brand-surfaceForeground/80">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    disabled={!singleSelected.email}
                    onChange={(event) => setSendEmail(event.target.checked)}
                  />
                  {t('vouchers.assign.send_email', 'Enviar por e-mail')}
                </label>
                {!singleSelected.email ? (
                  <p className="mt-1 text-xs text-brand-surfaceForeground/50">
                    {t(
                      'vouchers.assign.no_email',
                      'Este cliente não tem e-mail cadastrado.'
                    )}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-2 text-xs text-brand-surfaceForeground/60">
                {t(
                  'vouchers.assign.bulk_no_email',
                  'Atribuição em massa não envia e-mail automático — envie individualmente depois, se precisar.'
                )}
              </p>
            )}
          </div>
        ) : null}

        {error?.message ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error.message}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export default VoucherAssignModal;
