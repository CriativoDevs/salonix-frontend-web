import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Feedback from '../Feedback.jsx';
import * as api from '../../api/feedback';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => {
      const dict = {
        'feedback.rating': 'Avaliação',
        'feedback.rating_1': 'Muito ruim',
        'feedback.rating_2': 'Ruim',
        'feedback.rating_3': 'Regular',
        'feedback.rating_4': 'Bom',
        'feedback.rating_5': 'Excelente',
        'feedback.category': 'Categoria',
        'feedback.select_category': 'Selecione uma categoria',
        'feedback.categories.app': 'App',
        'feedback.message': 'Mensagem',
        'feedback.message_placeholder': 'Conte-nos sobre sua experiência...',
        'feedback.submit': 'Enviar feedback',
        'feedback.thank_you': 'Obrigado!',
        'feedback.submission_success': 'Seu feedback foi enviado com sucesso.',
        'feedback.submit_another': 'Enviar outro feedback',
        'feedback.submit_error': 'Não foi possível enviar o feedback.',
        'feedback.errors.rating_required': 'Selecione uma avaliação de 1 a 5.',
        'feedback.errors.category_required': 'Selecione uma categoria válida.',
        'feedback.errors.message_required': 'Escreva uma mensagem.',
        'feedback.errors.message_too_long':
          'Mensagem muito longa. Máximo de 2000 caracteres.',
        'common.loading': 'Enviando...',
      };
      return dict[key] ?? fallback ?? key;
    },
  }),
}));

jest.mock('../../api/feedback', () => ({
  __esModule: true,
  submitFeedback: jest.fn(),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'tenant-x' }),
}));

jest.mock('../../components/security/CaptchaGate', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../components/ui/ThemeToggle.jsx', () => ({
  __esModule: true,
  default: () => null,
}));

describe('Feedback page', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('exibe erros de validação ao enviar vazio', async () => {
    api.submitFeedback.mockResolvedValueOnce({ ok: true });

    render(
      <MemoryRouter>
        <Feedback />
      </MemoryRouter>
    );

    const form = screen.getByRole('form', { name: 'feedback-form' });
    fireEvent.submit(form);

    expect(
      await screen.findByText('Selecione uma avaliação de 1 a 5.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Selecione uma categoria válida.')
    ).toBeInTheDocument();
    expect(screen.getByText('Escreva uma mensagem.')).toBeInTheDocument();
  });

  it('envia com sucesso e mostra estado de sucesso', async () => {
    api.submitFeedback.mockResolvedValueOnce({ id: 1 });

    render(
      <MemoryRouter>
        <Feedback />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Excelente' }));

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'app' } });

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Teste' } });

    fireEvent.click(screen.getByRole('button', { name: 'Enviar feedback' }));

    expect(await screen.findByText('Obrigado!')).toBeInTheDocument();
    expect(
      screen.getByText('Seu feedback foi enviado com sucesso.')
    ).toBeInTheDocument();
  });

  it('mostra erro quando envio falha', async () => {
    api.submitFeedback.mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter>
        <Feedback />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Bom' }));

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'app' } });

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Falhou' } });

    fireEvent.click(screen.getByRole('button', { name: 'Enviar feedback' }));

    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });
});
