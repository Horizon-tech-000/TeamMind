import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthBrandPanel, MobileBrand } from "@/components/auth/AuthBrandPanel";
import { Field, PrimaryButton } from "@/components/auth/AuthFormElements";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Log in — TeamMind" },
      { name: "description", content: "Log in to TeamMind to search your team's knowledge across Slack, Jira, Drive, and Confluence." },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel />

      <div className="flex items-center justify-center bg-background px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <MobileBrand />

          <div className="space-y-1.5">
            <h2 className="text-3xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Log in to continue to TeamMind.
            </p>
          </div>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/signup" });
            }}
          >
            <Field id="email" label="Work email" type="email" autoComplete="email" placeholder="ada@company.com" />

            <div className="space-y-1.5">
              <Field id="password" label="Password" type="password" autoComplete="current-password" placeholder="••••••••" />
              <div className="flex justify-end">
                <Link to="/login" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div className="pt-2">
              <PrimaryButton type="submit">Log in</PrimaryButton>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
