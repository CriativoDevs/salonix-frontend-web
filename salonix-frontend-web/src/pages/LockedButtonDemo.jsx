import { BarChart3, Settings, Users, Smartphone } from 'lucide-react';
import LockedButton from '../components/security/LockedButton';
import Container from '../components/ui/Container';
import PageHeader from '../components/ui/PageHeader';

/**
 * Página de demonstração do componente LockedButton
 * Para testar visualmente todas as variantes e estados
 *
 * Acesso: /demo/locked-button (rota temporária para desenvolvimento)
 */
export default function LockedButtonDemo() {
  const handleClick = () => {
    alert('Botão desbloqueado clicado!');
  };

  return (
    <Container>
      <PageHeader
        title="LockedButton Component Demo"
        subtitle="Testes visuais de todas as variantes e estados"
      />

      <div className="space-y-12">
        {/* Estados: Locked vs Unlocked */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-brand-foreground">
            Estados: Locked vs Unlocked
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Locked */}
            <div className="border border-brand-border rounded-lg p-6 bg-brand-light">
              <h3 className="text-lg font-semibold mb-4 text-brand-foreground">
                Estado: Locked (Bloqueado)
              </h3>
              <div className="space-y-4">
                <LockedButton
                  featureKey="enableReports"
                  tooltip="Disponível no plano Pro"
                  onClick={handleClick}
                >
                  Acessar Relatórios
                </LockedButton>

                <LockedButton
                  featureKey="enableReports"
                  tooltip="Upgrade necessário"
                  variant="secondary"
                  onClick={handleClick}
                >
                  <BarChart3 className="h-4 w-4" />
                  Com Ícone
                </LockedButton>
              </div>
            </div>

            {/* Unlocked */}
            <div className="border border-brand-border rounded-lg p-6 bg-brand-light">
              <h3 className="text-lg font-semibold mb-4 text-brand-foreground">
                Estado: Unlocked (Desbloqueado)
              </h3>
              <div className="space-y-4">
                <LockedButton
                  featureKey="enableCustomerPwa" // Feature que está desbloqueada
                  onClick={handleClick}
                >
                  Configurar PWA
                </LockedButton>

                <LockedButton
                  featureKey="enableCustomerPwa"
                  variant="secondary"
                  onClick={handleClick}
                >
                  <Smartphone className="h-4 w-4" />
                  Com Ícone
                </LockedButton>
              </div>
            </div>
          </div>
        </section>

        {/* Variantes */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-brand-foreground">
            Variantes
          </h2>

          <div className="space-y-6">
            {/* Primary */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-brand-surfaceForeground">
                Primary (Padrão)
              </h3>
              <div className="flex flex-wrap gap-4">
                <LockedButton
                  featureKey="enableReports"
                  tooltip="Locked - Primary"
                  variant="primary"
                  onClick={handleClick}
                >
                  Locked Primary
                </LockedButton>

                <LockedButton
                  featureKey="enableCustomerPwa"
                  variant="primary"
                  onClick={handleClick}
                >
                  Unlocked Primary
                </LockedButton>
              </div>
            </div>

            {/* Secondary */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-brand-surfaceForeground">
                Secondary
              </h3>
              <div className="flex flex-wrap gap-4">
                <LockedButton
                  featureKey="enableReports"
                  tooltip="Locked - Secondary"
                  variant="secondary"
                  onClick={handleClick}
                >
                  Locked Secondary
                </LockedButton>

                <LockedButton
                  featureKey="enableCustomerPwa"
                  variant="secondary"
                  onClick={handleClick}
                >
                  Unlocked Secondary
                </LockedButton>
              </div>
            </div>

            {/* Outline */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-brand-surfaceForeground">
                Outline
              </h3>
              <div className="flex flex-wrap gap-4">
                <LockedButton
                  featureKey="enableReports"
                  tooltip="Locked - Outline"
                  variant="outline"
                  onClick={handleClick}
                >
                  Locked Outline
                </LockedButton>

                <LockedButton
                  featureKey="enableCustomerPwa"
                  variant="outline"
                  onClick={handleClick}
                >
                  Unlocked Outline
                </LockedButton>
              </div>
            </div>
          </div>
        </section>

        {/* Tamanhos */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-brand-foreground">
            Tamanhos
          </h2>

          <div className="space-y-6">
            {/* Small */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-brand-surfaceForeground">
                Small (sm)
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <LockedButton
                  featureKey="enableReports"
                  tooltip="Small locked"
                  size="sm"
                  onClick={handleClick}
                >
                  Locked Small
                </LockedButton>

                <LockedButton
                  featureKey="enableCustomerPwa"
                  size="sm"
                  onClick={handleClick}
                >
                  Unlocked Small
                </LockedButton>
              </div>
            </div>

            {/* Medium */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-brand-surfaceForeground">
                Medium (md) - Padrão
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <LockedButton
                  featureKey="enableReports"
                  tooltip="Medium locked"
                  size="md"
                  onClick={handleClick}
                >
                  Locked Medium
                </LockedButton>

                <LockedButton
                  featureKey="enableCustomerPwa"
                  size="md"
                  onClick={handleClick}
                >
                  Unlocked Medium
                </LockedButton>
              </div>
            </div>

            {/* Large */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-brand-surfaceForeground">
                Large (lg)
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <LockedButton
                  featureKey="enableReports"
                  tooltip="Large locked"
                  size="lg"
                  onClick={handleClick}
                >
                  Locked Large
                </LockedButton>

                <LockedButton
                  featureKey="enableCustomerPwa"
                  size="lg"
                  onClick={handleClick}
                >
                  Unlocked Large
                </LockedButton>
              </div>
            </div>
          </div>
        </section>

        {/* Com Ícones */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-brand-foreground">
            Com Ícones
          </h2>

          <div className="flex flex-wrap gap-4">
            <LockedButton
              featureKey="enableReports"
              tooltip="Relatórios bloqueados"
              onClick={handleClick}
            >
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </LockedButton>

            <LockedButton
              featureKey="enableWhiteLabel"
              tooltip="White Label bloqueado"
              variant="secondary"
              onClick={handleClick}
            >
              <Settings className="h-4 w-4" />
              White Label
            </LockedButton>

            <LockedButton featureKey="enableCustomerPwa" onClick={handleClick}>
              <Smartphone className="h-4 w-4" />
              PWA Cliente
            </LockedButton>

            <LockedButton
              featureKey="enableTeamManagement"
              tooltip="Gestão de equipe bloqueada"
              variant="outline"
              onClick={handleClick}
            >
              <Users className="h-4 w-4" />
              Equipe
            </LockedButton>
          </div>
        </section>

        {/* Tooltips */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-brand-foreground">
            Tooltips (Hover sobre locked)
          </h2>

          <div className="flex flex-wrap gap-4">
            <LockedButton
              featureKey="enableReports"
              tooltip="Disponível no plano Pro"
              onClick={handleClick}
            >
              Tooltip Curto
            </LockedButton>

            <LockedButton
              featureKey="enableReports"
              tooltip="Esta funcionalidade está disponível apenas para usuários do plano Professional"
              onClick={handleClick}
            >
              Tooltip Longo
            </LockedButton>

            <LockedButton featureKey="enableReports" onClick={handleClick}>
              Sem Tooltip
            </LockedButton>
          </div>
        </section>

        {/* Estado Disabled */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-brand-foreground">
            Estado Disabled
          </h2>

          <div className="flex flex-wrap gap-4">
            <LockedButton
              featureKey="enableCustomerPwa"
              disabled={true}
              onClick={handleClick}
            >
              Disabled (Unlocked)
            </LockedButton>

            <LockedButton
              featureKey="enableReports"
              tooltip="Locked e Disabled"
              disabled={true}
              onClick={handleClick}
            >
              Disabled (Locked)
            </LockedButton>
          </div>
        </section>

        {/* Casos de Uso Reais */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-brand-foreground">
            Casos de Uso Reais
          </h2>

          <div className="space-y-6">
            {/* Toolbar de ações */}
            <div className="border border-brand-border rounded-lg p-4 bg-brand-light">
              <h3 className="text-sm font-semibold mb-3 text-brand-surfaceForeground">
                Toolbar de Ações
              </h3>
              <div className="flex gap-2">
                <LockedButton
                  featureKey="enableCustomerPwa"
                  size="sm"
                  variant="outline"
                  onClick={handleClick}
                >
                  <Smartphone className="h-3 w-3" />
                  Configurar
                </LockedButton>

                <LockedButton
                  featureKey="enableReports"
                  tooltip="Disponível no Pro"
                  size="sm"
                  variant="outline"
                  onClick={handleClick}
                >
                  <BarChart3 className="h-3 w-3" />
                  Exportar
                </LockedButton>

                <LockedButton
                  featureKey="enableWhiteLabel"
                  tooltip="Apenas no plano Pro"
                  size="sm"
                  variant="outline"
                  onClick={handleClick}
                >
                  <Settings className="h-3 w-3" />
                  Personalizar
                </LockedButton>
              </div>
            </div>

            {/* Card de feature */}
            <div className="border border-brand-border rounded-lg p-6 bg-brand-surface">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-2 text-brand-foreground">
                    Relatórios Avançados
                  </h3>
                  <p className="text-sm text-brand-surfaceForeground mb-4">
                    Analise seu negócio com insights detalhados e métricas
                    personalizadas.
                  </p>
                </div>
                <LockedButton
                  featureKey="enableReports"
                  tooltip="Upgrade para o plano Pro"
                  onClick={handleClick}
                >
                  Ativar
                </LockedButton>
              </div>
            </div>

            {/* Formulário */}
            <div className="border border-brand-border rounded-lg p-6 bg-brand-surface">
              <h3 className="text-lg font-bold mb-4 text-brand-foreground">
                Configurações de Notificações
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-brand-foreground">
                      Notificações SMS
                    </div>
                    <div className="text-sm text-brand-surfaceForeground">
                      Envie lembretes por SMS
                    </div>
                  </div>
                  <LockedButton
                    featureKey="enableSmsNotifications"
                    tooltip="Disponível no plano Standard"
                    size="sm"
                    variant="secondary"
                    onClick={handleClick}
                  >
                    Ativar
                  </LockedButton>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-brand-foreground">
                      WhatsApp Business
                    </div>
                    <div className="text-sm text-brand-surfaceForeground">
                      Integração com WhatsApp
                    </div>
                  </div>
                  <LockedButton
                    featureKey="enableWhatsappIntegration"
                    tooltip="Disponível no plano Pro"
                    size="sm"
                    variant="secondary"
                    onClick={handleClick}
                  >
                    Ativar
                  </LockedButton>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Container>
  );
}
