import { renderHook, act } from '@testing-library/react';
import useCreditBalance from '../useCreditBalance';

jest.useFakeTimers();

// Mock do cliente API
jest.mock('../../api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

// Mock do useTenant para fornecer slug
jest.mock('../useTenant', () => ({
  useTenant: () => ({ slug: 'aurora' }),
}));

import client from '../../api/client';

describe('useCreditBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('faz fetch inicial e popula balance com header do tenant', async () => {
    client.get.mockResolvedValueOnce({ data: { current_balance: 42 } });

    const { result } = renderHook(() => useCreditBalance());

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.balance).toEqual({ current_balance: 42 });
    expect(client.get).toHaveBeenCalledWith('users/credits/balance/', {
      headers: expect.objectContaining({ 'X-Tenant-Slug': 'aurora' }),
    });
  });

  it('refresh atualiza o saldo quando chamado', async () => {
    client.get
      .mockResolvedValueOnce({ data: { current_balance: 10 } })
      .mockResolvedValueOnce({ data: { current_balance: 15 } });

    const { result } = renderHook(() => useCreditBalance());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.balance).toEqual({ current_balance: 10 });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.balance).toEqual({ current_balance: 15 });
    expect(client.get).toHaveBeenCalledTimes(2);
  });

  it('registra erro quando a API falha', async () => {
    client.get.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useCreditBalance());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.loading).toBe(false);
  });

  it('não faz fetch quando enabled=false', async () => {
    const { result } = renderHook(() => useCreditBalance({ enabled: false }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(client.get).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.balance).toBeNull();
  });

  it('executa polling quando pollIntervalMs > 0', async () => {
    client.get
      .mockResolvedValueOnce({ data: { current_balance: 1 } })
      .mockResolvedValueOnce({ data: { current_balance: 2 } })
      .mockResolvedValueOnce({ data: { current_balance: 3 } });

    const { result } = renderHook(() => useCreditBalance({ pollIntervalMs: 10 }));

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.balance).toEqual({ current_balance: 1 });

    await act(async () => {
      jest.advanceTimersByTime(10);
      await Promise.resolve();
    });
    expect(result.current.balance).toEqual({ current_balance: 2 });

    await act(async () => {
      jest.advanceTimersByTime(10);
      await Promise.resolve();
    });
    expect(result.current.balance).toEqual({ current_balance: 3 });
    expect(client.get).toHaveBeenCalledTimes(3);
  });
});