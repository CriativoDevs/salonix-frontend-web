import lockupDark from '../assets/brand/timelyone-lockup-horizontal.svg';
import lockupLight from '../assets/brand/timelyone-lockup-horizontal-light.svg';

/**
 * Lockup horizontal da marca TimelyOne (ícone + wordmark).
 * Respeita o tema: a variante "dark" tem wordmark branco (para fundos escuros),
 * a "light" tem wordmark escuro (para fundos claros).
 *
 * @param {boolean} isDark - true para fundo escuro (usa wordmark branco)
 * @param {string} className - classes utilitárias (ex.: altura)
 */
export default function BrandLockup({ isDark = false, className = 'h-8 w-auto' }) {
  return (
    <img
      src={isDark ? lockupDark : lockupLight}
      alt="TimelyOne"
      className={className}
      draggable={false}
    />
  );
}
