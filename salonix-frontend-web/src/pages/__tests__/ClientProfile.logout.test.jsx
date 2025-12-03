import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import ClientProfile from '../ClientProfile';

jest.mock('../../api/clientMe', () => ({
  fetchClientProfile: jest.fn().mockResolvedValue({
    name: 'Alice',
    email: 'alice@example.com',
    phone_number: '+351911111111',
    notes: '',
    marketing_opt_in: false,
  }),
  updateClientProfile: jest.fn().mockResolvedValue({
    name: 'Alice',
    email: 'alice@example.com',
    phone_number: '+351911111111',
    notes: '',
    marketing_opt_in: false,
  }),
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k, fallback) => fallback || _k }),
}));

test('exibe botão Sair e aciona limpeza de sessão ao clicar', async () => {
  try {
    localStorage.setItem('client_session_present', '1');
  } catch {
    /* noop */
  }

  const originalRemove = window.localStorage.removeItem;
  window.localStorage.removeItem = jest.fn();

  render(
    <ThemeProvider>
      <MemoryRouter>
        <ClientProfile />
      </MemoryRouter>
    </ThemeProvider>
  );

  await screen.findByRole('heading', { name: 'Perfil do Cliente' });
  await waitFor(() => {
    expect(screen.queryByText('Carregando…')).toBeNull();
  });
  const logoutBtn = await screen.findByText('Sair');
  const { fireEvent } = await import('@testing-library/react');
  fireEvent.click(logoutBtn);

  expect(mockNavigate).toHaveBeenCalledWith('/client/enter', { replace: true });
  window.localStorage.removeItem = originalRemove;
});
