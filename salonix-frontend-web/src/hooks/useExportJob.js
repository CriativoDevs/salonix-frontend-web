import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchExportJobStatus } from '../api/reports';

/**
 * Estados possíveis de um job de exportação.
 *
 * Máquina de estados:
 *   idle → pending → ready    → idle (após download)
 *                  → error    → idle (após reset)
 *                  → expired  → idle (após reset)
 *
 * Forward-compatible: quando o backend implementar exportação assíncrona real,
 * basta substituir os internals de startExport para:
 *   POST /api/reports/exports/ → { job_id }
 * O polling já está implementado e será ativado automaticamente.
 */
export const EXPORT_STATUS = {
  IDLE: 'idle',
  PENDING: 'pending',
  READY: 'ready',
  ERROR: 'error',
  EXPIRED: 'expired',
};

const POLL_INTERVAL_MS = 3000; // intervalo entre chamadas de status
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // timeout máximo: 5 minutos

/**
 * Hook para gerenciar o ciclo de vida de um export.
 *
 * @param {Function} exportFn  - Função assíncrona de export: (params) => Promise<{ data: Blob|{ job_id } }>
 * @param {string}   filename  - Nome do arquivo; use '{date}' como placeholder para data atual.
 * @param {string}   [slug]    - Slug do tenant (necessário para polling autenticado).
 *
 * @returns {{
 *   status: string,
 *   error: string|null,
 *   jobId: string|null,
 *   startExport: (params: object) => Promise<void>,
 *   download: () => void,
 *   reset: () => void,
 * }}
 */
export function useExportJob(exportFn, filename, slug) {
  const [status, setStatus] = useState(EXPORT_STATUS.IDLE);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);
  const blobRef = useRef(null);
  const pollTimerRef = useRef(null);
  const pollTimeoutRef = useRef(null);

  // Limpa timers de polling pendentes
  const clearPolling = useCallback(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    pollTimerRef.current = null;
    pollTimeoutRef.current = null;
  }, []);

  // Cleanup ao desmontar
  useEffect(() => () => clearPolling(), [clearPolling]);

  // Polling: ativa quando jobId está presente e status é PENDING
  useEffect(() => {
    if (!jobId || status !== EXPORT_STATUS.PENDING) return;

    const poll = async () => {
      try {
        const result = await fetchExportJobStatus(jobId, slug);

        if (result.status === 'ready') {
          clearPolling();
          // Se o backend devolver download_url em vez de blob, buscamos o blob aqui
          if (result.download_url) {
            const res = await fetch(result.download_url);
            blobRef.current = await res.blob();
          }
          setStatus(EXPORT_STATUS.READY);
        } else if (result.status === 'error') {
          clearPolling();
          setError(
            result.detail || 'Erro ao gerar exportação. Tente novamente.'
          );
          setStatus(EXPORT_STATUS.ERROR);
        } else if (result.status === 'expired') {
          clearPolling();
          setStatus(EXPORT_STATUS.EXPIRED);
        }
        // status === 'pending' → aguarda próxima iteração
      } catch (err) {
        clearPolling();
        const message =
          err?.response?.data?.detail ||
          err?.message ||
          'Erro ao verificar status da exportação.';
        setError(message);
        setStatus(EXPORT_STATUS.ERROR);
      }
    };

    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);

    // Timeout máximo: transita para expired se o job demorar demais
    pollTimeoutRef.current = setTimeout(() => {
      clearPolling();
      setStatus(EXPORT_STATUS.EXPIRED);
    }, POLL_TIMEOUT_MS);

    return () => clearPolling();
  }, [jobId, status, slug, clearPolling]);

  const startExport = useCallback(
    async (params) => {
      if (status === EXPORT_STATUS.PENDING) return;

      clearPolling();
      setStatus(EXPORT_STATUS.PENDING);
      setError(null);
      setJobId(null);
      blobRef.current = null;

      try {
        const response = await exportFn(params);

        if (
          response?.data instanceof Blob ||
          response?.data instanceof ArrayBuffer
        ) {
          // Fluxo atual: backend retorna blob imediatamente
          blobRef.current = new Blob([response.data], {
            type: 'text/csv;charset=utf-8;',
          });
          setStatus(EXPORT_STATUS.READY);
        } else if (response?.data?.job_id) {
          // Fluxo futuro: backend retorna job_id → polling será iniciado pelo useEffect
          setJobId(response.data.job_id);
          // status permanece PENDING; o useEffect de polling vai disparar
        } else {
          throw new Error('Resposta de export inesperada do servidor.');
        }
      } catch (err) {
        const message =
          err?.response?.status === 429
            ? 'Limite de exportações atingido. Aguarde alguns minutos.'
            : err?.response?.data?.detail ||
              err?.message ||
              'Erro ao gerar exportação. Tente novamente.';
        setError(message);
        setStatus(EXPORT_STATUS.ERROR);
      }
    },
    [exportFn, status, clearPolling]
  );

  const download = useCallback(() => {
    if (!blobRef.current) return;

    const today = new Date().toISOString().split('T')[0];
    const resolvedFilename = filename.replace('{date}', today);

    const url = URL.createObjectURL(blobRef.current);
    const link = document.createElement('a');
    link.href = url;
    link.download = resolvedFilename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    blobRef.current = null;
    setStatus(EXPORT_STATUS.IDLE);
    setJobId(null);
  }, [filename]);

  const reset = useCallback(() => {
    clearPolling();
    blobRef.current = null;
    setStatus(EXPORT_STATUS.IDLE);
    setError(null);
    setJobId(null);
  }, [clearPolling]);

  return { status, error, jobId, startExport, download, reset };
}
