import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { GOOGLE_DRIVE_PROVIDER } from "@/lib/integrations";
import { readServerEnv } from "@/lib/server-env";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

function getSupabaseConfig() {
  const url = readServerEnv("VITE_SUPABASE_URL");
  const key = readServerEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) {
    throw new Error("Supabase is not configured on the server.");
  }
  return { url, key };
}

function getGoogleServerConfig() {
  const clientId = readServerEnv("VITE_GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_ID");
  const clientSecret = readServerEnv(
    "GOOGLE_CLIENT_SECRET",
    "VITE_GOOGLE_CLIENT_SECRET",
  );

  const missing: string[] = [];
  if (!clientId) missing.push("VITE_GOOGLE_CLIENT_ID");
  if (!clientSecret) missing.push("GOOGLE_CLIENT_SECRET");

  if (missing.length > 0) {
    throw new Error(
      `Google OAuth is not configured on the server. Missing: ${missing.join(", ")}. ` +
        "Add them to .env locally, .dev.vars for Cloudflare Workers dev, and your Lovable project environment settings for preview.",
    );
  }

  return { clientId, clientSecret };
}

async function getAuthenticatedUser(accessToken: string) {
  if (!accessToken) {
    throw new Error("You must be logged in to connect Google Drive.");
  }

  const { url, key } = getSupabaseConfig();
  const supabase = createClient(url, key);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error("Your login session has expired. Please log in again.");
  }
  return { user: data.user, accessToken };
}

async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = getGoogleServerConfig();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const payload = (await response.json()) as GoogleTokenResponse & { error?: string; error_description?: string };
  if (!response.ok) {
    throw new Error(payload.error_description ?? payload.error ?? "Failed to exchange Google authorization code.");
  }

  if (!payload.access_token) {
    throw new Error("Google did not return an access token.");
  }

  return payload;
}

export const connectGoogleDrive = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; redirectUri: string; accessToken: string }) => input)
  .handler(async ({ data }) => {
    const { user, accessToken } = await getAuthenticatedUser(data.accessToken);
    const tokens = await exchangeCodeForTokens(data.code, data.redirectUri);

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    const { url, key } = getSupabaseConfig();
    const supabase = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { error } = await supabase.from("user_integrations").upsert(
      {
        user_id: user.id,
        provider: GOOGLE_DRIVE_PROVIDER,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
      },
      { onConflict: "user_id,provider" },
    );

    if (error) {
      throw new Error(`Could not save Google Drive connection: ${error.message}`);
    }

    return { success: true as const };
  });
