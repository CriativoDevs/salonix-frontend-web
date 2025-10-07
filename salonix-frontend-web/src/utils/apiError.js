export function parseApiError(error, fallbackMessage = 'Algo deu errado.') {
  const response = error?.response;
  const apiError = response?.data?.error;

  const requestIdFromHeader = response?.headers?.['x-request-id'] || null;
  const requestId = apiError?.error_id || requestIdFromHeader;

  if (!response) {
    return {
      message: error?.message || fallbackMessage,
      code: null,
      details: null,
      requestId,
    };
  }

  if (response?.status === 429) {
    const retryAfter = Number(response?.headers?.['retry-after'] || 0);
    const seconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null;
    const msg = seconds
      ? `Muitas tentativas. Tente novamente em ${seconds}s.`
      : 'Muitas tentativas. Tente novamente em instantes.';
    return {
      message: msg,
      code: 'RATE_LIMITED',
      details: null,
      requestId,
    };
  }

  if (response?.status === 400) {
    const payload = response?.data;
    const candidateMessages = [];

    if (payload && typeof payload === 'object') {
      ['logo', 'logo_url', 'logoUrl'].forEach((key) => {
        const value = payload[key];
        if (typeof value === 'string') {
          candidateMessages.push(value);
        } else if (Array.isArray(value)) {
          value.forEach((item) => {
            if (typeof item === 'string') {
              candidateMessages.push(item);
            }
          });
        }
      });
    }

    if (typeof payload === 'string') {
      candidateMessages.push(payload);
    } else if (payload && typeof payload === 'object') {
      if (typeof payload.detail === 'string') {
        candidateMessages.push(payload.detail);
      }
      if (apiError?.message) {
        candidateMessages.push(apiError.message);
      }
      Object.values(payload).forEach((value) => {
        if (typeof value === 'string') {
          candidateMessages.push(value);
        } else if (Array.isArray(value)) {
          value.forEach((item) => {
            if (typeof item === 'string') {
              candidateMessages.push(item);
            }
          });
        }
      });
    }

    const limitMessage = candidateMessages.find((msg) =>
      typeof msg === 'string' && msg.toLowerCase().includes('mb')
    );

    if (limitMessage) {
      return {
        message: limitMessage,
        code: apiError?.code || null,
        details: apiError?.details ?? response?.data?.errors ?? null,
        requestId,
      };
    }
  }

  const message = apiError?.message || response?.data?.detail || fallbackMessage;
  const details = apiError?.details ?? response?.data?.errors ?? null;
  const code = apiError?.code || null;

  return {
    message,
    code,
    details,
    requestId,
  };
}

export function hasActionableError(code) {
  if (!code) return false;
  return (
    code.startsWith('E0') ||
    code.startsWith('E1') ||
    code.startsWith('E2') ||
    code.startsWith('E4')
  );
}
