import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import ClientSelfRegister from '../ClientSelfRegister';
import * as tenantApi from '../../api/tenant';
import * as selfRegisterApi from '../../api/clientSelfRegister';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key }),
}));

jest.mock('../../api/tenant');
jest.mock('../../api/clientSelfRegister');

jest.mock('../../components/security/CaptchaChallenge', () => ({
  __esModule: true,
  default: ({ onChange }) => (
    <button
      type="button"
      data-testid="mock-captcha"
      onClick={() =>
        onChange({ captchaKey: 'k1', captchaValue: 'v1' })
      }
    >
      mock captcha
    </button>
  ),
}));

function renderAtSlug(slug) {
  return render(
    <MemoryRouter initialEntries={[`/join/${slug}`]}>
      <Routes>
        <Route path="/join/:tenantSlug" element={<ClientSelfRegister />} />
      </Routes>
    </MemoryRouter>
  );
}

// Renders the page mounted once, with a button that navigates (client-side,
// without remounting ClientSelfRegister) to a different tenant slug. Used to
// exercise the "slug changes on an already-mounted instance" scenario.
function renderWithNav(initialSlug, targetSlug) {
  function Harness() {
    const navigate = useNavigate();
    return (
      <>
        <button
          type="button"
          data-testid="nav-to-target"
          onClick={() => navigate(`/join/${targetSlug}`)}
        >
          navigate
        </button>
        <Routes>
          <Route path="/join/:tenantSlug" element={<ClientSelfRegister />} />
        </Routes>
      </>
    );
  }

  return render(
    <MemoryRouter initialEntries={[`/join/${initialSlug}`]}>
      <Harness />
    </MemoryRouter>
  );
}

describe('ClientSelfRegister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the tenant name once loaded', async () => {
    tenantApi.fetchPublicTenant.mockResolvedValue({
      name: 'Salão Teste',
      slug: 'salao-teste',
    });

    renderAtSlug('salao-teste');

    expect(await screen.findByText('Salão Teste')).toBeInTheDocument();
    expect(tenantApi.fetchPublicTenant).toHaveBeenCalledWith('salao-teste');
  });

  it('shows a not-found state when the tenant slug is invalid', async () => {
    tenantApi.fetchPublicTenant.mockRejectedValue({
      response: { status: 404, data: { detail: 'Tenant não encontrado.' } },
    });

    renderAtSlug('does-not-exist');

    expect(
      await screen.findByText(/link inválido/i)
    ).toBeInTheDocument();
  });

  it('submits the form and shows a success message', async () => {
    tenantApi.fetchPublicTenant.mockResolvedValue({ name: 'Salão Teste' });
    selfRegisterApi.registerClientPublic.mockResolvedValue({
      customer_id: 1,
      message: 'Cadastro realizado.',
    });

    renderAtSlug('salao-teste');
    await screen.findByText('Salão Teste');

    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: 'Maria Silva' },
    });
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'maria@example.com' },
    });
    fireEvent.click(screen.getByTestId('mock-captcha'));
    fireEvent.click(screen.getByRole('button', { name: /registar/i }));

    await waitFor(() => {
      expect(selfRegisterApi.registerClientPublic).toHaveBeenCalledWith({
        tenantSlug: 'salao-teste',
        name: 'Maria Silva',
        email: 'maria@example.com',
        phoneNumber: '',
        marketingOptIn: false,
        captchaKey: 'k1',
        captchaValue: 'v1',
      });
    });

    expect(
      await screen.findByText(/verifique o seu email/i)
    ).toBeInTheDocument();
  });

  it('shows a clear message when the email is already registered', async () => {
    tenantApi.fetchPublicTenant.mockResolvedValue({ name: 'Salão Teste' });
    selfRegisterApi.registerClientPublic.mockRejectedValue({
      response: { status: 400, data: { detail: 'Este email já está registado.' } },
    });

    renderAtSlug('salao-teste');
    await screen.findByText('Salão Teste');

    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: 'Maria Silva' },
    });
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'maria@example.com' },
    });
    fireEvent.click(screen.getByTestId('mock-captcha'));
    fireEvent.click(screen.getByRole('button', { name: /registar/i }));

    expect(
      await screen.findByText(/este email já está registado/i)
    ).toBeInTheDocument();
  });

  it('shows a rate limit message on 429', async () => {
    tenantApi.fetchPublicTenant.mockResolvedValue({ name: 'Salão Teste' });
    selfRegisterApi.registerClientPublic.mockRejectedValue({
      response: { status: 429, data: { detail: 'Rate limit exceeded' } },
    });

    renderAtSlug('salao-teste');
    await screen.findByText('Salão Teste');

    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: 'Maria Silva' },
    });
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'maria@example.com' },
    });
    fireEvent.click(screen.getByTestId('mock-captcha'));
    fireEvent.click(screen.getByRole('button', { name: /registar/i }));

    expect(
      await screen.findByText(/muitas tentativas/i)
    ).toBeInTheDocument();
  });

  it('recovers from a stale not-found state when the slug changes to a valid one', async () => {
    tenantApi.fetchPublicTenant.mockImplementation((slug) => {
      if (slug === 'bad-slug') {
        return Promise.reject({ response: { status: 404 } });
      }
      return Promise.resolve({ name: 'Salão Bom' });
    });

    renderWithNav('bad-slug', 'good-slug');

    expect(await screen.findByText(/link inválido/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('nav-to-target'));

    expect(await screen.findByText('Salão Bom')).toBeInTheDocument();
    expect(screen.queryByText(/link inválido/i)).not.toBeInTheDocument();
  });

  it('shows the first field-level validation error when there is no top-level detail', async () => {
    tenantApi.fetchPublicTenant.mockResolvedValue({ name: 'Salão Teste' });
    selfRegisterApi.registerClientPublic.mockRejectedValue({
      response: {
        status: 400,
        data: { phone_number: ['Enter a valid phone number.'] },
      },
    });

    renderAtSlug('salao-teste');
    await screen.findByText('Salão Teste');

    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: 'Maria Silva' },
    });
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'maria@example.com' },
    });
    fireEvent.click(screen.getByTestId('mock-captcha'));
    fireEvent.click(screen.getByRole('button', { name: /registar/i }));

    expect(
      await screen.findByText('Enter a valid phone number.')
    ).toBeInTheDocument();
  });
});
