import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ServiceForm from '../components/ServiceForm';

function Services() {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);

  const handleAddService = (newService) => {
    setServices([newService, ...services]);
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">{t('services.title')}</h1>
        <ServiceForm onAdd={handleAddService} />

        {services.length > 0 && (
          <ul className="mt-6 space-y-2">
            {services.map((service) => (
              <li
                key={service.id}
                className="border rounded px-4 py-2 bg-gray-100 flex justify-between"
              >
                <span>{service.name}</span>
                <span>
                  €{service.price} · {service.duration}min
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Services;
