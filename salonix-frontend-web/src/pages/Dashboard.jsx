import { useTranslation } from 'react-i18next';

function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <h1 className="text-2xl font-bold text-gray-800">
        {t('dashboard.welcome')}
      </h1>
    </div>
  );
}

export default Dashboard;
