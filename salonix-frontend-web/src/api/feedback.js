import client from './client';
import { getCaptchaTokenForRequest } from '../utils/captchaPolicy';

export async function submitFeedback(
  { category, custom_category, rating, message, anonymous = false, customerId },
  { slug, captchaToken } = {}
) {
  const headers = {};
  const payload = {
    category,
    ...(custom_category ? { custom_category } : {}),
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

  const token = getCaptchaTokenForRequest(captchaToken);
  if (token) {
    headers['X-Captcha-Token'] = token;
  }

  const response = await client.post('feedbacks/', payload, { headers });
  return response.data;
}

export default { submitFeedback };
