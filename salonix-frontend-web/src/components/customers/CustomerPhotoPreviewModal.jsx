import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import { resolveTenantAssetUrl } from '../../utils/tenant';

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

function CustomerPhotoPreviewModal({ open, customer, onClose }) {
  const { t } = useTranslation();
  const photoSrc = resolveTenantAssetUrl(customer?.photo || '');
  const customerName =
    customer?.name || t('customers.preview.unknown', 'Cliente');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('customers.preview.title', 'Foto do cliente')}
      description={t(
        'customers.preview.description',
        'Use a foto ampliada para diferenciar clientes com nomes parecidos.'
      )}
      size="md"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-brand-primary hover:underline"
          >
            {t('common.close', 'Fechar')}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-light/40 p-3">
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={customerName}
              className="mx-auto max-h-[60vh] w-full rounded-xl object-contain"
            />
          ) : (
            <div className="flex h-72 w-full items-center justify-center rounded-xl bg-brand-light text-5xl font-semibold text-brand-primary/70">
              {getInitials(customerName)}
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-brand-border bg-brand-light/30 p-3">
            <p className="text-xs uppercase tracking-wide text-brand-surfaceForeground/55">
              {t('customers.preview.name', 'Cliente')}
            </p>
            <p className="mt-1 text-base font-semibold text-brand-surfaceForeground">
              {customerName}
            </p>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-light/30 p-3">
            <p className="text-xs uppercase tracking-wide text-brand-surfaceForeground/55">
              {t('customers.preview.birthday', 'Aniversario')}
            </p>
            <p className="mt-1 text-base font-medium text-brand-surfaceForeground">
              {formatBirthday(customer?.birthday)}
            </p>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-light/30 p-3">
            <p className="text-xs uppercase tracking-wide text-brand-surfaceForeground/55">
              {t('customers.preview.email', 'E-mail')}
            </p>
            <p className="mt-1 text-sm text-brand-surfaceForeground">
              {customer?.email || '—'}
            </p>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-light/30 p-3">
            <p className="text-xs uppercase tracking-wide text-brand-surfaceForeground/55">
              {t('customers.preview.phone', 'Telefone')}
            </p>
            <p className="mt-1 text-sm text-brand-surfaceForeground">
              {customer?.phone_number || '—'}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default CustomerPhotoPreviewModal;
