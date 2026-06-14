import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sparkles,
  Info,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Share2,
  MessageSquare,
  Plus,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { getProject, type ConnectedSource, type Project, type ProjectMember } from "@/lib/projects";
import { useAuth } from "@/lib/auth-context";
import { askQuestion } from "@/lib/ask-question";
import { listAnswers, listOpenQuestions, getProjectStats, type AnswerWithQuestion, type Question } from "@/lib/questions";

export const Route = createFileRoute("/projects")({
  validateSearch: (search: Record<string, unknown>): { id?: string } => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Project — TeamMind" },
      { name: "description", content: "Project knowledge." },
    ],
  }),
  component: ProjectPage,
});

const sourceColors: Record<string, string> = {
  Slack: "#4A154B",
  Jira: "#2684FF",
  Drive: "#1FA463",
  "Google Drive": "#1FA463",
  Confluence: "#172B4D",
};

function SourcePill({ name }: { name: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-white"
      style={{ background: sourceColors[name] }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
      {name}
    </span>
  );
}

function SourceChip({
  tool,
  label,
}: {
  tool: keyof typeof sourceColors;
  label: string;
}) {
  return (
    <button className="inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-muted transition-colors">
      <span
        className="h-4 w-4 rounded flex items-center justify-center text-[9px] font-bold text-white"
        style={{ background: sourceColors[tool] }}
      >
        {tool[0]}
      </span>
      <span className="text-foreground">{label}</span>
    </button>
  );
}



const statusColor = {
  red: "bg-destructive",
  amber: "bg-warning",
  green: "bg-success",
};

function initialsOf(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

const avatarPalette = ["#0F1C2E", "#00C9B1", "#6B7A90", "#12B76A", "#F79009", "#4A154B"];

const confidenceMeta = {
  high: { label: "High confidence", text: "text-success", bar: "bg-success", w: "w-full" },
  medium: { label: "Medium confidence", text: "text-warning", bar: "bg-warning", w: "w-2/3" },
  low: { label: "Low confidence", text: "text-destructive", bar: "bg-destructive", w: "w-1/3" },
};

function ProjectPage() {
  const { id } = Route.useSearch();
  const { session } = useAuth();
  const [tab, setTab] = useState<"answers" | "open">("answers");
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [connectedSources, setConnectedSources] = useState<ConnectedSource[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Real data state
  const [answers, setAnswers] = useState<AnswerWithQuestion[]>([]);
  const [openQs, setOpenQs] = useState<Question[]>([]);
  const [stats, setStats] = useState<{ decisionsCount: number; openQuestionsCount: number; lastActivity: string | null } | null>(null);

  // Ask box state
  const [questionText, setQuestionText] = useState("");
  const [asking, setAsking] = useState(false);

  const fetchData = (projectId: string) => {
    getProject(projectId)
      .then((d) => {
        setProject(d.project);
        setMembers(d.members);
        setConnectedSources(d.sources);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Failed to load project"));
    listAnswers(projectId).then(setAnswers).catch(() => {});
    listOpenQuestions(projectId).then(setOpenQs).catch(() => {});
    getProjectStats(projectId).then(setStats).catch(() => {});
  };

  useEffect(() => {
    if (!id) return;
    fetchData(id);
  }, [id]);

  const onAsk = async () => {
    if (!id || !questionText.trim() || asking) return;
    setAsking(true);
    try {
      await askQuestion({ data: { projectId: id, text: questionText.trim(), accessToken: session?.access_token ?? "" } });
      setQuestionText("");
      // Refresh answers, open questions, and stats
      listAnswers(id).then(setAnswers).catch(() => {});
      listOpenQuestions(id).then(setOpenQs).catch(() => {});
      getProjectStats(id).then(setStats).catch(() => {});
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to ask question.");
    } finally {
      setAsking(false);
    }
  };

  if (!id) {
    return (
      <AppShell>
        <div className="text-sm text-muted-foreground">
          No project selected. <Link to="/dashboard" className="text-accent underline">Go to dashboard</Link>.
        </div>
      </AppShell>
    );
  }
  if (loadError) {
    return <AppShell><div className="text-sm text-destructive">{loadError}</div></AppShell>;
  }
  if (!project) {
    return <AppShell><div className="text-sm text-muted-foreground">Loading project…</div></AppShell>;
  }

  return (
    <AppShell>
      <TooltipProvider delayDuration={150}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* LEFT */}
          <div className="space-y-6 min-w-0">
            {/* Header */}
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight">
                {project.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {connectedSources.map((s) => (
                  <SourcePill key={s.id} name={s.tool} />
                ))}
                <span className="text-xs text-muted-foreground ml-1">
                  · {members.length} member{members.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>


            {/* Ask box */}
            <div
              className="bg-card rounded-xl border border-border p-4"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
            >
              <div className="flex gap-3 items-start">
                <Textarea
                  rows={3}
                  placeholder="Ask anything about this project… e.g. Why did we decide to use OAuth over API keys?"
                  className="flex-1 resize-none border-0 focus-visible:ring-0 shadow-none text-base p-2"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                />
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90 h-10 px-6 font-semibold"
                  onClick={onAsk}
                  disabled={asking || !questionText.trim()}
                >
                  {asking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 px-2">
                Answers are generated from your connected sources only. Sources
                you cannot access in the original tool will not appear.
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-border flex items-center gap-6">
              {[
                { id: "answers", label: "AI Answers" },
                { id: "open", label: "Open Questions" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as typeof tab)}
                  className={`relative pb-3 text-sm font-semibold transition-colors ${
                    tab === t.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {tab === t.id && (
                    <span className="absolute -bottom-px inset-x-0 h-0.5 bg-accent rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === "answers" ? (
              <div className="space-y-4">
                {answers.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-12">
                    No answers yet. Ask a question above to get started.
                  </div>
                )}
                {answers.map((a) => {
                  const c = confidenceMeta[a.confidence];
                  const truncated = a.content.length > 300 ? a.content.slice(0, 300) + "…" : a.content;
                  return (
                    <Link
                      to={`/answer?id=${a.id}`}
                      key={a.id}
                      className="block bg-card rounded-xl border border-border p-6 hover:border-accent/50 transition-colors"
                      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-md bg-accent/10 text-accent">
                          <Sparkles className="h-3 w-3" />
                          AI Answer
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {a.question.text}
                      </p>
                      <p className="text-sm leading-relaxed text-foreground mb-5">
                        {truncated}
                      </p>

                      <div className="mb-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Sources
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {a.sources.map((s, j) => (
                            <SourceChip key={j} tool={s.tool} label={s.label} />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="flex-1 max-w-[160px] h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full ${c.bar} ${c.w}`} />
                          </div>
                          <span className={`text-xs font-semibold ${c.text}`}>
                            {c.label}
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-muted-foreground hover:text-foreground">
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              Confidence is based on how many sources agreed and
                              how recent they are.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          {[ThumbsUp, ThumbsDown, Copy, Share2].map((Icon, k) => (
                            <button
                              key={k}
                              className="h-8 w-8 rounded-md hover:bg-muted hover:text-foreground flex items-center justify-center transition-colors"
                            >
                              <Icon className="h-4 w-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground">
                    {openQs.length} question{openQs.length === 1 ? "" : "s"} from your team
                  </p>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90 h-9">
                    <Plus className="h-4 w-4" />
                    Ask the team
                  </Button>
                </div>
                {openQs.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-12">
                    No open questions right now.
                  </div>
                ) : (
                <div
                  className="bg-card rounded-xl border border-border divide-y divide-border"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                >
                  {openQs.map((q) => (
                    <div key={q.id} className="p-4 flex items-center gap-4">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${q.status === "flagged" ? statusColor.red : statusColor.amber}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{q.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {timeAgo(q.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="h-8 shrink-0"
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <aside className="space-y-4">
            {/* Connected Sources */}
            <div
              className="bg-card rounded-xl border border-border p-5"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
            >
              <h3 className="font-heading font-semibold text-sm mb-4">
                Connected Sources
              </h3>
              <ul className="space-y-3">
                {connectedSources.length === 0 && (
                  <li className="text-xs text-muted-foreground">No sources connected.</li>
                )}
                {connectedSources.map((s) => (
                  <li key={s.id} className="flex items-center gap-3">
                    <span
                      className="h-7 w-7 rounded-md flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ background: sourceColors[s.tool] ?? "#6B7A90" }}
                    >
                      {s.tool[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.label ?? s.tool}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {s.tool}
                      </p>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-success shrink-0" />
                  </li>
                ))}
              </ul>
            </div>

            {/* Members */}
            <div
              className="bg-card rounded-xl border border-border p-5"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
            >
              <h3 className="font-heading font-semibold text-sm mb-4">
                Members
              </h3>
              <ul className="space-y-3">
                {members.map((m, i) => {
                  const display = m.name || m.email || "Unknown";
                  return (
                    <li key={m.id} className="flex items-center gap-3">
                      <span
                        className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                        style={{ background: avatarPalette[i % avatarPalette.length] }}
                      >
                        {initialsOf(display)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{display}</p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${
                          m.role === "owner"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {m.role}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>


            {/* Project health */}
            <div
              className="bg-card rounded-xl border border-border p-5"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
            >
              <h3 className="font-heading font-semibold text-sm mb-4">
                Project health
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Decisions captured</span>
                  <span className="font-semibold">{stats?.decisionsCount ?? "—"}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Open questions</span>
                  <span className="font-semibold">{stats?.openQuestionsCount ?? "—"}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last activity</span>
                  <span className="font-semibold">{stats?.lastActivity ? timeAgo(stats.lastActivity) : "—"}</span>
                </li>
              </ul>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed px-2">
              <MessageSquare className="inline h-3 w-3 mr-1 -mt-0.5" />
              TeamMind only surfaces content you already have access to in your
              connected tools.
            </p>
          </aside>
        </div>
      </TooltipProvider>
    </AppShell>
  );
}
