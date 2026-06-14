/**
 * Server function — Exchange Atlassian (Jira / Confluence) OAuth code for tokens and save to DB.
 */

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { readServerEnv } from "@/lib/server-env";

const ATLASSIAN_TOKEN_URL = "https://auth.atlassian.com/oauth/token";

function getSupabaseConfig() {
  const url = readServerEnv("VITE_SUPABASE_URL");
  const key = readServerEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) throw new Error("Supabase is not configured on the server.");
  return { url, key };
}

function getAtlassianServerConfig() {
  const clientId = readServerEnv("VITE_ATLASSIAN_CLIENT_ID");
  const clientSecret = readServerEnv("ATLASSIAN_CLIENT_SECRET");

  const missing: string[] = [];
  if (!clientId) missing.push("VITE_ATLASSIAN_CLIENT_ID");
  if (!clientSecret) missing.push("ATLASSIAN_CLIENT_SECRET");

  if (missing.length > 0) {
    throw new Error(`Atlassian OAuth is not configured. Missing: ${missing.join(", ")}.`);
  }

  return { clientId: clientId!, clientSecret: clientSecret! };
}

async function getAuthenticatedUser(accessToken: string) {
  if (!accessToken) throw new Error("You must be logged in.");
  const { url, key } = getSupabaseConfig();
  const supabase = createClient(url, key);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Session expired. Please log in again.");
  return { user: data.user, accessToken };
}

type AtlassianTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

export const connectAtlassian = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      code: string;
      redirectUri: string;
      provider: "jira" | "confluence";
      accessToken: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const { user, accessToken } = await getAuthenticatedUser(data.accessToken);
    const { clientId, clientSecret } = getAtlassianServerConfig();

    // Exchange code for token
    const response = await fetch(ATLASSIAN_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code: data.code,
        redirect_uri: data.redirectUri,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Atlassian token exchange failed: ${err}`);
    }

    const tokens = (await response.json()) as AtlassianTokenResponse;

    if (!tokens.access_token) {
      throw new Error("Atlassian did not return an access token.");
    }

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    // Save to DB
    const { url, key } = getSupabaseConfig();
    const supabase = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { error } = await supabase.from("user_integrations").upsert(
      {
        user_id: user.id,
        provider: data.provider,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
      },
      { onConflict: "user_id,provider" },
    );

    if (error) {
      throw new Error(`Could not save ${data.provider} connection: ${error.message}`);
    }

    return { success: true as const };
  });
