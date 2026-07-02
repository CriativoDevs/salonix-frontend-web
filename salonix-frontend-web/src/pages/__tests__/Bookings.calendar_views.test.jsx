import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Bookings from '../Bookings';
import { fetchAppointments } from '../../api/appointments';
import { fetchCustomers } from '../../api/customers';
import { fetchServices } from '../../api/services';
import { fetchProfessionals } from '../../api/professionals';
import { fetchTenantBusinessHours } from '../../api/tenant';

jest.mock('../../layouts/FullPageLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'aurora' }),
}));

jest.mock('../../api/appointments');
jest.mock('../../api/customers');
jest.mock('../../api/services');
jest.mock('../../api/professionals');
jest.mock('../../api/tenant');

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValueOrOptions) =>
      typeof defaultValueOrOptions === 'string' ? defaultValueOrOptions : key,
  }),
}));

function renderBookings() {
  return render(
    <MemoryRouter>
      <Bookings />
    </MemoryRouter>
  );
}

describe('Bookings day/week/month views', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchAppointments.mockResolvedValue({ results: [], count: 0 });
    fetchCustomers.mockResolvedValue({ results: [], count: 0 });
    fetchServices.mockResolvedValue({ results: [], count: 0 });
    fetchProfessionals.mockResolvedValue({ results: [], count: 0 });
    fetchTenantBusinessHours.mockResolvedValue([
      { day_of_week: 1, is_active: true, start_time: '09:00:00', end_time: '18:00:00' },
    ]);
  });

  it('defaults to the week view and switches to day/month', async () => {
    renderBookings();

    expect(await screen.findByRole('button', { name: 'Dia' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Semana' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mês' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dia' }));
    await waitFor(() => {
      expect(fetchAppointments).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mês' }));
    await waitFor(() => {
      expect(fetchAppointments).toHaveBeenCalled();
    });
  });
});
