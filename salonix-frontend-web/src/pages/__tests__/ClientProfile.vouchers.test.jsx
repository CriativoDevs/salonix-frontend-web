import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import ClientProfile from '../ClientProfile';
import { fetchClientVouchers } from '../../api/clientMe';

jest.mock('../../api/clientMe', () => ({
  fetchClientProfile: jest.fn().mockResolvedValue({
    name: 'Alice',
    email: 'alice@example.com',
    phone_number: '+351911111111',
    marketing_opt_in: false,
  }),
  updateClientProfile: jest.fn(),
  fetchClientVouchers: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValueOrOptions, maybeOptions) => {
      let template = key;
      let values = {};
      if (typeof defaultValueOrOptions === 'string') {
        template = defaultValueOrOptions;
      } else if (defaultValueOrOptions && typeof defaultValueOrOptions === 'object') {
        values = defaultValueOrOptions;
      }
      if (maybeOptions && typeof maybeOptions === 'object') {
        values = { ...values, ...maybeOptions };
      }
      return template.replace(/\{\{(\w+)\}\}/g, (_, token) =>
        Object.prototype.hasOwnProperty.call(values, token) ? values[token] : ''
      );
    },
  }),
}));

describe('ClientProfile vouchers section (BE-VOUCHER-06)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows an empty message when the client has no vouchers', async () => {
    fetchClientVouchers.mockResolvedValue([]);

    render(
      <ThemeProvider>
        <MemoryRouter>
          <ClientProfile />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(
      await screen.findByText('Você ainda não tem vouchers atribuídos.')
    ).toBeInTheDocument();
  });

  it('lists the vouchers assigned to the client with code, benefit and status', async () => {
    fetchClientVouchers.mockResolvedValue([
      {
        id: 1,
        voucher_code: 'PROMO2026',
        voucher_type: 'percent',
        voucher_value: '10.00',
        status: 'active',
      },
      {
        id: 2,
        voucher_code: 'USEDCODE',
        voucher_type: 'free_service',
        voucher_value: null,
        status: 'used',
      },
    ]);

    render(
      <ThemeProvider>
        <MemoryRouter>
          <ClientProfile />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(await screen.findByText('Código PROMO2026')).toBeInTheDocument();
    expect(screen.getByText('10.00% de desconto')).toBeInTheDocument();
    expect(screen.getByText('Código USEDCODE')).toBeInTheDocument();
    expect(screen.getByText('Serviço grátis')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('used')).toBeInTheDocument();
  });
});
