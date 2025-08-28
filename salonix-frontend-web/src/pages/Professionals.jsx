import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import ProfessionalForm from '../components/ProfessionalForm';

function Professionals() {
  const { t } = useTranslation();
  const [list, setList] = useState([]);

  const handleAdd = (professional) => {
    setList((prev) => [professional, ...prev]);
  };

  return (
    <FullPageLayout>
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">
          {t('professionals.title')}
        </h1>

        <div className="form-light">
          <ProfessionalForm onAdd={handleAdd} />
        </div>

        {list.length > 0 && (
          <ul className="mt-6 divide-y divide-gray-100">
            {list.map((p, idx) => (
              <li
                key={p.id ?? idx}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div>
                  <div className="font-medium text-gray-900">{p.name}</div>
                  <div className="text-sm text-gray-600">{p.specialty}</div>
                  {p.phone && (
                    <div className="text-sm text-gray-500">{p.phone}</div>
                  )}
                </div>
                {/* Espaço para ações: Editar/Apagar (warning/danger) quando necessário */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </FullPageLayout>
  );
}

export default Professionals;
