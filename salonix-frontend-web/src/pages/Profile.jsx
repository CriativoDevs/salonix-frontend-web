import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function Profile() {
  const { t } = useTranslation();

  const [profile] = useState({
    name: 'Salão Elegante',
    phone: '+351 912 345 678',
    address: 'Rua das Flores, 123, Porto',
    logo: '', // pode usar URL ou manter vazio
  });

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow space-y-4">
        <h1 className="text-2xl font-bold">{t('profile.title')}</h1>

        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden">
            {profile.logo ? (
              <img
                src={profile.logo}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-500 text-sm">
                {t('profile.no_logo')}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-lg">{profile.name}</p>
            <p className="text-sm text-gray-600">{profile.phone}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">{t('profile.address')}</p>
          <p className="text-base">{profile.address}</p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
