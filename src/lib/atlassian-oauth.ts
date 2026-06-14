/**
 * Atlassian (Jira + Confluence) OAuth helpers (client-side)
 *
 * Jira and Confluence share the same Atlassian OAuth 2.0 flow.
 * The scopes requested determine what APIs are accessible.
 */

const JIRA_SCOPES = [
  "read:jira-work",
  "read:jira-user",
  "search:jira",
].join(" ");

const CONFLUENCE_SCOPES = [
  "read:confluence-content.all",
  "read:confluence-space.summary",
  "search:confluence",
].join(" ");

export function getAtlassianClientId(): string {
  return import.meta.env.VITE_ATLASSIAN_CLIENT_ID ?? "";
}

function startAtlassianOAuth(scopes: string, providerTag: string) {
  const clientId = getAtlassianClientId();
  if (!clientId) {
    throw new Error(
      `${providerTag} integration is not configured. Set VITE_ATLASSIAN_CLIENT_ID in your environment.`,
    );
  }

  const state = JSON.stringify({
    nonce: crypto.randomUUID(),
    provider: providerTag,
  });
  sessionStorage.setItem("atlassian_oauth_state", state);

  const redirectUri = `${window.location.origin}/settings`;

  const params = new URLSearchParams({
    audience: "api.atlassian.com",
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    prompt: "consent",
  });

  window.location.href = `https://auth.atlassian.com/authorize?${params.toString()}`;
}

export function startJiraOAuth() {
  startAtlassianOAuth(JIRA_SCOPES, "jira");
}

export function startConfluenceOAuth() {
  startAtlassianOAuth(CONFLUENCE_SCOPES, "confluence");
}

export function readAtlassianOAuthCallback(): {
  code: string;
  state: string;
  provider: "jira" | "confluence";
} | null {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");

  if (!code || !stateRaw) return null;

  const storedState = sessionStorage.getItem("atlassian_oauth_state");
  if (!storedState || stateRaw !== storedState) return null;

  try {
    const parsed = JSON.parse(stateRaw);
    if (parsed.provider === "jira" || parsed.provider === "confluence") {
      return { code, state: stateRaw, provider: parsed.provider };
    }
  } catch {
    // Not an Atlassian callback
  }

  return null;
}

export function clearAtlassianOAuthCallbackParams() {
  sessionStorage.removeItem("atlassian_oauth_state");
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  window.history.replaceState({}, "", url.toString());
}
