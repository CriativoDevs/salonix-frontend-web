import React from 'react';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../layouts/AuthLayout';

export default function Setup() {
  const { t } = useTranslation();

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('setup.title', 'Configuração Inicial')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t(
              'setup.description',
              'Vamos configurar o seu estabelecimento para começar.'
            )}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            {t(
              'setup.placeholder',
              'O formulário de configuração será implementado aqui.'
            )}
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
