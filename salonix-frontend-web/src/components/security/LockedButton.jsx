import { LockIcon } from 'lucide-react';
import useFeatureLock from '../../hooks/useFeatureLock';

/**
 * LockedButton Component
 *
 * Botão que exibe estado "locked" quando a feature é bloqueada por plano.
 * Quando bloqueado:
 * - Fica desabilitado visualmente
 * - Mostra ícone de cadeado
 * - Exibe tooltip explicativo
 * - Ao clicar, redireciona para página de planos
 *
 * @param {string} featureKey - Chave da feature no sistema
 * @param {string} tooltip - Texto do tooltip quando bloqueado
 * @param {Function} onClick - Handler de click quando desbloqueado
 * @param {ReactNode} children - Conteúdo do botão
 * @param {string} variant - Variante visual: 'primary' | 'secondary' | 'outline'
 * @param {string} size - Tamanho: 'sm' | 'md' | 'lg'
 * @param {string} className - Classes CSS adicionais
 * @param {boolean} disabled - Desabilitar independente do lock
 * @param {...any} buttonProps - Props adicionais do button
 */
export default function LockedButton({
  featureKey,
  tooltip,
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...buttonProps
}) {
  const { isLocked, showUpgrade } = useFeatureLock(featureKey);

  // Se está bloqueado, usa showUpgrade, senão usa onClick original
  const handleClick = isLocked ? showUpgrade : onClick;

  // Botão está desabilitado se locked OU disabled prop
  const isDisabled = isLocked || disabled;

  // Variantes de estilo
  const variantClasses = {
    primary: isDisabled
      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
      : 'bg-brand-primary hover:bg-brand-primary/90 text-white',
    secondary: isDisabled
      ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
      : 'bg-brand-secondary hover:bg-brand-secondary/90 text-brand-foreground',
    outline: isDisabled
      ? 'border-2 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
      : 'border-2 border-brand-primary text-brand-primary hover:bg-brand-primary/10',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-xl',
  };

  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary';

  const buttonClasses = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Tooltip wrapper (apenas quando bloqueado)
  if (isLocked && tooltip) {
    return (
      <div className="relative group inline-block">
        <button
          type="button"
          onClick={handleClick}
          className={buttonClasses}
          aria-label={tooltip}
          {...buttonProps}
        >
          <LockIcon
            className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`}
          />
          {children}
        </button>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
        </div>
      </div>
    );
  }

  // Botão sem tooltip
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled && !isLocked} // Se locked, não desabilita (permite click para upgrade)
      className={buttonClasses}
      {...buttonProps}
    >
      {isLocked && (
        <LockIcon
          className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`}
        />
      )}
      {children}
    </button>
  );
}
