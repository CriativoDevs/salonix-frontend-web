import {
  normalizePhone,
  buildWhatsAppUrl,
  buildWhatsAppMessage,
} from '../whatsapp';

describe('normalizePhone', () => {
  it('adiciona indicativo 351 a número de 9 dígitos', () => {
    expect(normalizePhone('912345678')).toBe('351912345678');
  });

  it('remove o + e mantém indicativo já presente', () => {
    expect(normalizePhone('+351912345678')).toBe('351912345678');
  });

  it('remove espaços e outros caracteres não numéricos', () => {
    expect(normalizePhone('+351 912 345 678')).toBe('351912345678');
  });

  it('retorna null para telefone vazio ou nulo', () => {
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
  });
});

describe('buildWhatsAppUrl', () => {
  it('gera a URL wa.me com número normalizado e mensagem codificada', () => {
    const url = buildWhatsAppUrl('912345678', 'Olá!');
    expect(url).toBe('https://wa.me/351912345678?text=Ol%C3%A1!');
  });

  it('retorna null quando não há telefone', () => {
    expect(buildWhatsAppUrl(null, 'Olá!')).toBeNull();
    expect(buildWhatsAppUrl('', 'Olá!')).toBeNull();
  });
});

describe('buildWhatsAppMessage', () => {
  const appointment = {
    customerName: 'Maria',
    serviceName: 'Corte de cabelo',
    professionalName: 'Ana',
    salonName: 'Salão Exemplo',
    slotStart: '2026-10-01T15:30:00Z',
  };

  it('gera mensagem de confirmação com dados do agendamento', () => {
    const message = buildWhatsAppMessage(appointment, 'confirmation');
    expect(message).toContain('Maria');
    expect(message).toContain('Corte de cabelo');
    expect(message).toContain('Ana');
    expect(message).toContain('Salão Exemplo');
    expect(message).toContain('confirmada');
  });

  it('gera mensagem de lembrete', () => {
    const message = buildWhatsAppMessage(appointment, 'reminder');
    expect(message).toContain('Lembrete');
  });

  it('gera mensagem de cancelamento', () => {
    const message = buildWhatsAppMessage(appointment, 'cancellation');
    expect(message).toContain('cancelada');
  });

  it('retorna null para tipo de evento desconhecido ou sem agendamento', () => {
    expect(buildWhatsAppMessage(appointment, 'unknown')).toBeNull();
    expect(buildWhatsAppMessage(null, 'confirmation')).toBeNull();
  });
});
