import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import Card from '../components/ui/Card';
import Label from '../components/ui/Label';

function AvailableSlots() {
  const { t } = useTranslation();

  const mockSlots = {
    '2025-08-28': ['09:00', '10:00', '11:00', '14:00', '15:30'],
    '2025-08-29': ['08:30', '09:30', '13:00', '16:00'],
  };

  const [selectedDate, setSelectedDate] = useState('2025-08-28');
  const slots = mockSlots[selectedDate] || [];

  return (
    <FullPageLayout>
      <Card className="p-6">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">
          {t('slots.title')}
        </h1>

        <div className="mb-4 form-light">
          <Label className="mb-1 block">{t('slots.select_date')}</Label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full"
          >
            {Object.keys(mockSlots).map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>

        {slots.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {slots.map((time) => (
              <li
                key={time}
                className="rounded-lg bg-white px-3 py-2 text-center text-sm font-medium
                           text-gray-800 ring-1 ring-brand-border hover:bg-brand-light"
              >
                {time}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-700">{t('slots.no_slots')}</p>
        )}
      </Card>
    </FullPageLayout>
  );
}

export default AvailableSlots;
