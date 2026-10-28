import React from 'react';
import { act } from 'react-dom/test-utils';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SlotBulkBlockModal from '../SlotBulkBlockModal';
import { bulkBlockSlots } from '../../../api/slots';

jest.mock('../../../api/slots', () => ({
  bulkBlockSlots: jest.fn(),
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

const PROFESSIONALS = [{ id: 1, name: 'Alice' }];

function openModal(onBlocked = jest.fn(), onClose = jest.fn()) {
  const { container } = render(
    <SlotBulkBlockModal
      open={true}
      onClose={onClose}
      onBlocked={onBlocked}
      professionals={PROFESSIONALS}
      slug="default"
    />
  );
  return container;
}

function fillRequiredFields() {
  fireEvent.click(screen.getByRole('button', { name: 'Selecione...' }));
  fireEvent.click(screen.getByRole('button', { name: 'Alice' }));

  // O Dropdown agenda um setTimeout(50ms) para focar a busca ao abrir, mas
  // ao escolher o item ele já desmonta o painel de busca na mesma render
  // (ref vira null). Limpamos esse timer pendente para não deixar o
  // setTimeout disparar depois sobre uma ref nula (bug pré-existente do
  // Dropdown.jsx, fora do escopo desta tarefa — ver to_see.md).
  act(() => {
    jest.clearAllTimers();
  });

  // Modal usa createPortal: os inputs ficam em document.body, não no
  // container retornado por render().
  const [dateFrom, dateTo] = document.querySelectorAll('input[type="date"]');
  fireEvent.change(dateFrom, { target: { value: '2026-08-01' } });
  fireEvent.change(dateTo, { target: { value: '2026-08-07' } });
}

describe('SlotBulkBlockModal', () => {
  beforeEach(() => {
    bulkBlockSlots.mockReset();
    // O Dropdown agenda um setTimeout(50ms) para focar a busca ao abrir;
    // com timers falsos esse timeout nunca dispara durante o teste (evita
    // acessar a ref já nula quando o item selecionado fecha o dropdown).
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('envia o payload correto para a API de bloqueio em massa', async () => {
    bulkBlockSlots.mockResolvedValue({
      blocked: 5,
      created: 3,
      skipped_booked: 0,
    });
    const onBlocked = jest.fn();
    openModal(onBlocked);

    fillRequiredFields();

    fireEvent.click(
      screen.getByRole('button', { name: /Bloquear horários/ })
    );

    await waitFor(() => expect(bulkBlockSlots).toHaveBeenCalledTimes(1));

    expect(bulkBlockSlots).toHaveBeenCalledWith(
      expect.objectContaining({
        professionalId: '1',
        dateFrom: '2026-08-01',
        dateTo: '2026-08-07',
        startTime: '09:00',
        endTime: '18:00',
        intervalMinutes: 60,
        slug: 'default',
      })
    );

    await waitFor(() => expect(onBlocked).toHaveBeenCalledTimes(1));
  });

  it('mostra o resultado (blocked/created/skipped_booked) ao final', async () => {
    bulkBlockSlots.mockResolvedValue({
      blocked: 4,
      created: 2,
      skipped_booked: 1,
    });
    openModal();

    fillRequiredFields();

    fireEvent.click(
      screen.getByRole('button', { name: /Bloquear horários/ })
    );

    await waitFor(() =>
      expect(screen.getByText(/Bloqueio concluído/)).toBeInTheDocument()
    );

    expect(screen.getByText(/bloqueados: 4/)).toBeInTheDocument();
    expect(screen.getByText(/criados: 2/)).toBeInTheDocument();
    expect(screen.getByText(/reservados: 1/)).toBeInTheDocument();
  });

  it('range cruzando slot booked não quebra a UI e mostra o aviso de skipped_booked', async () => {
    bulkBlockSlots.mockResolvedValue({
      blocked: 2,
      created: 1,
      skipped_booked: 3,
    });
    openModal();

    fillRequiredFields();

    fireEvent.click(
      screen.getByRole('button', { name: /Bloquear horários/ })
    );

    await waitFor(() =>
      expect(screen.getByText(/reservados: 3/)).toBeInTheDocument()
    );
    // Modal continua montado e sem erro — resultado exibido normalmente.
    expect(
      screen.queryByText(/Falha ao bloquear/)
    ).not.toBeInTheDocument();
  });
});
