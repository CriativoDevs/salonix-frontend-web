import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Inventory from '../Inventory';
import { useTenant } from '../../hooks/useTenant';
import {
  fetchInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  fetchInventoryAlerts,
  createStockMovement,
} from '../../api/inventory';

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

jest.mock('../../api/inventory', () => ({
  fetchInventoryItems: jest.fn(),
  createInventoryItem: jest.fn(),
  updateInventoryItem: jest.fn(),
  deleteInventoryItem: jest.fn(),
  fetchInventoryAlerts: jest.fn(),
  createStockMovement: jest.fn(),
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

const baseItems = [
  { id: 1, name: 'Shampoo profissional', unit: 'un', quantity: 10, minimum_quantity: 3 },
  { id: 2, name: 'Toalhas', unit: 'un', quantity: 2, minimum_quantity: 5 },
];

describe('Inventory page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    useTenant.mockReturnValue({ slug: 'default' });
    fetchInventoryItems.mockResolvedValue(baseItems);
    fetchInventoryAlerts.mockResolvedValue([baseItems[1]]);
    createInventoryItem.mockResolvedValue({
      id: 3,
      name: 'Novo item',
      unit: 'un',
      quantity: 5,
      minimum_quantity: null,
    });
    updateInventoryItem.mockResolvedValue({
      id: 1,
      name: 'Shampoo profissional atualizado',
      unit: 'un',
      quantity: 10,
      minimum_quantity: 3,
    });
    deleteInventoryItem.mockResolvedValue(true);
    createStockMovement.mockResolvedValue({ id: 99 });
  });

  it('loads and displays the list of items', async () => {
    render(
      <MemoryRouter>
        <Inventory />
      </MemoryRouter>
    );

    expect(await screen.findByText('Shampoo profissional')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Toalhas' })).toBeInTheDocument();
    expect(fetchInventoryItems).toHaveBeenCalled();
  });

  it('shows the low stock alerts section when there are alerts', async () => {
    render(
      <MemoryRouter>
        <Inventory />
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Itens com estoque baixo')
    ).toBeInTheDocument();
  });

  it('shows an empty state when there are no items', async () => {
    fetchInventoryItems.mockResolvedValue([]);
    fetchInventoryAlerts.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Inventory />
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Nenhum item cadastrado')
    ).toBeInTheDocument();
  });

  it('creates a new item through the modal', async () => {
    render(
      <MemoryRouter>
        <Inventory />
      </MemoryRouter>
    );

    await screen.findByText('Shampoo profissional');

    fireEvent.click(screen.getByRole('button', { name: /Adicionar item/i }));

    fireEvent.change(screen.getByPlaceholderText('Ex.: Shampoo profissional 1L'), {
      target: { value: 'Condicionador' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ex.: un, ml, kg'), {
      target: { value: 'un' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^Salvar$/i }));

    await waitFor(() => {
      expect(createInventoryItem).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Condicionador', unit: 'un' }),
        { slug: 'default' }
      );
    });

    expect(await screen.findByText('Novo item')).toBeInTheDocument();
  });

  it('edits an existing item through the modal', async () => {
    render(
      <MemoryRouter>
        <Inventory />
      </MemoryRouter>
    );

    await screen.findByText('Shampoo profissional');

    const editButtons = screen.getAllByRole('button', { name: 'Editar' });
    fireEvent.click(editButtons[0]);

    const nameInput = await screen.findByDisplayValue('Shampoo profissional');
    fireEvent.change(nameInput, {
      target: { value: 'Shampoo profissional atualizado' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^Salvar$/i }));

    await waitFor(() => {
      expect(updateInventoryItem).toHaveBeenCalled();
    });

    expect(
      await screen.findByText('Shampoo profissional atualizado')
    ).toBeInTheDocument();
  });

  it('removes an item after confirmation', async () => {
    render(
      <MemoryRouter>
        <Inventory />
      </MemoryRouter>
    );

    await screen.findByText('Shampoo profissional');

    const deleteButtons = screen.getAllByRole('button', { name: 'Excluir' });
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(deleteInventoryItem).toHaveBeenCalledWith(1, { slug: 'default' });
    });

    await waitFor(() => {
      expect(screen.queryByText('Shampoo profissional')).not.toBeInTheDocument();
    });
  });

  it('opens the movement modal and registers a stock-in', async () => {
    render(
      <MemoryRouter>
        <Inventory />
      </MemoryRouter>
    );

    await screen.findByText('Shampoo profissional');

    const movementButtons = screen.getAllByRole('button', {
      name: 'Movimentar',
    });
    fireEvent.click(movementButtons[0]);

    expect(
      await screen.findByRole('heading', { name: 'Registrar movimentação' })
    ).toBeInTheDocument();

    const quantityInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(quantityInputs[quantityInputs.length - 1], {
      target: { value: '5' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Registrar movimentação/i })
    );

    await waitFor(() => {
      expect(createStockMovement).toHaveBeenCalledWith(
        expect.objectContaining({ item: 1, movement_type: 'in', quantity: '5' }),
        { slug: 'default' }
      );
    });
  });

  it('shows a clear error message for negative balance movements', async () => {
    createStockMovement.mockRejectedValue({
      response: {
        status: 400,
        data: { quantity: ['Estoque insuficiente para essa movimentação.'] },
      },
    });

    render(
      <MemoryRouter>
        <Inventory />
      </MemoryRouter>
    );

    await screen.findByText('Shampoo profissional');

    const movementButtons = screen.getAllByRole('button', {
      name: 'Movimentar',
    });
    fireEvent.click(movementButtons[1]);

    const quantityInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(quantityInputs[quantityInputs.length - 1], {
      target: { value: '999' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Saída' }));
    fireEvent.click(
      screen.getByRole('button', { name: /Registrar movimentação/i })
    );

    expect(
      await screen.findByText('Estoque insuficiente para essa movimentação.')
    ).toBeInTheDocument();
  });
});
