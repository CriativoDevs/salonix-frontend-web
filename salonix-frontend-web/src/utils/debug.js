import { getEnvFlag } from './env';

const debugLogsEnabled = getEnvFlag('VITE_DEBUG_LOGS');

export function trace(message, ...args) {
  if (!debugLogsEnabled) {
    return;
  }
  console.log(`[DEBUG] ${message}`, ...args);
}
