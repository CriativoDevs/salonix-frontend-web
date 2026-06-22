import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StoreBadges from '../components/StoreBadges';

export default function InstallApp() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen min-h-[100dvh] bg-brand-bg px-4 py-10 text-brand-bgForeground">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-brand-surfaceForeground/70 transition hover:text-brand-surfaceForeground"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('install_app.back', 'Voltar ao painel')}
        </Link>

        <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface p-6 text-brand-surfaceForeground sm:p-8">
          <h1 className="text-2xl font-semibold">
            {t('install_app.title', 'Instala a app TimelyOne')}
          </h1>
          <p className="mt-2 text-sm text-brand-surfaceForeground/70">
            {t(
              'install_app.subtitle',
              'Gere o teu negócio a partir do telemóvel: agendamentos, clientes e equipa na palma da mão. Descarrega a app para iOS ou Android.'
            )}
          </p>

          <StoreBadges className="mt-6" />
        </div>
      </div>
    </div>
  );
}
