// Buffer temporário por tenant (frontend) — pode ser movido para backend depois
export const DEFAULT_TENANT_BUFFER_MINUTES = 10;

// Granularidades de slot suportadas
export const SLOT_STEPS_MINUTES = [5, 15, 30];

// Visões da agenda inicialmente suportadas
export const AGENDA_VIEWS = {
  day: 'day',
  week: 'week',
};