import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';

function Profile() {
  const { t } = useTranslation();

  const [profile] = useState({
    name: 'Salão Elegante',
    phone: '+351 912 345 678',
    address: 'Rua das Flores, 123, Porto',
    logo: '',
  });

  return (
    <FullPageLayout>
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">
          {t('profile.title')}
        </h1>

        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-full bg-gray-200">
            {profile.logo ? (
              <img
                src={profile.logo}
                alt="Logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
                {t('profile.no_logo')}
              </div>
            )}
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-900">
              {profile.name}
            </p>
            <p className="text-sm text-gray-600">{profile.phone}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-500">{t('profile.address')}</p>
          <p className="text-base text-gray-800">{profile.address}</p>
        </div>
      </div>
    </FullPageLayout>
  );
}

export default Profile;
