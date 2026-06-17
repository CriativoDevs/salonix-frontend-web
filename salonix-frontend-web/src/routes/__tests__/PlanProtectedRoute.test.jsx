/* eslint-env jest */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from '../PrivateRoute';
import PlanProtectedRoute from '../PlanProtectedRoute';

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ plan: { tier: 'basic' } }),
}));

describe('PlanProtectedRoute', () => {
  it('permite acesso a features ex-Pro no plano único', async () => {
    // FEW-PLANS-01 (#320): plano único — o Basic acede às features ex-Pro
    // (ex.: relatórios avançados) sem redirecionamento para /plans.
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <PlanProtectedRoute featureKey="enableAdvancedReports">
                  <div>Reports</div>
                </PlanProtectedRoute>
              </PrivateRoute>
            }
          />
          <Route path="/plans" element={<div>Plans</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });
    expect(screen.queryByText('Plans')).not.toBeInTheDocument();
  });
});
