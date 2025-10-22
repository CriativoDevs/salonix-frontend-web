import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TextEncoder, TextDecoder } from 'util';
import Team from '../Team';
import { useTenant } from '../../hooks/useTenant';
import { useAuth } from '../../hooks/useAuth';
import { fetchProfessionals } from '../../api/professionals';

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

jest.mock('../../api/professionals', () => ({
  fetchProfessionals: jest.fn(() => Promise.resolve([])),
  createProfessional: jest.fn(() => Promise.resolve({})),
  updateProfessional: jest.fn(() => Promise.resolve({})),
  deleteProfessional: jest.fn(() => Promise.resolve(true)),
}));

describe('Team page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTenant.mockReturnValue({ slug: 'aurora' });
    useAuth.mockReturnValue({ user: { email: 'manager@example.com' } });
    fetchProfessionals.mockResolvedValue([]);
  });

  it('renders team page', async () => {
    render(
      <MemoryRouter>
        <Team />
      </MemoryRouter>
    );

    expect(await screen.findByText('Equipe')).toBeInTheDocument();
  });
});
