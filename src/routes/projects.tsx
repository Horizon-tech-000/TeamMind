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
} from "lucide-react";
import { getProject, type ConnectedSource, type Project, type ProjectMember } from "@/lib/projects";

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

const answers = [
  {
    question: "Why did we choose Postgres over MongoDB?",
    answer:
      "The team chose Postgres primarily for its transactional consistency and the existing team expertise. During the March architecture review, the lead engineer noted that MongoDB's document model would require significant data restructuring. The decision was finalised in the Jira ticket and confirmed in Slack.",
    sources: [
      { tool: "Slack" as const, label: "#platform-team · Mar 14" },
      { tool: "Jira" as const, label: "PLAT-204" },
      { tool: "Drive" as const, label: "Architecture Decision Record v2.pdf" },
    ],
    confidence: "high" as const,
  },
  {
    question:
      "What are the known risks of the current API rate limiting approach?",
    answer:
      "The current token-bucket implementation lives in the edge layer and is not synchronised across regions, so a client hitting two POPs can effectively double their quota. The platform team also flagged that bursts above 5x the steady rate are silently dropped without a 429 response, which makes client-side debugging painful. A redesign using a shared Redis counter is in scoping.",
    sources: [
      { tool: "Jira" as const, label: "PLAT-318" },
      { tool: "Confluence" as const, label: "Rate Limiting RFC" },
    ],
    confidence: "medium" as const,
  },
];

const openQuestions = [
  {
    status: "red" as const,
    text: "Should the v2 gateway expose gRPC alongside REST for internal services?",
    asker: "Priya Shah",
    when: "2 days ago",
  },
  {
    status: "amber" as const,
    text: "What's the migration plan for clients still on the legacy /v0 endpoints?",
    asker: "Marcus Okafor",
    when: "yesterday",
  },
  {
    status: "green" as const,
    text: "Are we keeping mTLS between the gateway and the auth service?",
    asker: "Lena Park",
    when: "4 hours ago",
  },
];

const statusColor = {
  red: "bg-destructive",
  amber: "bg-warning",
  green: "bg-success",
};

const connectedSources = [
  { tool: "Slack" as const, name: "#api-gateway", indexed: "2 minutes ago" },
  { tool: "Jira" as const, name: "PLAT board", indexed: "15 minutes ago" },
  { tool: "Drive" as const, name: "API Gateway 2026", indexed: "1 hour ago" },
  {
    tool: "Confluence" as const,
    name: "Platform / Gateway",
    indexed: "3 hours ago",
  },
];

const members = [
  { name: "Aisha Mensah", initials: "AM", role: "Owner" },
  { name: "Lena Park", initials: "LP", role: "Member" },
  { name: "Marcus Okafor", initials: "MO", role: "Member" },
  { name: "Priya Shah", initials: "PS", role: "Member" },
  { name: "Ben Chen", initials: "BC", role: "Member" },
  { name: "Rafael Hernandez", initials: "RH", role: "Member" },
];

const avatarPalette = ["#0F1C2E", "#00C9B1", "#6B7A90", "#12B76A", "#F79009", "#4A154B"];

const confidenceMeta = {
  high: { label: "High confidence", text: "text-success", bar: "bg-success", w: "w-full" },
  medium: { label: "Medium confidence", text: "text-warning", bar: "bg-warning", w: "w-2/3" },
  low: { label: "Low confidence", text: "text-destructive", bar: "bg-destructive", w: "w-1/3" },
};

function ProjectPage() {
  const [tab, setTab] = useState<"answers" | "open">("answers");

  return (
    <AppShell>
      <TooltipProvider delayDuration={150}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* LEFT */}
          <div className="space-y-6 min-w-0">
            {/* Header */}
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight">
                API Gateway Redesign
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <SourcePill name="Slack" />
                <SourcePill name="Jira" />
                <SourcePill name="Drive" />
                <SourcePill name="Confluence" />
                <span className="text-xs text-muted-foreground ml-1">
                  · 6 members
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
                />
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 h-10 px-6 font-semibold">
                  Ask
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
                {answers.map((a, i) => {
                  const c = confidenceMeta[a.confidence];
                  return (
                    <Link
                      to="/answer"
                      key={i}
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
                        {a.question}
                      </p>
                      <p className="text-sm leading-relaxed text-foreground mb-5">
                        {a.answer}
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
                    {openQuestions.length} questions from your team
                  </p>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90 h-9">
                    <Plus className="h-4 w-4" />
                    Ask the team
                  </Button>
                </div>
                <div
                  className="bg-card rounded-xl border border-border divide-y divide-border"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                >
                  {openQuestions.map((q, i) => (
                    <div key={i} className="p-4 flex items-center gap-4">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusColor[q.status]}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{q.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Asked by{" "}
                          <span className="font-medium text-foreground">
                            {q.asker}
                          </span>{" "}
                          · {q.when}
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
                {connectedSources.map((s) => (
                  <li key={s.name} className="flex items-center gap-3">
                    <span
                      className="h-7 w-7 rounded-md flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ background: sourceColors[s.tool] }}
                    >
                      {s.tool[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Indexed {s.indexed}
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
                {members.map((m, i) => (
                  <li key={m.name} className="flex items-center gap-3">
                    <span
                      className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ background: avatarPalette[i % avatarPalette.length] }}
                    >
                      {m.initials}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${
                        m.role === "Owner"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {m.role}
                    </span>
                  </li>
                ))}
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
                  <span className="font-semibold">23</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Open questions</span>
                  <span className="font-semibold">4</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last activity</span>
                  <span className="font-semibold">1 hour ago</span>
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
