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
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getAnswer,
  getMyFeedback,
  type AnswerWithQuestion,
  type AnswerFeedback,
} from "@/lib/questions";
import { submitAnswerFeedback, flagQuestion } from "@/lib/ask-question";

export const Route = createFileRoute("/answer")({
  validateSearch: (search: Record<string, unknown>): { id?: string } => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
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

function ToolBadge({ tool }: { tool: string }) {
  return (
    <span
      className="h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ background: sourceColors[tool] ?? "#6B7280" }}
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

/** Format a date string as relative time (e.g. "2 hours ago"). */
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/** Map confidence level to display label and color class. */
function confidenceDisplay(level: "high" | "medium" | "low") {
  switch (level) {
    case "high":
      return { label: "High confidence", colorClass: "bg-success", textClass: "text-success" };
    case "medium":
      return { label: "Medium confidence", colorClass: "bg-yellow-400", textClass: "text-yellow-500" };
    case "low":
      return { label: "Low confidence", colorClass: "bg-destructive", textClass: "text-destructive" };
  }
}

function AnswerDetailPage() {
  const { id } = Route.useSearch();
  const { session } = useAuth();
  const accessToken = session?.access_token ?? "";

  const [answer, setAnswer] = useState<AnswerWithQuestion | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [flagLoading, setFlagLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("No answer ID provided.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [answerData, feedbackData] = await Promise.all([
          getAnswer(id!),
          getMyFeedback(id!),
        ]);
        if (cancelled) return;
        if (!answerData) {
          setError("Answer not found.");
        } else {
          setAnswer(answerData);
          setFeedback(feedbackData);
          if (answerData.question.status === "flagged") setFlagged(true);
        }
      } catch (e) {
        if (!cancelled) setError("Failed to load answer.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleVote(vote: "up" | "down") {
    if (!answer || feedbackLoading) return;
    setFeedbackLoading(true);
    try {
      await submitAnswerFeedback({
        data: { answerId: answer.id, vote, accessToken },
      });
      setFeedback((prev) =>
        prev ? { ...prev, vote } : { id: "", answer_id: answer.id, user_id: "", vote, created_at: "" },
      );
    } catch {
      // silently ignore
    } finally {
      setFeedbackLoading(false);
    }
  }

  async function handleFlag() {
    if (!answer || flagLoading || flagged) return;
    setFlagLoading(true);
    try {
      await flagQuestion({
        data: { questionId: answer.question_id, accessToken },
      });
      setFlagged(true);
    } catch {
      // silently ignore
    } finally {
      setFlagLoading(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <AppShell>
        <div className="max-w-[800px] mx-auto flex flex-col items-center justify-center py-32 gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading answer…</p>
        </div>
      </AppShell>
    );
  }

  // ── Error / not-found state ────────────────────────────────
  if (error || !answer) {
    return (
      <AppShell>
        <div className="max-w-[800px] mx-auto flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-sm text-muted-foreground">{error ?? "Answer not found."}</p>
          <Link to="/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back to projects
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const conf = confidenceDisplay(answer.confidence);

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
                Project
              </Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="hover:text-foreground">AI Answers</span>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="text-foreground font-medium">Answer detail</span>
            </nav>
          </div>

          {/* Question */}
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            {answer.question.text}
          </h1>
          <p className="text-sm text-muted-foreground mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Answered {relativeTime(answer.created_at)}</span>
            <span className="text-border">·</span>
            <span>{answer.sources.length} source{answer.sources.length !== 1 ? "s" : ""}</span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${conf.colorClass}`} />
              <span className={`${conf.textClass} font-semibold`}>{conf.label}</span>
            </span>
          </p>

          {/* Answer */}
          <article className="mt-8 space-y-4 text-[15px] leading-7 text-foreground">
            {answer.content
              .split("\n\n")
              .filter((p) => p.trim())
              .map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
          </article>

          {/* Sources */}
          <section className="mt-12">
            <h2 className="font-heading text-lg font-semibold mb-4">
              Sources used
            </h2>
            <div className="space-y-4">
              {answer.sources.map((source, i) => (
                <div
                  key={i}
                  id={`src-${i}`}
                  className="bg-card rounded-xl border border-border p-5 scroll-mt-24"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <ToolBadge tool={source.tool} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {source.label}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8">
                      <ExternalLink className="h-3.5 w-3.5" />
                      View in {source.tool}
                    </Button>
                  </div>
                  <blockquote className="rounded-lg bg-muted/60 border-l-2 border-border p-4">
                    <p className="text-sm leading-relaxed text-foreground">
                      {source.excerpt}
                    </p>
                  </blockquote>
                </div>
              ))}

              {answer.sources.length === 0 && (
                <p className="text-sm text-muted-foreground">No sources cited for this answer.</p>
              )}
            </div>
          </section>

          {/* Feedback */}
          <section className="mt-12 mb-4 pt-8 border-t border-border text-center">
            <p className="text-sm font-semibold mb-3">
              Was this answer helpful?
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant={feedback?.vote === "up" ? "default" : "outline"}
                size="sm"
                className="h-9"
                disabled={feedbackLoading}
                onClick={() => handleVote("up")}
              >
                {feedbackLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsUp className="h-4 w-4" />
                )}
                Yes
              </Button>
              <Button
                variant={feedback?.vote === "down" ? "default" : "outline"}
                size="sm"
                className="h-9"
                disabled={feedbackLoading}
                onClick={() => handleVote("down")}
              >
                {feedbackLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsDown className="h-4 w-4" />
                )}
                No
              </Button>
            </div>
            <button
              className="mt-5 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              disabled={flagLoading || flagged}
              onClick={handleFlag}
            >
              <Flag className="h-3.5 w-3.5" />
              {flagged
                ? "Flagged for your team"
                : flagLoading
                  ? "Flagging…"
                  : "Something missing? Flag this for your team"}
            </button>
          </section>
        </div>
      </TooltipProvider>
    </AppShell>
  );
}
