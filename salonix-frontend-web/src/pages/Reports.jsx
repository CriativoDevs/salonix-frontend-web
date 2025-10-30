import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { useStaff } from '../hooks/useStaff';

export default function Reports() {
  const { t } = useTranslation();
  const { plan, slug } = useTenant();
  const { user } = useAuth();
  const { staff } = useStaff({ slug });
  const [activeTab, setActiveTab] = useState('basic');

  // Determinar papel do usuário atual
  const currentUserRole = useMemo(() => {
    if (!Array.isArray(staff) || !user) {
      return null;
    }
    
    const email = typeof user.email === 'string' ? user.email.toLowerCase() : null;
    const username = typeof user.username === 'string' ? user.username.toLowerCase() : null;
    
    const match = staff.find((member) => {
      const memberEmail = typeof member.email === 'string' ? member.email.toLowerCase() : null;
      const memberUsername = typeof member.username === 'string' ? member.username.toLowerCase() : null;
      
      return (
        (email && memberEmail === email) ||
        (username && memberUsername === username)
      );
    });
    
    return match?.role || null;
  }, [staff, user]);

  // Verificar se é owner
  const isOwner = currentUserRole === 'owner';

  // Verificar se tem acesso a relatórios avançados (Pro/Enterprise)
  const hasAdvancedReports = useMemo(() => {
    const planTier = plan?.tier?.toLowerCase();
    return planTier === 'pro' || planTier === 'enterprise';
  }, [plan?.tier]);

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
              <svg className="h-6 w-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-brand-surfaceForeground mb-2">
              {t('reports.access_denied', 'Acesso Negado')}
            </h3>
            <p className="text-brand-surfaceForeground/70">
              {t('reports.access_denied_description', 'Apenas proprietários têm acesso aos relatórios.')}
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
        subtitle={t('reports.subtitle', 'Visualize e exporte dados do seu salão')} 
      />

      {/* Verificar se é owner */}
      {currentUserRole !== 'owner' ? (
        <Card className="p-6 text-center">
          <div className="text-brand-surfaceForeground">
            <h3 className="text-lg font-medium mb-2">
              {t('reports.access_denied.title', 'Acesso restrito')}
            </h3>
            <p className="text-brand-surfaceForeground/70">
              {t('reports.access_denied.description', 'Apenas proprietários têm acesso aos relatórios do salão.')}
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

          {/* Conteúdo das tabs */}
          {activeTab === 'basic' && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-brand-surfaceForeground mb-2">
                {t('reports.basic.title', 'Relatórios Básicos')}
              </h3>
              <p className="text-brand-surfaceForeground/70 mb-4">
                {t('reports.basic.description', 'Relatórios essenciais para acompanhar o desempenho do seu salão')}
              </p>
              <div className="bg-brand-light/50 border border-brand-border rounded-lg p-4">
                <p className="text-sm text-brand-surfaceForeground/60">
                  {t('reports.basic.coming_soon', 'Em breve: Relatórios básicos de agendamentos, receita e clientes')}
                </p>
              </div>
            </Card>
          )}

          {activeTab === 'advanced' && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-brand-surfaceForeground mb-2">
                {t('reports.advanced.title', 'Relatórios Avançados')}
              </h3>
              <p className="text-brand-surfaceForeground/70 mb-4">
                {t('reports.advanced.description', 'Análises detalhadas e métricas avançadas')}
              </p>
              
              {/* Verificar se tem acesso aos relatórios avançados (Pro/Enterprise) */}
              {!hasAdvancedReports ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                    {t('reports.advanced.upgrade_required', 'Disponível a partir do plano Pro. Desbloqueie métricas detalhadas e exportação avançada.')}
                  </p>
                  <button className="bg-brand-primary text-brand-primaryForeground px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-primaryHover transition-colors">
                    {t('reports.advanced.upgrade_button', 'Atualizar plano')}
                  </button>
                </div>
              ) : (
                <div className="bg-brand-light/50 border border-brand-border rounded-lg p-4">
                  <p className="text-sm text-brand-surfaceForeground/60">
                    {t('reports.advanced.coming_soon', 'Em breve: Análises avançadas, comparativos e insights detalhados')}
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </FullPageLayout>
  );
}