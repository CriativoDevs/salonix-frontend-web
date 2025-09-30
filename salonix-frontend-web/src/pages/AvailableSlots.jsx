import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import Card from '../components/ui/Card';
import Label from '../components/ui/Label';
import { fetchProfessionals } from '../api/professionals';
import { fetchSlots } from '../api/slots';
import { useTenant } from '../hooks/useTenant';
import { parseApiError } from '../utils/apiError';

function AvailableSlots() {
  const { t } = useTranslation();
  const { slug } = useTenant();
  const [professionals, setProfessionals] = useState([]);
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [slotItems, setSlotItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchProfessionals(slug)
      .then((data) => {
        if (cancelled) return;
        setProfessionals(data);
        if (data?.length && !selectedProfessional) {
          setSelectedProfessional(String(data[0].id));
        }
      })
      .catch((e) => !cancelled && setError(parseApiError(e, t('common.load_error'))));
    return () => {
      cancelled = true;
    };
  }, [slug, t]);

  useEffect(() => {
    if (!selectedProfessional) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSlots({ professionalId: selectedProfessional, slug })
      .then((data) => !cancelled && setSlotItems(data))
      .catch((e) => !cancelled && setError(parseApiError(e, t('common.load_error'))))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedProfessional, slug, t]);

  const dates = useMemo(() => {
    const set = new Set(
      slotItems.map((s) => (s.start_time ? s.start_time.slice(0, 10) : ''))
    );
    return Array.from(set).filter(Boolean).sort();
  }, [slotItems]);

  const filteredSlots = useMemo(() => {
    if (!selectedDate) return slotItems;
    return slotItems.filter((s) => s.start_time?.startsWith(selectedDate));
  }, [slotItems, selectedDate]);

  return (
    <FullPageLayout>
      <Card className="p-6">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">
          {t('slots.title')}
        </h1>

        <div className="mb-4 form-light">
          <Label className="mb-1 block">Profissional</Label>
          <select
            value={selectedProfessional}
            onChange={(e) => setSelectedProfessional(e.target.value)}
            className="w-full"
          >
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 form-light">
          <Label className="mb-1 block">{t('slots.select_date')}</Label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full"
          >
            <option value="">{t('common.all', 'Todas')}</option>
            {dates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <p className="text-sm text-gray-600">{t('common.loading')}</p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error.message}</p>
        )}
        {!loading && !error && filteredSlots.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredSlots.map((slot) => (
              <li
                key={slot.id}
                className="rounded-lg bg-white px-3 py-2 text-center text-sm font-medium
                           text-gray-800 ring-1 ring-brand-border hover:bg-brand-light"
              >
                {new Date(slot.start_time).toLocaleString()}
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
