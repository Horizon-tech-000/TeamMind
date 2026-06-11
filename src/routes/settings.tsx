import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Bell,
  Plug,
  Shield,
  Info,
  Upload,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  deleteUserIntegration,
  getUserIntegration,
  GOOGLE_DRIVE_PROVIDER,
  isIntegrationValid,
} from "@/lib/integrations";
import {
  clearGoogleOAuthCallbackParams,
  getGoogleClientId,
  getGoogleRedirectUri,
  readGoogleOAuthCallback,
  startGoogleDriveOAuth,
  validateGoogleOAuthState,
} from "@/lib/google-oauth";
import { connectGoogleDrive } from "@/lib/connect-google-drive";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TeamMind" },
      { name: "description", content: "Manage your TeamMind account, connections, and notifications." },
    ],
  }),
  component: SettingsPage,
});

type Section = "profile" | "notifications" | "connections" | "security";

const nav: { id: Section; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "connections", label: "Connected Accounts", icon: Plug },
  { id: "security", label: "Security", icon: Shield },
];

const toolColors: Record<string, string> = {
  Slack: "#4A154B",
  Jira: "#2684FF",
  "Google Drive": "#1FA463",
  Confluence: "#172B4D",
};

type ToolName = keyof typeof toolColors;

type Tool = {
  name: ToolName;
  status: "connected" | "disconnected";
  account?: string;
  connectable: boolean;
};

const placeholderTools: Tool[] = [
  { name: "Slack", status: "disconnected", connectable: false },
  { name: "Jira", status: "disconnected", connectable: false },
  { name: "Google Drive", status: "disconnected", connectable: true },
  { name: "Confluence", status: "disconnected", connectable: false },
];

function SettingsPage() {
  const [section, setSection] = useState<Section>("connections");
  const [tools, setTools] = useState<Tool[]>(placeholderTools);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [googleActionLoading, setGoogleActionLoading] = useState(false);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);
  const [connectionsMessage, setConnectionsMessage] = useState<string | null>(null);

  const refreshGoogleDriveStatus = useCallback(async () => {
    const integration = await getUserIntegration(GOOGLE_DRIVE_PROVIDER);
    const connected = isIntegrationValid(integration);

    setTools((prev) =>
      prev.map((tool) =>
        tool.name === "Google Drive"
          ? {
              ...tool,
              status: connected ? "connected" : "disconnected",
              account: connected ? "Google account linked" : undefined,
            }
          : tool,
      ),
    );
  }, []);

  const loadConnections = useCallback(async () => {
    setConnectionsLoading(true);
    setConnectionsError(null);
    try {
      await refreshGoogleDriveStatus();
    } catch (error) {
      setConnectionsError(error instanceof Error ? error.message : "Could not load connected accounts.");
    } finally {
      setConnectionsLoading(false);
    }
  }, [refreshGoogleDriveStatus]);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    const callback = readGoogleOAuthCallback();
    if (!callback) return;

    void (async () => {
      setGoogleActionLoading(true);
      setConnectionsError(null);
      setConnectionsMessage(null);

      try {
        if (!validateGoogleOAuthState(callback.state)) {
          throw new Error("Google sign-in could not be verified. Please try connecting again.");
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) {
          throw new Error("You must be logged in to connect Google Drive.");
        }

        await connectGoogleDrive({
          data: {
            code: callback.code,
            redirectUri: getGoogleRedirectUri(),
            accessToken,
          },
        });

        clearGoogleOAuthCallbackParams();
        await refreshGoogleDriveStatus();
        setConnectionsMessage("Google Drive connected successfully.");
      } catch (error) {
        clearGoogleOAuthCallbackParams();
        setConnectionsError(error instanceof Error ? error.message : "Could not connect Google Drive.");
      } finally {
        setGoogleActionLoading(false);
      }
    })();
  }, [refreshGoogleDriveStatus]);

  const handleConnectGoogleDrive = () => {
    setConnectionsError(null);
    setConnectionsMessage(null);

    if (!getGoogleClientId()) {
      setConnectionsError("Google OAuth is not configured. Add VITE_GOOGLE_CLIENT_ID to your environment.");
      return;
    }

    try {
      startGoogleDriveOAuth();
    } catch (error) {
      setConnectionsError(error instanceof Error ? error.message : "Could not start Google sign-in.");
    }
  };

  const handleDisconnectGoogleDrive = async () => {
    setGoogleActionLoading(true);
    setConnectionsError(null);
    setConnectionsMessage(null);

    try {
      await deleteUserIntegration(GOOGLE_DRIVE_PROVIDER);
      await refreshGoogleDriveStatus();
      setConnectionsMessage("Google Drive disconnected.");
    } catch (error) {
      setConnectionsError(error instanceof Error ? error.message : "Could not disconnect Google Drive.");
    } finally {
      setGoogleActionLoading(false);
    }
  };

  const handleToolAction = (name: ToolName) => {
    if (name === "Google Drive") {
      const googleDrive = tools.find((tool) => tool.name === "Google Drive");
      if (googleDrive?.status === "connected") {
        void handleDisconnectGoogleDrive();
      } else {
        handleConnectGoogleDrive();
      }
    }
  };

  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto">
        <h1 className="font-heading text-3xl font-bold tracking-tight mb-8">
          Settings
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
          <nav className="space-y-1">
            {nav.map((n) => {
              const active = section === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setSection(n.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-card text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                  }`}
                  style={active ? { boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : undefined}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </button>
              );
            })}
          </nav>

          <div>
            {section === "connections" && (
              <Connections
                tools={tools}
                loading={connectionsLoading || googleActionLoading}
                error={connectionsError}
                message={connectionsMessage}
                onAction={handleToolAction}
              />
            )}
            {section === "profile" && <Profile />}
            {section === "notifications" && (
              <Placeholder
                title="Notifications"
                subtext="Choose when TeamMind emails or pings you about flagged questions and new answers."
              />
            )}
            {section === "security" && (
              <Placeholder
                title="Security"
                subtext="Manage your password, two-factor authentication, and active sessions."
              />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-card rounded-xl border border-border p-6"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
    >
      {children}
    </div>
  );
}

function Connections({
  tools,
  loading,
  error,
  message,
  onAction,
}: {
  tools: Tool[];
  loading: boolean;
  error: string | null;
  message: string | null;
  onAction: (name: ToolName) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Connected Accounts</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">
          TeamMind uses these connections to index your sources. Your permissions
          in each tool are always respected.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
          {message}
        </div>
      )}

      <Card>
        <ul className="divide-y divide-border -my-2">
          {tools.map((t) => {
            const connected = t.status === "connected";
            const isGoogleDrive = t.name === "Google Drive";
            const actionDisabled = loading || (!t.connectable && !connected);

            return (
              <li key={t.name} className="flex items-center gap-4 py-4">
                <span
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: toolColors[t.name] }}
                >
                  {t.name[0]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {connected ? (t.account ?? "Connected") : "Not connected"}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded ${
                    connected
                      ? "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {connected ? "Connected" : "Not connected"}
                </span>
                {connected ? (
                  <button
                    onClick={() => onAction(t.name)}
                    disabled={actionDisabled || !isGoogleDrive}
                    className="text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors w-24 text-right disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading && isGoogleDrive ? "Working…" : "Disconnect"}
                  </button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onAction(t.name)}
                    disabled={actionDisabled}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 w-24"
                  >
                    {loading && isGoogleDrive ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Working
                      </>
                    ) : t.connectable ? (
                      "Connect"
                    ) : (
                      "Soon"
                    )}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <div
        className="rounded-xl border p-4 flex gap-3"
        style={{
          background: "rgba(38, 132, 255, 0.06)",
          borderColor: "rgba(38, 132, 255, 0.25)",
        }}
      >
        <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#2684FF" }} />
        <div className="text-xs leading-relaxed text-foreground space-y-2">
          <p>
            When you connect Google Drive, TeamMind requests read-only access so it
            can search files you already have permission to view.
          </p>
          <p>
            If Google shows <strong>redirect_uri_mismatch</strong>, add this exact
            URL in Google Cloud Console → Credentials → your OAuth client →{" "}
            <strong>Authorized redirect URIs</strong>:
          </p>
          <code className="block rounded-md border border-border bg-background px-2 py-1.5 text-[11px] break-all">
            {getGoogleRedirectUri() || "Open Settings in your browser to see the redirect URI"}
          </code>
        </div>
      </div>
    </div>
  );
}

function Profile() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground mt-2">
          This is how you appear to your teammates in TeamMind.
        </p>
      </div>

      <Card>
        <div className="flex items-center gap-5 pb-6 border-b border-border">
          <span
            className="h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
            style={{ background: "#0F1C2E" }}
          >
            JM
          </span>
          <div>
            <Button variant="outline" size="sm" className="h-9">
              <Upload className="h-4 w-4" />
              Upload photo
            </Button>
            <p className="text-[11px] text-muted-foreground mt-2">
              PNG or JPG, up to 2MB.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6">
          <Field label="Full name">
            <Input defaultValue="James Mitchell" />
          </Field>
          <Field
            label="Work email"
            action={
              <button className="text-xs font-semibold text-accent hover:underline">
                Change email
              </button>
            }
          >
            <Input
              readOnly
              defaultValue="james@company.com"
              className="bg-muted/40 cursor-not-allowed"
            />
          </Field>
          <Field label="Job title">
            <Input defaultValue="Staff Platform Engineer" />
          </Field>
          <Field label="Company">
            <Input defaultValue="Acme Corp" />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-border">
          <Button variant="ghost">Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <CheckCircle2 className="h-4 w-4" />
            Save changes
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Field({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-xs font-semibold">{label}</Label>
        {action}
      </div>
      {children}
    </div>
  );
}

function Placeholder({ title, subtext }: { title: string; subtext: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-2">{subtext}</p>
      </div>
      <Card>
        <p className="text-sm text-muted-foreground text-center py-8">
          {title} preferences will appear here.
        </p>
      </Card>
    </div>
  );
}
