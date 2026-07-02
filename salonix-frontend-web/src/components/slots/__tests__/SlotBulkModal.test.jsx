import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SlotBulkModal from '../SlotBulkModal';

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

// Preset real observado em produção: negócio configurado só com Seg/Ter/Qua,
// que NÃO inclui quinta-feira (o dia de "hoje" nos testes abaixo).
const MON_TUE_WED_PRESET = {
  weekdays: [1, 2, 3],
  startTime: '09:00',
  endTime: '18:00',
};

describe('SlotBulkModal - sincronização de dia da semana no período "Hoje"', () => {
  beforeEach(() => {
    // 2026-07-02 é uma quinta-feira
    jest.useFakeTimers().setSystemTime(new Date('2026-07-02T10:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('marca automaticamente o dia da semana de hoje ao clicar em "Hoje", mesmo se o preset do negócio não incluir hoje', () => {
    render(
      <SlotBulkModal
        open={true}
        onClose={jest.fn()}
        onCreated={jest.fn()}
        professionals={PROFESSIONALS}
        slug="default"
        businessHoursPreset={MON_TUE_WED_PRESET}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }));

    const quiButton = screen.getByRole('button', { name: 'Thu' });
    expect(quiButton.className).toMatch(/border-brand-primary\/30/);
  });

  it('mostra a prévia de horários assim que "Hoje" é selecionado, sem passos extra', () => {
    render(
      <SlotBulkModal
        open={true}
        onClose={jest.fn()}
        onCreated={jest.fn()}
        professionals={PROFESSIONALS}
        slug="default"
        businessHoursPreset={MON_TUE_WED_PRESET}
      />
    );

    // Selecionar profissional primeiro (necessário para a prévia)
    fireEvent.click(screen.getByRole('button', { name: 'Selecione...' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alice' }));

    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }));

    expect(
      screen.getByText(/horários serão criados/i)
    ).toBeInTheDocument();
  });
});
