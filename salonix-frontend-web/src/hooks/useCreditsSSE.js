import { useEffect, useRef, useState } from 'react';
import { getAccessToken } from '../utils/authStorage';
import { useTenant } from './useTenant';
import { API_BASE_URL } from '../api/client';

/**
 * Hook SSE para atualizações de créditos em tempo real.
 * Usa `fetch` streaming com reconexão e fallback de polling.
 * Eventos esperados: `credit_update`, `heartbeat`.
 */
export default function useCreditsSSE({
  enabled = true,
  onUpdate,
  onHeartbeat,
  onError,
  pollFallbackMs = 30000,
} = {}) {
  const { slug } = useTenant();
  const [connected, setConnected] = useState(false);
  const connectedRef = useRef(false);
  const controllerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const lastEventIdRef = useRef(null);
  const fallbackPollRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const token = getAccessToken();
    if (!token) {
      // sem token não conecta SSE
      return;
    }

    const url = `${API_BASE_URL}auth/realtime/credits/`;
    const controller = new AbortController();
    controllerRef.current = controller;

    const headers = {
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache',
    };
    if (slug) headers['X-Tenant-Slug'] = slug;
    if (lastEventIdRef.current) headers['Last-Event-ID'] = lastEventIdRef.current;

    let buffer = '';
    let event = { type: null, data: '', id: null };

    const flushEvent = () => {
      if (!event.type) return;
      try {
        if (event.type === 'credit_update') {
          const payload = event.data ? JSON.parse(event.data) : null;
          onUpdate && onUpdate(payload);
        } else if (event.type === 'heartbeat') {
          onHeartbeat && onHeartbeat();
        }
      } catch (e) {
        onError && onError(e);
      } finally {
        event = { type: null, data: '', id: null };
      }
    };

    const parseLine = (line) => {
      if (!line) return;
      if (line.startsWith('id:')) {
        event.id = line.slice(3).trim();
        lastEventIdRef.current = event.id;
      } else if (line.startsWith('event:')) {
        event.type = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        const d = line.slice(5).trim();
        event.data = event.data ? `${event.data}\n${d}` : d;
      }
    };

    const connect = async () => {
      try {
        const resp = await fetch(url, { headers, signal: controller.signal });
        if (!resp.ok) throw new Error(`SSE status ${resp.status}`);
        setConnected(true);
        connectedRef.current = true;

        const reader = resp.body.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += new TextDecoder().decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop();
          for (const chunk of parts) {
            const lines = chunk.split('\n');
            for (const line of lines) parseLine(line);
            flushEvent();
          }
        }
      } catch (err) {
        setConnected(false);
        connectedRef.current = false;
        onError && onError(err);
        // tenta reconectar com backoff simples
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(connect, 3000);
      }
    };

    connect();

    // fallback polling opcional
    if (pollFallbackMs && pollFallbackMs > 0) {
      fallbackPollRef.current = setInterval(() => {
        if (!connectedRef.current) {
          // cliente pode querer buscar saldo aqui (ex.: via onUpdate externo)
          onHeartbeat && onHeartbeat();
        }
      }, pollFallbackMs);
    }

    return () => {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
      if (controllerRef.current) controllerRef.current.abort();
      setConnected(false);
      connectedRef.current = false;
      if (fallbackPollRef.current) {
        clearInterval(fallbackPollRef.current);
        fallbackPollRef.current = null;
      }
    };
  }, [enabled, slug, pollFallbackMs, onUpdate, onHeartbeat, onError]);

  return { connected };
}