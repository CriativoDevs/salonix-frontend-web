import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ClientBookingPage from '../ClientBookingPage';
import { useTenant } from '../../hooks/useTenant';
import client from '../../api/client';
import { fetchServices } from '../../api/services';
import {
  createClientAppointment,
  fetchClientVouchers,
  applyClientVoucherToAppointment,
} from '../../api/clientMe';

jest.mock('../../hooks/useTenant', () => ({
  useTenant: jest.fn(),
}));

jest.mock('../../api/services', () => ({
  fetchServices: jest.fn(),
}));

jest.mock('../../api/client', () => ({
  get: jest.fn(),
}));

jest.mock('../../api/clientMe', () => ({
  createClientAppointment: jest.fn(),
  fetchClientVouchers: jest.fn(),
  applyClientVoucherToAppointment: jest.fn(),
}));

jest.mock('../../layouts/ClientLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValueOrOptions, maybeOptions) => {
      let template = key;
      let values = {};
      if (typeof defaultValueOrOptions === 'string') {
        template = defaultValueOrOptions;
      } else if (
        defaultValueOrOptions &&
        typeof defaultValueOrOptions === 'object'
      ) {
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

const baseService = { id: 1, name: 'Corte' };
const baseProfessional = { id: 2, name: 'Joana' };
const baseSlot = { id: 3, start_time: '2099-01-01T10:00:00Z' };

const activeVoucher = {
  id: 9,
  voucher: 5,
  voucher_code: 'PROMO2026',
  voucher_type: 'percent',
  voucher_value: '10.00',
  status: 'active',
};

describe('ClientBookingPage voucher selection (BE-VOUCHER-06)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTenant.mockReturnValue({ slug: 'default' });
    fetchServices.mockResolvedValue([baseService]);
    client.get.mockImplementation((url) => {
      if (url === 'public/professionals/') {
        return Promise.resolve({ data: [baseProfessional] });
      }
      if (url === 'public/slots/') {
        return Promise.resolve({ data: [baseSlot] });
      }
      return Promise.resolve({ data: [] });
    });
    fetchClientVouchers.mockResolvedValue([activeVoucher]);
    createClientAppointment.mockResolvedValue({ id: 42 });
    applyClientVoucherToAppointment.mockResolvedValue({
      ...activeVoucher,
      status: 'used',
    });
  });

  const fillBookingForm = async () => {
    await screen.findByText('Corte');
  };

  it('shows the active vouchers available to the client', async () => {
    render(
      <MemoryRouter>
        <ClientBookingPage />
      </MemoryRouter>
    );

    expect(fetchClientVouchers).toHaveBeenCalled();
    expect(
      await screen.findByText('Usar voucher')
    ).toBeInTheDocument();
    expect(
      screen.getByText('PROMO2026 — 10.00% de desconto')
    ).toBeInTheDocument();
  });

  it('does not render the voucher section when the client has none', async () => {
    fetchClientVouchers.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <ClientBookingPage />
      </MemoryRouter>
    );

    await screen.findByText('Corte');
    expect(screen.queryByText('Usar voucher')).not.toBeInTheDocument();
  });

  it('applies the selected voucher to the appointment after booking', async () => {
    render(
      <MemoryRouter>
        <ClientBookingPage />
      </MemoryRouter>
    );

    await fillBookingForm();

    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: String(baseService.id) },
    });

    const professionalSelect = await waitFor(() =>
      screen.getAllByRole('combobox')[1]
    );
    fireEvent.change(professionalSelect, {
      target: { value: String(baseProfessional.id) },
    });

    const slotSelect = await waitFor(() => screen.getAllByRole('combobox')[2]);
    fireEvent.change(slotSelect, { target: { value: String(baseSlot.id) } });

    const voucherSelect = await screen.findByText('Usar voucher');
    const voucherCombo = voucherSelect.closest('div').querySelector('select');
    fireEvent.change(voucherCombo, { target: { value: String(activeVoucher.id) } });

    fireEvent.click(screen.getByRole('button', { name: /Agendar/i }));

    await waitFor(() => {
      expect(createClientAppointment).toHaveBeenCalledWith({
        service: baseService.id,
        professional: baseProfessional.id,
        slot: baseSlot.id,
        notes: '',
      });
    });

    await waitFor(() => {
      expect(applyClientVoucherToAppointment).toHaveBeenCalledWith(
        42,
        activeVoucher.id
      );
    });
  });

  it('shows a warning and does not navigate when applying the voucher fails', async () => {
    applyClientVoucherToAppointment.mockRejectedValue({
      response: { status: 400, data: { client_voucher_id: ['Já usado.'] } },
    });

    render(
      <MemoryRouter>
        <ClientBookingPage />
      </MemoryRouter>
    );

    await fillBookingForm();

    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: String(baseService.id) },
    });
    const professionalSelect = await waitFor(() =>
      screen.getAllByRole('combobox')[1]
    );
    fireEvent.change(professionalSelect, {
      target: { value: String(baseProfessional.id) },
    });
    const slotSelect = await waitFor(() => screen.getAllByRole('combobox')[2]);
    fireEvent.change(slotSelect, { target: { value: String(baseSlot.id) } });

    const voucherSelect = await screen.findByText('Usar voucher');
    const voucherCombo = voucherSelect.closest('div').querySelector('select');
    fireEvent.change(voucherCombo, { target: { value: String(activeVoucher.id) } });

    fireEvent.click(screen.getByRole('button', { name: /Agendar/i }));

    expect(await screen.findByText('Já usado.')).toBeInTheDocument();
  });
});
