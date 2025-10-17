import React from 'react';
import { render, screen } from '@testing-library/react';
import { TextDecoder, TextEncoder } from 'util';
import { useStaff } from '../../hooks/useStaff';
import { useTenant } from '../../hooks/useTenant';
import { useAuth } from '../../hooks/useAuth';

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

const Team = require('../Team').default;
const { MemoryRouter } = require('react-router-dom');

jest.mock('../../hooks/useStaff', () => ({
  useStaff: jest.fn(),
}));

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
      } else if (defaultValueOrOptions && typeof defaultValueOrOptions === 'object') {
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

describe('Team page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTenant.mockReturnValue({ slug: 'aurora' });
    useAuth.mockReturnValue({ user: { email: 'manager@example.com' } });
  });

  it('renders loading state', () => {
    useStaff.mockReturnValue({
      staff: [],
      loading: true,
      error: null,
      forbidden: false,
      requestId: null,
      refetch: jest.fn(),
      inviteStaff: jest.fn(),
      updateStaff: jest.fn(),
    });

    render(
      <MemoryRouter>
        <Team />
      </MemoryRouter>
    );

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('renders empty state with invite action', () => {
    useStaff.mockReturnValue({
      staff: [],
      loading: false,
      error: null,
      forbidden: false,
      requestId: null,
      refetch: jest.fn(),
      inviteStaff: jest.fn(),
      updateStaff: jest.fn(),
    });

    render(
      <MemoryRouter>
        <Team />
      </MemoryRouter>
    );

    expect(screen.getByText('Nenhum membro encontrado')).toBeInTheDocument();
    const inviteButtons = screen.getAllByRole('button', { name: 'Convidar membro' });
    expect(inviteButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders staff list with manage buttons', () => {
    useAuth.mockReturnValue({ user: { email: 'manager@example.com' } });
    useStaff.mockReturnValue({
      staff: [
        {
          id: 1,
          role: 'owner',
          status: 'active',
          email: 'owner@example.com',
          first_name: 'Alice',
          last_name: 'Owner',
          invited_at: null,
          activated_at: null,
          deactivated_at: null,
        },
        {
          id: 2,
          role: 'manager',
          status: 'active',
          email: 'manager@example.com',
          first_name: 'Bob',
          last_name: 'Manager',
          invited_at: '2025-01-01T12:00:00Z',
          activated_at: '2025-01-02T08:00:00Z',
          deactivated_at: null,
        },
        {
          id: 3,
          role: 'collaborator',
          status: 'invited',
          email: 'carol@example.com',
          first_name: 'Carol',
          last_name: 'Collab',
          invited_at: '2025-01-03T09:00:00Z',
          invite_token_expires_at: '2025-01-10T09:00:00Z',
          activated_at: null,
          deactivated_at: null,
        },
      ],
      loading: false,
      error: null,
      forbidden: false,
      requestId: null,
      refetch: jest.fn(),
      inviteStaff: jest.fn(),
      updateStaff: jest.fn(),
    });

    render(
      <MemoryRouter>
        <Team />
      </MemoryRouter>
    );

    expect(screen.getByText('Alice Owner')).toBeInTheDocument();
    expect(screen.getByText('Bob Manager')).toBeInTheDocument();
    expect(screen.getByText('Carol Collab')).toBeInTheDocument();
    expect(screen.getByText(/Token expira em/)).toBeInTheDocument();

    const manageButtons = screen.getAllByRole('button', { name: 'Gerenciar' });
    expect(manageButtons.length).toBeGreaterThanOrEqual(2);
    const hasDisabled = manageButtons.some((button) => button.disabled);
    const hasEnabled = manageButtons.some((button) => !button.disabled);
    expect(hasDisabled).toBe(true);
    expect(hasEnabled).toBe(true);
  });
});
