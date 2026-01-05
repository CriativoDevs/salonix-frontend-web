import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import useCreditPurchase from '../../hooks/useCreditPurchase';
import useCreditBalance from '../../hooks/useCreditBalance';

export default function CreditPurchaseModal({ open, onClose }) {
  const { t } = useTranslation();
  const { packages, loadingPackages, purchaseLoading, error, buyPackage } =
    useCreditPurchase();

  const { balance } = useCreditBalance({ enabled: open });
  const currentBalance = Number(balance?.current_balance || 0);

  const [selectedAmount, setSelectedAmount] = useState(null);

  // Set default selection when packages load
  useEffect(() => {
    if (open && packages.length > 0 && !selectedAmount) {
      const first = packages[0];
      const amt = first?.price_eur ?? first?.credits ?? 5;
      setSelectedAmount(Number(amt));
    } else if (open && !selectedAmount && packages.length === 0) {
      // Default fallback if no packages loaded yet or empty
      setSelectedAmount(5);
    }
  }, [open, packages, selectedAmount]);

  const handleBuy = () => {
    if (selectedAmount) {
      buyPackage(selectedAmount);
    }
  };

  const defaultPackages = [
    { price_eur: 5, credits: 5 },
    { price_eur: 10, credits: 11 },
    { price_eur: 25, credits: 28 },
    { price_eur: 50, credits: 60 },
    { price_eur: 100, credits: 130 },
  ];

  const displayPackages = packages.length > 0 ? packages : defaultPackages;

  const selectedPkg = displayPackages.find(
    (p) => (p.price_eur ?? p.credits) === selectedAmount
  );
  const creditsToAdd = selectedPkg?.credits ?? selectedPkg?.price_eur ?? 0;
  const finalBalance = currentBalance + Number(creditsToAdd);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('settings.credits.add_credits', 'Adicionar créditos')}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-brand-surfaceForeground/80">
          {t(
            'settings.credits.description',
            'Selecione um valor para comprar. Pagamento via Stripe (checkout).'
          )}
        </p>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {t('common.error', 'Ocorreu um erro')}:{' '}
            {error.message || String(error)}
          </div>
        )}

        <div className="space-y-2">
          <select
            className="w-full p-2 text-sm border rounded-md border-brand-border bg-brand-surface text-brand-surfaceForeground"
            value={selectedAmount || ''}
            onChange={(e) => setSelectedAmount(Number(e.target.value))}
            disabled={loadingPackages || purchaseLoading}
          >
            {loadingPackages && packages.length === 0 ? (
              <option>{t('common.loading', 'Carregando...')}</option>
            ) : (
              displayPackages.map((pkg) => {
                const val = pkg.price_eur ?? pkg.credits;
                const credits = pkg.credits
                  ? `${pkg.credits} ${t('common.credits', 'créditos')}`
                  : '';
                const price = pkg.price_eur ? `€ ${pkg.price_eur}` : '';
                const label =
                  credits && price ? `${credits} - ${price}` : `€ ${val}`;
                return (
                  <option key={val} value={val}>
                    {label}
                  </option>
                );
              })
            )}
          </select>
        </div>

        {selectedAmount && (
          <div className="mt-4 p-3 bg-brand-surface border border-brand-border rounded-md text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-brand-surfaceForeground/60">
                {t('settings.credits.current_balance', 'Saldo atual')}:
              </span>
              <span className="font-medium">{currentBalance}</span>
            </div>
            <div className="flex justify-between mb-1 text-emerald-600">
              <span>{t('settings.credits.purchase_amount', '+ Compra')}:</span>
              <span className="font-medium">+{creditsToAdd}</span>
            </div>
            <div className="border-t border-brand-border my-2"></div>
            <div className="flex justify-between font-semibold text-brand-surfaceForeground">
              <span>{t('settings.credits.new_balance', 'Novo saldo')}:</span>
              <span className="font-medium">{finalBalance}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 items-center">
          <button
            type="button"
            className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700"
            onClick={onClose}
            disabled={purchaseLoading}
          >
            {t('common.cancel', 'Cancelar')}
          </button>
          <button
            type="button"
            className="px-4 py-2 text-xs font-medium text-brand-primary underline hover:text-brand-primary/80 disabled:opacity-50"
            onClick={handleBuy}
            disabled={purchaseLoading || !selectedAmount}
          >
            {purchaseLoading
              ? t('common.processing', 'Processando...')
              : t('settings.credits.buy', 'Comprar')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
