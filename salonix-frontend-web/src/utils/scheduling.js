import { DEFAULT_TENANT_BUFFER_MINUTES } from '../constants/scheduling';

export function roundUpToStep(date, stepMinutes = 5) {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime();
  const stepMs = stepMinutes * 60 * 1000;
  const rounded = Math.ceil(ms / stepMs) * stepMs;
  return new Date(rounded);
}

// Fallback simples: dado um alvo e slots ocupados, sugere próximo horário a partir do alvo
export function suggestNextSlotFallback({
  target,
  serviceDurationMinutes,
  occupiedRanges = [],
  stepMinutes = 5,
}) {
  const start = roundUpToStep(target, stepMinutes);
  if (!start) return null;
  const durationWithBuffer = Number(serviceDurationMinutes || 0) + DEFAULT_TENANT_BUFFER_MINUTES;
  const end = new Date(start.getTime() + durationWithBuffer * 60 * 1000);

  const overlaps = occupiedRanges.some(([s, e]) => {
    const sDate = s instanceof Date ? s : new Date(s);
    const eDate = e instanceof Date ? e : new Date(e);
    if (Number.isNaN(sDate.getTime()) || Number.isNaN(eDate.getTime())) return false;
    return (start < eDate && end > sDate);
  });

  if (!overlaps) {
    return { start, end };
  }

  // Se o alvo inicial colidiu, avançar para fim do primeiro overlap e tentar de novo
  const sorted = occupiedRanges
    .map(([s, e]) => [new Date(s), new Date(e)])
    .filter(([s, e]) => !Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()))
    .sort((a, b) => a[0] - b[0]);

  for (const [s, e] of sorted) {
    if (start < e && end > s) {
      const nextStart = roundUpToStep(new Date(e.getTime()), stepMinutes);
      const nextEnd = new Date(nextStart.getTime() + durationWithBuffer * 60 * 1000);
      return { start: nextStart, end: nextEnd };
    }
  }

  return null;
}