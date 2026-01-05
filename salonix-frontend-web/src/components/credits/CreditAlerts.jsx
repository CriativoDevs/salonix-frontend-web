import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useCreditAlerts from '../../hooks/useCreditAlerts';
import CreditPurchaseModal from './CreditPurchaseModal';

export default function CreditAlerts() {
  const { t } = useTranslation();
  const { status, balance } = useCreditAlerts();
  const [modalOpen, setModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Se não houver alerta ou se foi dispensado (apenas warnings são dispensáveis)
  if (status.level === 'none') return null;
  if (status.level === 'warning' && dismissed) return null;

  const isCritical = status.level === 'critical';

  return (
    <>
      <div
        className={`w-full px-4 py-3 ${
          isCritical
            ? 'border-b border-red-200 bg-red-50'
            : 'border-b border-yellow-200 bg-yellow-50'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl" role="img" aria-label="alert">
              {isCritical ? '🛑' : '⚠️'}
            </span>
            <div>
              <p
                className={`text-sm font-medium ${
                  isCritical ? 'text-red-800' : 'text-yellow-800'
                }`}
              >
                {isCritical
                  ? t(
                      'credits.alert.critical_title',
                      'Seu saldo de créditos esgotou!'
                    )
                  : t(
                      'credits.alert.low_title',
                      'Seu saldo de créditos está baixo.'
                    )}
              </p>
              <p
                className={`text-xs ${
                  isCritical ? 'text-red-700' : 'text-yellow-700'
                }`}
              >
                {t(
                  'credits.alert.message',
                  'Saldo atual: {{balance}} créditos.',
                  {
                    balance: balance ?? 0,
                  }
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className={`text-xs font-bold underline transition-colors ${
                isCritical
                  ? 'text-red-800 hover:text-red-900'
                  : 'text-yellow-800 hover:text-yellow-900'
              }`}
            >
              {t('credits.add_credits', 'Adicionar créditos')}
            </button>
            {!isCritical && (
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="text-gray-500 hover:text-gray-700"
                aria-label={t('common.close', 'Fechar')}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
      <CreditPurchaseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
