import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';

function Bookings() {
  const { t } = useTranslation();

  const [bookings] = useState([
    {
      id: 1,
      client: 'Maria Silva',
      service: 'Corte de cabelo',
      professional: 'João',
      datetime: '2025-08-28 10:00',
    },
    {
      id: 2,
      client: 'Carlos Souza',
      service: 'Manicure',
      professional: 'Ana',
      datetime: '2025-08-28 14:30',
    },
  ]);

  return (
    <FullPageLayout>
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">
          {t('bookings.title')}
        </h1>

        {bookings.length > 0 ? (
          <ul className="space-y-4">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <p className="text-gray-800">
                  <strong className="text-gray-900">
                    {t('bookings.client')}:
                  </strong>{' '}
                  {b.client}
                </p>
                <p className="text-gray-800">
                  <strong className="text-gray-900">
                    {t('bookings.service')}:
                  </strong>{' '}
                  {b.service}
                </p>
                <p className="text-gray-800">
                  <strong className="text-gray-900">
                    {t('bookings.professional')}:
                  </strong>{' '}
                  {b.professional}
                </p>
                <p className="text-gray-800">
                  <strong className="text-gray-900">
                    {t('bookings.datetime')}:
                  </strong>{' '}
                  {b.datetime}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-700">{t('bookings.empty')}</p>
        )}
      </div>
    </FullPageLayout>
  );
}

export default Bookings;
