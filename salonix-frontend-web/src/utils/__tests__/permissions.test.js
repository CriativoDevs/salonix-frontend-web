import { canViewBilling } from '../permissions';

describe('canViewBilling', () => {
  it('permite owner e manager', () => {
    expect(canViewBilling({ staff_role: 'owner' })).toBe(true);
    expect(canViewBilling({ staff_role: 'manager' })).toBe(true);
  });

  it('nega colaborador, sem role e sem usuário', () => {
    expect(canViewBilling({ staff_role: 'collaborator' })).toBe(false);
    expect(canViewBilling({})).toBe(false);
    expect(canViewBilling(null)).toBe(false);
    expect(canViewBilling(undefined)).toBe(false);
  });
});
