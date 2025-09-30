import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import ServiceForm from '../components/ServiceForm';
import { fetchServices, createService } from '../api/services';
import { parseApiError } from '../utils/apiError';
import { useTenant } from '../hooks/useTenant';

function Services() {
  const { t } = useTranslation();
  const { slug } = useTenant();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchServices(slug)
      .then((data) => {
        if (!cancelled) setServices(data);
      })
      .catch((e) => !cancelled && setError(parseApiError(e, t('common.load_error'))))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, t]);

  const handleAddService = async (newService) => {
    try {
      const created = await createService({ ...newService, slug });
      setServices((prev) => [created, ...prev]);
    } catch (e) {
      setError(parseApiError(e, t('common.save_error', 'Falha ao salvar.')));
    }
  };

  return (
    <FullPageLayout>
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">
          {t('services.title')}
        </h1>

        <div className="form-light">
          <ServiceForm onAdd={handleAddService} />
        </div>

        {loading && (
          <p className="mt-4 text-sm text-gray-600">{t('common.loading')}</p>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-600">{error.message}</p>
        )}
        {!loading && !error && services.length > 0 && (
          <ul className="mt-6 space-y-2">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
              >
                <span className="font-medium text-gray-800">
                  {service.name}
                </span>
                <span className="text-gray-600">
                  €{service.price_eur ?? service.price} · {service.duration_minutes ?? service.duration}min
                </span>
              </li>
            ))}
          </ul>
        )}
        {!loading && !error && services.length === 0 && (
          <p className="mt-4 text-sm text-gray-600">{t('common.empty_list', 'Nenhum serviço cadastrado.')}</p>
        )}
      </div>
    </FullPageLayout>
  );
}

export default Services;
