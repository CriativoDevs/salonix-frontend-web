import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function AvailableSlots() {
  const { t } = useTranslation();

  const mockSlots = {
    '2025-08-28': ['09:00', '10:00', '11:00', '14:00', '15:30'],
    '2025-08-29': ['08:30', '09:30', '13:00', '16:00'],
  };

  const [selectedDate, setSelectedDate] = useState('2025-08-28');

  const slots = mockSlots[selectedDate] || [];

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">{t('slots.title')}</h1>

        <div className="mb-4">
          <label className="block text-sm mb-1">{t('slots.select_date')}</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            {Object.keys(mockSlots).map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>

        {slots.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2">
            {slots.map((time) => (
              <li
                key={time}
                className="border px-3 py-2 rounded bg-green-100 text-center"
              >
                {time}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">{t('slots.no_slots')}</p>
        )}
      </div>
    </div>
  );
}

export default AvailableSlots;
