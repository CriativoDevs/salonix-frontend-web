import { useTranslation } from 'react-i18next';
import { STORE_LINKS } from '../constants/storeLinks';
import appStoreBadge from '../assets/badges/app-store-pt.svg';
import googlePlayBadge from '../assets/badges/google-play-pt.png';

/**
 * Badges oficiais das lojas (App Store + Google Play), em pt-PT.
 * Liga para as páginas oficiais da app TimelyOne Admin.
 */
export default function StoreBadges({ className = '' }) {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <a
        href={STORE_LINKS.ios}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('store_badges.ios_alt', 'Transferir na App Store')}
      >
        <img
          src={appStoreBadge}
          alt={t('store_badges.ios_alt', 'Transferir na App Store')}
          className="h-12 w-auto"
        />
      </a>
      <a
        href={STORE_LINKS.android}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('store_badges.android_alt', 'Disponível no Google Play')}
      >
        <img
          src={googlePlayBadge}
          alt={t('store_badges.android_alt', 'Disponível no Google Play')}
          className="h-12 w-auto"
        />
      </a>
    </div>
  );
}
