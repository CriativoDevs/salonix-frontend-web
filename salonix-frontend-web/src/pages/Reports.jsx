import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import BasicReportsMetrics from '../components/reports/BasicReportsMetrics';
import DateFilters from '../components/reports/DateFilters';
import ExportButton from '../components/reports/ExportButton';
import TopServices from '../components/reports/TopServices';
import RevenueChart from '../components/reports/RevenueChart';
import AdvancedFilters from '../components/reports/AdvancedFilters';
import ToastContainer from '../components/ui/ToastContainer';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { useStaff } from '../hooks/useStaff';
import { useReportsData } from '../hooks/useReportsData';
import useToast from '../hooks/useToast';
import { exportTopServicesReport, exportRevenueReport } from '../api/reports';

export default function Reports() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { plan, slug } = useTenant();
  const { user } = useAuth();
  const { staff } = useStaff({ slug });
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

  // Estados para filtros avançados
  const [advancedInterval, setAdvancedInterval] = useState('day');
  const [advancedLimit, setAdvancedLimit] = useState(25);

  // Funções de exportação para relatórios avançados
  const handleExportTopServices = async () => {
    try {
      await exportTopServicesReport({
        from: appliedFilters.from,
        to: appliedFilters.to,
        limit: advancedLimit
      });
      showSuccess(t('reports.export.success', 'Relatório exportado com sucesso'));
    } catch (error) {
      console.error('Export error:', error);
      showError(t('reports.export.error', 'Erro ao exportar relatório'));
    }
  };

  const handleExportRevenue = async () => {
    try {
      await exportRevenueReport({
        from: appliedFilters.from,
        to: appliedFilters.to,
        interval: advancedInterval
      });
      showSuccess(t('reports.export.success', 'Relatório exportado com sucesso'));
    } catch (error) {
      console.error('Export error:', error);
      showError(t('reports.export.error', 'Erro ao exportar relatório'));
    }
  };

  // Determinar papel do usuário atual
  const currentUserRole = useMemo(() => {
    if (!Array.isArray(staff) || !user) {
      return null;
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

    return match?.role || null;
  }, [staff, user]);

  // Verificar se é owner
  const isOwner = currentUserRole === 'owner';

  // Hook para dados de relatórios (só carrega se for owner)
  const {
    data: reportsData,
    loading: reportsLoading,
    error: reportsError,
    forbidden: reportsForbidden,
    refetch: refetchReports,
  } = useReportsData({
    slug: isOwner ? slug : null,
    type: activeTab === 'basic' ? 'basic' : 'advanced',
    filters: appliedFilters,
  });

  // Toast notifications based on data loading state
  useEffect(() => {
    if (reportsError) {
      showError('Erro ao carregar relatórios. Tente novamente.');
    } else if (reportsData && !reportsLoading) {
      showSuccess('Relatórios carregados com sucesso!');
    }
  }, [reportsData, reportsError, reportsLoading, showSuccess, showError]);

  // Verificar se tem acesso a relatórios avançados (Pro/Enterprise)
  const hasAdvancedReports = useMemo(() => {
    const planTier = plan?.tier?.toLowerCase();
    return planTier === 'pro' || planTier === 'enterprise';
  }, [plan?.tier]);

  // Funções para lidar com filtros de data
  const handleApplyFilters = () => {
    const filters = {};
    if (fromDate) filters.from = fromDate;
    if (toDate) filters.to = toDate;
    setAppliedFilters(filters);
  };

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
              <button
                onClick={() => setActiveTab('basic')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'basic'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-brand-surfaceForeground/70 hover:text-brand-surfaceForeground hover:border-brand-surfaceForeground/30'
                }`}
              >
                {t('reports.tabs.basic', 'Básicos')}
              </button>
              <button
                onClick={() => setActiveTab('advanced')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'advanced'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-brand-surfaceForeground/70 hover:text-brand-surfaceForeground hover:border-brand-surfaceForeground/30'
                }`}
              >
                {t('reports.tabs.advanced', 'Avançados')}
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
              <h3 className="text-lg font-medium text-brand-surfaceForeground mb-2">
                {t('reports.basic.title', 'Relatórios Básicos')}
              </h3>
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
                      <BasicReportsMetrics data={reportsData.basicReports} />

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
            </Card>
          )}

          {activeTab === 'advanced' && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-brand-surfaceForeground mb-2">
                {t('reports.advanced.title', 'Relatórios Avançados')}
              </h3>
              <p className="text-brand-surfaceForeground/70 mb-4">
                {t(
                  'reports.advanced.description',
                  'Análises detalhadas e métricas avançadas'
                )}
              </p>

              {/* Verificar se tem acesso aos relatórios avançados (Pro/Enterprise) */}
              {!hasAdvancedReports ? (
                <div className="bg-brand-light/50 border border-brand-border rounded-lg p-4">
                  <p className="text-sm text-brand-surfaceForeground mb-3">
                    {t(
                      'reports.advanced.upgrade_required',
                      'Disponível a partir do plano Pro. Desbloqueie métricas detalhadas e exportação avançada.'
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/plans')}
                    className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors"
                  >
                    {t('reports.advanced.upgrade_button', 'Atualizar plano')}
                  </button>
                </div>
              ) : (
                <>
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
                    <div className="space-y-8">
                      {reportsData?.advancedReports ? (
                        <>
                          {/* Advanced Filters */}
                          <AdvancedFilters
                            interval={advancedInterval}
                            onIntervalChange={setAdvancedInterval}
                            limit={advancedLimit}
                            onLimitChange={setAdvancedLimit}
                            loading={reportsLoading}
                          />

                          {/* Top Services */}
                          <Card className="p-6">
                            <TopServices 
                              data={reportsData.advancedReports}
                              loading={reportsLoading}
                              limit={advancedLimit}
                              onExport={handleExportTopServices}
                            />
                          </Card>

                          {/* Revenue Chart */}
                          <Card className="p-6">
                            <RevenueChart 
                              data={reportsData.advancedReports}
                              loading={reportsLoading}
                              interval={advancedInterval}
                              onExport={handleExportRevenue}
                            />
                          </Card>
                        </>
                      ) : (
                        <div className="rounded-lg p-4 bg-brand-light/50 border border-brand-border">
                          <p className="text-sm text-brand-surfaceForeground/60">
                            {t(
                              'reports.advanced.coming_soon',
                              'Em breve: Análises avançadas, comparativos e insights detalhados'
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
