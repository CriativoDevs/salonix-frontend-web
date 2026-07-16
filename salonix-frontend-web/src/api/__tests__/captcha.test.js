import client from '../client';
import { fetchCaptchaChallenge } from '../captcha';

jest.mock('../client', () => ({
  get: jest.fn(),
}));

describe('fetchCaptchaChallenge', () => {
  it('fetches a new captcha key and image url', async () => {
    client.get.mockResolvedValue({
      data: { key: 'abc123', image_url: '/api/captcha/image/abc123/' },
    });

    const result = await fetchCaptchaChallenge();

    expect(client.get).toHaveBeenCalledWith('captcha/refresh/');
    expect(result).toEqual({
      key: 'abc123',
      image_url: '/api/captcha/image/abc123/',
    });
  });
});
