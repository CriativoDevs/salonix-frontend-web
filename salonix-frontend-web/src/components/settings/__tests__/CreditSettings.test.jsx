/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock hooks
jest.mock('../../../hooks/useCreditBalance', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../../../hooks/useCreditAlerts', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../../../hooks/useCreditHistory', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../../../hooks/useTenant', () => ({
  useTenant: jest.fn(),
}));

// Mock child components
jest.mock('../CreditHistoryList', () => () => (
  <div data-testid="credit-history-list">History List</div>
));
jest.mock(
  '../../credits/CreditPurchaseModal',
  () =>
    ({ open, onClose }) =>
      open ? (
        <div data-testid="purchase-modal">
          <button onClick={onClose}>Close</button>
        </div>
      ) : null
);

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k, d, o) => {
      if (k === 'credits.days_remaining' && o?.days)
        return `approx. ${o.days} dias`;
      if (k === 'common.enabled_at' && o?.val) return `Ativo (< ${o.val})`;
      if (k === 'credits.alert_threshold' && o?.val)
        return `Alerta: < ${o.val}`;
      return d || k;
    },
  }),
}));

import useCreditBalance from '../../../hooks/useCreditBalance';
import useCreditAlerts from '../../../hooks/useCreditAlerts';
import useCreditHistory from '../../../hooks/useCreditHistory';
import { useTenant } from '../../../hooks/useTenant';
import CreditSettings from '../CreditSettings';

describe('CreditSettings', () => {
  const mockUpdateSettings = jest.fn();
  const mockRefreshBalance = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    useCreditBalance.mockReturnValue({
      balance: { current_balance: 100 },
      loading: false,
      refresh: mockRefreshBalance,
    });

    useCreditAlerts.mockReturnValue({
      settings: { enabled: true, threshold: 50 },
      updateSettings: mockUpdateSettings,
    });

    useCreditHistory.mockReturnValue({
      history: [],
      loading: false,
    });

    useTenant.mockReturnValue({
      tenant: { plan: { name: 'Pro Plan' } },
    });
  });

  it('renders correctly with default data', () => {
    render(<CreditSettings />);

    // Check Title
    expect(screen.getByText('Gerenciamento de Créditos')).toBeInTheDocument();

    // Check Balance
    expect(screen.getByText('Saldo Atual')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();

    // Check Stats Placeholders (empty history)
    expect(screen.getByText('Consumo (Mês)')).toBeInTheDocument();
    expect(screen.getAllByText('0.00')).toHaveLength(2); // Month consumption and Avg
    expect(screen.getByText('Média Mensal')).toBeInTheDocument();
    expect(screen.getByText('Previsão')).toBeInTheDocument();
    expect(screen.getByText('--')).toBeInTheDocument(); // Forecast

    // Check Alert Settings
    expect(screen.getByText('Configuração de Alertas')).toBeInTheDocument();
    expect(screen.getByText('Avisar com menos de:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();

    // Check History List
    expect(screen.getByTestId('credit-history-list')).toBeInTheDocument();
  });

  it('calculates statistics correctly from history', () => {
    // Mock history data for consumption
    // Assuming today is fixed or we use dates relative to now in the component logic
    // But the component uses `new Date()`. Ideally we should mock Date, but let's provide data for "this month"

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Create dates
    const date1 = new Date(currentYear, currentMonth, 5).toISOString();
    const date2 = new Date(currentYear, currentMonth, 10).toISOString();
    // Previous month
    const date3 = new Date(currentYear, currentMonth - 1, 15).toISOString();

    const mockHistory = [
      { amount: '-10.00', created_at: date1 },
      { amount: '-20.00', created_at: date2 },
      { amount: '-30.00', created_at: date3 },
      { amount: '50.00', created_at: date1 }, // Positive amount (purchase), should be ignored
    ];

    useCreditHistory.mockReturnValue({
      history: mockHistory,
      loading: false,
    });

    render(<CreditSettings />);

    // Month consumption: 10 + 20 = 30
    // Average monthly consumption: (10+20+30) / 2 months = 30
    const values = screen.getAllByText('30.00');
    expect(values).toHaveLength(2); // One for month, one for avg
  });

  it('opens purchase modal when buy button is clicked', () => {
    render(<CreditSettings />);

    const buyButton = screen.getByText('Comprar Créditos');
    fireEvent.click(buyButton);

    expect(screen.getByTestId('purchase-modal')).toBeInTheDocument();
  });

  it('calls updateSettings when alert toggle is clicked', () => {
    render(<CreditSettings />);

    const toggleButton = screen.getByRole('switch');
    fireEvent.click(toggleButton);

    expect(mockUpdateSettings).toHaveBeenCalledWith({ enabled: false });
  });

  it('calls updateSettings when threshold input changes', () => {
    render(<CreditSettings />);

    const input = screen.getByDisplayValue('50');
    fireEvent.change(input, { target: { value: '100' } });

    expect(mockUpdateSettings).toHaveBeenCalledWith({ threshold: 100 });
  });

  it('displays loading states', () => {
    useCreditBalance.mockReturnValue({
      balance: null,
      loading: true,
      refresh: mockRefreshBalance,
    });
    useCreditHistory.mockReturnValue({
      history: [],
      loading: true,
    });

    render(<CreditSettings />);

    expect(screen.getAllByText('...').length).toBeGreaterThan(0);
  });
});
