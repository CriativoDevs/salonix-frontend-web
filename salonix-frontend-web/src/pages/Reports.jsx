import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { LockIcon } from 'lucide-react';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import BasicReportsMetrics from '../components/reports/BasicReportsMetrics';
import DateFilters from '../components/reports/DateFilters';
import ExportButton from '../components/reports/ExportButton';
import AdvancedExportButton from '../components/reports/AdvancedExportButton';
import TopServices from '../components/reports/TopServices';
import RevenueChart from '../components/reports/RevenueChart';
import AdvancedFilters from '../components/reports/AdvancedFilters';
import ToastContainer from '../components/ui/ToastContainer';
import UpgradePrompt from '../components/security/UpgradePrompt';
import useFeatureLock from '../hooks/useFeatureLock';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { useStaff } from '../hooks/useStaff';
import { useReportsData } from '../hooks/useReportsData';
import useToast from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import {
  exportTopServicesReport,
  exportRevenueReport,
  downloadCSV,
} from '../api/reports';

export default function Reports() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { slug, profile, plan } = useTenant();
  const { user } = useAuth();
  const { staff, error: staffError, forbidden } = useStaff({ slug });
  const [activeTab, setActiveTab] = useState('basic');

  // Toast system
  const { toasts, showSuccess, showError, hideToast } = useToast();

  // Função para formatar data para input type="date"
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Definir data padrão (últimos 30 dias)
  const getDefaultFromDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return formatDateForInput(date);
  };

  const getDefaultToDate = () => {
    return formatDateForInput(new Date());
  };

  // Estados para filtros de data - inicializar com valores vazios para permitir seleção do usuário
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    from: getDefaultFromDate(),
    to: getDefaultToDate(),
  });

  // Debounce dos filtros para otimizar chamadas à API
  const debouncedFromDate = useDebounce(fromDate, 800);
  const debouncedToDate = useDebounce(toDate, 800);

  // Estados para filtros avançados
  const [advancedInterval, setAdvancedInterval] = useState('day');
  const [advancedLimit, setAdvancedLimit] = useState(25);

  // Auto-aplicar filtros quando os valores debounced mudarem
  useEffect(() => {
    if (debouncedFromDate || debouncedToDate) {
      const filters = {};
      if (debouncedFromDate) filters.from = debouncedFromDate;
      if (debouncedToDate) filters.to = debouncedToDate;
      setAppliedFilters(filters);
    }
  }, [debouncedFromDate, debouncedToDate]);

  // Determinar papel do usuário atual
  const currentUserRole = useMemo(() => {
    if (!user) {
      return null;
    }
    if (
      staffError ||
      forbidden ||
      !Array.isArray(staff) ||
      staff.length === 0
    ) {
      return 'owner';
    }
    const email =
      typeof user.email === 'string' ? user.email.toLowerCase() : null;
    const username =
      typeof user.username === 'string' ? user.username.toLowerCase() : null;
    const match = staff.find((member) => {
      const memberEmail =
        typeof member.email === 'string' ? member.email.toLowerCase() : null;
      const memberUsername =
        typeof member.username === 'string'
          ? member.username.toLowerCase()
          : null;
      return (
        (email && memberEmail === email) ||
        (username && memberUsername === username)
      );
    });
    if (match?.role) return match.role;
    const userEmail =
      typeof user?.email === 'string' ? user.email.toLowerCase() : null;
    const tenantEmail =
      typeof profile?.email === 'string' ? profile.email.toLowerCase() : null;
    if (userEmail && tenantEmail && userEmail === tenantEmail) {
      return 'owner';
    }
    return null;
  }, [staff, user, staffError, forbidden, profile?.email]);

  // Verificar se é owner
  const isOwner = currentUserRole === 'owner';

  // Verificação de permissões por feature usando useFeatureLock
  const { isLocked: basicReportsLocked } = useFeatureLock('enableBasicReports');
  const { isLocked: businessReportsLocked } = useFeatureLock(
    'enableBusinessReports'
  );
  const { isLocked: advancedReportsLocked } = useFeatureLock(
    'enableAdvancedReports'
  );

  // Verificar permissões baseadas no plano (mantido para compatibilidade)
  const planTier = plan?.tier?.toLowerCase();

  const canViewAdvancedInsights = useMemo(() => {
    return planTier === 'pro';
  }, [planTier]);

  // Hook para dados de relatórios
  const reportType = useMemo(() => {
    if (activeTab === 'basic') return 'basic';
    if (activeTab === 'business') return 'business';
    if (activeTab === 'insights') return 'insights';
    return 'basic';
  }, [activeTab]);

  const {
    data: reportsData,
    loading: reportsLoading,
    error: reportsError,
    forbidden: reportsForbidden,
    refetch: refetchReports,
  } = useReportsData({
    slug,
    type: reportType,
    filters: appliedFilters,
  });

  // Toast notifications based on data loading state
  useEffect(() => {
    if (reportsError) {
      showError(t('reports.error', 'Erro ao carregar relatórios'));
    }
  }, [reportsError, showError, t]);

  // Funções para lidar com filtros de data
  const handleApplyFilters = () => {
    const filters = {};
    if (fromDate) filters.from = fromDate;
    if (toDate) filters.to = toDate;
    setAppliedFilters(filters);
  };

  // Funções de exportação para Business Analysis
  const handleExportTopServices = async () => {
    try {
      const blob = await exportTopServicesReport({
        slug,
        ...appliedFilters,
        limit: advancedLimit,
      });
      const filename = `top_services_${slug}_${appliedFilters.from}_${appliedFilters.to}.csv`;
      downloadCSV(blob, filename);
      showSuccess(
        t('reports.export_success', 'Relatório exportado com sucesso!')
      );
    } catch (error) {
      console.error('Export error:', error);
      showError(t('reports.export_error', 'Erro ao exportar relatório.'));
    }
  };

  const handleExportRevenue = async () => {
    try {
      const blob = await exportRevenueReport({
        slug,
        ...appliedFilters,
        interval: advancedInterval,
      });
      const filename = `revenue_${slug}_${appliedFilters.from}_${appliedFilters.to}.csv`;
      downloadCSV(blob, filename);
      showSuccess(
        t('reports.export_success', 'Relatório exportado com sucesso!')
      );
    } catch (error) {
      console.error('Export error:', error);
      showError(t('reports.export_error', 'Erro ao exportar relatório.'));
    }
  };

  const retention = reportsData?.insightsReports?.retention;
  const insightsPeriod = reportsData?.insightsReports?.period;

  // Se não for owner, não tem acesso
  if (!isOwner) {
    return (
      <FullPageLayout>
        <PageHeader
          title={t('reports.title', 'Relatórios')}
          subtitle={t('reports.subtitle', 'Análise detalhada do seu negócio')}
        />

        <Card className="p-6">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-error/10 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-error"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-brand-surfaceForeground mb-2">
              {t('reports.access_denied', 'Acesso Negado')}
            </h3>
            <p className="text-brand-surfaceForeground/70">
              {t(
                'reports.access_denied_description',
                'Apenas proprietários têm acesso aos relatórios.'
              )}
            </p>
          </div>
        </Card>
      </FullPageLayout>
    );
  }

  return (
    <FullPageLayout className="theme-bg-primary theme-text-primary">
      <PageHeader
        title={t('reports.title', 'Relatórios')}
        subtitle={t(
          'reports.subtitle',
          'Visualize e exporte dados do seu negócio'
        )}
      />

      {/* Verificar se é owner */}
      {currentUserRole !== 'owner' ? (
        <Card className="p-6 text-center">
          <div className="text-brand-surfaceForeground">
            <h3 className="text-lg font-medium mb-2">
              {t('reports.access_denied.title', 'Acesso restrito')}
            </h3>
            <p className="text-brand-surfaceForeground/70">
              {t(
                'reports.access_denied.description',
                'Apenas proprietários têm acesso aos relatórios do negócio.'
              )}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="border-b border-brand-border">
            <nav className="-mb-px flex space-x-8">
              {/* Tab Básicos - Disponível para todos os planos (Founder+) */}
              <button
                onClick={() => !basicReportsLocked && setActiveTab('basic')}
                disabled={basicReportsLocked}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-1.5 ${
                  activeTab === 'basic'
                    ? 'border-brand-primary text-brand-primary'
                    : basicReportsLocked
                      ? 'border-transparent text-brand-surfaceForeground/40 cursor-not-allowed'
                      : 'border-transparent text-brand-surfaceForeground/70 hover:text-brand-surfaceForeground hover:border-brand-surfaceForeground/30'
                }`}
                title={
                  basicReportsLocked
                    ? t('upgrade.available_in_plan', {
                        plan: 'Founder',
                        defaultValue: 'Disponível no plano Founder',
                      })
                    : ''
                }
              >
                {t('reports.tabs.basic', 'Básicos')}
                {basicReportsLocked && <LockIcon className="h-3.5 w-3.5" />}
              </button>

              {/* Tab Análise de Negócio - Requer Pro */}
              <button
                onClick={() =>
                  !businessReportsLocked && setActiveTab('business')
                }
                disabled={businessReportsLocked}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-1.5 ${
                  activeTab === 'business'
                    ? 'border-brand-primary text-brand-primary'
                    : businessReportsLocked
                      ? 'border-transparent text-brand-surfaceForeground/40 cursor-not-allowed'
                      : 'border-transparent text-brand-surfaceForeground/70 hover:text-brand-surfaceForeground hover:border-brand-surfaceForeground/30'
                }`}
                title={
                  businessReportsLocked
                    ? t('upgrade.available_in_plan', {
                        plan: 'Pro',
                        defaultValue: 'Disponível no plano Pro',
                      })
                    : ''
                }
              >
                {t('reports.tabs.business', 'Análise de Negócio')}
                {businessReportsLocked && <LockIcon className="h-3.5 w-3.5" />}
              </button>

              {/* Tab Insights Avançados - Requer Pro */}
              <button
                onClick={() =>
                  !advancedReportsLocked && setActiveTab('insights')
                }
                disabled={advancedReportsLocked}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-1.5 ${
                  activeTab === 'insights'
                    ? 'border-brand-primary text-brand-primary'
                    : advancedReportsLocked
                      ? 'border-transparent text-brand-surfaceForeground/40 cursor-not-allowed'
                      : 'border-transparent text-brand-surfaceForeground/70 hover:text-brand-surfaceForeground hover:border-brand-surfaceForeground/30'
                }`}
                title={
                  advancedReportsLocked
                    ? t('upgrade.available_in_plan', {
                        plan: 'Pro',
                        defaultValue: 'Disponível no plano Pro',
                      })
                    : ''
                }
              >
                {t('reports.tabs.insights', 'Insights Avançados')}
                {advancedReportsLocked && <LockIcon className="h-3.5 w-3.5" />}
              </button>
            </nav>
          </div>

          {/* Filtros de data */}
          <DateFilters
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            onApplyFilters={handleApplyFilters}
            loading={reportsLoading}
          />

          {/* Conteúdo das tabs */}
          {activeTab === 'basic' && (
            <Card className="p-6">
              {/* Verificar se tab está bloqueada */}
              {basicReportsLocked ? (
                <UpgradePrompt
                  featureKey="enableBasicReports"
                  variant="inline"
                />
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-brand-surfaceForeground">
                      {t('reports.basic.title', 'Relatórios Básicos')}
                    </h3>
                    {reportsData?.basicReports?.period && (
                      <span className="text-xs font-medium text-brand-surfaceForeground/50 bg-brand-light/50 px-2 py-1 rounded">
                        {t(
                          'reports.insights.period_label',
                          'Dados de {{start}} até {{end}}',
                          {
                            start: new Date(
                              reportsData.basicReports.period.start
                            ).toLocaleDateString(i18n.language),
                            end: new Date(
                              reportsData.basicReports.period.end
                            ).toLocaleDateString(i18n.language),
                          }
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-brand-surfaceForeground/70 mb-4">
                    {t(
                      'reports.basic.description',
                      'Relatórios essenciais para acompanhar o desempenho do seu salão'
                    )}
                  </p>

                  {/* Loading state */}
                  {reportsLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                      <span className="ml-3 text-brand-surfaceForeground/70">
                        {t('reports.loading', 'Carregando relatórios...')}
                      </span>
                    </div>
                  )}

                  {/* Error state */}
                  {reportsError && !reportsLoading && (
                    <div className="bg-brand-light/50 border border-brand-border rounded-lg p-4">
                      <div className="flex items-center">
                        <svg
                          className="h-5 w-5 text-red-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm text-brand-surfaceForeground">
                          {reportsError.message ||
                            t('reports.error', 'Erro ao carregar relatórios')}
                        </p>
                      </div>
                      <button
                        onClick={refetchReports}
                        className="mt-2 text-sm text-brand-primary hover:text-brand-primary/80"
                      >
                        {t('reports.retry', 'Tentar novamente')}
                      </button>
                    </div>
                  )}

                  {/* Forbidden state */}
                  {reportsForbidden && !reportsLoading && (
                    <div className="bg-brand-light/50 border border-brand-border rounded-lg p-4">
                      <p className="text-sm text-brand-surfaceForeground">
                        {t(
                          'reports.forbidden',
                          'Seu plano atual não inclui acesso aos relatórios.'
                        )}
                      </p>
                    </div>
                  )}

                  {/* Content */}
                  {!reportsLoading && !reportsError && !reportsForbidden && (
                    <div>
                      {reportsData?.basicReports ? (
                        <div>
                          <BasicReportsMetrics
                            data={reportsData.basicReports}
                          />

                          {/* Export Button */}
                          <div className="mt-4 flex justify-end">
                            <ExportButton
                              filters={appliedFilters}
                              disabled={reportsLoading}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="bg-brand-light/50 border border-brand-border rounded-lg p-4">
                          <p className="text-sm text-brand-surfaceForeground/60">
                            {t(
                              'reports.basic.coming_soon',
                              'Em breve: Relatórios básicos de agendamentos, receita e clientes'
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </Card>
          )}

          {activeTab === 'business' && (
            <Card className="p-6">
              {/* Verificar se tab está bloqueada */}
              {businessReportsLocked ? (
                <UpgradePrompt
                  featureKey="enableBusinessReports"
                  variant="inline"
                />
              ) : (
                <>
                  <h3 className="text-lg font-medium text-brand-surfaceForeground mb-2">
                    {t('reports.business.title', 'Análise de Negócio')}
                  </h3>
                  <p className="text-brand-surfaceForeground/70 mb-4">
                    {t(
                      'reports.business.description',
                      'Acompanhe os serviços mais vendidos e a evolução da receita'
                    )}
                  </p>
                  {/* Loading state */}
                  {reportsLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                      <span className="ml-3 text-brand-surfaceForeground/70">
                        {t('reports.loading', 'Carregando relatórios...')}
                      </span>
                    </div>
                  )}

                  {/* Error state */}
                  {reportsError && !reportsLoading && (
                    <div className="bg-brand-light/50 border border-brand-border rounded-lg p-4">
                      <div className="flex items-center">
                        <svg
                          className="h-5 w-5 text-red-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm text-brand-surfaceForeground">
                          {reportsError.message ||
                            t('reports.error', 'Erro ao carregar relatórios')}
                        </p>
                      </div>
                      <button
                        onClick={refetchReports}
                        className="mt-2 text-sm text-brand-primary hover:text-brand-primary/80"
                      >
                        {t('reports.retry', 'Tentar novamente')}
                      </button>
                    </div>
                  )}

                  {/* Content */}
                  {!reportsLoading && !reportsError && (
                    <div className="space-y-8">
                      {reportsData?.businessReports ? (
                        <>
                          {/* Advanced Filters for Revenue */}
                          <AdvancedFilters
                            interval={advancedInterval}
                            onIntervalChange={setAdvancedInterval}
                            limit={advancedLimit}
                            onLimitChange={setAdvancedLimit}
                            loading={reportsLoading}
                          />

                          {/* Top Services */}
                          <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                              <div>
                                <h4 className="text-lg font-medium text-brand-surfaceForeground">
                                  {t(
                                    'reports.advanced.top_services.title',
                                    'Serviços Mais Populares'
                                  )}
                                </h4>
                                <p className="text-sm text-brand-surfaceForeground/60">
                                  {t(
                                    'reports.advanced.top_services.description',
                                    'Ranking dos serviços por número de agendamentos'
                                  )}
                                </p>
                              </div>
                              <button
                                onClick={handleExportTopServices}
                                disabled={reportsLoading}
                                className="inline-flex items-center text-xs font-medium text-brand-primary hover:text-brand-primary/80 hover:underline focus:outline-none disabled:opacity-50"
                              >
                                <svg
                                  className="mr-1.5 h-4 w-4 text-brand-surfaceForeground/50"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                                {t('reports.export_csv', 'Exportar CSV')}
                              </button>
                            </div>
                            <TopServices
                              data={{
                                top_services:
                                  reportsData.businessReports.top_services,
                              }}
                              loading={reportsLoading}
                              limit={advancedLimit}
                            />
                          </Card>

                          {/* Revenue Chart */}
                          <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-base font-medium text-brand-surfaceForeground">
                                {t(
                                  'reports.revenue.title',
                                  'Evolução da Receita'
                                )}
                              </h4>
                              <button
                                onClick={handleExportRevenue}
                                disabled={reportsLoading}
                                className="inline-flex items-center text-xs font-medium text-brand-primary hover:text-brand-primary/80 hover:underline focus:outline-none disabled:opacity-50"
                              >
                                <svg
                                  className="mr-1.5 h-4 w-4 text-brand-surfaceForeground/50"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                                {t('reports.export_csv', 'Exportar CSV')}
                              </button>
                            </div>
                            <RevenueChart
                              data={{
                                revenue: reportsData.businessReports.revenue,
                              }}
                              loading={reportsLoading}
                              interval={advancedInterval}
                            />
                          </Card>
                        </>
                      ) : (
                        <div className="rounded-lg p-4 bg-brand-light/50 border border-brand-border">
                          <p className="text-sm text-brand-surfaceForeground/60">
                            {t(
                              'reports.business.no_data',
                              'Nenhum dado disponível para o período selecionado.'
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </Card>
          )}

          {activeTab === 'insights' && (
            <Card className="p-6">
              {/* Verificar se tab está bloqueada */}
              {advancedReportsLocked ? (
                <UpgradePrompt
                  featureKey="enableAdvancedReports"
                  variant="inline"
                />
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-brand-surfaceForeground">
                      {t('reports.insights.title', 'Insights Avançados')}
                    </h3>
                    {insightsPeriod && (
                      <span className="text-xs font-medium text-brand-surfaceForeground/50 bg-brand-light/50 px-2 py-1 rounded">
                        {t(
                          'reports.insights.period_label',
                          'Dados de {{start}} até {{end}}',
                          {
                            start: new Date(
                              insightsPeriod.start
                            ).toLocaleDateString(i18n.language),
                            end: new Date(
                              insightsPeriod.end
                            ).toLocaleDateString(i18n.language),
                          }
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-brand-surfaceForeground/70 mb-4">
                    {t(
                      'reports.insights.description',
                      'Análise de retenção e comportamento de clientes'
                    )}
                  </p>

                  {!canViewAdvancedInsights ? (
                    <div className="bg-brand-light/50 border border-brand-border rounded-lg p-4">
                      <p className="text-sm text-brand-surfaceForeground mb-3">
                        {t(
                          'reports.insights.upgrade_required',
                          'Disponível a partir do plano Pro. Desbloqueie análises de retenção e insights profundos.'
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/plans')}
                        className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors"
                      >
                        {t('reports.upgrade_button', 'Atualizar plano')}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {retention ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* New Clients */}
                          <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-medium text-brand-surfaceForeground/70">
                                {t(
                                  'reports.insights.new_clients',
                                  'Novos Clientes'
                                )}
                              </h4>
                              <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                                <svg
                                  className="h-4 w-4 text-brand-primary"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div className="flex justify-between items-end">
                              <div>
                                <div className="text-3xl font-bold text-brand-surfaceForeground">
                                  {retention.new_clients?.qty || 0}
                                </div>
                                <div className="text-xs text-brand-surfaceForeground/60 mt-1">
                                  {t(
                                    'reports.insights.clients_count',
                                    'Clientes cadastrados'
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-semibold text-brand-primary">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'EUR',
                                  }).format(
                                    retention.new_clients?.revenue || 0
                                  )}
                                </div>
                                <div className="text-xs text-brand-surfaceForeground/60 mt-1">
                                  {t(
                                    'reports.insights.revenue_generated',
                                    'Receita gerada'
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Returning Clients */}
                          <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-medium text-brand-surfaceForeground/70">
                                {t(
                                  'reports.insights.returning_clients',
                                  'Clientes Recorrentes'
                                )}
                              </h4>
                              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                                <svg
                                  className="h-4 w-4 text-success"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div className="flex justify-between items-end">
                              <div>
                                <div className="text-3xl font-bold text-brand-surfaceForeground">
                                  {retention.returning_clients?.qty || 0}
                                </div>
                                <div className="text-xs text-brand-surfaceForeground/60 mt-1">
                                  {t(
                                    'reports.insights.clients_count',
                                    'Clientes que retornaram'
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-semibold text-brand-primary">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'EUR',
                                  }).format(
                                    retention.returning_clients?.revenue || 0
                                  )}
                                </div>
                                <div className="text-xs text-brand-surfaceForeground/60 mt-1">
                                  {t(
                                    'reports.insights.revenue_generated',
                                    'Receita gerada'
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg p-4 bg-brand-light/50 border border-brand-border">
                          <p className="text-sm text-brand-surfaceForeground/60">
                            {t(
                              'reports.insights.no_data',
                              'Nenhum dado disponível para o período selecionado.'
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </FullPageLayout>
  );
}
