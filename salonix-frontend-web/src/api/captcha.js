import client from './client';

/**
 * Busca um novo desafio de captcha (key + URL da imagem) do backend.
 * Usado no registo público de clientes (django-simple-captcha).
 */
export async function fetchCaptchaChallenge() {
  const { data } = await client.get('captcha/refresh/');
  return data;
}
