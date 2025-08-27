import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProfessionalForm from '../components/ProfessionalForm';

function Professionals() {
  const { t } = useTranslation();
  const [list, setList] = useState([]);

  const handleAdd = (professional) => {
    setList([professional, ...list]);
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">{t('professionals.title')}</h1>
        <ProfessionalForm onAdd={handleAdd} />

        {list.length > 0 && (
          <ul className="mt-6 space-y-2">
            {list.map((p) => (
              <li
                key={p.id}
                className="border rounded px-4 py-2 bg-gray-100 flex flex-col"
              >
                <span className="font-semibold">{p.name}</span>
                <span className="text-sm">{p.specialty}</span>
                {p.phone && (
                  <span className="text-sm text-gray-600">{p.phone}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Professionals;
