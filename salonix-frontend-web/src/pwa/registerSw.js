export function registerServiceWorker(reload = () => window.location.reload()) {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});

      // Um Service Worker novo so assume controle apos todas as abas antigas
      // fecharem, mesmo com skipWaiting/clients.claim() no sw.js. Sem isto,
      // uma aba/PWA aberta ha dias continua servindo respostas cacheadas por
      // uma versao antiga do SW indefinidamente (ex: /api/professionals/
      // cacheado antes do bypass de /api/ existir). Recarrega uma unica vez
      // quando o controller mudar, para a aba assumir o SW novo na hora.
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        reload();
      });
    });
  }
}

