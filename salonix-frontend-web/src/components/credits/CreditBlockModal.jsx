import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';

export default function CreditBlockModal({ open, onClose, onBuy, action }) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('credits.block.title', 'Saldo insuficiente')}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-brand-surfaceForeground/80">
          {t('credits.block.message', 'Você precisa de créditos para realizar esta ação ({{action}}).', { 
            action: action || t('common.action', 'ação') 
          })}
        </p>
        <div className="flex justify-end gap-3 pt-2">
           <button
             type="button"
             className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700"
             onClick={onClose}
           >
             {t('common.cancel', 'Cancelar')}
           </button>
           <button
             type="button"
             className="px-4 py-2 text-xs font-medium text-brand-primary underline hover:text-brand-primary/80"
             onClick={() => { onClose(); onBuy?.(); }}
           >
             {t('credits.buy', 'Comprar créditos')}
           </button>
        </div>
      </div>
    </Modal>
  );
}
