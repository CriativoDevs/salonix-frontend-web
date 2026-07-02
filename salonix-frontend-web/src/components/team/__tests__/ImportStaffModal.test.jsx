import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ImportStaffModal from '../ImportStaffModal';

jest.mock('../../ui/Modal', () => ({
  __esModule: true,
  default: ({ open, children, footer }) =>
    open ? (
      <div>
        {children}
        {footer}
      </div>
    ) : null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValueOrOptions, maybeOptions) => {
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
    },
  }),
}));

function selectFile(input) {
  const file = new File(['a,b\n1,2'], 'staff.csv', { type: 'text/csv' });
  fireEvent.change(input, { target: { files: [file] } });
  return file;
}

describe('ImportStaffModal', () => {
  it('calls onDownloadTemplate when the template link is clicked', () => {
    const onDownloadTemplate = jest.fn();
    render(
      <ImportStaffModal
        open
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        onDownloadTemplate={onDownloadTemplate}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Baixar modelo CSV' }));

    expect(onDownloadTemplate).toHaveBeenCalledTimes(1);
  });

  it('previews with dry_run before allowing confirmation', async () => {
    const onSubmit = jest.fn().mockResolvedValue({
      success: true,
      summary: { processed: 2, created: 1, updated: 1, skipped: 0, errors: [] },
    });

    render(
      <ImportStaffModal
        open
        onClose={jest.fn()}
        onSubmit={onSubmit}
        onDownloadTemplate={jest.fn()}
      />
    );

    const file = selectFile(screen.getByLabelText('Ficheiro CSV'));
    fireEvent.click(screen.getByRole('button', { name: 'Pré-visualizar' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(file, { dryRun: true });
    });

    expect(await screen.findByText(/Criados: 1/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Confirmar importação' })
    ).toBeInTheDocument();
  });

  it('confirms the import after a successful preview', async () => {
    const onSubmit = jest
      .fn()
      .mockResolvedValueOnce({
        success: true,
        summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] },
      })
      .mockResolvedValueOnce({
        success: true,
        summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] },
      });
    const onImported = jest.fn();

    render(
      <ImportStaffModal
        open
        onClose={jest.fn()}
        onSubmit={onSubmit}
        onDownloadTemplate={jest.fn()}
        onImported={onImported}
      />
    );

    const file = selectFile(screen.getByLabelText('Ficheiro CSV'));
    fireEvent.click(screen.getByRole('button', { name: 'Pré-visualizar' }));
    await screen.findByRole('button', { name: 'Confirmar importação' });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar importação' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenNthCalledWith(2, file, { dryRun: false });
    });
    expect(onImported).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText('Staff importado com sucesso!')
    ).toBeInTheDocument();
  });

  it('shows row errors returned by the dry run and blocks confirmation', async () => {
    const onSubmit = jest.fn().mockResolvedValue({
      success: true,
      summary: {
        processed: 2,
        created: 0,
        updated: 0,
        skipped: 1,
        errors: [{ line: 3, error: 'Email já existe' }],
      },
    });

    render(
      <ImportStaffModal
        open
        onClose={jest.fn()}
        onSubmit={onSubmit}
        onDownloadTemplate={jest.fn()}
      />
    );

    selectFile(screen.getByLabelText('Ficheiro CSV'));
    fireEvent.click(screen.getByRole('button', { name: 'Pré-visualizar' }));

    expect(
      await screen.findByText(/Linha 3: Email já existe/)
    ).toBeInTheDocument();
  });

  it('shows an error message when the preview request fails', async () => {
    const onSubmit = jest.fn().mockResolvedValue({
      success: false,
      error: { message: 'Ficheiro inválido' },
    });

    render(
      <ImportStaffModal
        open
        onClose={jest.fn()}
        onSubmit={onSubmit}
        onDownloadTemplate={jest.fn()}
      />
    );

    selectFile(screen.getByLabelText('Ficheiro CSV'));
    fireEvent.click(screen.getByRole('button', { name: 'Pré-visualizar' }));

    expect(await screen.findByText('Ficheiro inválido')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Confirmar importação' })
    ).not.toBeInTheDocument();
  });
});
