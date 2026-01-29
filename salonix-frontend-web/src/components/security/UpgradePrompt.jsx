import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { trace } from '../../utils/debug';

/**
 * UpgradePrompt Component
 *
 * Exibe mensagem contextual de upgrade com call-to-action para planos superiores.
 * Suporta múltiplas variantes visuais: inline, modal, tooltip.
 *
 * @param {string} featureKey - Chave da feature no sistema (ex: 'enableReports')
 * @param {string} title - Título da mensagem (padrão via i18n)
 * @param {string} description - Descrição contextual da feature
 * @param {ReactNode} icon - Ícone da feature (lucide-react)
 * @param {string} ctaText - Texto do botão de ação (padrão: "Ver planos")
 * @param {string} variant - Variante visual: 'inline' | 'modal' | 'tooltip'
 * @param {string} requiredPlan - Plano necessário para desbloquear (ex: 'Pro')
 * @param {string} className - Classes CSS adicionais
 */
export default function UpgradePrompt({
  featureKey,
  title,
  description,
  icon,
  ctaText,
  variant = 'inline',
  requiredPlan,
  className = '',
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Textos padrão se não fornecidos
  const displayTitle =
    title || t('upgrade.locked_feature', 'Feature bloqueada');
  const displayDescription =
    description ||
    t(
      'upgrade.available_in_plan',
      `Disponível no plano ${requiredPlan || 'superior'}.`,
      { plan: requiredPlan }
    );
  const displayCtaText = ctaText || t('upgrade.view_plans', 'Ver planos');

  const handleUpgradeClick = () => {
    trace('upgrade_prompt_click', {
      featureKey: featureKey || null,
      requiredPlan: requiredPlan || null,
      variant,
    });

    // Navega para página de planos com estado para highlight do plano necessário
    navigate('/plans', {
      state: {
        highlightPlan: requiredPlan,
        fromFeature: featureKey,
      },
    });
  };

  // Classes base por variante
  const variantClasses = {
    inline:
      'rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-6 py-4',
    modal:
      'rounded-xl border border-brand-border bg-brand-surface px-8 py-6 shadow-lg',
    tooltip:
      'rounded-md border border-brand-border bg-brand-surface px-4 py-3 text-sm shadow-md max-w-xs',
  };

  const iconClasses = {
    inline: 'h-12 w-12 text-amber-600 dark:text-amber-400',
    modal: 'h-16 w-16 text-brand-primary',
    tooltip: 'h-8 w-8 text-brand-foreground',
  };

  const titleClasses = {
    inline: 'text-lg font-semibold text-amber-900 dark:text-amber-100',
    modal: 'text-2xl font-bold text-brand-foreground',
    tooltip: 'text-sm font-semibold text-brand-foreground',
  };

  const descriptionClasses = {
    inline: 'text-sm text-amber-800 dark:text-amber-200',
    modal: 'text-base text-brand-surfaceForeground',
    tooltip: 'text-xs text-brand-surfaceForeground',
  };

  const buttonClasses = {
    inline:
      'inline-flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
    modal:
      'inline-flex items-center gap-2 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2',
    tooltip:
      'inline-flex items-center gap-1 rounded-md bg-brand-primary hover:bg-brand-primary/90 text-white px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-brand-primary',
  };

  return (
    <div
      className={`upgrade-prompt upgrade-prompt--${variant} ${variantClasses[variant]} ${className}`}
    >
      <div className="flex items-start gap-4">
        {/* Ícone da Feature */}
        {icon && (
          <div className="flex-shrink-0">
            <div className={iconClasses[variant]}>{icon}</div>
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex-1 space-y-2">
          <h3 className={titleClasses[variant]}>{displayTitle}</h3>

          {description && (
            <p className={descriptionClasses[variant]}>{displayDescription}</p>
          )}

          {/* Call to Action */}
          {variant !== 'tooltip' && (
            <div className="pt-2">
              <button
                type="button"
                className={buttonClasses[variant]}
                onClick={handleUpgradeClick}
              >
                {displayCtaText}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CTA para variante tooltip (simplificado) */}
      {variant === 'tooltip' && (
        <div className="mt-3">
          <button
            type="button"
            className={buttonClasses[variant]}
            onClick={handleUpgradeClick}
          >
            {displayCtaText}
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
