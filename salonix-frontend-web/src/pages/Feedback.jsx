import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import FormButton from '../components/ui/FormButton';

function Feedback() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    rating: 0,
    category: '',
    message: '',
    anonymous: false,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const categories = [
    'service_quality',
    'professional_behavior',
    'facility_cleanliness',
    'appointment_scheduling',
    'pricing',
    'other',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.rating || !form.category || !form.message) return;

    // TODO: implementar envio de feedback
    setIsSubmitted(true);
  };

  const handleRatingClick = (rating) => {
    setForm({ ...form, rating });
  };

  if (isSubmitted) {
    return (
      <FullPageLayout>
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('feedback.thank_you')}
          </h2>

          <p className="text-gray-600 mb-6">
            {t('feedback.submission_success')}
          </p>

          <FormButton
            onClick={() => {
              setIsSubmitted(false);
              setForm({
                rating: 0,
                category: '',
                message: '',
                anonymous: false,
              });
            }}
            variant="primary"
          >
            {t('feedback.submit_another')}
          </FormButton>
        </div>
      </FullPageLayout>
    );
  }

  return (
    <FullPageLayout>
      <PageHeader
        title={t('feedback.title')}
        subtitle={t('feedback.subtitle')}
      />

      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avaliação por estrelas */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                {t('feedback.rating')}
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      star <= form.rating
                        ? 'bg-yellow-400 text-white'
                        : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {form.rating > 0 && t(`feedback.rating_${form.rating}`)}
              </p>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                {t('feedback.category')}
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">{t('feedback.select_category')}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {t(`feedback.categories.${category}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                {t('feedback.message')}
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder={t('feedback.message_placeholder')}
              />
            </div>

            {/* Anônimo */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="anonymous"
                checked={form.anonymous}
                onChange={(e) =>
                  setForm({ ...form, anonymous: e.target.checked })
                }
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
              />
              <label
                htmlFor="anonymous"
                className="ml-2 block text-sm text-gray-900"
              >
                {t('feedback.anonymous')}
              </label>
            </div>

            {/* Botão de envio */}
            <FormButton
              type="submit"
              variant="primary"
              className="w-full"
              disabled={!form.rating || !form.category || !form.message}
            >
              {t('feedback.submit')}
            </FormButton>
          </form>
        </Card>
      </div>
    </FullPageLayout>
  );
}

export default Feedback;
