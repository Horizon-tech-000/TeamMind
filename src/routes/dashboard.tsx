import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Flag, ExternalLink } from "lucide-react";
import { NewProjectModal } from "@/components/NewProjectModal";
import { listMyProjects, type Project } from "@/lib/projects";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TeamMind" },
      { name: "description", content: "Your team's knowledge dashboard." },
    ],
  }),
  component: DashboardPage,
});

const projectColors = ["#00C9B1", "#F04438", "#F79009", "#4A154B", "#2684FF", "#12B76A"];
const avatarColors = ["#0F1C2E", "#00C9B1", "#6B7A90", "#12B76A"];

const captured = [
  {
    summary:
      "Decision: Postgres chosen over MongoDB for the API gateway database — see thread",
    sources: ["Slack #platform-team"],
    confidence: "high" as const,
    time: "1h ago",
  },
  {
    summary:
      "New runbook published for handling Cloudflare 522 errors during deploys",
    sources: ["Confluence", "Google Drive"],
    confidence: "medium" as const,
    time: "3h ago",
  },
  {
    summary:
      "Jira PLAT-482 closed — SSO rollout to engineering org completed without incident",
    sources: ["Jira", "Slack #sso-rollout"],
    confidence: "high" as const,
    time: "yesterday",
  },
];

const flagged = [
  {
    question: "Why did we drop Kafka in favour of NATS for the event bus?",
    asker: "Priya Shah",
    project: "Platform Migration Q3",
  },
  {
    question:
      "What's the rollback procedure if the new auth gateway fails in prod?",
    asker: "Marcus Okafor",
    project: "Security Incident Response",
  },
];

const confidenceStyles = {
  high: "bg-success/10 text-success border-success/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-destructive/10 text-destructive border-destructive/20",
};

const confidenceLabel = { high: "High", medium: "Medium", low: "Low" };

function DashboardPage() {
  const [showNew, setShowNew] = useState(false);
  const [projects, setProjects] = useState<Project[] | null>(null);

  const load = () => {
    listMyProjects().then(setProjects).catch(() => setProjects([]));
  };
  useEffect(() => { load(); }, []);

  return (
    <AppShell>
      <NewProjectModal
        open={showNew}
        onClose={() => { setShowNew(false); load(); }}
      />
      <div className="space-y-10">
        {/* Section 1 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold">Your Projects</h2>
            <Button onClick={() => setShowNew(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 h-9">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
          {projects === null ? (
            <div className="text-sm text-muted-foreground">Loading projects…</div>
          ) : projects.length === 0 ? (
            <div
              className="bg-card rounded-xl border border-dashed border-border p-10 text-center"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
            >
              <p className="text-sm text-muted-foreground">
                You have no projects yet — create your first one.
              </p>
              <Button
                onClick={() => setShowNew(true)}
                className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90 h-9"
              >
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map((p, idx) => {
                const color = projectColors[idx % projectColors.length];
                const initial = p.name.trim().charAt(0).toUpperCase() || "P";
                return (
                  <Link
                    key={p.id}
                    to="/projects"
                    search={{ id: p.id }}
                    className="text-left bg-card rounded-xl border border-border overflow-hidden flex hover:-translate-y-0.5 transition-transform"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                  >
                    <div className="w-1.5 shrink-0" style={{ background: color }} />
                    <div className="p-5 flex-1">
                      <h3 className="font-heading font-semibold text-base mb-3">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex -space-x-2">
                          <div
                            className="h-7 w-7 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-semibold text-white"
                            style={{ background: avatarColors[0] }}
                          >
                            {initial}
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground font-medium">
                          Project
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>


        {/* Section 2 */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-4">
            Knowledge captured while you were away
          </h2>
          <div className="space-y-3">
            {captured.map((c, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-5 flex gap-4"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
              >
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-relaxed">{c.summary}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {c.sources.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground font-medium"
                      >
                        {s}
                      </span>
                    ))}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md border font-semibold ${confidenceStyles[c.confidence]}`}
                    >
                      {confidenceLabel[c.confidence]}
                    </span>
                    <span className="text-xs text-muted-foreground">· {c.time}</span>
                    <Link to="/answer" className="ml-auto text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1">
                      View source <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-4">
            Flagged for your input
          </h2>
          <div className="bg-card rounded-xl border border-border divide-y divide-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            {flagged.map((f, i) => (
              <div key={i} className="p-5 flex items-center gap-4">
                <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                  <Flag className="h-4 w-4 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{f.question}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Asked by <span className="font-medium text-foreground">{f.asker}</span> · {f.project}
                  </p>
                </div>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 shrink-0">
                  Answer
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
