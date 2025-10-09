let cachedEnv;

function resolveViteEnv() {
  try {
    // embed import.meta access in function body to avoid syntax errors in Jest
    // eslint-disable-next-line no-new-func
    const evaluateImportMeta = new Function('return (typeof import !== "undefined" && import.meta && import.meta.env) || {};');
    return evaluateImportMeta();
  } catch {
    return {};
  }
}

function resolveProcessEnv() {
  const maybeProcess = typeof globalThis !== 'undefined' ? globalThis.process : undefined;
  if (maybeProcess?.env) {
    return maybeProcess.env;
  }
  return {};
}

function loadEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }
  const processEnv = resolveProcessEnv();
  const viteEnv = resolveViteEnv();
  cachedEnv = {
    ...processEnv,
    ...viteEnv,
  };
  return cachedEnv;
}

export function getEnvVar(name, defaultValue = undefined) {
  const allEnv = loadEnv();
  if (Object.prototype.hasOwnProperty.call(allEnv, name)) {
    return allEnv[name];
  }
  return defaultValue;
}

export function getEnvFlag(name, defaultValue = false) {
  const rawValue = getEnvVar(name);
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return defaultValue;
  }
  return String(rawValue).trim().toLowerCase() === 'true';
}

export function resetEnvCache() {
  cachedEnv = undefined;
}
