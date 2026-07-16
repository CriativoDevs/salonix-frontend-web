import client from './client';

export async function registerClientPublic({
  tenantSlug,
  name,
  email,
  phoneNumber,
  marketingOptIn,
  captchaKey,
  captchaValue,
}) {
  const payload = {
    name,
    email,
    phone_number: phoneNumber,
    marketing_opt_in: Boolean(marketingOptIn),
    captcha_value: captchaValue,
  };
  if (captchaKey) {
    payload.captcha_key = captchaKey;
  }

  const response = await client.post(
    `public/${tenantSlug}/clients/register/`,
    payload
  );
  return response.data;
}
