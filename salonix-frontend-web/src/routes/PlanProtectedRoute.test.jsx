import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PlanProtectedRoute from './PlanProtectedRoute';
import usePlanGate from '../hooks/usePlanGate';

// Mock hook
jest.mock('../hooks/usePlanGate');

describe('PlanProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when allowed', () => {
    usePlanGate.mockReturnValue({ allowed: true });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <PlanProtectedRoute featureKey="someFeature">
                <div>Protected Content</div>
              </PlanProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /plans when not allowed', () => {
    usePlanGate.mockReturnValue({ allowed: false });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <PlanProtectedRoute featureKey="someFeature">
                <div>Protected Content</div>
              </PlanProtectedRoute>
            }
          />
          <Route path="/plans" element={<div>Plans Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Plans Page')).toBeInTheDocument();
  });
});
