import { Link } from "@tanstack/react-router";

export function AuthBrandPanel() {
  return (
    <div className="relative hidden h-full flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
      <Link to="/" className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "Sora, sans-serif" }}>
        <span className="text-white">Team</span>
        <span className="text-accent">Mind</span>
      </Link>

      <div className="space-y-5 max-w-md">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
          Your team's knowledge, finally findable.
        </h1>
        <p className="text-base text-white/70 leading-relaxed">
          Ask questions across Slack, Jira, Drive, and Confluence in one place.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-white/50">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Connected knowledge for distributed teams
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--color-accent)" }}
      />
    </div>
  );
}

export function MobileBrand() {
  return (
    <div className="mb-8 lg:hidden">
      <Link to="/" className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "Sora, sans-serif" }}>
        <span className="text-foreground">Team</span>
        <span className="text-accent">Mind</span>
      </Link>
    </div>
  );
}
