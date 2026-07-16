import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Customers from '../Customers';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'salao-teste', flags: {}, featureFlagsRaw: {} }),
}));

jest.mock('../../layouts/FullPageLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../api/customers', () => ({
  fetchCustomers: jest.fn(async () => ({ results: [], count: 0 })),
  fetchCustomerDetail: jest.fn(),
  createCustomer: jest.fn(),
  updateCustomer: jest.fn(),
  deleteCustomer: jest.fn(),
  resendCustomerInvite: jest.fn(),
  importCustomersCSV: jest.fn(),
  fetchCustomersImportTemplate: jest.fn(),
  exportCustomersCSV: jest.fn(),
}));

const writeTextMock = jest.fn(() => Promise.resolve());
Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

describe('Customers registration link', () => {
  beforeEach(() => {
    writeTextMock.mockClear();
  });

  it('copies the /join link to the clipboard', async () => {
    render(
      <MemoryRouter>
        <Customers />
      </MemoryRouter>
    );

    const copyButton = await screen.findByRole('button', {
      name: /copiar link de registo/i,
    });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining('/join/salao-teste')
      );
    });
  });

  it('opens a QR code modal for the registration link', async () => {
    render(
      <MemoryRouter>
        <Customers />
      </MemoryRouter>
    );

    const qrButton = await screen.findByRole('button', {
      name: /gerar qr code/i,
    });
    fireEvent.click(qrButton);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('shows an error toast when copying the link fails', async () => {
    writeTextMock.mockRejectedValueOnce(new Error('denied'));

    render(
      <MemoryRouter>
        <Customers />
      </MemoryRouter>
    );

    const copyButton = await screen.findByRole('button', {
      name: /copiar link de registo/i,
    });
    fireEvent.click(copyButton);

    expect(
      await screen.findByText(/não foi possível copiar o link/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/link copiado!/i)
    ).not.toBeInTheDocument();
  });
});
