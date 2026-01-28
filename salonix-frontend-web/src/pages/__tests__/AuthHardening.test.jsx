/* eslint-env jest, node */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../Login';
import Register from '../Register';
import ForgotPassword from '../ForgotPassword';
import { useAuth } from '../../hooks/useAuth';
import { registerUser, requestPasswordReset } from '../../api/auth';
import { useTenant } from '../../hooks/useTenant';

// Mocks
jest.mock('../../hooks/useAuth');
jest.mock('../../api/auth');
jest.mock('../../hooks/useTenant');
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  Link: ({ children }) => <div>{children}</div>,
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));
jest.mock('../../layouts/AuthLayout', () => ({ children }) => (
  <div>{children}</div>
));
jest.mock('../../components/security/CaptchaGate', () => () => (
  <div>CaptchaGate</div>
));

// Mock environment variables

describe('Auth Hardening (FEW-210)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      login: jest.fn(),
      authError: null,
      isLoading: false,
      isAuthenticated: false,
      clearAuthError: jest.fn(),
    });
    useTenant.mockReturnValue({
      applyTenantBootstrap: jest.fn(),
    });
  });

  describe('Login Component', () => {
    it('trims email input before submission', async () => {
      const mockLogin = jest.fn().mockResolvedValue({});
      useAuth.mockReturnValue({
        login: mockLogin,
        authError: null,
        isLoading: false,
        isAuthenticated: false,
        clearAuthError: jest.fn(),
      });

      render(<Login />);

      const emailInput = screen.getByLabelText(/login.email/i);
      const passwordInput = screen.getByLabelText(/login.password/i);
      const submitButton = screen.getByRole('button', {
        name: /login.submit/i,
      });

      fireEvent.change(emailInput, {
        target: { value: '  user@example.com  ' },
      });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'user@example.com',
            password: 'password123',
          })
        );
      });
    });

    it('disables button while submitting', async () => {
      // Create a promise that we can control or just one that takes time
      let resolveLogin;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      const mockLogin = jest.fn().mockReturnValue(loginPromise);

      useAuth.mockReturnValue({
        login: mockLogin,
        authError: null,
        isLoading: false,
        isAuthenticated: false,
        clearAuthError: jest.fn(),
      });

      render(<Login />);

      fireEvent.change(screen.getByLabelText(/login.email/i), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/login.password/i), {
        target: { value: 'pass' },
      });

      const submitButton = screen.getByRole('button', {
        name: /login.submit/i,
      });
      fireEvent.click(submitButton);

      // Should be disabled immediately after click (state update)
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('common.loading')).toBeInTheDocument();

      resolveLogin({});
      await waitFor(() => expect(submitButton).not.toBeDisabled());
    });
  });

  describe('Register Component', () => {
    it('trims all text inputs before submission', async () => {
      registerUser.mockResolvedValue({ tenant: { slug: 'test' } });
      const mockLogin = jest.fn().mockResolvedValue({});
      useAuth.mockReturnValue({ login: mockLogin });

      render(<Register />);

      fireEvent.change(screen.getByLabelText('auth.username'), {
        target: { value: '  user  ' },
      });
      fireEvent.change(screen.getByLabelText('auth.email'), {
        target: { value: '  email@test.com  ' },
      });
      fireEvent.change(screen.getByLabelText('auth.password'), {
        target: { value: 'pass' },
      });
      fireEvent.change(screen.getByLabelText('auth.confirm_password'), {
        target: { value: 'pass' },
      });
      fireEvent.change(screen.getByLabelText('auth.salon_name'), {
        target: { value: '  My Salon  ' },
      });
      fireEvent.change(screen.getByLabelText('auth.phone_number'), {
        target: { value: '  123456  ' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'auth.register' }));

      await waitFor(() => {
        expect(registerUser).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'user',
            email: 'email@test.com',
            salon_name: 'My Salon',
            phone_number: '123456',
            password: 'pass', // Password not trimmed
          }),
          expect.anything()
        );
      });
    });
  });

  describe('ForgotPassword Component', () => {
    it('trims email and disables button on submit', async () => {
      // Mock the dynamic import of api/auth if possible, but here we mocked the module at top level
      // However, ForgotPassword uses dynamic import: const { requestPasswordReset } = await import('../api/auth');
      // Jest mock usually mocks the module import, so dynamic import should also return the mock if configured correctly.
      // If not, we might need to adjust. Let's assume standard jest module mocking covers it or we might need to mock import().

      // Since ForgotPassword does `await import('../api/auth')`, we need to ensure that import returns our mock.
      // In Jest, `import()` behaves like `require()`.

      requestPasswordReset.mockResolvedValue({});

      render(<ForgotPassword />);

      const emailInput = screen.getByLabelText('auth.email');
      fireEvent.change(emailInput, {
        target: { value: '  forgot@test.com  ' },
      });

      const submitButton = screen.getByRole('button', {
        name: 'auth.send_reset_link',
      });
      fireEvent.click(submitButton);

      // Check loading state
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('common.loading')).toBeInTheDocument();

      await waitFor(() => {
        expect(requestPasswordReset).toHaveBeenCalledWith(
          'forgot@test.com',
          expect.stringContaining('/reset-password'),
          undefined
        );
      });
    });
  });
});
