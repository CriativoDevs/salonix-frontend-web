import client from './client';

export async function submitFeedback(
  { category, rating, message, anonymous = false, customerId },
  { slug, captchaToken } = {}
) {
  const headers = {};
  const payload = {
    category,
    rating,
    message,
    is_anonymous: Boolean(anonymous),
  };

  if (typeof customerId === 'number') {
    payload.customer = customerId;
  }

  if (slug) {
    headers['X-Tenant-Slug'] = slug;
  }

  const bypass = import.meta.env.VITE_CAPTCHA_BYPASS_TOKEN || '';
  if (captchaToken) {
    headers['X-Captcha-Token'] = captchaToken;
  } else if (bypass) {
    headers['X-Captcha-Token'] = bypass;
  }

  const response = await client.post('feedbacks/', payload, { headers });
  return response.data;
}

export default { submitFeedback };

