import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">{t('bookings.title')}</h1>

        {bookings.length > 0 ? (
          <ul className="space-y-4">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="border rounded p-4 bg-gray-100 space-y-1"
              >
                <p>
                  <strong>{t('bookings.client')}:</strong> {b.client}
                </p>
                <p>
                  <strong>{t('bookings.service')}:</strong> {b.service}
                </p>
                <p>
                  <strong>{t('bookings.professional')}:</strong>{' '}
                  {b.professional}
                </p>
                <p>
                  <strong>{t('bookings.datetime')}:</strong> {b.datetime}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">{t('bookings.empty')}</p>
        )}
      </div>
    </div>
  );
}

export default Bookings;
