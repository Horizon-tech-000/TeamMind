import { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground">
        <div className="font-heading text-2xl font-bold">
          <span className="text-white">Team</span>
          <span className="text-accent">Mind</span>
        </div>
        <div className="max-w-md">
          <h1 className="font-heading text-4xl xl:text-5xl font-semibold leading-tight tracking-tight">
            Your team's knowledge, finally findable.
          </h1>
          <p className="mt-6 text-base text-white/70 leading-relaxed">
            Ask questions across Slack, Jira, Drive, and Confluence in one place.
          </p>
        </div>
        <div className="text-xs text-white/40">© TeamMind</div>
      </aside>

      <main className="flex flex-col">
        <div className="lg:hidden flex items-center justify-between px-6 py-5 bg-primary text-primary-foreground">
          <div className="font-heading text-xl font-bold">
            <span className="text-white">Team</span>
            <span className="text-accent">Mind</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
