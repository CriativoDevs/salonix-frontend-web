import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import './styles/index.css';
import './styles/themes.css';
import './i18n';
import { getEnvVar } from './utils/env';
import { registerServiceWorker } from './pwa/registerSw';

if (typeof window !== 'undefined') {
  window.__DEFAULT_TENANT_SLUG__ =
    window.__DEFAULT_TENANT_SLUG__ ||
    getEnvVar('VITE_DEFAULT_TENANT_SLUG', 'timelyone');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
registerServiceWorker();
