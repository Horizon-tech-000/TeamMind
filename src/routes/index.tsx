import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: StylePreview,
  head: () => ({
    meta: [
      { title: "TeamMind — Design System Preview" },
      {
        name: "description",
        content:
          "Design system preview for TeamMind: colors, typography, and card component.",
      },
    ],
  }),
});

type Swatch = {
  name: string;
  hex: string;
  varClass: string;
  textClass?: string;
  note?: string;
};

const swatches: Swatch[] = [
  { name: "Primary / Navy", hex: "#0F1C2E", varClass: "bg-primary", textClass: "text-primary-foreground" },
  { name: "Accent / Teal", hex: "#00C9B1", varClass: "bg-accent", textClass: "text-accent-foreground" },
  { name: "Background", hex: "#F7F8FA", varClass: "bg-background border", textClass: "text-foreground" },
  { name: "Card", hex: "#FFFFFF", varClass: "bg-card border", textClass: "text-card-foreground" },
  { name: "Text secondary", hex: "#6B7A90", varClass: "bg-muted-foreground", textClass: "text-white" },
  { name: "Border", hex: "#E2E8F0", varClass: "bg-border", textClass: "text-foreground" },
  { name: "Success / High", hex: "#12B76A", varClass: "bg-success", textClass: "text-white" },
  { name: "Warning / Medium", hex: "#F79009", varClass: "bg-warning", textClass: "text-white" },
  { name: "Error / Low", hex: "#F04438", varClass: "bg-destructive", textClass: "text-destructive-foreground" },
];

function StylePreview() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 md:px-12">
      <div className="mx-auto max-w-5xl space-y-12">
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-foreground">
            <span className="h-2 w-2 rounded-full bg-accent" />
            TeamMind · Design System
          </span>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Style preview
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Foundations for TeamMind — the knowledge retrieval tool for
            distributed IT teams. No screens yet, just the design tokens in
            place.
          </p>
        </header>

        {/* Colors */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Colors</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {swatches.map((s) => (
              <div
                key={s.name}
                className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]"
              >
                <div className={`flex h-20 items-end p-3 ${s.varClass} ${s.textClass ?? ""}`}>
                  <span className="text-xs font-medium opacity-80">{s.hex}</span>
                </div>
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{s.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Typography</h2>
          <div className="rounded-xl border bg-card p-6 shadow-[var(--shadow-card)] space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Heading · Sora
              </p>
              <h1 className="mt-1 text-4xl font-semibold">Ask anything. Find anything.</h1>
              <h3 className="mt-2 text-xl font-medium text-muted-foreground">
                Connected knowledge for distributed teams
              </h3>
            </div>
            <div className="border-t pt-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Body · Inter
              </p>
              <p className="mt-1 text-base leading-relaxed">
                TeamMind pulls answers from Slack, Jira, Google Drive, and
                Confluence — so your engineers stop re-asking the same question.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Secondary text uses #6B7A90 for supporting copy and metadata.
              </p>
            </div>
          </div>
        </section>

        {/* Sample card */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Sample card</h2>
          <article className="rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Answer · from Confluence
                </p>
                <h3 className="mt-1 text-lg font-semibold">
                  How do I rotate the production database credentials?
                </h3>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 text-xs font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                High confidence
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground/90">
              Open the Vault dashboard, select <em>prod-db</em>, and click
              <em> Rotate</em>. The new secret syncs to Kubernetes within 60
              seconds. Confluence runbook last updated 3 days ago.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-md border bg-background px-2 py-1">Confluence</span>
                <span className="rounded-md border bg-background px-2 py-1">Slack #sre</span>
                <span className="rounded-md border bg-background px-2 py-1">Jira INFRA-204</span>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                View source
              </button>
            </div>
          </article>

          {/* Confidence variants */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "High confidence", cls: "bg-success/12 text-success", dot: "bg-success" },
              { label: "Medium confidence", cls: "bg-warning/12 text-warning", dot: "bg-warning" },
              { label: "Low confidence", cls: "bg-destructive/12 text-destructive", dot: "bg-destructive" },
            ].map((c) => (
              <div
                key={c.label}
                className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]"
              >
                <span className="text-sm font-medium">{c.label}</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${c.cls}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                  Indicator
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
