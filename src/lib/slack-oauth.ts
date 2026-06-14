/**
 * Slack OAuth helpers (client-side)
 */

const SLACK_SCOPES = [
  "channels:history",
  "channels:read",
  "groups:history",
  "groups:read",
  "search:read",
  "users:read",
  "users:read.email",
].join(",");

export function getSlackClientId(): string {
  return import.meta.env.VITE_SLACK_CLIENT_ID ?? "";
}

export function startSlackOAuth() {
  const clientId = getSlackClientId();
  if (!clientId) {
    throw new Error(
      "Slack integration is not configured. Set VITE_SLACK_CLIENT_ID in your environment.",
    );
  }

  const state = crypto.randomUUID();
  sessionStorage.setItem("slack_oauth_state", state);

  const redirectUri = `${window.location.origin}/settings`;

  const params = new URLSearchParams({
    client_id: clientId,
    scope: SLACK_SCOPES,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
  });

  window.location.href = `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export function readSlackOAuthCallback(): { code: string; state: string } | null {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const slackState = sessionStorage.getItem("slack_oauth_state");

  if (!code || !state || state !== slackState) return null;

  // Check if this was a Slack callback (not Google)
  // Slack doesn't send a scope param with drive in it
  const scope = url.searchParams.get("scope");
  if (scope && scope.includes("drive")) return null;

  return { code, state };
}

export function validateSlackOAuthState(state: string): boolean {
  return state === sessionStorage.getItem("slack_oauth_state");
}

export function clearSlackOAuthCallbackParams() {
  sessionStorage.removeItem("slack_oauth_state");
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("scope");
  window.history.replaceState({}, "", url.toString());
}
