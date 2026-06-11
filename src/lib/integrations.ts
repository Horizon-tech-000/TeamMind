import { supabase } from "./supabase";

export const GOOGLE_DRIVE_PROVIDER = "google_drive";

export type UserIntegration = {
  id: string;
  user_id: string;
  provider: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export function isIntegrationValid(integration: UserIntegration | null): boolean {
  if (!integration?.access_token) return false;
  if (!integration.expires_at) return true;
  return new Date(integration.expires_at).getTime() > Date.now();
}

export async function getUserIntegration(provider: string): Promise<UserIntegration | null> {
  const { data, error } = await supabase
    .from("user_integrations")
    .select("*")
    .eq("provider", provider)
    .maybeSingle();

  if (error) throw error;
  return (data as UserIntegration | null) ?? null;
}

export async function deleteUserIntegration(provider: string): Promise<void> {
  const { error } = await supabase.from("user_integrations").delete().eq("provider", provider);
  if (error) throw error;
}
