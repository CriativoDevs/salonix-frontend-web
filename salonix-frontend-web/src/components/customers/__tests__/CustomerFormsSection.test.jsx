import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CustomerFormsSection from '../CustomerFormsSection';
import {
  fetchForms,
  fetchCustomerFormResponses,
  createFormResponse,
  updateFormResponse,
} from '../../../api/forms';

const tMock = (key, d, o) => {
  let tpl = typeof d === 'string' ? d : key;
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (o && o[k]) ?? '');
};
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: tMock }) }));
jest.mock('../../../api/forms', () => ({
  fetchForms: jest.fn(),
  fetchCustomerFormResponses: jest.fn(),
  createFormResponse: jest.fn(),
  updateFormResponse: jest.fn(),
}));

const form = {
  id: 5,
  title: 'Anamnese',
  is_active: true,
  fields: [
    { id: 1, label: 'Alergias', field_type: 'text', required: true },
    { id: 2, label: 'Fuma', field_type: 'boolean', required: false },
    { id: 3, label: 'Tipo', field_type: 'select', required: false, options: ['A', 'B'] },
    { id: 4, label: 'Idade', field_type: 'number', required: false },
  ],
};
const inactive = { id: 6, title: 'Oculta', is_active: false, fields: [] };

const open = async () => {
  render(<CustomerFormsSection customerId={9} slug="s" />);
  fireEvent.click(screen.getByText('Fichas do cliente'));
};

describe('CustomerFormsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchForms.mockResolvedValue([form, inactive]);
    fetchCustomerFormResponses.mockResolvedValue([]);
  });

  it('não carrega nada até expandir (dados sensíveis só sob demanda)', () => {
    render(<CustomerFormsSection customerId={9} slug="s" />);
    expect(fetchForms).not.toHaveBeenCalled();
    expect(fetchCustomerFormResponses).not.toHaveBeenCalled();
  });

  it('carrega só fichas ativas ao expandir', async () => {
    await open();
    expect(await screen.findByText('Anamnese')).toBeInTheDocument();
    expect(screen.queryByText('Oculta')).not.toBeInTheDocument();
    expect(fetchCustomerFormResponses).toHaveBeenCalledWith(9, { slug: 's' });
  });

  it('bloqueia salvar sem campo obrigatório', async () => {
    await open();
    await screen.findByText('Anamnese');
    fireEvent.click(screen.getByText('Salvar ficha'));
    expect(
      await screen.findByText('Preencha o campo obrigatório: Alergias')
    ).toBeInTheDocument();
    expect(createFormResponse).not.toHaveBeenCalled();
  });

  it('cria a resposta com booleano como "false" por padrão', async () => {
    createFormResponse.mockResolvedValue({ id: 70, form: 5, answers: [] });
    await open();
    await screen.findByText('Anamnese');
    fireEvent.change(screen.getByLabelText(/Alergias/), { target: { value: 'Pólen' } });
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'B' } });
    fireEvent.click(screen.getByLabelText('Fuma'));
    fireEvent.click(screen.getByText('Salvar ficha'));
    await waitFor(() => expect(createFormResponse).toHaveBeenCalled());
    expect(createFormResponse.mock.calls[0][0]).toEqual({
      form: 5,
      customer: 9,
      answers: [
        { field_id: 1, value: 'Pólen' },
        { field_id: 2, value: 'true' },
        { field_id: 3, value: 'B' },
        { field_id: 4, value: '' },
      ],
    });
    expect(await screen.findByText('Ficha salva.')).toBeInTheDocument();
  });

  it('pré-preenche respostas existentes e atualiza via PATCH', async () => {
    fetchCustomerFormResponses.mockResolvedValue([
      {
        id: 70,
        form: 5,
        answers: [
          { field_id: 1, value: 'Nenhuma' },
          { field_id: 2, value: 'true' },
        ],
      },
    ]);
    updateFormResponse.mockResolvedValue({ id: 70, form: 5, answers: [] });
    await open();
    expect(await screen.findByDisplayValue('Nenhuma')).toBeInTheDocument();
    expect(screen.getByLabelText('Fuma')).toBeChecked();
    fireEvent.change(screen.getByLabelText(/Alergias/), { target: { value: 'Látex' } });
    fireEvent.click(screen.getByText('Salvar ficha'));
    await waitFor(() => expect(updateFormResponse).toHaveBeenCalled());
    expect(updateFormResponse.mock.calls[0][0]).toBe(70);
    expect(updateFormResponse.mock.calls[0][1].answers[0]).toEqual({
      field_id: 1,
      value: 'Látex',
    });
    expect(createFormResponse).not.toHaveBeenCalled();
  });

  it('mostra erro de carregamento e de salvamento', async () => {
    fetchForms.mockRejectedValueOnce(new Error('falhou'));
    await open();
    expect(await screen.findByText('falhou')).toBeInTheDocument();
  });

  it('não renderiza HTML vindo do rótulo (texto puro)', async () => {
    fetchForms.mockResolvedValue([
      { id: 8, title: '<b>x</b>', is_active: true, fields: [] },
    ]);
    await open();
    expect(await screen.findByText('<b>x</b>')).toBeInTheDocument();
  });
});
