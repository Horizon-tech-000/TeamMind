type EnvRecord = Record<string, string | undefined>;

function trim(value: string | undefined): string {
  return value?.trim() ?? "";
}

function readFromProcessEnv(keys: string[]): string {
  if (typeof process === "undefined" || !process.env) return "";

  for (const key of keys) {
    const value = trim(process.env[key]);
    if (value) return value;
  }

  return "";
}

function readFromImportMetaEnv(keys: string[]): string {
  const env = import.meta.env as EnvRecord;

  for (const key of keys) {
    const value = trim(env[key]);
    if (value) return value;
  }

  return "";
}

/**
 * Read env vars inside TanStack Start server functions.
 *
 * Vite exposes VITE_* keys on import.meta.env. Non-VITE keys (e.g. GOOGLE_CLIENT_SECRET)
 * are available via process.env in Node dev, and via .dev.vars / platform secrets on Cloudflare.
 */
export function readServerEnv(...keys: string[]): string {
  return readFromProcessEnv(keys) || readFromImportMetaEnv(keys);
}
