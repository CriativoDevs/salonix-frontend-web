/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock de i18n para retornar chaves simples
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k, d) => d || k }),
}));

// Mock do hook de saldo
jest.mock('../../../hooks/useCreditBalance', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useCreditBalance from '../../../hooks/useCreditBalance';
import CreditBadge from '../CreditBadge';

describe('CreditBadge (modo manual)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('exibe loading quando loading=true', () => {
    useCreditBalance.mockReturnValue({
      balance: null,
      loading: true,
      error: null,
      refresh: jest.fn(),
    });

    render(<CreditBadge />);
    expect(screen.getByText(/Carregando créditos/i)).toBeInTheDocument();
  });

  it('exibe indisponível quando error presente', () => {
    useCreditBalance.mockReturnValue({
      balance: null,
      loading: false,
      error: { message: 'Falha' },
      refresh: jest.fn(),
    });

    render(<CreditBadge />);
    expect(screen.getByText(/Créditos indisponíveis/i)).toBeInTheDocument();
  });

  it('exibe saldo atual quando disponível', () => {
    useCreditBalance.mockReturnValue({
      balance: { current_balance: 42 },
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<CreditBadge />);
    const badge = screen.getByRole('button');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/Créditos\s*:\s*42/);
  });

  it('chama refresh ao clicar quando não está carregando', () => {
    const refresh = jest.fn();
    useCreditBalance.mockReturnValue({
      balance: { current_balance: 10 },
      loading: false,
      error: null,
      refresh,
    });

    render(<CreditBadge />);
    const badge = screen.getByRole('button');
    fireEvent.click(badge);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('não chama refresh se loading=true', () => {
    const refresh = jest.fn();
    useCreditBalance.mockReturnValue({
      balance: null,
      loading: true,
      error: null,
      refresh,
    });

    render(<CreditBadge />);
    const badge = screen.getByRole('button');
    fireEvent.click(badge);
    expect(refresh).not.toHaveBeenCalled();
  });
});