import { useState } from "react";
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
} from "lucide-react";

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

type Tool = {
  name: keyof typeof toolColors;
  status: "connected" | "disconnected";
  account?: string;
};

const initialTools: Tool[] = [
  { name: "Slack", status: "connected", account: "james@company.com" },
  { name: "Jira", status: "connected", account: "james@company.com" },
  { name: "Google Drive", status: "disconnected" },
  { name: "Confluence", status: "disconnected" },
];

function SettingsPage() {
  const [section, setSection] = useState<Section>("connections");
  const [tools, setTools] = useState<Tool[]>(initialTools);

  const toggleTool = (name: Tool["name"]) => {
    setTools((prev) =>
      prev.map((t) =>
        t.name === name
          ? t.status === "connected"
            ? { ...t, status: "disconnected", account: undefined }
            : { ...t, status: "connected", account: "james@company.com" }
          : t,
      ),
    );
  };

  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto">
        <h1 className="font-heading text-3xl font-bold tracking-tight mb-8">
          Settings
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
          {/* Secondary nav */}
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

          {/* Content */}
          <div>
            {section === "connections" && (
              <Connections tools={tools} onToggle={toggleTool} />
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
  onToggle,
}: {
  tools: Tool[];
  onToggle: (name: Tool["name"]) => void;
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

      <Card>
        <ul className="divide-y divide-border -my-2">
          {tools.map((t) => {
            const connected = t.status === "connected";
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
                    {connected ? `Connected as ${t.account}` : "Not connected"}
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
                    onClick={() => onToggle(t.name)}
                    className="text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors w-24 text-right"
                  >
                    Disconnect
                  </button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onToggle(t.name)}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 w-24"
                  >
                    Connect
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
        <p className="text-xs leading-relaxed text-foreground">
          When you connect a tool, TeamMind only accesses content within the
          specific channels, boards, or folders you add to a project. We never
          index your entire account.
        </p>
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
