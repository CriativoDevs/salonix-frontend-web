import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CaptchaChallenge from '../CaptchaChallenge';
import * as captchaApi from '../../../api/captcha';
import * as captchaPolicy from '../../../utils/captchaPolicy';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key }),
}));

jest.mock('../../../api/captcha');
jest.mock('../../../utils/captchaPolicy');

describe('CaptchaChallenge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render a challenge when a dev bypass token is present', async () => {
    captchaPolicy.getCaptchaBypassToken.mockReturnValue('dev-bypass-token');
    const onChange = jest.fn();

    render(<CaptchaChallenge onChange={onChange} />);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        captchaKey: null,
        captchaValue: 'dev-bypass-token',
      });
    });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(captchaApi.fetchCaptchaChallenge).not.toHaveBeenCalled();
  });

  it('fetches and renders a real challenge when there is no bypass token', async () => {
    captchaPolicy.getCaptchaBypassToken.mockReturnValue(undefined);
    captchaApi.fetchCaptchaChallenge.mockResolvedValue({
      key: 'k1',
      image_url: '/api/captcha/image/k1/',
    });

    render(<CaptchaChallenge onChange={jest.fn()} />);

    const image = await screen.findByRole('img');
    expect(image).toHaveAttribute('src', '/api/captcha/image/k1/');
  });

  it('calls onChange with key and typed value as the user types', async () => {
    captchaPolicy.getCaptchaBypassToken.mockReturnValue(undefined);
    captchaApi.fetchCaptchaChallenge.mockResolvedValue({
      key: 'k1',
      image_url: '/api/captcha/image/k1/',
    });
    const onChange = jest.fn();

    render(<CaptchaChallenge onChange={onChange} />);
    await screen.findByRole('img');

    fireEvent.change(screen.getByLabelText(/captcha/i), {
      target: { value: '4x7q' },
    });

    expect(onChange).toHaveBeenLastCalledWith({
      captchaKey: 'k1',
      captchaValue: '4x7q',
    });
  });

  it('fetches a new challenge when the refresh button is clicked', async () => {
    captchaPolicy.getCaptchaBypassToken.mockReturnValue(undefined);
    captchaApi.fetchCaptchaChallenge
      .mockResolvedValueOnce({ key: 'k1', image_url: '/img/k1/' })
      .mockResolvedValueOnce({ key: 'k2', image_url: '/img/k2/' });

    render(<CaptchaChallenge onChange={jest.fn()} />);
    await screen.findByRole('img');

    fireEvent.click(screen.getByRole('button', { name: /atualizar/i }));

    await waitFor(() => {
      expect(screen.getByRole('img')).toHaveAttribute('src', '/img/k2/');
    });
    expect(captchaApi.fetchCaptchaChallenge).toHaveBeenCalledTimes(2);
  });

  it('shows an error message and retry button when the challenge fails to load', async () => {
    captchaPolicy.getCaptchaBypassToken.mockReturnValue(undefined);
    captchaApi.fetchCaptchaChallenge
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({ key: 'k1', image_url: '/img/k1/' });

    render(<CaptchaChallenge onChange={jest.fn()} />);

    await screen.findByText(/não foi possível carregar o captcha/i);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
    fireEvent.click(retryButton);

    await screen.findByRole('img');
    expect(captchaApi.fetchCaptchaChallenge).toHaveBeenCalledTimes(2);
  });
});
