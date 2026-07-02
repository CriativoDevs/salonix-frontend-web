import {
  parseTimeToMinutes,
  getBusinessHoursRangeMinutes,
  layoutOverlappingEvents,
  computeBlockRect,
  minutesSinceMidnight,
} from '../calendarGrid';

describe('parseTimeToMinutes', () => {
  it('parses HH:MM:SS into minutes since midnight', () => {
    expect(parseTimeToMinutes('09:30:00')).toBe(570);
  });

  it('parses HH:MM without seconds', () => {
    expect(parseTimeToMinutes('18:00')).toBe(1080);
  });

  it('returns null for invalid input', () => {
    expect(parseTimeToMinutes('not-a-time')).toBeNull();
    expect(parseTimeToMinutes(null)).toBeNull();
    expect(parseTimeToMinutes(undefined)).toBeNull();
  });
});

describe('getBusinessHoursRangeMinutes', () => {
  it('falls back to 09:00-18:00 when no data is provided', () => {
    expect(getBusinessHoursRangeMinutes(null)).toEqual({
      startMinutes: 540,
      endMinutes: 1080,
    });
    expect(getBusinessHoursRangeMinutes([])).toEqual({
      startMinutes: 540,
      endMinutes: 1080,
    });
  });

  it('falls back when every day is inactive', () => {
    const items = [
      { day_of_week: 1, is_active: false, start_time: '08:00:00', end_time: '20:00:00' },
    ];
    expect(getBusinessHoursRangeMinutes(items)).toEqual({
      startMinutes: 540,
      endMinutes: 1080,
    });
  });

  it('uses the earliest start and latest end across active days', () => {
    const items = [
      { day_of_week: 1, is_active: true, start_time: '09:00:00', end_time: '18:00:00' },
      { day_of_week: 2, is_active: true, start_time: '08:00:00', end_time: '19:30:00' },
      { day_of_week: 3, is_active: false, start_time: '06:00:00', end_time: '23:00:00' },
    ];
    expect(getBusinessHoursRangeMinutes(items)).toEqual({
      startMinutes: 480,
      endMinutes: 1170,
    });
  });
});

describe('minutesSinceMidnight', () => {
  it('converts a Date into minutes since midnight', () => {
    const date = new Date('2026-07-06T09:30:00');
    expect(minutesSinceMidnight(date)).toBe(570);
  });
});

describe('layoutOverlappingEvents', () => {
  it('assigns column 0 to a single event', () => {
    const result = layoutOverlappingEvents([
      { id: 'a', startMinutes: 540, endMinutes: 600 },
    ]);
    expect(result).toEqual([
      { id: 'a', startMinutes: 540, endMinutes: 600, column: 0, columnCount: 1 },
    ]);
  });

  it('keeps non-overlapping events in separate single-column clusters', () => {
    const result = layoutOverlappingEvents([
      { id: 'a', startMinutes: 540, endMinutes: 600 },
      { id: 'b', startMinutes: 600, endMinutes: 660 },
    ]);
    expect(result.find((e) => e.id === 'a')).toMatchObject({ column: 0, columnCount: 1 });
    expect(result.find((e) => e.id === 'b')).toMatchObject({ column: 0, columnCount: 1 });
  });

  it('splits overlapping events into side-by-side columns', () => {
    const result = layoutOverlappingEvents([
      { id: 'a', startMinutes: 540, endMinutes: 600 },
      { id: 'b', startMinutes: 555, endMinutes: 615 },
    ]);
    expect(result.find((e) => e.id === 'a')).toMatchObject({ column: 0, columnCount: 2 });
    expect(result.find((e) => e.id === 'b')).toMatchObject({ column: 1, columnCount: 2 });
  });

  it('reuses a freed column once its previous event has ended', () => {
    const result = layoutOverlappingEvents([
      { id: 'a', startMinutes: 540, endMinutes: 570 },
      { id: 'b', startMinutes: 545, endMinutes: 600 },
      { id: 'c', startMinutes: 575, endMinutes: 610 },
    ]);
    expect(result.find((e) => e.id === 'a')).toMatchObject({ column: 0 });
    expect(result.find((e) => e.id === 'b')).toMatchObject({ column: 1 });
    // c starts after a ends (570) so it can reuse column 0
    expect(result.find((e) => e.id === 'c')).toMatchObject({ column: 0, columnCount: 2 });
  });
});

describe('computeBlockRect', () => {
  const range = { rangeStartMinutes: 540, rangeEndMinutes: 1080 }; // 09:00-18:00, 540min span

  it('positions an event fully inside the range', () => {
    const rect = computeBlockRect({
      startMinutes: 570,
      endMinutes: 630,
      ...range,
      column: 0,
      columnCount: 1,
    });
    expect(rect).toEqual({ top: '5.555555555555555%', height: '11.11111111111111%', left: '0%', width: '100%' });
  });

  it('clamps the top to 0% when the event starts before the visible range', () => {
    const rect = computeBlockRect({
      startMinutes: 480,
      endMinutes: 600,
      ...range,
      column: 0,
      columnCount: 1,
    });
    expect(rect.top).toBe('0%');
  });

  it('splits width evenly across columns', () => {
    const rect = computeBlockRect({
      startMinutes: 570,
      endMinutes: 630,
      ...range,
      column: 1,
      columnCount: 2,
    });
    expect(rect.left).toBe('50%');
    expect(rect.width).toBe('50%');
  });
});
