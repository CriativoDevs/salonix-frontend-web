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
      <div className="rounded-xl bg-brand-surface p-6 shadow-sm ring-1 ring-brand-border">
        <h1 className="mb-4 text-2xl font-semibold text-brand-surfaceForeground">
          {t('bookings.title')}
        </h1>

        {bookings.length > 0 ? (
          <ul className="space-y-4">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="rounded-lg border border-brand-border bg-brand-surface p-4 text-brand-surfaceForeground"
              >
                <p className="text-brand-surfaceForeground">
                  <strong className="text-brand-surfaceForeground">
                    {t('bookings.client')}:
                  </strong>{' '}
                  {b.client}
                </p>
                <p className="text-brand-surfaceForeground">
                  <strong className="text-brand-surfaceForeground">
                    {t('bookings.service')}:
                  </strong>{' '}
                  {b.service}
                </p>
                <p className="text-brand-surfaceForeground">
                  <strong className="text-brand-surfaceForeground">
                    {t('bookings.professional')}:
                  </strong>{' '}
                  {b.professional}
                </p>
                <p className="text-brand-surfaceForeground">
                  <strong className="text-brand-surfaceForeground">
                    {t('bookings.datetime')}:
                  </strong>{' '}
                  {b.datetime}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-brand-surfaceForeground/80">{t('bookings.empty')}</p>
        )}
      </div>
    </FullPageLayout>
  );
}

export default Bookings;
