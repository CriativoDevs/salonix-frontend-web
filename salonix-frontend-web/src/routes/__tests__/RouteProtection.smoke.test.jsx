import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from '../PrivateRoute';
import RoleProtectedRoute from '../RoleProtectedRoute';

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { email: 'collab@example.com', username: 'collab' },
  }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'aurora', loading: false, error: null }),
}));

jest.mock('../../hooks/useStaff', () => ({
  useStaff: () => ({
    staff: [
      {
        id: 1,
        email: 'collab@example.com',
        username: 'collab',
        role: 'collaborator',
        status: 'active',
      },
    ],
    loading: false,
    error: null,
  }),
}));

describe('Proteção de rotas (smoke)', () => {
  it('bloqueia colaborador em /reports e redireciona para /dashboard', async () => {
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <RoleProtectedRoute allowedRoles={['owner']}>
                  <div>Reports</div>
                </RoleProtectedRoute>
              </PrivateRoute>
            }
          />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('bloqueia colaborador em /settings e redireciona para /dashboard', async () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <RoleProtectedRoute allowedRoles={['owner']}>
                  <div>Settings</div>
                </RoleProtectedRoute>
              </PrivateRoute>
            }
          />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
