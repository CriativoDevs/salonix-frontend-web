import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Forms from '../Forms';
import { useTenant } from '../../hooks/useTenant';
import { fetchForms, createForm, updateForm, deleteForm } from '../../api/forms';

const tMock = (key, defaultValueOrOptions, maybeOptions) => {
  let template = key;
  let values = {};
  if (typeof defaultValueOrOptions === 'string') template = defaultValueOrOptions;
  if (maybeOptions && typeof maybeOptions === 'object') values = maybeOptions;
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => values[k] ?? '');
};

jest.mock('../../hooks/useTenant', () => ({ useTenant: jest.fn() }));
jest.mock('../../api/forms', () => ({
  fetchForms: jest.fn(),
  createForm: jest.fn(),
  updateForm: jest.fn(),
  deleteForm: jest.fn(),
}));
jest.mock('../../layouts/FullPageLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tMock }),
}));

const forms = [
  { id: 1, title: 'Anamnese', is_active: true, client_editable: true, fields: [{ id: 1, label: 'A', field_type: 'text' }, { id: 2, label: 'B', field_type: 'text' }] },
  { id: 2, title: 'Termo', is_active: false, client_editable: false, fields: [] },
];

describe('Forms page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    useTenant.mockReturnValue({ slug: 'default' });
    fetchForms.mockResolvedValue(forms);
  });

  it('lista as fichas com status e quantidade de campos', async () => {
    render(<Forms />);
    expect(await screen.findByText('Anamnese')).toBeInTheDocument();
    expect(screen.getByText('Termo')).toBeInTheDocument();
    expect(screen.getByText('Ativa')).toBeInTheDocument();
    expect(screen.getByText('Inativa')).toBeInTheDocument();
    expect(screen.getByText(/2 campos/)).toBeInTheDocument();
  });

  it('mostra estado vazio', async () => {
    fetchForms.mockResolvedValue([]);
    render(<Forms />);
    expect(await screen.findByText('Nenhuma ficha criada')).toBeInTheDocument();
  });

  it('cria uma ficha nova', async () => {
    createForm.mockResolvedValue({ id: 3, title: 'Nova', is_active: true, client_editable: false, fields: [] });
    render(<Forms />);
    await screen.findByText('Anamnese');
    fireEvent.click(screen.getAllByText('Criar ficha')[0]);
    fireEvent.change(screen.getByLabelText('Título da ficha'), { target: { value: 'Nova' } });
    fireEvent.click(screen.getByText('Salvar'));
    await waitFor(() => expect(createForm).toHaveBeenCalled());
    expect(createForm.mock.calls[0][0]).toMatchObject({ title: 'Nova', fields: [] });
    expect(await screen.findByText('Nova')).toBeInTheDocument();
  });

  it('edita uma ficha existente', async () => {
    updateForm.mockResolvedValue({ ...forms[0], title: 'Anamnese 2' });
    render(<Forms />);
    await screen.findByText('Anamnese');
    fireEvent.click(screen.getAllByText('Editar')[0]);
    fireEvent.change(screen.getByLabelText('Título da ficha'), { target: { value: 'Anamnese 2' } });
    fireEvent.click(screen.getByText('Salvar'));
    await waitFor(() => expect(updateForm).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Anamnese 2' }), { slug: 'default' }));
    expect(await screen.findByText('Anamnese 2')).toBeInTheDocument();
  });

  it('remove após confirmar e avisa que apaga respostas', async () => {
    deleteForm.mockResolvedValue(true);
    render(<Forms />);
    await screen.findByText('Anamnese');
    fireEvent.click(screen.getAllByText('Excluir')[0]);
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('respostas'));
    await waitFor(() => expect(deleteForm).toHaveBeenCalledWith(1, { slug: 'default' }));
    await waitFor(() => expect(screen.queryByText('Anamnese')).not.toBeInTheDocument());
  });

  it('não remove se o usuário cancelar', async () => {
    window.confirm = jest.fn(() => false);
    render(<Forms />);
    await screen.findByText('Anamnese');
    fireEvent.click(screen.getAllByText('Excluir')[0]);
    expect(deleteForm).not.toHaveBeenCalled();
  });

  it('mostra erro ao falhar o carregamento', async () => {
    fetchForms.mockRejectedValue(new Error('boom'));
    render(<Forms />);
    expect(await screen.findByText('boom')).toBeInTheDocument();
  });
});
