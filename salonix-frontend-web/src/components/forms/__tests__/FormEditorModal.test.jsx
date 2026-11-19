import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import FormEditorModal from '../FormEditorModal';

const tMock = (key, defaultValueOrOptions) =>
  typeof defaultValueOrOptions === 'string' ? defaultValueOrOptions : key;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tMock }),
}));

const existingForm = {
  id: 7,
  title: 'Anamnese',
  is_active: true,
  client_editable: false,
  fields: [
    { id: 11, label: 'Alergias', field_type: 'text', required: true, options: null, order: 0 },
    { id: 12, label: 'Tipo', field_type: 'select', required: false, options: ['A', 'B'], order: 1 },
  ],
};

function setup(props = {}) {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();
  render(
    <FormEditorModal open form={null} onSubmit={onSubmit} onClose={onClose} {...props} />
  );
  return { onSubmit, onClose };
}

const submit = () => fireEvent.click(screen.getByText('Salvar'));

describe('FormEditorModal', () => {
  it('exige título', async () => {
    const { onSubmit } = setup();
    submit();
    expect(await screen.findByText('Informe o título da ficha.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('cria ficha nova com campos, tipo select e opções', async () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByLabelText('Título da ficha'), {
      target: { value: 'Ficha inicial' },
    });
    fireEvent.click(screen.getByText('Adicionar campo'));
    fireEvent.change(screen.getByLabelText('Nome do campo'), {
      target: { value: 'Fuma?' },
    });
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'select' } });
    fireEvent.change(screen.getByLabelText('Opções (uma por linha)'), {
      target: { value: 'Sim\n\n Não ' },
    });
    fireEvent.click(screen.getByLabelText('Obrigatório'));
    submit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Ficha inicial',
      is_active: true,
      client_editable: false,
      fields: [
        { label: 'Fuma?', field_type: 'select', required: true, options: ['Sim', 'Não'], order: 0 },
      ],
    });
  });

  it('recusa campo sem nome e select sem opções', async () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByLabelText('Título da ficha'), { target: { value: 'F' } });
    fireEvent.click(screen.getByText('Adicionar campo'));
    submit();
    expect(
      await screen.findByText('Todos os campos precisam de um nome.')
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nome do campo'), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'select' } });
    submit();
    expect(
      await screen.findByText('Campos de seleção precisam de pelo menos uma opção.')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('edição preserva ids, reordena e remove campos', async () => {
    const { onSubmit } = setup({ form: existingForm });
    expect(screen.getByDisplayValue('Anamnese')).toBeInTheDocument();

    const rows = screen.getAllByTestId('form-field-row');
    fireEvent.click(within(rows[0]).getByLabelText('Descer campo'));
    submit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.fields.map((f) => [f.id, f.order])).toEqual([
      [12, 0],
      [11, 1],
    ]);
    expect(payload.fields[0].options).toEqual(['A', 'B']);
    expect(payload.fields[1].options).toBeNull();

    // remover
    fireEvent.click(
      within(screen.getAllByTestId('form-field-row')[0]).getByLabelText('Remover campo')
    );
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit.mock.calls[1][0].fields.map((f) => f.id)).toEqual([11]);
  });

  it('mostra o erro vindo da API', () => {
    setup({ error: { message: 'Falha do servidor' } });
    expect(screen.getByText('Falha do servidor')).toBeInTheDocument();
  });
});
