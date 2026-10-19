import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TextEncoder, TextDecoder } from 'util';
import Team from '../Team';
import { useTenant } from '../../hooks/useTenant';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchProfessionals,
  fetchProfessionalsWithMeta,
} from '../../api/professionals';
import { fetchStaffMembers } from '../../api/staff';
import { ThemeProvider } from '../../contexts/ThemeContext';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}

jest.mock('../../hooks/useTenant', () => ({
  useTenant: jest.fn(),
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
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
    },
  }),
}));

jest.mock('../../api/professionals', () => ({
  fetchProfessionals: jest.fn(() => Promise.resolve([])),
  fetchProfessionalsWithMeta: jest.fn(() =>
    Promise.resolve({ results: [], meta: { totalCount: 0 } })
  ),
  createProfessional: jest.fn(() => Promise.resolve({})),
  updateProfessional: jest.fn(() => Promise.resolve({})),
  deleteProfessional: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../../api/services', () => ({
  fetchServices: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../api/staff', () => ({
  fetchStaffMembers: jest.fn(() =>
    Promise.resolve({
      staff: [
        {
          id: 1,
          email: 'manager@example.com',
          role: 'manager',
          status: 'active',
          first_name: 'Casey',
          last_name: 'Manager',
        },
      ],
      requestId: null,
    })
  ),
  inviteStaffMember: jest.fn(),
  updateStaffMember: jest.fn(),
}));

describe('Team page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTenant.mockReturnValue({ slug: 'aurora' });
    useAuth.mockReturnValue({ user: { email: 'manager@example.com' } });
    fetchProfessionals.mockResolvedValue([]);
    fetchProfessionalsWithMeta.mockResolvedValue({
      results: [],
      meta: { totalCount: 0 },
    });
    fetchStaffMembers.mockResolvedValue({
      staff: [
        {
          id: 1,
          email: 'manager@example.com',
          role: 'manager',
          status: 'active',
          first_name: 'Casey',
          last_name: 'Manager',
        },
      ],
      requestId: null,
    });
  });

  it('renders team page', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <Team />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(await screen.findByText('Equipe')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Convidar membro' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtros' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Busca')).not.toBeInTheDocument();
  });

  it('shows "Tornar-me profissional" shortcut for owner without a Professional', async () => {
    useAuth.mockReturnValue({ user: { email: 'owner@example.com' } });
    fetchStaffMembers.mockResolvedValue({
      staff: [
        {
          id: 7,
          email: 'owner@example.com',
          role: 'owner',
          status: 'active',
          first_name: 'Olivia',
          last_name: 'Owner',
        },
      ],
      requestId: null,
    });
    // Nenhum professional vinculado ao owner (cenário de conta antiga,
    // criada antes do BE-PROF-01).
    fetchProfessionalsWithMeta.mockResolvedValue({
      results: [],
      meta: { totalCount: 0 },
    });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <Team />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(
      await screen.findByRole('button', { name: 'Tornar-me profissional' })
    ).toBeInTheDocument();
  });

  it('calls createProfessional with all tenant services when owner clicks the shortcut', async () => {
    const { createProfessional } = await import('../../api/professionals');
    const { fetchServices } = await import('../../api/services');
    fetchServices.mockResolvedValue([
      { id: 1, name: 'Corte' },
      { id: 2, name: 'Barba' },
    ]);
    createProfessional.mockResolvedValue({ id: 50, name: 'Olivia Owner' });

    useAuth.mockReturnValue({ user: { email: 'owner@example.com' } });
    fetchStaffMembers.mockResolvedValue({
      staff: [
        {
          id: 7,
          email: 'owner@example.com',
          role: 'owner',
          status: 'active',
          first_name: 'Olivia',
          last_name: 'Owner',
        },
      ],
      requestId: null,
    });
    fetchProfessionalsWithMeta.mockResolvedValue({
      results: [],
      meta: { totalCount: 0 },
    });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <Team />
        </MemoryRouter>
      </ThemeProvider>
    );

    const button = await screen.findByRole('button', {
      name: 'Tornar-me profissional',
    });
    fireEvent.click(button);

    await waitFor(() => {
      expect(createProfessional).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Olivia Owner',
          staffMemberId: 7,
          serviceIds: [1, 2],
        })
      );
    });
  });
});
