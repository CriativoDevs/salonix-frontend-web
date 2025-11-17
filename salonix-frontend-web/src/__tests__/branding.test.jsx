import React from 'react';
import { render, waitFor } from '@testing-library/react';
import App from '../App';

// Garantir TextEncoder/TextDecoder para jsdom
import { TextEncoder, TextDecoder } from 'util';
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}

jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({ isAuthenticated: true })),
}));

jest.mock('../hooks/useTenant', () => ({
  useTenant: jest.fn(() => ({
    slug: 'aurora',
    tenant: { name: 'Aurora Spa' },
    branding: {
      appName: 'TimelyOne Aurora',
      shortName: 'Aurora',
      faviconUrl: '/assets/branding/favicon.png',
      appleTouchIconUrl: '/assets/branding/apple-touch.png',
      logoUrl: '/assets/branding/logo-512.png',
    },
    theme: {},
  })),
}));

// Evitar parse de import.meta em providers reais
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
}));

jest.mock('../contexts/TenantContext', () => ({
  TenantProvider: ({ children }) => <>{children}</>,
}));

// Evitar import de páginas que usam import.meta via Router
jest.mock('../routes/Router', () => () => null);

describe('Branding aplicado (title, favicon, touch-icon)', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    // Mock de URL para manifest dinâmico
    const originalURL = globalThis.URL || window.URL || {};
    globalThis.URL = {
      ...originalURL,
      createObjectURL: jest.fn(() => 'blob:mock-manifest'),
      revokeObjectURL: jest.fn(),
    };
  });

  it('atualiza título, favicon e apple-touch-icon quando autenticado', async () => {
    render(<App />);

    await waitFor(() => {
      expect(document.title).toBe('Aurora Spa');
    });

    const iconLink = document.querySelector('link[rel="icon"]');
    expect(iconLink).toBeTruthy();
    expect(iconLink.getAttribute('href')).toContain('/assets/branding/favicon.png');

    const shortcutIcon = document.querySelector('link[rel="shortcut icon"]');
    expect(shortcutIcon).toBeTruthy();
    expect(shortcutIcon.getAttribute('href')).toContain('/assets/branding/favicon.png');

    const appleIcon = document.getElementById('tenant-apple-touch-icon');
    expect(appleIcon).toBeTruthy();
    expect(appleIcon.getAttribute('href')).toContain('/assets/branding/apple-touch.png');

    const appleWebAppTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    expect(appleWebAppTitle).toBeTruthy();
    expect(appleWebAppTitle.getAttribute('content')).toBe('Aurora');
  });
});