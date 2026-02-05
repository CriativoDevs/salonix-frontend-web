import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PublicRoute from '../PublicRoute';
import { useAuth } from '../../hooks/useAuth';
import { useClientAuth } from '../../hooks/useClientAuth';

// Mock useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock useClientAuth hook
jest.mock('../../hooks/useClientAuth', () => ({
  useClientAuth: jest.fn(),
}));

// Mock navigation utils
jest.mock('../../utils/navigation', () => ({
  consumePostAuthRedirect: jest.fn(() => null),
}));

describe('PublicRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when isLoading is true', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    useClientAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <PublicRoute>
          <div>Public Content</div>
        </PublicRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.queryByText('Public Content')).not.toBeInTheDocument();
  });

  it('redirects to dashboard when authenticated', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    useClientAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <div>Login Page</div>
              </PublicRoute>
            }
          />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('renders children when not authenticated and not loading', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    useClientAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <PublicRoute>
          <div>Public Content</div>
        </PublicRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Public Content')).toBeInTheDocument();
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
  });
});
