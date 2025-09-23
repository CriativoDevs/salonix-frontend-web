import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import { useTenant } from '../hooks/useTenant';
import { describeFeatureRequirement } from '../constants/tenantFeatures';

export default function Dashboard() {
  const { t } = useTranslation();
  const { plan, profile, flags } = useTenant();

  const businessSummary = useMemo(() => {
    if (!profile?.businessName) {
      return t('dashboard.subtitle', 'Resumo do seu negócio');
    }

    return `${profile.businessName} • ${t('dashboard.subtitle', 'Resumo do seu negócio')}`;
  }, [profile?.businessName, t]);

  const planName = plan?.name;
  const reportsEnabled = flags?.enableReports !== false;
  const reportsRequirement = !reportsEnabled
    ? describeFeatureRequirement('enableReports', planName)
    : null;

  return (
    <FullPageLayout>
      <PageHeader
        title={t('dashboard.title', 'Dashboard')}
        subtitle={businessSummary}
      >
        {planName ? (
          <span className="rounded-full border border-brand-border bg-brand-light px-3 py-1 text-xs font-medium text-gray-700">
            {t('settings.plan_badge', 'Plano')}: {planName}
          </span>
        ) : null}
      </PageHeader>

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
                <button className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-accent">
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

        <Card className="p-6">
          <h2 className="text-lg font-medium text-gray-900">
            {t('dashboard.reports_section', 'Relatórios')}
          </h2>
          {reportsEnabled ? (
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <p>{t('dashboard.reports_enabled', 'Aceda aos relatórios completos e exporte os dados sempre que precisar.')}</p>
              <button className="rounded-lg border border-brand-border bg-brand-light px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-light/70">
                {t('dashboard.view_reports', 'Ver relatórios')}
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <strong>{reportsRequirement?.label || t('dashboard.reports_locked', 'Relatórios bloqueados')}</strong>
              <p className="mt-1">
                {reportsRequirement?.description ||
                  t(
                    'dashboard.reports_locked_description',
                    'Atualize o plano para desbloquear relatórios avançados.'
                  )}
              </p>
            </div>
          )}
        </Card>
      </section>
    </FullPageLayout>
  );
}
