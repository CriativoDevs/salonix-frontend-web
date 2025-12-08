import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import FormButton from '../components/ui/FormButton';
import CaptchaGate from '../components/security/CaptchaGate';
import { useTenant } from '../hooks/useTenant';
import { submitFeedback } from '../api/feedback';
import { parseApiError } from '../utils/apiError';
import { trace } from '../utils/debug';

function Feedback() {
  const { t } = useTranslation();
  const MAX_LENGTH = 2000;
  const [form, setForm] = useState({
    rating: 0,
    category: '',
    message: '',
    anonymous: false,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const { slug } = useTenant();
  const [errors, setErrors] = useState({});
  const ratingRef = useRef(null);
  const categoryRef = useRef(null);
  const messageRef = useRef(null);

  const categories = [
    'service_quality',
    'professional_behavior',
    'facility_cleanliness',
    'appointment_scheduling',
    'pricing',
    'other',
  ];

  const messageLength = useMemo(
    () => String(form.message || '').length,
    [form.message]
  );

  const validateForm = () => {
    const nextErrors = {};
    const validCategories = new Set([
      'service_quality',
      'professional_behavior',
      'facility_cleanliness',
      'appointment_scheduling',
      'pricing',
      'other',
    ]);
    const ratingNum = Number(form.rating);
    const trimmed = String(form.message || '').trim();

    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      nextErrors.rating = t(
        'feedback.errors.rating_required',
        'Selecione uma avaliação de 1 a 5.'
      );
    }

    if (!form.category || !validCategories.has(form.category)) {
      nextErrors.category = t(
        'feedback.errors.category_required',
        'Selecione uma categoria válida.'
      );
    }

    if (!trimmed) {
      nextErrors.message = t(
        'feedback.errors.message_required',
        'Escreva uma mensagem.'
      );
    } else if (trimmed.length > MAX_LENGTH) {
      nextErrors.message = t(
        'feedback.errors.message_too_long',
        'Mensagem muito longa. Máximo de 2000 caracteres.'
      );
    }

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const order = ['rating', 'category', 'message'];
      const firstKey = order.find((k) => nextErrors[k]);
      if (firstKey === 'rating') {
        const btn = ratingRef.current?.querySelector('button');
        if (btn && typeof btn.focus === 'function') btn.focus();
      } else if (firstKey === 'category') {
        categoryRef.current?.focus?.();
      } else if (firstKey === 'message') {
        messageRef.current?.focus?.();
      }
      return;
    }
    const trimmed = String(form.message || '').trim();
    setLoading(true);
    try {
      await submitFeedback(
        {
          category: form.category,
          rating: form.rating,
          message: trimmed,
          anonymous: form.anonymous,
        },
        { slug, captchaToken }
      );
      trace('feedback.submit.success', {
        category: form.category,
        rating: form.rating,
        anonymous: Boolean(form.anonymous),
        messageLength: trimmed.length,
      });
      setIsSubmitted(true);
      setForm({ rating: 0, category: '', message: '', anonymous: false });
      setCaptchaToken(null);
      setResetKey((k) => k + 1);
      setErrors({});
    } catch (err) {
      const parsed = parseApiError(
        err,
        t('feedback.submit_error', 'Não foi possível enviar o feedback.')
      );
      trace('feedback.submit.error', {
        category: form.category,
        rating: form.rating,
        anonymous: Boolean(form.anonymous),
        errorCode: parsed.code,
        requestId: parsed.requestId,
      });
      setError(parsed);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (rating) => {
    setForm({ ...form, rating });
  };

  if (isSubmitted) {
    return (
      <FullPageLayout>
        <div
          className="max-w-md mx-auto text-center"
          role="status"
          aria-live="polite"
        >
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
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            aria-busy={loading}
            aria-label="feedback-form"
          >
            {/* Avaliação por estrelas */}
            <div>
              <label
                className="block text-sm font-medium text-brand-surfaceForeground mb-3"
                id="rating-label"
              >
                {t('feedback.rating')}
              </label>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-labelledby="rating-label"
                aria-required="true"
                aria-describedby={errors.rating ? 'rating-error' : undefined}
                ref={ratingRef}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    aria-label={t(`feedback.rating_${star}`)}
                    disabled={loading}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                      star <= form.rating
                        ? 'bg-brand-primary text-white'
                        : 'bg-brand-light text-brand-surfaceForeground/70 hover:bg-brand-light/80'
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
              <p className="text-sm text-brand-surfaceForeground/80 mt-2">
                {form.rating > 0 && t(`feedback.rating_${form.rating}`)}
              </p>
              {errors.rating && (
                <p
                  id="rating-error"
                  className="mt-1 text-xs text-rose-600"
                  aria-live="polite"
                >
                  {errors.rating}
                </p>
              )}
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-brand-surfaceForeground mb-2">
                {t('feedback.category')}
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                aria-invalid={Boolean(errors.category)}
                aria-describedby={
                  errors.category ? 'category-error' : undefined
                }
                disabled={loading}
                required
                ref={categoryRef}
              >
                <option value="">{t('feedback.select_category')}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {t(`feedback.categories.${category}`)}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p
                  id="category-error"
                  className="mt-1 text-xs text-rose-600"
                  aria-live="polite"
                >
                  {errors.category}
                </p>
              )}
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm font-medium text-brand-surfaceForeground mb-2">
                {t('feedback.message')}
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground placeholder-brand-surfaceForeground/70 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                placeholder={t('feedback.message_placeholder')}
                aria-invalid={
                  Boolean(errors.message) || messageLength > MAX_LENGTH
                }
                aria-describedby={errors.message ? 'message-error' : undefined}
                disabled={loading}
                maxLength={MAX_LENGTH}
                required
                ref={messageRef}
              />
              <p
                className={`mt-1 text-xs ${messageLength >= MAX_LENGTH ? 'text-rose-600' : messageLength > MAX_LENGTH - 100 ? 'text-brand-primary' : 'text-brand-surfaceForeground/70'}`}
                aria-live="polite"
              >
                {messageLength}/{MAX_LENGTH}
              </p>
              {errors.message && (
                <p
                  id="message-error"
                  className="mt-1 text-xs text-rose-600"
                  aria-live="polite"
                >
                  {errors.message}
                </p>
              )}
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
                className="ml-2 block text-sm text-brand-surfaceForeground"
              >
                {t('feedback.anonymous')}
              </label>
            </div>

            {/* Captcha e envio */}
            <div className="space-y-3">
              <CaptchaGate
                onToken={setCaptchaToken}
                resetKey={resetKey}
                className="flex items-center text-brand-surfaceForeground"
              />
              {error ? (
                <div
                  className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                  aria-live="polite"
                >
                  {error.message}
                </div>
              ) : null}
              <FormButton
                type="submit"
                variant="link"
                className="w-full"
                disabled={
                  loading ||
                  !form.rating ||
                  !form.category ||
                  !form.message ||
                  messageLength > MAX_LENGTH
                }
              >
                {loading
                  ? t('common.loading', 'Enviando...')
                  : t('feedback.submit')}
              </FormButton>
              <span className="sr-only" aria-live="polite" role="status">
                {loading ? t('common.loading', 'Enviando...') : ''}
              </span>
            </div>
          </form>
        </Card>
      </div>
    </FullPageLayout>
  );
}

export default Feedback;
