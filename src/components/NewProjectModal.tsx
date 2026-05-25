import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, X, Search, Slack, Briefcase, FolderOpen, BookOpen, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createProject } from "@/lib/projects";

type Step = 1 | 2 | 3 | 4;

const stepLabels = [
  "1. Name your project",
  "2. Connect sources",
  "3. Add members",
];

type SourceKey = "slack" | "jira" | "drive" | "confluence";
const sources: {
  key: SourceKey;
  name: string;
  desc: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  connectedLabel: string;
}[] = [
  { key: "slack", name: "Slack", desc: "Connect a specific channel or workspace", color: "#4A154B", icon: Slack, connectedLabel: "#platform-team" },
  { key: "jira", name: "Jira", desc: "Connect a specific board or project", color: "#0052CC", icon: Briefcase, connectedLabel: "PLAT board" },
  { key: "drive", name: "Google Drive", desc: "Connect a specific folder", color: "#1FA463", icon: FolderOpen, connectedLabel: "Platform Migration/" },
  { key: "confluence", name: "Confluence", desc: "Connect a specific space", color: "#172B4D", icon: BookOpen, connectedLabel: "Engineering Space" },
];

const suggestedMembers = [
  { id: "1", name: "Priya Shah", email: "priya@company.com", initials: "PS", color: "#00C9B1" },
  { id: "2", name: "Marcus Okafor", email: "marcus@company.com", initials: "MO", color: "#0F1C2E" },
  { id: "3", name: "Lena Petrov", email: "lena@company.com", initials: "LP", color: "#F79009" },
];

export function NewProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [connected, setConnected] = useState<Record<SourceKey, boolean>>({
    slack: false, jira: false, drive: false, confluence: false,
  });
  const [added, setAdded] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setStep(1); setName(""); setDescription("");
    setConnected({ slack: false, jira: false, drive: false, confluence: false });
    setAdded([]); setError(null); setCreatedId(null);
  };
  const close = () => { reset(); onClose(); };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const sourcesPayload = sources
        .filter((s) => connected[s.key])
        .map((s) => ({ tool: s.name, label: s.connectedLabel }));
      const membersPayload = added
        .map((id) => suggestedMembers.find((m) => m.id === id)!)
        .map((m) => ({ name: m.name, email: m.email }));
      const id = await createProject({
        name: name.trim(),
        description,
        sources: sourcesPayload,
        members: membersPayload,
      });
      setCreatedId(id);
      setStep(4);
    } catch (e) {
      console.error("[NewProjectModal] createProject failed:", e);
      const msg = e instanceof Error ? e.message : typeof e === "object" ? JSON.stringify(e) : String(e);
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm">
      <div
        className="bg-card rounded-2xl w-[80vw] h-[80vh] max-w-[1200px] flex flex-col overflow-hidden"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
      >
        {/* Header / progress */}
        <div className="px-8 pt-6 pb-5 border-b border-border">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-lg font-semibold">Create New Project</h2>
            <button onClick={close} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          </div>
          {step < 4 && (
            <div className="flex items-center gap-3">
              {stepLabels.map((label, i) => {
                const idx = (i + 1) as Step;
                const active = step === idx;
                const done = step > idx;
                return (
                  <div key={label} className="flex-1 flex items-center gap-3">
                    <div className="flex-1">
                      <div className={`h-1.5 rounded-full transition-colors ${done || active ? "bg-accent" : "bg-border"}`} />
                      <p className={`mt-2 text-xs font-medium ${active ? "text-foreground" : done ? "text-accent" : "text-muted-foreground"}`}>
                        {label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {step === 1 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h3 className="font-heading text-3xl font-semibold tracking-tight">What are you working on?</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Give your project a name. This becomes a scoped knowledge container — only connected sources and added members will be included.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pname">Project name</Label>
                <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. API Gateway Redesign" className="h-12 text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdesc">Description</Label>
                <Textarea id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about? (optional)" rows={4} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h3 className="font-heading text-3xl font-semibold tracking-tight">Connect your tools</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  TeamMind will only index the specific slices you connect — not your entire tool.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources.map((s) => {
                  const isConnected = connected[s.key];
                  const Icon = s.icon;
                  return (
                    <div key={s.key} className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                      <div className="flex items-start gap-4">
                        <div className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.color }}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-heading font-semibold">{s.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                          {isConnected && (
                            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-md">
                              <Check className="h-3.5 w-3.5" />
                              Connected: {s.connectedLabel}
                            </div>
                          )}
                        </div>
                        <Button
                          variant={isConnected ? "outline" : "default"}
                          className={isConnected ? "" : "bg-accent text-accent-foreground hover:bg-accent/90"}
                          onClick={() => setConnected((c) => ({ ...c, [s.key]: !c[s.key] }))}
                        >
                          {isConnected ? "Change" : "Connect"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 flex gap-3">
                <ShieldCheck className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/80 leading-relaxed">
                  TeamMind respects your existing permissions. If a team member cannot see a file in Drive, TeamMind will not surface it to them either.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h3 className="font-heading text-3xl font-semibold tracking-tight">Who's on this project?</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Only added members can ask questions or view knowledge in this project.
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or email…" className="pl-9 h-11" />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested</p>
                <div className="bg-card rounded-xl border border-border divide-y divide-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  {suggestedMembers.map((m) => {
                    const isAdded = added.includes(m.id);
                    return (
                      <div key={m.id} className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: m.color }}>
                          {m.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.email}</p>
                        </div>
                        <Button
                          variant={isAdded ? "ghost" : "outline"}
                          size="sm"
                          onClick={() => setAdded((a) => isAdded ? a.filter((x) => x !== m.id) : [...a, m.id])}
                          className={isAdded ? "text-success hover:text-success" : ""}
                        >
                          {isAdded ? <>Added <Check className="h-3.5 w-3.5" /></> : "Add"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {added.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Added members</p>
                  <div className="flex flex-wrap gap-2">
                    {added.map((id) => {
                      const m = suggestedMembers.find((x) => x.id === id)!;
                      return (
                        <span key={id} className="inline-flex items-center gap-2 bg-muted rounded-full pl-1 pr-2 py-1 text-sm">
                          <span className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white" style={{ background: m.color }}>
                            {m.initials}
                          </span>
                          {m.name}
                          <button onClick={() => setAdded((a) => a.filter((x) => x !== id))} className="ml-1 hover:text-destructive">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
                <div className="relative h-20 w-20 rounded-full bg-accent flex items-center justify-center">
                  <Check className="h-10 w-10 text-accent-foreground" strokeWidth={3} />
                </div>
              </div>
              <h3 className="mt-8 font-heading text-3xl font-semibold tracking-tight">Project created</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Your sources are being indexed. This usually takes a few minutes.
              </p>
              <Button
                className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 h-11 px-6"
                onClick={() => {
                  const id = createdId;
                  reset();
                  onClose();
                  if (id) navigate({ to: "/projects", search: { id } });
                }}
              >
                <Sparkles className="h-4 w-4" />
                Go to project
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 4 && (
          <div className="px-8 py-4 border-t border-border flex items-center justify-between bg-background">
            {step === 1 ? (
              <button onClick={close} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            ) : (
              <Button variant="outline" onClick={() => setStep((s) => (s - 1) as Step)} disabled={creating}>
                Back
              </Button>
            )}
            <div className="flex items-center gap-3">
              {error && <span className="text-xs text-destructive">{error}</span>}
              <Button
                className="bg-accent text-accent-foreground hover:bg-accent/90 h-10 px-6"
                disabled={(step === 1 && !name.trim()) || creating}
                onClick={() => {
                  if (step === 3) handleCreate();
                  else setStep((s) => (s + 1) as Step);
                }}
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                {step === 3 ? "Create Project" : "Continue"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
