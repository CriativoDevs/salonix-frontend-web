import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Marketing from '../Marketing';
import { useTenant } from '../../hooks/useTenant';
import {
  fetchMarketingCampaigns,
  createMarketingCampaign,
} from '../../api/marketing';

const tMock = (key, defaultValueOrOptions, maybeOptions) => {
  let template = key;
  let values = {};

  if (typeof defaultValueOrOptions === 'string') {
    template = defaultValueOrOptions;
  } else if (
    defaultValueOrOptions &&
    typeof defaultValueOrOptions === 'object'
  ) {
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
};

jest.mock('../../hooks/useTenant', () => ({
  useTenant: jest.fn(),
}));

jest.mock('../../api/marketing', () => ({
  fetchMarketingCampaigns: jest.fn(),
  createMarketingCampaign: jest.fn(),
}));

jest.mock('../../layouts/FullPageLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: tMock,
    i18n: { language: 'pt' },
  }),
}));

const baseCampaigns = [
  {
    id: 1,
    subject: 'Campanha de setembro',
    body: 'Olá clientes!',
    reply_to: 'contato@negocio.com',
    status: 'completed',
    eligible_count: 40,
    skipped_no_consent_count: 2,
    free_sent_count: 38,
    credit_sent_count: 0,
    credit_charged_eur: 0,
    blocked_credit_count: 0,
    total_sent_count: 38,
    created_by_username: 'owner1',
    created_at: '2026-09-01T10:00:00Z',
    completed_at: '2026-09-01T10:05:00Z',
  },
];

describe('Marketing page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTenant.mockReturnValue({ slug: 'default' });
    fetchMarketingCampaigns.mockResolvedValue(baseCampaigns);
    createMarketingCampaign.mockResolvedValue({
      id: 2,
      subject: 'Nova campanha',
      body: 'Conteúdo do email',
      reply_to: null,
      status: 'completed',
      eligible_count: 50,
      skipped_no_consent_count: 3,
      free_sent_count: 47,
      credit_sent_count: 0,
      credit_charged_eur: 0,
      blocked_credit_count: 0,
      total_sent_count: 47,
      created_by_username: 'owner1',
      created_at: '2026-09-09T12:00:00Z',
      completed_at: '2026-09-09T12:01:00Z',
    });
  });

  it('loads and displays the campaign history', async () => {
    render(
      <MemoryRouter>
        <Marketing />
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Campanha de setembro')
    ).toBeInTheDocument();
    expect(fetchMarketingCampaigns).toHaveBeenCalledWith({ slug: 'default' });
  });

  it('shows an empty state when there is no campaign history', async () => {
    fetchMarketingCampaigns.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Marketing />
      </MemoryRouter>
    );

    expect(
      await screen.findByText('Nenhuma campanha enviada')
    ).toBeInTheDocument();
  });

  it('validates the form and blocks submission when fields are empty', async () => {
    render(
      <MemoryRouter>
        <Marketing />
      </MemoryRouter>
    );

    await screen.findByText('Campanha de setembro');

    fireEvent.click(
      screen.getByRole('button', { name: /Rever e enviar campanha/i })
    );

    expect(
      await screen.findByText('Escreva o assunto do email.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Escreva o conteúdo do email.')
    ).toBeInTheDocument();
    expect(createMarketingCampaign).not.toHaveBeenCalled();
  });

  it('validates the reply_to field as an email when filled', async () => {
    render(
      <MemoryRouter>
        <Marketing />
      </MemoryRouter>
    );

    await screen.findByText('Campanha de setembro');

    fireEvent.change(screen.getByLabelText('Assunto'), {
      target: { value: 'Assunto válido' },
    });
    fireEvent.change(screen.getByLabelText('Conteúdo do email'), {
      target: { value: 'Conteúdo válido' },
    });
    fireEvent.change(screen.getByPlaceholderText('contato@meunegocio.com'), {
      target: { value: 'not-an-email' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Rever e enviar campanha/i })
    );

    expect(
      await screen.findByText('Informe um email válido.')
    ).toBeInTheDocument();
    expect(createMarketingCampaign).not.toHaveBeenCalled();
  });

  it('opens the confirmation modal, sends the campaign and shows the result', async () => {
    render(
      <MemoryRouter>
        <Marketing />
      </MemoryRouter>
    );

    await screen.findByText('Campanha de setembro');

    fireEvent.change(screen.getByLabelText('Assunto'), {
      target: { value: 'Nova campanha' },
    });
    fireEvent.change(screen.getByLabelText('Conteúdo do email'), {
      target: { value: 'Conteúdo do email' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Rever e enviar campanha/i })
    );

    expect(
      await screen.findByText('Confirmar envio da campanha')
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Sim, enviar campanha/i })
    );

    await waitFor(() => {
      expect(createMarketingCampaign).toHaveBeenCalledWith(
        {
          subject: 'Nova campanha',
          body: 'Conteúdo do email',
          reply_to: null,
        },
        { slug: 'default' }
      );
    });

    expect(await screen.findByText('Resultado do envio')).toBeInTheDocument();
    expect(screen.getAllByText('47').length).toBeGreaterThan(0);
  });

  it('shows an error message when sending the campaign fails', async () => {
    createMarketingCampaign.mockRejectedValue({
      response: {
        status: 403,
        data: { detail: 'Você não tem permissão para esta ação.' },
      },
    });

    render(
      <MemoryRouter>
        <Marketing />
      </MemoryRouter>
    );

    await screen.findByText('Campanha de setembro');

    fireEvent.change(screen.getByLabelText('Assunto'), {
      target: { value: 'Nova campanha' },
    });
    fireEvent.change(screen.getByLabelText('Conteúdo do email'), {
      target: { value: 'Conteúdo do email' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Rever e enviar campanha/i })
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Sim, enviar campanha/i })
    );

    expect(
      (await screen.findAllByText('Você não tem permissão para esta ação.'))
        .length
    ).toBeGreaterThan(0);
  });
});
