/* eslint-env jest */

import client from '../client';
import {
  fetchStaffMembers,
  inviteStaffMember,
  updateStaffMember,
  disableStaffMember,
  acceptStaffInvite,
} from '../staff';

jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('staff api', () => {
  it('fetchStaffMembers envia headers de tenant e extrai requestId', async () => {
    client.get.mockResolvedValueOnce({
      data: [{ id: 1, role: 'manager' }],
      headers: { 'x-request-id': 'abc-123' },
    });

    const { staff, requestId } = await fetchStaffMembers({ slug: 'salonix' });

    expect(client.get).toHaveBeenCalledWith('users/staff/', {
      headers: { 'X-Tenant-Slug': 'salonix' },
      params: { tenant: 'salonix' },
    });
    expect(staff).toHaveLength(1);
    expect(requestId).toBe('abc-123');
  });

  it('inviteStaffMember posta dados e retorna staffMember com requestId', async () => {
    client.post.mockResolvedValueOnce({
      data: { id: 2, status: 'invited' },
      headers: { 'x-request-id': 'req-456' },
    });

    const payload = {
      email: 'user@example.com',
      role: 'collaborator',
      first_name: 'Ana',
    };
    const result = await inviteStaffMember(payload, { slug: 'salonix' });

    expect(client.post).toHaveBeenCalledWith('users/staff/', payload, {
      headers: { 'X-Tenant-Slug': 'salonix' },
      params: { tenant: 'salonix' },
    });
    expect(result.staffMember).toEqual({ id: 2, status: 'invited' });
    expect(result.requestId).toBe('req-456');
  });

  it('updateStaffMember envia PATCH com id no payload', async () => {
    client.patch.mockResolvedValueOnce({
      data: { id: 5, role: 'manager' },
      headers: { 'x-request-id': 'req-789' },
    });

    const { staffMember, requestId } = await updateStaffMember(
      5,
      { role: 'manager' },
      { slug: 'aurora' }
    );

    expect(client.patch).toHaveBeenCalledWith(
      'users/staff/',
      { id: 5, role: 'manager' },
      {
        headers: { 'X-Tenant-Slug': 'aurora' },
        params: { tenant: 'aurora' },
      }
    );
    expect(staffMember).toEqual({ id: 5, role: 'manager' });
    expect(requestId).toBe('req-789');
  });

  it('disableStaffMember envia DELETE com payload e interpreta 204', async () => {
    client.delete.mockResolvedValueOnce({ status: 204, headers: { 'x-request-id': 'del-001' } });

    const { success, requestId } = await disableStaffMember(10, { slug: 'aurora' });

    expect(client.delete).toHaveBeenCalledWith('users/staff/', {
      headers: { 'X-Tenant-Slug': 'aurora' },
      params: { tenant: 'aurora' },
      data: { id: 10 },
    });
    expect(success).toBe(true);
    expect(requestId).toBe('del-001');
  });

  it('acceptStaffInvite posta token e retorna staffMember', async () => {
    client.post.mockResolvedValueOnce({
      data: { id: 9, status: 'active' },
      headers: { 'x-request-id': 'accept-123' },
    });

    const { staffMember, requestId } = await acceptStaffInvite({
      token: 'tok',
      password: 'pass1234',
    });

    expect(client.post).toHaveBeenCalledWith('users/staff/accept/', {
      token: 'tok',
      password: 'pass1234',
    });
    expect(staffMember).toEqual({ id: 9, status: 'active' });
    expect(requestId).toBe('accept-123');
  });
});
