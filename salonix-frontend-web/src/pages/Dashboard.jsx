import React from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <FullPageLayout>
      <PageHeader
        title={t('dashboard.title', 'Dashboard')}
        subtitle={t('dashboard.subtitle', 'Resumo do seu negócio')}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('dashboard.stats.bookings', 'Agendamentos (hoje)')}
          value="12"
          hint="+3 vs ontem"
        />
        <StatCard
          label={t('dashboard.stats.revenue', 'Receita (mês)')}
          value="€ 1.820"
          hint="+8% MoM"
        />
        <StatCard
          label={t('dashboard.stats.clients', 'Clientes')}
          value="248"
          hint="+12 novos"
        />
        <StatCard
          label={t('dashboard.stats.util', 'Ocupação')}
          value="74%"
          hint="meta 80%"
        />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-lg font-medium text-gray-900">
            {t('dashboard.upcoming', 'Próximos agendamentos')}
          </h2>
          <div className="mt-4">
            <EmptyState
              title={t(
                'dashboard.no_upcoming',
                'Sem agendamentos nas próximas horas'
              )}
              description={t(
                'dashboard.create_first',
                'Crie um novo agendamento ou abra horários disponíveis.'
              )}
              action={
                <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                  {t('dashboard.new_booking', 'Novo agendamento')}
                </button>
              }
            />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-lg font-medium text-gray-900">
            {t('dashboard.quick_actions', 'Ações rápidas')}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              {t('dashboard.add_slot', 'Abrir horários')}
            </button>
            <button className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              {t('dashboard.add_professional', 'Adicionar profissional')}
            </button>
            <button className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              {t('dashboard.add_service', 'Cadastrar serviço')}
            </button>
          </div>
        </div>
      </section>
    </FullPageLayout>
  );
}
