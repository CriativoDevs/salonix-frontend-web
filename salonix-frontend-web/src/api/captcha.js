import client from './client';

/**
 * Busca um novo desafio de captcha (key + URL da imagem) do backend.
 * Usado no registo público de clientes.
 *
 * Usa o endpoint próprio ('captcha/new/'), não o 'captcha/refresh/' do
 * django-simple-captcha — esse exige o header X-Requested-With:
 * XMLHttpRequest, que o axios não envia, o que faz o endpoint devolver
 * sempre 404. O endpoint próprio devolve a mesma forma de resposta
 * ({key, image_url}) e valida contra o mesmo CaptchaStore.
 */
export async function fetchCaptchaChallenge() {
  const { data } = await client.get('captcha/new/');
  return data;
}
