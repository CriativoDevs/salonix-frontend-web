import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Customers from '../Customers';
import { useTenant } from '../../hooks/useTenant';
import useCreditGate from '../../hooks/useCreditGate';
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  resendCustomerInvite,
} from '../../api/customers';

const mockCustomerPhotoPreviewModal = jest.fn(() => null);

const tMock = (key, defaultValueOrOptions, maybeOptions) => {
  let template = key;
  let values = {};

  if (typeof defaultValueOrOptions === 'string') {
    template = defaultValueOrOptions;
  } else if (
    defaultValueOrOptions &&
    typeof defaultValueOrOptions === 'object'
  ) {
    if (typeof defaultValueOrOptions.defaultValue === 'string') {
      template = defaultValueOrOptions.defaultValue;
    }
    values = defaultValueOrOptions;
  }

  if (maybeOptions && typeof maybeOptions === 'object') {
    if (typeof maybeOptions.defaultValue === 'string') {
      template = maybeOptions.defaultValue;
    }
    values = { ...values, ...maybeOptions };
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, token) =>
    Object.prototype.hasOwnProperty.call(values, token) ? values[token] : ''
  );
};

jest.mock('../../hooks/useTenant', () => ({
  useTenant: jest.fn(),
}));

jest.mock('../../hooks/useCreditGate', () => jest.fn());

jest.mock('../../api/customers', () => ({
  fetchCustomers: jest.fn(),
  createCustomer: jest.fn(),
  updateCustomer: jest.fn(),
  deleteCustomer: jest.fn(),
  resendCustomerInvite: jest.fn(),
}));

jest.mock('../../layouts/FullPageLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../components/credits/CreditBlockModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../components/credits/CreditPurchaseModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../components/customers/CustomerPhotoPreviewModal', () => ({
  __esModule: true,
  default: (props) => {
    mockCustomerPhotoPreviewModal(props);
    if (!props.open) return null;
    return <div role="dialog" />;
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: tMock,
  }),
}));

describe('Customers page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTenant.mockReturnValue({
      slug: 'default',
      flags: {
        enableCustomerPwa: true,
        enableSms: false,
        enableWhatsapp: false,
      },
      featureFlagsRaw: null,
    });
    useCreditGate.mockReturnValue({
      checkCredits: () => true,
      getCost: () => 1,
    });
    fetchCustomers.mockResolvedValue({
      results: [
        {
          id: 1,
          name: 'Cliente Novo Teste',
          email: 'cliente@example.com',
          phone_number: '+351911223344',
          photo: '/media/customers/alice.png',
          birthday: '1991-05-10',
          notes: 'Cliente VIP',
          is_active: true,
          created_at: '2026-02-28T10:00:00Z',
        },
      ],
      count: 1,
    });
    createCustomer.mockResolvedValue({ id: 2, name: 'Novo' });
    updateCustomer.mockResolvedValue({ id: 1, name: 'Atualizado' });
    deleteCustomer.mockResolvedValue(true);
    resendCustomerInvite.mockResolvedValue({ status: 'queued' });
  });

  it('opens the customer photo preview when clicking the card avatar', async () => {
    render(
      <MemoryRouter>
        <Customers />
      </MemoryRouter>
    );

    expect(await screen.findByText('Lista de clientes')).toBeInTheDocument();

    const previewButton = await screen.findByRole('button', {
      name: /Abrir foto de Cliente Novo Teste/i,
    });

    fireEvent.click(previewButton);

    expect(mockCustomerPhotoPreviewModal).toHaveBeenCalled();
    await waitFor(() => {
      expect(
        mockCustomerPhotoPreviewModal.mock.calls.some(
          ([props]) =>
            props?.open === true &&
            props?.customer?.name === 'Cliente Novo Teste'
        )
      ).toBe(true);
    });
  });

  it('keeps add-customer and filters panels collapsed until requested', async () => {
    render(
      <MemoryRouter>
        <Customers />
      </MemoryRouter>
    );

    expect(await screen.findByText('Lista de clientes')).toBeInTheDocument();
    expect(
      screen.queryByText(
        'Cadastre dados de contato e uma foto clara para identificar rapidamente quem e quem.'
      )
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Ordenacao')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Adicionar cliente/i }));
    expect(
      screen.getByText(
        'Cadastre dados de contato e uma foto clara para identificar rapidamente quem e quem.'
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Filtros/i }));
    expect(screen.getByText('Ordenacao')).toBeInTheDocument();
  });
});
