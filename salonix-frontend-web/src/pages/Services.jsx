import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import ServiceForm from '../components/ServiceForm';

function Services() {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);

  const handleAddService = (newService) => {
    setServices((prev) => [newService, ...prev]);
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

        {services.length > 0 && (
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
                  €{service.price} · {service.duration}min
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </FullPageLayout>
  );
}

export default Services;
