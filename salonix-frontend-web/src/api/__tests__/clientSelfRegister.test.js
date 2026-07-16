import client from '../client';
import { registerClientPublic } from '../clientSelfRegister';

jest.mock('../client', () => ({
  post: jest.fn(),
}));

describe('registerClientPublic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts to the public registration endpoint with the tenant slug in the URL', async () => {
    client.post.mockResolvedValue({
      data: { customer_id: 42, message: 'Cadastro realizado.' },
    });

    const result = await registerClientPublic({
      tenantSlug: 'salao-teste',
      name: 'Maria Silva',
      email: 'maria@example.com',
      phoneNumber: '',
      marketingOptIn: false,
      captchaKey: 'abc123',
      captchaValue: 'xyz',
    });

    expect(client.post).toHaveBeenCalledWith(
      'public/salao-teste/clients/register/',
      {
        name: 'Maria Silva',
        email: 'maria@example.com',
        phone_number: '',
        marketing_opt_in: false,
        captcha_key: 'abc123',
        captcha_value: 'xyz',
      }
    );
    expect(result).toEqual({ customer_id: 42, message: 'Cadastro realizado.' });
  });

  it('omits captcha_key when not provided (dev bypass)', async () => {
    client.post.mockResolvedValue({ data: { customer_id: 1 } });

    await registerClientPublic({
      tenantSlug: 'salao-teste',
      name: 'Maria Silva',
      email: 'maria@example.com',
      captchaValue: 'dev-bypass-token',
    });

    const [, payload] = client.post.mock.calls[0];
    expect(payload.captcha_value).toBe('dev-bypass-token');
    expect(payload).not.toHaveProperty('captcha_key');
  });
});
