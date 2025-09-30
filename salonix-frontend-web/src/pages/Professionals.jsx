import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import ProfessionalForm from '../components/ProfessionalForm';
import { fetchProfessionals, createProfessional } from '../api/professionals';
import { useTenant } from '../hooks/useTenant';
import { parseApiError } from '../utils/apiError';

function Professionals() {
  const { t } = useTranslation();
  const { slug } = useTenant();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProfessionals(slug)
      .then((data) => !cancelled && setList(data))
      .catch((e) => !cancelled && setError(parseApiError(e, t('common.load_error'))))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, t]);

  const handleAdd = async (professional) => {
    try {
      const created = await createProfessional({ ...professional, slug });
      setList((prev) => [created, ...prev]);
    } catch (e) {
      setError(parseApiError(e, t('common.save_error', 'Falha ao salvar.')));
    }
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

        {loading && (
          <p className="mt-4 text-sm text-gray-600">{t('common.loading')}</p>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-600">{error.message}</p>
        )}
        {!loading && !error && list.length > 0 && (
          <ul className="mt-6 divide-y divide-gray-100">
            {list.map((p, idx) => (
              <li
                key={p.id ?? idx}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div>
                  <div className="font-medium text-gray-900">{p.name}</div>
                  {p.bio && (
                    <div className="text-sm text-gray-600">{p.bio}</div>
                  )}
                  {p.phone && (
                    <div className="text-sm text-gray-500">{p.phone}</div>
                  )}
                </div>
                {/* Espaço para ações: Editar/Apagar (warning/danger) quando necessário */}
              </li>
            ))}
          </ul>
        )}
        {!loading && !error && list.length === 0 && (
          <p className="mt-4 text-sm text-gray-600">{t('common.empty_list', 'Nenhum profissional cadastrado.')}</p>
        )}
      </div>
    </FullPageLayout>
  );
}

export default Professionals;
