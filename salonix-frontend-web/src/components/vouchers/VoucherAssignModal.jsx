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

function VoucherAssignModal({ open, voucher, busy = false, error = null, onClose, onSubmit }) {
  const { t } = useTranslation();
  const { slug } = useTenant();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [sendEmail, setSendEmail] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setResults([]);
    setSelectedCustomer(null);
    setSendEmail(false);
    setSearchError(null);
  }, [open, voucher]);

  useEffect(() => {
    if (!open) return undefined;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const term = search.trim();
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

  const handleSubmit = async (event) => {
    event?.preventDefault();
    if (!selectedCustomer) return;
    await onSubmit?.({ client: selectedCustomer, sendEmail });
  };

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
        disabled={busy || !selectedCustomer}
        className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50"
      >
        {busy
          ? t('common.saving', 'Salvando...')
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
        'Busque o cliente pelo nome ou e-mail para atribuir o voucher {{code}}.',
        { code: voucher?.code || '' }
      )}
      size="md"
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
              onChange={(event) => {
                setSearch(event.target.value);
                setSelectedCustomer(null);
              }}
              placeholder={t(
                'vouchers.assign.search_placeholder',
                'Nome ou e-mail do cliente'
              )}
              style={inputStyle}
              className="w-full rounded-lg border px-9 py-2 text-sm"
            />
          </div>
        </label>

        {searching ? (
          <p className="text-xs text-brand-surfaceForeground/60">
            {t('common.loading', 'Carregando...')}
          </p>
        ) : null}

        {searchError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {searchError.message}
          </div>
        ) : null}

        {!searching && results.length > 0 ? (
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-brand-border p-1">
            {results.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(customer)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                    selectedCustomer?.id === customer.id
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'hover:bg-brand-light text-brand-surfaceForeground'
                  }`}
                >
                  <span className="block font-medium">{customer.name}</span>
                  <span className="block text-xs text-brand-surfaceForeground/60">
                    {customer.email || customer.phone_number || ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {selectedCustomer ? (
          <div className="rounded-lg border border-brand-primary/20 bg-brand-primary/5 p-3 text-sm">
            <p className="font-medium text-brand-surfaceForeground">
              {t('vouchers.assign.selected', 'Selecionado: {{name}}', {
                name: selectedCustomer.name,
              })}
            </p>
            <label className="mt-2 flex items-center gap-2 text-xs text-brand-surfaceForeground/80">
              <input
                type="checkbox"
                checked={sendEmail}
                disabled={!selectedCustomer.email}
                onChange={(event) => setSendEmail(event.target.checked)}
              />
              {t('vouchers.assign.send_email', 'Enviar por e-mail')}
            </label>
            {!selectedCustomer.email ? (
              <p className="mt-1 text-xs text-brand-surfaceForeground/50">
                {t(
                  'vouchers.assign.no_email',
                  'Este cliente não tem e-mail cadastrado.'
                )}
              </p>
            ) : null}
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
