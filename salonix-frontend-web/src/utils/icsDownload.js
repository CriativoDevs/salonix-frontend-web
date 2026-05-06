/**
 * Download seguro de arquivo ICS com token em header em vez de query string.
 * Reduz exposição do token em:
 * - Histórico de navegação
 * - Headers de referer
 * - Logs de servidor
 * - Cache do navegador
 *
 * @param {string} apiBaseUrl - Base URL da API (ex: https://api.example.com/)
 * @param {number} appointmentId - ID do agendamento
 * @param {string} icsToken - Token HMAC para validação
 * @param {string} filename - Nome do arquivo para salvar
 * @returns {Promise<void>}
 */
export async function downloadICSSecure(
  apiBaseUrl,
  appointmentId,
  icsToken,
  filename
) {
  if (!apiBaseUrl || !appointmentId || !icsToken) {
    throw new Error('Missing required parameters for ICS download');
  }

  try {
    // Construir URL sem token na query string
    const url = `${apiBaseUrl}public/appointments/${appointmentId}/ics/`;

    // Fazer fetch com token em header e sem referer
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-ICS-Token': icsToken,
        'Content-Type': 'application/json',
      },
      referrerPolicy: 'no-referrer', // Não enviar referer
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // Criar link temporário e simular download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    // Não usar rel="noreferrer" aqui pois é download direto

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Limpar blob URL após delay
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 100);
  } catch (error) {
    console.error('Secure ICS download failed:', error);
    throw error;
  }
}

/**
 * Fallback: abre calendário em nova aba com token em body (POST)
 * Útil para calendários que não suportam download (Google Calendar, etc)
 *
 * @param {string} apiBaseUrl - Base URL da API
 * @param {number} appointmentId - ID do agendamento
 * @param {string} icsToken - Token HMAC
 */
export function openICSSecure(apiBaseUrl, appointmentId, icsToken) {
  if (!apiBaseUrl || !appointmentId || !icsToken) {
    console.error('Missing required parameters for ICS open');
    return;
  }

  try {
    const url = `${apiBaseUrl}public/appointments/${appointmentId}/ics/`;

    // Criar form temporário para POST (abre em nova aba)
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = '_blank';
    form.style.display = 'none';

    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'X-ICS-Token';
    tokenInput.value = icsToken;

    form.appendChild(tokenInput);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  } catch (error) {
    console.error('Secure ICS open failed:', error);
  }
}
