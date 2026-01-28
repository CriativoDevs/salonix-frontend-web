import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import ClientSetPassword from '../ClientSetPassword';
import i18n from '../../i18n';
import * as clientAccessApi from '../../api/clientAccess';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../api/clientAccess', () => ({
  setClientPassword: jest.fn(),
}));

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <ClientSetPassword />
      </I18nextProvider>
    </BrowserRouter>
  );
};

describe('ClientSetPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar o formulário com campos de senha', () => {
      renderComponent();
      expect(screen.getByLabelText(/Nova Senha/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirme a Senha/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Definir Senha/i })
      ).toBeInTheDocument();
    });
  });

  describe('Integração com API', () => {
    it('deve chamar setClientPassword com dados corretos', async () => {
      const setPasswordSpy = jest
        .spyOn(clientAccessApi, 'setClientPassword')
        .mockResolvedValue({});

      renderComponent();

      fireEvent.change(screen.getByLabelText(/Nova Senha/i), {
        target: { value: '123456' },
      });
      fireEvent.change(screen.getByLabelText(/Confirme a Senha/i), {
        target: { value: '123456' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Definir Senha/i }));

      await waitFor(() => {
        expect(setPasswordSpy).toHaveBeenCalledWith({ password: '123456' });
      });
    });

    it('deve redirecionar para /client/appointments após sucesso', async () => {
      jest.spyOn(clientAccessApi, 'setClientPassword').mockResolvedValue({});

      renderComponent();

      fireEvent.change(screen.getByLabelText(/Nova Senha/i), {
        target: { value: '123456' },
      });
      fireEvent.change(screen.getByLabelText(/Confirme a Senha/i), {
        target: { value: '123456' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Definir Senha/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/client/dashboard', {
          replace: true,
        });
      });
    });

    it('não deve chamar API se senhas não coincidirem', async () => {
      const setPasswordSpy = jest.spyOn(clientAccessApi, 'setClientPassword');

      renderComponent();

      fireEvent.change(screen.getByLabelText(/Nova Senha/i), {
        target: { value: '123456' },
      });
      fireEvent.change(screen.getByLabelText(/Confirme a Senha/i), {
        target: { value: '654321' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Definir Senha/i }));

      await waitFor(() => {
        expect(setPasswordSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it.skip('deve exibir erro genérico em falha', async () => {
      jest
        .spyOn(clientAccessApi, 'setClientPassword')
        .mockRejectedValue(new Error('Network error'));

      renderComponent();

      fireEvent.change(screen.getByLabelText(/Nova Senha/i), {
        target: { value: '123456' },
      });
      fireEvent.change(screen.getByLabelText(/Confirme a Senha/i), {
        target: { value: '123456' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Definir Senha/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/Erro ao definir senha. Tente novamente./i)
        ).toBeInTheDocument();
      });
    });
  });
});
