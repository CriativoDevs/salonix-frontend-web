import { mergePlanAvailability } from '../planAvailability';

describe('mergePlanAvailability', () => {
  const planOptions = [
    { code: 'basic', name: 'TimelyOne', price: '€29', highlights: ['a', 'b'] },
    { code: 'founder', name: 'Founder', price: '€15', highlights: ['c'] },
  ];

  it('merges backend availability fields into the matching plan option', () => {
    const availablePlans = [
      { plan_code: 'basic', is_available: false, is_current: false, can_upgrade: true },
      { plan_code: 'founder', is_available: true, is_current: false, can_upgrade: false },
    ];

    const result = mergePlanAvailability(planOptions, availablePlans);

    expect(result).toEqual([
      {
        code: 'basic',
        name: 'TimelyOne',
        price: '€29',
        highlights: ['a', 'b'],
        plan_code: 'basic',
        is_available: false,
        is_current: false,
        can_upgrade: true,
      },
      {
        code: 'founder',
        name: 'Founder',
        price: '€15',
        highlights: ['c'],
        plan_code: 'founder',
        is_available: true,
        is_current: false,
        can_upgrade: false,
      },
    ]);
  });

  it('omits plan options that the backend does not return', () => {
    const availablePlans = [
      { plan_code: 'basic', is_available: true, is_current: true, can_upgrade: false },
    ];

    const result = mergePlanAvailability(planOptions, availablePlans);

    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('basic');
  });

  it('returns an empty array when availablePlans is null or undefined', () => {
    expect(mergePlanAvailability(planOptions, null)).toEqual([]);
    expect(mergePlanAvailability(planOptions, undefined)).toEqual([]);
  });

  it('returns an empty array when availablePlans is an empty array', () => {
    expect(mergePlanAvailability(planOptions, [])).toEqual([]);
  });
});
