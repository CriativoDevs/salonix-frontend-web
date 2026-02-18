/* eslint-env jest */
import React from 'react';
import { render } from '@testing-library/react';

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({
    slug: 'aurora',
    theme: {
      primary: '#123456',
      primaryForeground: '#ffffff',
      surface: '#ffffff',
      surfaceForeground: '#111111',
      accent: '#ff00aa',
      border: '#dddddd',
      secondary: '#888888',
      secondaryForeground: '#ffffff',
      highlight: '#00ff00',
      highlightForeground: '#000000',
    },
    branding: {
      appName: 'Aurora',
      shortName: 'Aurora',
      logoUrl: '/logo.png',
      icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    },
    tenant: { name: 'Aurora Salon' },
  }),
}));

jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
}));

jest.mock('../../contexts/TenantContext', () => ({
  TenantProvider: ({ children }) => <>{children}</>,
}));

jest.mock('../../contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }) => <>{children}</>,
}));

jest.mock('../../routes/Router', () => ({
  default: () => null,
}));

describe('Dynamic manifest and theme update', () => {
  it('creates dynamic manifest link and sets theme variables', async () => {
    globalThis.URL.createObjectURL = jest.fn(() => 'blob://manifest');
    globalThis.URL.revokeObjectURL = jest.fn();
    const { TenantThemeManager } = await import('../../App.jsx');
    render(<TenantThemeManager />);

    const manifestLink = document.getElementById('tenant-dynamic-manifest');
    expect(manifestLink).toBeTruthy();

    const titleMeta = document.querySelector(
      'meta[name="apple-mobile-web-app-title"]'
    );
    expect(titleMeta).toBeTruthy();
    expect(titleMeta.getAttribute('content')).toBe('Aurora');

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--brand-primary')).toBe('#123456');
  });
});
