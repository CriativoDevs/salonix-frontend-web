import client from './client';

/**
 * Busca um novo desafio de captcha (key + URL da imagem) do backend.
 * Usado no registo público de clientes.
 *
 * Usa o endpoint próprio ('users/captcha/new/'), não o 'captcha/refresh/'
 * do django-simple-captcha — esse exige o header X-Requested-With:
 * XMLHttpRequest, que o axios não envia, o que faz o endpoint devolver
 * sempre 404. O endpoint próprio devolve a mesma forma de resposta
 * ({key, image_url}) e valida contra o mesmo CaptchaStore. Está montado
 * sob o prefixo 'users/' (users/urls.py incluído em 'api/users/' no
 * urls.py principal) — não em 'captcha/' apesar do nome do módulo.
 */
export async function fetchCaptchaChallenge() {
  const { data } = await client.get('users/captcha/new/');
  return data;
}
