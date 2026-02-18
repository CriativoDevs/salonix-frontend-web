import {
  BarChart3,
  Smartphone,
  Brush,
  Globe,
  Calendar,
  Building2,
} from 'lucide-react';
import UpgradePrompt from '../components/security/UpgradePrompt';
import Container from '../components/ui/Container';
import PageHeader from '../components/ui/PageHeader';

/**
 * Página de demonstração do componente UpgradePrompt
 * Para testar visualmente todas as variantes e casos de uso
 *
 * Acesso: /demo/upgrade-prompt (rota temporária para desenvolvimento)
 */
export default function UpgradePromptDemo() {
  return (
    <Container>
      <PageHeader
        title="UpgradePrompt Component Demo"
        subtitle="Testes visuais de todas as variantes e casos de uso"
      />

      <div className="space-y-12">
        {/* Variante Inline */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-brand-foreground">
            Variante: Inline
          </h2>

          <div className="space-y-6">
            {/* Exemplo 1: Com ícone e descrição completa */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-brand-surfaceForeground">
                Com ícone e descrição completa
              </h3>
              <UpgradePrompt
                featureKey="enableReports"
                title="Relatórios Avançados"
                description="Analise seu negócio com insights detalhados, dados históricos e métricas de crescimento."
                icon={<BarChart3 />}
                ctaText="Ver planos Pro"
                requiredPlan="Pro"
                variant="inline"
              />
            </div>

            {/* Exemplo 2: Sem descrição */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-brand-surfaceForeground">
                Sem descrição (título e CTA apenas)
              </h3>
              <UpgradePrompt
                featureKey="enableCustomerPwa"
                title="App para Clientes"
                icon={<Smartphone />}
                ctaText="Ver planos Basic"
                requiredPlan="Basic"
                variant="inline"
              />
            </div>

            {/* Exemplo 3: Sem ícone */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-brand-surfaceForeground">
                Sem ícone
              </h3>
              <UpgradePrompt
                featureKey="enableWhiteLabel"
                title="White Label"
                description="Personalize completamente a marca do sistema com seu logo, cores e domínio próprio."
                ctaText="Upgrade para Pro"
                requiredPlan="Pro"
                variant="inline"
              />
            </div>

            {/* Exemplo 4: Padrões (sem props customizadas) */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-brand-surfaceForeground">
                Valores padrão (sem customização)
              </h3>
              <UpgradePrompt variant="inline" />
            </div>
          </div>
        </section>

        {/* Variante Modal */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-brand-foreground">
            Variante: Modal
          </h2>

          <div className="space-y-6">
            {/* Exemplo 1: Modal completo */}
            <div className="flex justify-center">
              <div className="max-w-md">
                <h3 className="text-lg font-semibold mb-2 text-brand-surfaceForeground">
                  Modal com ícone grande
                </h3>
                <UpgradePrompt
                  featureKey="enableMultiLocation"
                  title="Múltiplas Unidades"
                  description="Gerencie múltiplas localizações do seu negócio em uma única conta."
                  icon={<Building2 />}
                  ctaText="Upgrade para Pro"
                  requiredPlan="Pro"
                  variant="modal"
                />
              </div>
            </div>

            {/* Exemplo 2: Modal sem ícone */}
            <div className="flex justify-center">
              <div className="max-w-md">
                <h3 className="text-lg font-semibold mb-2 text-brand-surfaceForeground">
                  Modal sem ícone
                </h3>
                <UpgradePrompt
                  featureKey="enableApiAccess"
                  title="Acesso à API"
                  description="Integre com seus sistemas via API REST completa com documentação."
                  ctaText="Upgrade para Pro"
                  requiredPlan="Pro"
                  variant="modal"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Variante Tooltip */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-brand-foreground">
            Variante: Tooltip
          </h2>

          <div className="space-y-6">
            {/* Exemplo 1: Tooltip com ícone */}
            <div className="flex gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-brand-surfaceForeground">
                  Tooltip com ícone
                </h3>
                <UpgradePrompt
                  featureKey="enableAdvancedScheduling"
                  title="Agendamento Avançado"
                  description="Agendamentos recorrentes e listas de espera."
                  icon={<Calendar />}
                  ctaText="Ver planos"
                  requiredPlan="Standard"
                  variant="tooltip"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-brand-surfaceForeground">
                  Tooltip sem ícone
                </h3>
                <UpgradePrompt
                  featureKey="enableCustomDomain"
                  title="Domínio Personalizado"
                  description="Use seu próprio domínio."
                  ctaText="Upgrade"
                  requiredPlan="Pro"
                  variant="tooltip"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-brand-surfaceForeground">
                  Tooltip padrão
                </h3>
                <UpgradePrompt variant="tooltip" />
              </div>
            </div>
          </div>
        </section>

        {/* Casos de Uso Reais */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-brand-foreground">
            Casos de Uso Reais
          </h2>

          <div className="space-y-6">
            {/* Exemplo: Bloqueio de tab em Reports */}
            <div className="border border-brand-border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-brand-surfaceForeground">
                Bloqueio de Tab em Reports
              </h3>
              <div className="bg-brand-light rounded-lg p-4">
                <div className="flex gap-2 mb-4">
                  <button className="px-4 py-2 rounded-lg bg-brand-primary text-white">
                    Basic
                  </button>
                  <button className="px-4 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-surfaceForeground opacity-60 cursor-not-allowed">
                    Standard 🔒
                  </button>
                  <button className="px-4 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-surfaceForeground opacity-60 cursor-not-allowed">
                    Advanced 🔒
                  </button>
                </div>
                <UpgradePrompt
                  featureKey="enableReports"
                  title="Relatórios Standard"
                  description="Inclui análise de retenção, comparação de períodos e exportação em Excel."
                  icon={<BarChart3 />}
                  ctaText="Ver planos Standard"
                  requiredPlan="Standard"
                  variant="inline"
                />
              </div>
            </div>

            {/* Exemplo: Bloqueio em Settings */}
            <div className="border border-brand-border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-brand-surfaceForeground">
                Bloqueio em Settings
              </h3>
              <div className="bg-brand-light rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-brand-foreground font-medium">
                    White Label
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-brand-surfaceForeground">
                      🔒
                    </span>
                    <button className="px-8 py-1 rounded-full bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-60">
                      OFF
                    </button>
                  </div>
                </div>
                <UpgradePrompt
                  featureKey="enableWhiteLabel"
                  title="White Label"
                  description="Personalize completamente a marca do sistema com seu logo, cores e domínio próprio."
                  icon={<Brush />}
                  ctaText="Upgrade para Pro"
                  requiredPlan="Pro"
                  variant="inline"
                  className="mt-3"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Testes de Responsividade */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-brand-foreground">
            Responsividade
          </h2>

          <div className="space-y-4">
            <div className="max-w-sm">
              <h3 className="text-lg font-semibold mb-2 text-brand-surfaceForeground">
                Mobile (max-w-sm)
              </h3>
              <UpgradePrompt
                featureKey="enableReports"
                title="Relatórios Avançados"
                description="Analise seu negócio com insights detalhados."
                icon={<BarChart3 />}
                ctaText="Ver planos Pro"
                requiredPlan="Pro"
                variant="inline"
              />
            </div>

            <div className="max-w-md">
              <h3 className="text-lg font-semibold mb-2 text-brand-surfaceForeground">
                Tablet (max-w-md)
              </h3>
              <UpgradePrompt
                featureKey="enableReports"
                title="Relatórios Avançados"
                description="Analise seu negócio com insights detalhados."
                icon={<BarChart3 />}
                ctaText="Ver planos Pro"
                requiredPlan="Pro"
                variant="inline"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-brand-surfaceForeground">
                Desktop (full width)
              </h3>
              <UpgradePrompt
                featureKey="enableReports"
                title="Relatórios Avançados"
                description="Analise seu negócio com insights detalhados."
                icon={<BarChart3 />}
                ctaText="Ver planos Pro"
                requiredPlan="Pro"
                variant="inline"
              />
            </div>
          </div>
        </section>
      </div>
    </Container>
  );
}
