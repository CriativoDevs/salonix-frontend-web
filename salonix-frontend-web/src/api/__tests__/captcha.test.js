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

    // django-simple-captcha's 'captcha/refresh/' rejects any request without
    // the X-Requested-With: XMLHttpRequest header (which axios never sends),
    // always 404ing in real usage. Use our own endpoint instead, which
    // returns the same {key, image_url} shape and validates against the
    // same CaptchaStore. It's mounted under 'users/' (users/urls.py is
    // included at 'api/users/' in the root urls.py), not 'captcha/'.
    expect(client.get).toHaveBeenCalledWith('users/captcha/new/');
    expect(result).toEqual({
      key: 'abc123',
      image_url: '/api/captcha/image/abc123/',
    });
  });
});
