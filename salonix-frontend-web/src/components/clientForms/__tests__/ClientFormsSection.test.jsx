import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ClientFormsSection from '../ClientFormsSection';
import {
  fetchClientFormResponses,
  updateClientFormResponse,
} from '../../../api/clientMe';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, def, opts) => {
      let text = typeof def === 'string' ? def : key;
      if (opts && typeof opts === 'object') {
        Object.entries(opts).forEach(([k, v]) => {
          text = text.replace(`{{${k}}}`, v);
        });
      }
      return text;
    },
  }),
}));

jest.mock('../../../api/clientMe', () => ({
  fetchClientFormResponses: jest.fn(),
  updateClientFormResponse: jest.fn(),
}));

const fields = [
  { id: 1, label: 'Queixa', field_type: 'text', required: true, options: [], order: 0 },
  {
    id: 2,
    label: 'Humor',
    field_type: 'select',
    required: false,
    options: ['Bom', 'Mau'],
    order: 1,
  },
  { id: 3, label: 'Medicação', field_type: 'boolean', required: false, options: [], order: 2 },
];

function makeResponse(overrides = {}) {
  return {
    id: 10,
    form: 5,
    form_title: 'Anamnese',
    form_client_editable: true,
    form_fields: fields,
    answers: [
      { field_id: 1, label: 'Queixa', field_type: 'text', value: 'Ansiedade' },
    ],
    ...overrides,
  };
}

describe('ClientFormsSection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('não renderiza nada quando o cliente não tem fichas', async () => {
    fetchClientFormResponses.mockResolvedValue([]);
    const { container } = render(<ClientFormsSection />);
    await waitFor(() => expect(fetchClientFormResponses).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra ficha editável com campos, inclusive os ainda sem resposta', async () => {
    fetchClientFormResponses.mockResolvedValue([makeResponse()]);
    render(<ClientFormsSection />);

    expect(await screen.findByLabelText(/Queixa/)).toHaveValue('Ansiedade');
    expect(screen.getByLabelText(/Humor/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Medicação/)).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Salvar ficha' })).toBeInTheDocument();
  });

  it('ficha não editável aparece só para leitura, sem inputs nem botão', async () => {
    fetchClientFormResponses.mockResolvedValue([
      makeResponse({ form_client_editable: false }),
    ]);
    render(<ClientFormsSection />);

    expect(await screen.findByText('Ansiedade')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salvar ficha' })).not.toBeInTheDocument();
    expect(
      screen.getByText('Esta ficha só pode ser alterada pelo estabelecimento.')
    ).toBeInTheDocument();
  });

  it('salva via PUT com todas as respostas', async () => {
    fetchClientFormResponses.mockResolvedValue([makeResponse()]);
    updateClientFormResponse.mockResolvedValue(
      makeResponse({
        answers: [
          { field_id: 1, label: 'Queixa', field_type: 'text', value: 'Insónia' },
        ],
      })
    );
    render(<ClientFormsSection />);

    fireEvent.change(await screen.findByLabelText(/Queixa/), {
      target: { value: 'Insónia' },
    });
    fireEvent.change(screen.getByLabelText(/Humor/), { target: { value: 'Bom' } });
    fireEvent.click(screen.getByLabelText(/Medicação/));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar ficha' }));

    await waitFor(() =>
      expect(updateClientFormResponse).toHaveBeenCalledWith(10, {
        answers: [
          { field_id: 1, value: 'Insónia' },
          { field_id: 2, value: 'Bom' },
          { field_id: 3, value: 'true' },
        ],
      })
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Ficha salva.');
  });

  it('bloqueia o envio quando falta campo obrigatório', async () => {
    fetchClientFormResponses.mockResolvedValue([makeResponse({ answers: [] })]);
    render(<ClientFormsSection />);

    await screen.findByLabelText(/Queixa/);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar ficha' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Preencha o campo obrigatório: Queixa'
    );
    expect(updateClientFormResponse).not.toHaveBeenCalled();
  });

  it('mostra o erro devolvido pela API ao salvar (ex.: 403)', async () => {
    fetchClientFormResponses.mockResolvedValue([makeResponse()]);
    updateClientFormResponse.mockRejectedValue({
      response: {
        status: 403,
        data: { detail: 'Este formulário não permite edição pelo cliente.' },
      },
    });
    render(<ClientFormsSection />);

    await screen.findByLabelText(/Queixa/);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar ficha' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('mostra erro quando não consegue carregar', async () => {
    fetchClientFormResponses.mockRejectedValue(new Error('boom'));
    render(<ClientFormsSection />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('mostra rótulos e respostas como texto puro (sem HTML)', async () => {
    fetchClientFormResponses.mockResolvedValue([
      makeResponse({
        form_client_editable: false,
        form_fields: [
          { id: 1, label: 'Queixa', field_type: 'text', required: false, options: [], order: 0 },
        ],
        answers: [
          { field_id: 1, label: 'Queixa', field_type: 'text', value: '<b>x</b>' },
        ],
      }),
    ]);
    const { container } = render(<ClientFormsSection />);
    expect(await screen.findByText('<b>x</b>')).toBeInTheDocument();
    expect(container.querySelector('b')).toBeNull();
  });

  it('mostra selos de estado e data da última atualização', async () => {
    fetchClientFormResponses.mockResolvedValue([
      makeResponse({ updated_at: '2026-11-19T10:00:00Z' }),
    ]);
    render(<ClientFormsSection />);

    expect(await screen.findByText('Editável')).toBeInTheDocument();
    expect(screen.getByText(/Atualizada em/)).toBeInTheDocument();
    // Queixa (obrigatória) já respondida -> sem selo de pendência.
    expect(screen.queryByText('Por preencher')).not.toBeInTheDocument();
  });

  it('marca "Por preencher" quando falta obrigatório e identifica só leitura', async () => {
    fetchClientFormResponses.mockResolvedValue([
      makeResponse({ id: 1, answers: [] }),
      makeResponse({ id: 2, form_title: 'Termo', form_client_editable: false }),
    ]);
    render(<ClientFormsSection />);

    expect(await screen.findByText('Por preencher')).toBeInTheDocument();
    expect(screen.getByText('Só leitura')).toBeInTheDocument();
  });

  it('com várias fichas abre só a pendente e permite expandir/recolher', async () => {
    fetchClientFormResponses.mockResolvedValue([
      makeResponse({ id: 1, form_title: 'Pendente', answers: [] }),
      makeResponse({ id: 2, form_title: 'Completa' }),
    ]);
    render(<ClientFormsSection />);

    const pendente = await screen.findByRole('button', { name: /Pendente/ });
    const completa = screen.getByRole('button', { name: /Completa/ });
    expect(pendente).toHaveAttribute('aria-expanded', 'true');
    expect(completa).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(completa);
    expect(completa).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(pendente);
    expect(pendente).toHaveAttribute('aria-expanded', 'false');
  });

  it('campo obrigatório ganha texto para leitores de tela', async () => {
    fetchClientFormResponses.mockResolvedValue([makeResponse()]);
    render(<ClientFormsSection />);
    expect(await screen.findByText(/\(obrigatório\)/)).toBeInTheDocument();
  });
});
