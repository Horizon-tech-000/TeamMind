/**
 * Server function — Exchange Slack OAuth code for tokens and save to DB.
 */

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { readServerEnv } from "@/lib/server-env";

const SLACK_TOKEN_URL = "https://slack.com/api/oauth.v2.access";

function getSupabaseConfig() {
  const url = readServerEnv("VITE_SUPABASE_URL");
  const key = readServerEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) throw new Error("Supabase is not configured on the server.");
  return { url, key };
}

function getSlackServerConfig() {
  const clientId = readServerEnv("VITE_SLACK_CLIENT_ID");
  const clientSecret = readServerEnv("SLACK_CLIENT_SECRET");

  const missing: string[] = [];
  if (!clientId) missing.push("VITE_SLACK_CLIENT_ID");
  if (!clientSecret) missing.push("SLACK_CLIENT_SECRET");

  if (missing.length > 0) {
    throw new Error(`Slack OAuth is not configured. Missing: ${missing.join(", ")}.`);
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

export const connectSlack = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { code: string; redirectUri: string; accessToken: string }) => input,
  )
  .handler(async ({ data }) => {
    const { user, accessToken } = await getAuthenticatedUser(data.accessToken);
    const { clientId, clientSecret } = getSlackServerConfig();

    // Exchange code for token
    const response = await fetch(SLACK_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: data.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: data.redirectUri,
      }),
    });

    const payload = await response.json() as {
      ok: boolean;
      access_token?: string;
      error?: string;
      team?: { name: string };
    };

    if (!payload.ok || !payload.access_token) {
      throw new Error(payload.error ?? "Failed to exchange Slack authorization code.");
    }

    // Save to DB
    const { url, key } = getSupabaseConfig();
    const supabase = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { error } = await supabase.from("user_integrations").upsert(
      {
        user_id: user.id,
        provider: "slack",
        access_token: payload.access_token,
        refresh_token: null,
        expires_at: null, // Slack tokens don't expire
      },
      { onConflict: "user_id,provider" },
    );

    if (error) throw new Error(`Could not save Slack connection: ${error.message}`);

    return { success: true as const, teamName: payload.team?.name };
  });
