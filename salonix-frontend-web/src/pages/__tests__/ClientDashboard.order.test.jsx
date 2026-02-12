import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import ClientDashboard from '../ClientDashboard';

jest.mock('react-simple-pull-to-refresh', () => ({ children }) => (
  <>{children}</>
));

jest.mock('../../api/clientMe', () => ({
  fetchClientUpcoming: jest.fn().mockResolvedValue([
    {
      id: 1,
      service: { name: 'Corte Feminino' },
      professional: { name: 'Alice' },
      slot: { start_time: '2025-12-04T10:00:00Z' },
    },
  ]),
  cancelClientAppointment: jest.fn(),
}));

jest.mock('../../hooks/useClientTenant', () => ({
  useClientTenant: () => ({
    tenant: { profile: { email: 'salon@example.com', phone: '+351911509258' } },
    loading: false,
    error: null,
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k, fallback) => fallback || _k }),
}));

test('Próximo agendamento aparece antes de Entre em contacto', async () => {
  render(
    <ThemeProvider>
      <MemoryRouter>
        <ClientDashboard />
      </MemoryRouter>
    </ThemeProvider>
  );
  const nextHeading = await screen.findByRole('heading', {
    level: 2,
    name: /Próximo agendamento/i,
  });
  const contactHeading = await screen.findByRole('heading', {
    level: 2,
    name: /Entre em contacto/i,
  });
  const pos = nextHeading.compareDocumentPosition(contactHeading);
  expect(Boolean(pos & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
});
