/**
 * safeRedirect.js
 *
 * Validates URLs returned by the API before redirecting the user.
 * Prevents open-redirect vulnerabilities by allowing only trusted hosts
 * and HTTPS protocol.
 *
 * Allowed hosts are configured via the VITE_ALLOWED_REDIRECT_HOSTS env var
 * (comma-separated list). Falls back to the built-in Stripe hosts when the
 * variable is not set.
 */

import { getEnvVar } from './env';

const BUILTIN_ALLOWED_HOSTS = ['checkout.stripe.com', 'billing.stripe.com'];
export const REDIRECT_VALIDATION_ERROR_CODE = 'REDIRECT_URL_BLOCKED';

/**
 * Returns the set of allowed redirect hosts for the current environment.
 * @returns {string[]}
 */
function getAllowedHosts() {
  const envHosts = getEnvVar('VITE_ALLOWED_REDIRECT_HOSTS');
  if (envHosts && envHosts.trim()) {
    return envHosts
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);
  }
  return BUILTIN_ALLOWED_HOSTS;
}

/**
 * Returns true if the URL is safe to redirect to:
 * - Protocol must be https:
 * - Hostname must be in the allowed hosts list
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isAllowedRedirectUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return getAllowedHosts().some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}

export function isRedirectValidationError(error) {
  return error?.code === REDIRECT_VALIDATION_ERROR_CODE;
}

export function toRedirectValidationError(url) {
  const error = new TypeError('Redirect URL failed validation.');
  error.code = REDIRECT_VALIDATION_ERROR_CODE;
  error.blockedUrl = url;
  return error;
}

/**
 * Validates the URL and redirects via window.location.assign.
 * Throws a TypeError if the URL is not allowed — callers must handle this
 * and show an appropriate error to the user instead of redirecting.
 *
 * @param {string} url
 * @throws {TypeError} when the URL is invalid or not allowed
 */
export function safeRedirect(url) {
  if (!isAllowedRedirectUrl(url)) {
    throw toRedirectValidationError(url);
  }
  window.location.assign(url);
}
