import { getEnvVar } from './env';

let hasLoggedBypassEnabled = false;
let hasLoggedBypassBlocked = false;

function isTruthy(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === undefined || value === null) {
    return false;
  }
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function isProductionLikeValue(value) {
  if (value === undefined || value === null) {
    return false;
  }
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'production' || normalized === 'prod';
}

export function isProductionEnvironment() {
  if (isTruthy(getEnvVar('PROD'))) {
    return true;
  }

  if (isProductionLikeValue(getEnvVar('MODE'))) {
    return true;
  }

  if (isProductionLikeValue(getEnvVar('NODE_ENV'))) {
    return true;
  }

  if (isProductionLikeValue(getEnvVar('VITE_APP_ENV'))) {
    return true;
  }

  return false;
}

export function getCaptchaBypassToken() {
  const rawBypassToken = String(
    getEnvVar('VITE_CAPTCHA_BYPASS_TOKEN') || ''
  ).trim();
  if (!rawBypassToken) {
    return undefined;
  }

  if (isProductionEnvironment()) {
    if (!hasLoggedBypassBlocked) {
      console.warn(
        '[Captcha] VITE_CAPTCHA_BYPASS_TOKEN is configured but ignored in production.'
      );
      hasLoggedBypassBlocked = true;
    }
    return undefined;
  }

  if (!hasLoggedBypassEnabled) {
    console.warn(
      '[Captcha] Captcha bypass token is active in non-production mode.'
    );
    hasLoggedBypassEnabled = true;
  }

  return rawBypassToken;
}

export function getCaptchaTokenForRequest(captchaToken) {
  if (captchaToken) {
    return captchaToken;
  }
  return getCaptchaBypassToken();
}

export function resetCaptchaPolicyCacheForTests() {
  hasLoggedBypassEnabled = false;
  hasLoggedBypassBlocked = false;
}
