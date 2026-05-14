import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Flag,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/answer")({
  head: () => ({
    meta: [
      { title: "Answer detail — TeamMind" },
      {
        name: "description",
        content: "Full answer detail with source citations.",
      },
    ],
  }),
  component: AnswerDetailPage,
});

const sourceColors: Record<string, string> = {
  Slack: "#4A154B",
  Jira: "#2684FF",
  Drive: "#1FA463",
};

function ToolBadge({ tool }: { tool: keyof typeof sourceColors }) {
  return (
    <span
      className="h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ background: sourceColors[tool] }}
    >
      {tool[0]}
    </span>
  );
}

function Highlight({
  children,
  source,
  anchor,
}: {
  children: React.ReactNode;
  source: string;
  anchor: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="rounded px-1 py-0.5 cursor-help transition-colors"
          style={{ background: "rgba(0, 201, 177, 0.15)" }}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs bg-card text-foreground border border-border shadow-md">
        <p className="text-[11px] font-semibold mb-1">{source}</p>
        <a
          href={`#${anchor}`}
          className="text-accent text-xs font-medium inline-flex items-center gap-1 hover:underline"
        >
          Jump to source <ChevronRight className="h-3 w-3" />
        </a>
      </TooltipContent>
    </Tooltip>
  );
}

function AnswerDetailPage() {
  return (
    <AppShell>
      <TooltipProvider delayDuration={120}>
        <div className="max-w-[800px] mx-auto">
          {/* Breadcrumb + back */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              to="/projects"
              className="h-8 w-8 rounded-md border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <nav className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">
              <Link to="/projects" className="hover:text-foreground truncate">
                API Gateway Redesign
              </Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="hover:text-foreground">AI Answers</span>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="text-foreground font-medium">Answer detail</span>
            </nav>
          </div>

          {/* Question */}
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            Why did we choose Postgres over MongoDB?
          </h1>
          <p className="text-sm text-muted-foreground mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Answered just now</span>
            <span className="text-border">·</span>
            <span>3 sources</span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span className="text-success font-semibold">High confidence</span>
            </span>
          </p>

          {/* Answer */}
          <article className="mt-8 space-y-4 text-[15px] leading-7 text-foreground">
            <p>
              The team chose Postgres primarily for its{" "}
              <Highlight source="Slack · #platform-team" anchor="src-slack">
                transactional consistency and the existing team expertise
              </Highlight>
              . The decision came after a structured review where the lead
              engineer noted that the document model would require significant
              data restructuring of our existing relational schemas.
            </p>
            <p>
              During the March 14 architecture review, the platform team
              concluded that{" "}
              <Highlight source="Jira · PLAT-204" anchor="src-jira">
                Postgres' mature replication story and JSONB support gave us
                document-style flexibility without losing ACID guarantees
              </Highlight>
              . MongoDB was considered but ruled out due to operational overhead
              and uncertainty around multi-region writes.
            </p>
            <p>
              The final decision was recorded in the Architecture Decision
              Record, where the team documented that{" "}
              <Highlight source="Drive · ADR v2.pdf" anchor="src-drive">
                Postgres aligns with our long-term observability and backup
                tooling, and the team can ship faster on a stack they already
                operate in production
              </Highlight>
              .
            </p>
          </article>

          {/* Sources */}
          <section className="mt-12">
            <h2 className="font-heading text-lg font-semibold mb-4">
              Sources used
            </h2>
            <div className="space-y-4">
              {/* Slack */}
              <div
                id="src-slack"
                className="bg-card rounded-xl border border-border p-5 scroll-mt-24"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <ToolBadge tool="Slack" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">#platform-team</p>
                    <p className="text-[11px] text-muted-foreground">
                      March 14, 2025 · 14:32
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="h-8">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View in Slack
                  </Button>
                </div>
                <blockquote className="mt-4 rounded-lg bg-muted/60 border-l-2 border-border p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="h-8 w-8 rounded-md flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ background: "#0F1C2E" }}
                    >
                      AM
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs">
                        <span className="font-semibold text-foreground">
                          Aisha Mensah
                        </span>{" "}
                        <span className="text-muted-foreground">14:32</span>
                      </p>
                      <p className="text-sm leading-relaxed mt-1 text-foreground">
                        Sticking with Postgres. We get transactional consistency
                        out of the box and the whole platform team already
                        operates it. Migrating to Mongo means re-modelling half
                        the schemas — not worth the cost this quarter.
                      </p>
                    </div>
                  </div>
                </blockquote>
              </div>

              {/* Jira */}
              <div
                id="src-jira"
                className="bg-card rounded-xl border border-border p-5 scroll-mt-24"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <ToolBadge tool="Jira" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      PLAT-204 — Database selection decision
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-success/15 text-success font-semibold uppercase tracking-wide">
                        Done
                      </span>
                      <span>· Assigned to Lena Park</span>
                      <span>· Mar 14, 2025</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View in Jira
                  </Button>
                </div>
                <blockquote className="rounded-lg bg-muted/60 border-l-2 border-border p-4">
                  <p className="text-sm leading-relaxed text-foreground">
                    Decision: adopt Postgres 15 as the primary store for the
                    gateway. JSONB gives us document-style flexibility for
                    config payloads without losing ACID guarantees, and
                    logical replication covers our multi-region read needs.
                    Re-evaluate in Q4 if write throughput becomes the
                    bottleneck.
                  </p>
                </blockquote>
              </div>

              {/* Drive */}
              <div
                id="src-drive"
                className="bg-card rounded-xl border border-border p-5 scroll-mt-24"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <ToolBadge tool="Drive" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      Architecture Decision Record v2.pdf
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Page 4, Section 2.3
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="h-8">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View in Drive
                  </Button>
                </div>
                <blockquote className="mt-4 rounded-lg bg-muted/60 border-l-2 border-border p-4">
                  <p className="text-sm leading-relaxed text-foreground">
                    "Postgres aligns with our long-term observability stack
                    (pganalyze, Datadog) and our existing backup and
                    point-in-time recovery tooling. Selecting it lets the
                    platform team ship the gateway redesign on infrastructure
                    they already operate in production."
                  </p>
                </blockquote>
              </div>
            </div>
          </section>

          {/* Feedback */}
          <section className="mt-12 mb-4 pt-8 border-t border-border text-center">
            <p className="text-sm font-semibold mb-3">
              Was this answer helpful?
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" className="h-9">
                <ThumbsUp className="h-4 w-4" />
                Yes
              </Button>
              <Button variant="outline" size="sm" className="h-9">
                <ThumbsDown className="h-4 w-4" />
                No
              </Button>
            </div>
            <button className="mt-5 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors">
              <Flag className="h-3.5 w-3.5" />
              Something missing? Flag this for your team
            </button>
          </section>
        </div>
      </TooltipProvider>
    </AppShell>
  );
}
