import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Vouchers from '../Vouchers';
import { useTenant } from '../../hooks/useTenant';
import {
  fetchVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  assignVoucher,
  assignVoucherBulk,
  sendVoucherEmail,
} from '../../api/vouchers';
import { fetchServices } from '../../api/services';
import { fetchCustomers } from '../../api/customers';

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

jest.mock('../../api/vouchers', () => ({
  fetchVouchers: jest.fn(),
  createVoucher: jest.fn(),
  updateVoucher: jest.fn(),
  deleteVoucher: jest.fn(),
  assignVoucher: jest.fn(),
  assignVoucherBulk: jest.fn(),
  sendVoucherEmail: jest.fn(),
}));

jest.mock('../../api/services', () => ({
  fetchServices: jest.fn(),
}));

jest.mock('../../api/customers', () => ({
  fetchCustomers: jest.fn(),
}));

jest.mock('../../layouts/FullPageLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: tMock,
  }),
}));

const baseVouchers = [
  {
    id: 1,
    code: 'PROMO2026',
    type: 'percent',
    value: '10.00',
    service: null,
    max_uses: 5,
    valid_until: '2099-01-01',
    notes: '',
  },
  {
    id: 2,
    code: 'OLDCODE1',
    type: 'fixed',
    value: '20.00',
    service: null,
    max_uses: 1,
    valid_until: '2000-01-01',
    notes: '',
  },
];

describe('Vouchers page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    useTenant.mockReturnValue({ slug: 'default' });
    fetchVouchers.mockResolvedValue(baseVouchers);
    fetchServices.mockResolvedValue([]);
    fetchCustomers.mockResolvedValue({ results: [] });
    createVoucher.mockResolvedValue({
      id: 3,
      code: 'NEWCODE1',
      type: 'percent',
      value: '15.00',
      service: null,
      max_uses: 1,
      valid_until: null,
      notes: '',
    });
    updateVoucher.mockResolvedValue({ ...baseVouchers[0], notes: 'editado' });
    deleteVoucher.mockResolvedValue(true);
    assignVoucher.mockResolvedValue({ id: 10 });
    sendVoucherEmail.mockResolvedValue({ id: 11 });
  });

  it('loads and displays the list of vouchers', async () => {
    render(
      <MemoryRouter>
        <Vouchers />
      </MemoryRouter>
    );

    expect(await screen.findByText('PROMO2026')).toBeInTheDocument();
    expect(screen.getByText('OLDCODE1')).toBeInTheDocument();
    expect(fetchVouchers).toHaveBeenCalled();
  });

  it('shows status badges for active and expired vouchers', async () => {
    render(
      <MemoryRouter>
        <Vouchers />
      </MemoryRouter>
    );

    await screen.findByText('PROMO2026');
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Expirado')).toBeInTheDocument();
  });

  it('shows an empty state when there are no vouchers', async () => {
    fetchVouchers.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Vouchers />
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Nenhum voucher criado')
    ).toBeInTheDocument();
  });

  it('creates a new voucher through the modal', async () => {
    render(
      <MemoryRouter>
        <Vouchers />
      </MemoryRouter>
    );

    await screen.findByText('PROMO2026');

    fireEvent.click(screen.getByRole('button', { name: /Criar voucher/i }));

    const valueInput = await screen.findByRole('spinbutton', {
      name: /Percentual de desconto/i,
    });
    fireEvent.change(valueInput, { target: { value: '15' } });

    fireEvent.click(screen.getByRole('button', { name: /^Salvar$/i }));

    await waitFor(() => {
      expect(createVoucher).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'percent', value: '15', max_uses: 1 }),
        { slug: 'default' }
      );
    });

    expect(await screen.findByText('NEWCODE1')).toBeInTheDocument();
  });

  it('removes a voucher after confirmation', async () => {
    render(
      <MemoryRouter>
        <Vouchers />
      </MemoryRouter>
    );

    await screen.findByText('PROMO2026');

    const deleteButtons = screen.getAllByRole('button', { name: /Excluir/i });
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(deleteVoucher).toHaveBeenCalledWith(1, { slug: 'default' });
    });

    await waitFor(() => {
      expect(screen.queryByText('PROMO2026')).not.toBeInTheDocument();
    });
  });

  it('assigns a voucher to a customer found via search', async () => {
    fetchCustomers.mockResolvedValue({
      results: [{ id: 42, name: 'Ana Souza', email: 'ana@example.com' }],
    });

    render(
      <MemoryRouter>
        <Vouchers />
      </MemoryRouter>
    );

    await screen.findByText('PROMO2026');

    const assignButtons = screen.getAllByRole('button', {
      name: /Atribuir a cliente/i,
    });
    fireEvent.click(assignButtons[0]);

    const searchInput = await screen.findByPlaceholderText(
      'Nome ou e-mail do cliente'
    );
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'Ana' } });

    const customerButton = await screen.findByText('Ana Souza');
    fireEvent.click(customerButton);

    fireEvent.click(screen.getByRole('button', { name: /Atribuir voucher/i }));

    await waitFor(() => {
      expect(assignVoucher).toHaveBeenCalledWith(1, 42, { slug: 'default' });
    });
  });

  it('assigns a voucher to several customers at once via bulk assign', async () => {
    fetchCustomers.mockResolvedValue({
      results: [
        { id: 42, name: 'Ana Souza', email: 'ana@example.com' },
        { id: 43, name: 'Bruno Lima', email: null },
      ],
    });
    assignVoucherBulk.mockResolvedValue({
      assigned: [{ id: 1, client: 42 }, { id: 2, client: 43 }],
      skipped: [],
    });

    render(
      <MemoryRouter>
        <Vouchers />
      </MemoryRouter>
    );

    await screen.findByText('PROMO2026');

    const assignButtons = screen.getAllByRole('button', {
      name: /Atribuir a cliente/i,
    });
    fireEvent.click(assignButtons[0]);

    await screen.findByText('Ana Souza');
    fireEvent.click(screen.getByText('Ana Souza'));
    fireEvent.click(screen.getByText('Bruno Lima'));

    await screen.findByText('2 clientes selecionados');

    fireEvent.click(
      screen.getByRole('button', { name: /Atribuir a 2 clientes/i })
    );

    await waitFor(() => {
      expect(assignVoucherBulk).toHaveBeenCalledWith(1, [42, 43], {
        slug: 'default',
      });
    });
  });

  it('selects all visible customers via the select-all toggle', async () => {
    fetchCustomers.mockResolvedValue({
      results: [
        { id: 42, name: 'Ana Souza', email: 'ana@example.com' },
        { id: 43, name: 'Bruno Lima', email: null },
      ],
    });
    assignVoucherBulk.mockResolvedValue({ assigned: [], skipped: [] });

    render(
      <MemoryRouter>
        <Vouchers />
      </MemoryRouter>
    );

    await screen.findByText('PROMO2026');

    const assignButtons = screen.getAllByRole('button', {
      name: /Atribuir a cliente/i,
    });
    fireEvent.click(assignButtons[0]);

    await screen.findByText('Ana Souza');
    fireEvent.click(screen.getByText('Selecionar todos'));

    await screen.findByText('2 clientes selecionados');

    fireEvent.click(
      screen.getByRole('button', { name: /Atribuir a 2 clientes/i })
    );

    await waitFor(() => {
      expect(assignVoucherBulk).toHaveBeenCalledWith(1, [42, 43], {
        slug: 'default',
      });
    });
  });
});
