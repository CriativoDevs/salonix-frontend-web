import { render, screen } from '@testing-library/react';
import WhatsAppButton from '../WhatsAppButton';

const baseAppointment = {
  customerName: 'Maria',
  customerPhone: '912345678',
  serviceName: 'Corte de cabelo',
  professionalName: 'Ana',
  salonName: 'Salão Exemplo',
  slotStart: '2026-10-01T15:30:00Z',
};

describe('WhatsAppButton', () => {
  it('renderiza um link para wa.me com o número normalizado quando o cliente tem telefone', () => {
    render(
      <WhatsAppButton
        appointment={baseAppointment}
        eventType="confirmation"
        label="Enviar confirmação"
      />
    );

    const link = screen.getByRole('link', { name: /enviar confirmação/i });
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/351912345678')
    );
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('não renderiza nada quando o cliente não tem telefone', () => {
    const { container } = render(
      <WhatsAppButton
        appointment={{ ...baseAppointment, customerPhone: '' }}
        eventType="confirmation"
        label="Enviar confirmação"
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('não renderiza nada quando não há appointment', () => {
    const { container } = render(
      <WhatsAppButton appointment={null} eventType="confirmation" label="Enviar" />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
