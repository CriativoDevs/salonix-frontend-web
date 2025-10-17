import { renderHook, act } from '@testing-library/react';
import { useStaff } from '../useStaff';
import {
  fetchStaffMembers,
  inviteStaffMember,
  updateStaffMember,
  disableStaffMember,
} from '../../api/staff';

jest.mock('../../api/staff', () => ({
  fetchStaffMembers: jest.fn(),
  inviteStaffMember: jest.fn(),
  updateStaffMember: jest.fn(),
  disableStaffMember: jest.fn(),
}));

describe('useStaff hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carrega membros de equipe com sucesso', async () => {
    fetchStaffMembers.mockResolvedValueOnce({
      staff: [{ id: 1, role: 'manager' }],
      requestId: 'req-1',
    });

    const { result } = renderHook(() => useStaff({ slug: 'aurora' }));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchStaffMembers).toHaveBeenCalledWith({ slug: 'aurora' });
    expect(result.current.loading).toBe(false);
    expect(result.current.staff).toEqual([{ id: 1, role: 'manager' }]);
    expect(result.current.requestId).toBe('req-1');
    expect(result.current.error).toBeNull();
    expect(result.current.forbidden).toBe(false);
  });

  it('marca forbidden e registra erro quando backend responde 403', async () => {
    fetchStaffMembers.mockRejectedValueOnce({
      response: { status: 403, headers: { 'x-request-id': 'deny' }, data: { detail: 'nope' } },
    });

    const { result } = renderHook(() => useStaff({ slug: 'aurora' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.forbidden).toBe(true);
    expect(result.current.error).not.toBeNull();
    expect(result.current.error.message).toBe('nope');
    expect(result.current.requestId).toBe('deny');
  });

  it('inviteStaff adiciona novo membro quando sucesso', async () => {
    fetchStaffMembers.mockResolvedValueOnce({ staff: [], requestId: null });
    inviteStaffMember.mockResolvedValueOnce({
      staffMember: { id: 2, role: 'collaborator', status: 'invited' },
      requestId: 'invite-1',
    });

    const { result } = renderHook(() => useStaff({ slug: 'aurora' }));
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      const response = await result.current.inviteStaff({
        email: 'user@example.com',
        role: 'collaborator',
      });
      expect(response.success).toBe(true);
      expect(response.requestId).toBe('invite-1');
    });

    expect(result.current.staff).toEqual([
      { id: 2, role: 'collaborator', status: 'invited' },
    ]);
  });

  it('updateStaff substitui membro existente', async () => {
    fetchStaffMembers.mockResolvedValueOnce({
      staff: [{ id: 3, role: 'collaborator', status: 'active', first_name: 'Ana' }],
      requestId: null,
    });
    updateStaffMember.mockResolvedValueOnce({
      staffMember: { id: 3, role: 'manager', status: 'active', first_name: 'Ana' },
      requestId: 'upd-1',
    });

    const { result } = renderHook(() => useStaff({ slug: 'aurora' }));
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      const response = await result.current.updateStaff(3, { role: 'manager' });
      expect(response.success).toBe(true);
      expect(response.requestId).toBe('upd-1');
    });

    expect(result.current.staff).toEqual([
      { id: 3, role: 'manager', status: 'active', first_name: 'Ana' },
    ]);
  });

  it('disableStaff remove membro da lista', async () => {
    fetchStaffMembers.mockResolvedValueOnce({
      staff: [{ id: 4, role: 'collaborator' }],
      requestId: null,
    });
    disableStaffMember.mockResolvedValueOnce({ success: true, requestId: 'del-1' });

    const { result } = renderHook(() => useStaff({ slug: 'aurora' }));
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      const response = await result.current.disableStaff(4);
      expect(response.success).toBe(true);
      expect(response.requestId).toBe('del-1');
    });

    expect(result.current.staff).toEqual([]);
  });

  it('inviteStaff retorna erro quando API falha', async () => {
    fetchStaffMembers.mockResolvedValueOnce({ staff: [], requestId: null });
    inviteStaffMember.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useStaff({ slug: 'aurora' }));
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      const response = await result.current.inviteStaff({
        email: 'user@example.com',
        role: 'collaborator',
      });
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error.message).toBe('boom');
    });
  });
});
