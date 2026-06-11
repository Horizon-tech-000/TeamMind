export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
export const GOOGLE_OAUTH_STATE_KEY = "teammind_google_oauth_state";

function normalizeRedirectUri(uri: string): string {
  const trimmed = uri.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

/** Redirect URI sent to Google — must match Google Cloud Console exactly. */
export function getGoogleRedirectUri(): string {
  const configured = import.meta.env.VITE_GOOGLE_REDIRECT_URI?.trim();
  if (configured) {
    return normalizeRedirectUri(configured);
  }

  if (typeof window === "undefined") return "";
  return normalizeRedirectUri(`${window.location.origin}/settings`);
}

export function getGoogleClientId(): string | null {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  return clientId || null;
}

export function startGoogleDriveOAuth(): void {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("Google OAuth is not configured. Add VITE_GOOGLE_CLIENT_ID to your environment.");
  }

  const state = crypto.randomUUID();
  sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: GOOGLE_DRIVE_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function readGoogleOAuthCallback(): { code: string; state: string } | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    throw new Error(params.get("error_description") ?? "Google authorization was cancelled.");
  }

  if (!code || !state) return null;
  return { code, state };
}

export function validateGoogleOAuthState(state: string): boolean {
  const expected = sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY);
  sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
  return Boolean(expected && expected === state);
}

export function clearGoogleOAuthCallbackParams(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("scope");
  url.searchParams.delete("authuser");
  url.searchParams.delete("prompt");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  window.history.replaceState({}, "", url.pathname + url.search);
}
