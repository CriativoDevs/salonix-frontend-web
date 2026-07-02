/* eslint-env jest */

import client from '../client';
import {
  fetchStaffMembers,
  inviteStaffMember,
  updateStaffMember,
  updateStaffContact,
  disableStaffMember,
  acceptStaffInvite,
  importStaffCSV,
  fetchStaffImportTemplate,
  exportStaffCSV,
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
    client.delete.mockResolvedValueOnce({
      status: 204,
      headers: { 'x-request-id': 'del-001' },
    });

    const { success, requestId } = await disableStaffMember(10, {
      slug: 'aurora',
    });

    expect(client.delete).toHaveBeenCalledWith('users/staff/', {
      headers: { 'X-Tenant-Slug': 'aurora' },
      params: { tenant: 'aurora' },
      data: { id: 10 },
    });
    expect(success).toBe(true);
    expect(requestId).toBe('del-001');
  });

  it('updateStaffContact envia payload json quando não há arquivo', async () => {
    client.patch.mockResolvedValueOnce({
      data: { id: 7, birthday: '1992-07-18' },
      headers: { 'x-request-id': 'contact-001' },
    });

    const result = await updateStaffContact(
      7,
      { birthday: '1992-07-18' },
      { slug: 'aurora' }
    );

    expect(client.patch).toHaveBeenCalledWith(
      'users/staff/contact/',
      { id: 7, birthday: '1992-07-18' },
      {
        headers: { 'X-Tenant-Slug': 'aurora' },
        params: { tenant: 'aurora' },
      }
    );
    expect(result.requestId).toBe('contact-001');
  });

  it('updateStaffContact envia multipart quando há arquivo', async () => {
    client.patch.mockResolvedValueOnce({
      data: { id: 7 },
      headers: { 'x-request-id': 'contact-002' },
    });

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    await updateStaffContact(7, { photo: file }, { slug: 'aurora' });

    expect(client.patch).toHaveBeenCalledWith(
      'users/staff/contact/',
      expect.any(FormData),
      {
        headers: {
          'X-Tenant-Slug': 'aurora',
          'Content-Type': 'multipart/form-data',
        },
        params: { tenant: 'aurora' },
      }
    );
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

describe('staff import/export', () => {
  it('importStaffCSV posts the file as multipart with dry_run query param', async () => {
    const file = new File(['a,b\n1,2'], 'staff.csv', { type: 'text/csv' });
    client.post.mockResolvedValueOnce({
      data: { summary: { processed: 1, created: 1, updated: 0, skipped: 0, errors: [] } },
    });

    const resp = await importStaffCSV(file, { dryRun: true, slug: 'salon-x' });

    expect(client.post).toHaveBeenCalledTimes(1);
    const [url, body, config] = client.post.mock.calls[0];
    expect(url).toBe('import/staff/');
    expect(body.get('file')).toBe(file);
    expect(config).toEqual({
      headers: { 'X-Tenant-Slug': 'salon-x', 'Content-Type': 'multipart/form-data' },
      params: { dry_run: 'true', tenant: 'salon-x' },
    });
    expect(resp.summary.created).toBe(1);
  });

  it('fetchStaffImportTemplate downloads the CSV template as a blob', async () => {
    const blob = new Blob(['name,email,role']);
    client.get.mockResolvedValueOnce({ data: blob });

    const result = await fetchStaffImportTemplate({ slug: 'salon-x' });

    expect(client.get).toHaveBeenCalledWith('import/templates/staff.csv', {
      headers: { 'X-Tenant-Slug': 'salon-x' },
      params: { tenant: 'salon-x' },
      responseType: 'blob',
    });
    expect(result).toBe(blob);
  });

  it('exportStaffCSV downloads the staff export as a blob', async () => {
    const blob = new Blob(['id,name']);
    client.get.mockResolvedValueOnce({ data: blob });

    const result = await exportStaffCSV({ slug: 'salon-x' });

    expect(client.get).toHaveBeenCalledWith('export/staff.csv', {
      headers: { 'X-Tenant-Slug': 'salon-x' },
      params: { tenant: 'salon-x' },
      responseType: 'blob',
    });
    expect(result).toBe(blob);
  });
});
