import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ClientAuthProvider } from '../ClientAuthContext';
import { ClientAuthContext } from '../ClientAuthContextInstance';
import { refreshClientToken } from '../../api/clientAccess';
import {
  getClientRefreshToken,
  getClientAccessToken,
  setClientAccessToken,
  clearClientTokens,
} from '../../utils/clientAuthStorage';
import { clearTokens } from '../../utils/authStorage';

jest.mock('../../api/clientAccess', () => ({
  refreshClientToken: jest.fn(),
}));

jest.mock('../../utils/clientAuthStorage', () => ({
  getClientRefreshToken: jest.fn(),
  getClientAccessToken: jest.fn(),
  setClientAccessToken: jest.fn(),
  clearClientTokens: jest.fn(),
}));

jest.mock('../../utils/authStorage', () => ({
  clearTokens: jest.fn(),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({
    setTenantSlug: jest.fn(),
  }),
}));

function makeJwt(payload) {
  const base64Payload = btoa(JSON.stringify(payload));
  return `x.${base64Payload}.y`;
}

function Consumer() {
  const { isAuthenticated, isLoading, tenantSlug, customerId, login } =
    React.useContext(ClientAuthContext);

  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="tenant">{tenantSlug || ''}</div>
      <div data-testid="customer">{customerId || ''}</div>
      <button
        type="button"
        onClick={() =>
          login(makeJwt({ customer_id: 99, tenant_slug: 'tenant-login' }))
        }
      >
        login
      </button>
    </div>
  );
}

describe('ClientAuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fallback: sem refresh token permanece deslogado sem chamar refresh API', async () => {
    getClientRefreshToken.mockReturnValue(null);
    getClientAccessToken.mockReturnValue(null);

    render(
      <ClientAuthProvider>
        <Consumer />
      </ClientAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(refreshClientToken).not.toHaveBeenCalled();
  });

  it('reabertura web/pwa: com access valido + refresh, restaura sem chamar refresh API', async () => {
    getClientRefreshToken.mockReturnValue('refresh-token');
    getClientAccessToken.mockReturnValue(
      makeJwt({ customer_id: 42, tenant_slug: 'tenant-a' })
    );

    render(
      <ClientAuthProvider>
        <Consumer />
      </ClientAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('tenant')).toHaveTextContent('tenant-a');
    expect(screen.getByTestId('customer')).toHaveTextContent('42');
    expect(refreshClientToken).not.toHaveBeenCalled();
    expect(clearTokens).toHaveBeenCalled();
  });

  it('reabertura web/pwa: sem access, com refresh valido, faz refresh e restaura sessao', async () => {
    getClientRefreshToken.mockReturnValue('refresh-token');
    getClientAccessToken.mockReturnValue(null);
    refreshClientToken.mockResolvedValue({
      access: makeJwt({ customer_id: 7, tenant_slug: 'tenant-b' }),
    });

    render(
      <ClientAuthProvider>
        <Consumer />
      </ClientAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(refreshClientToken).toHaveBeenCalledWith('refresh-token');
    expect(setClientAccessToken).toHaveBeenCalled();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('tenant')).toHaveTextContent('tenant-b');
    expect(screen.getByTestId('customer')).toHaveTextContent('7');
    expect(clearTokens).toHaveBeenCalled();
  });

  it('refresh auth error limpa tokens e nao autentica', async () => {
    getClientRefreshToken.mockReturnValue('refresh-token');
    getClientAccessToken.mockReturnValue(null);
    refreshClientToken.mockRejectedValue({ response: { status: 401 } });

    render(
      <ClientAuthProvider>
        <Consumer />
      </ClientAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(clearClientTokens).toHaveBeenCalled();
    expect(clearTokens).toHaveBeenCalled();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('login manual limpa contexto staff antes de autenticar cliente', async () => {
    getClientRefreshToken.mockReturnValue(null);
    getClientAccessToken.mockReturnValue(null);

    render(
      <ClientAuthProvider>
        <Consumer />
      </ClientAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    fireEvent.click(screen.getByRole('button', { name: 'login' }));

    expect(clearTokens).toHaveBeenCalled();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('tenant')).toHaveTextContent('tenant-login');
    expect(screen.getByTestId('customer')).toHaveTextContent('99');
  });
});
