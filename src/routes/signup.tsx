import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthBrandPanel, MobileBrand } from "@/components/auth/AuthBrandPanel";
import { Field, PrimaryButton } from "@/components/auth/AuthFormElements";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
  head: () => ({
    meta: [
      { title: "Create your account — TeamMind" },
      { name: "description", content: "Sign up for TeamMind and make your team's knowledge findable across Slack, Jira, Drive, and Confluence." },
    ],
  }),
});

function SignUpPage() {
  const navigate = useNavigate();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel />

      <div className="flex items-center justify-center bg-background px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <MobileBrand />

          <div className="space-y-1.5">
            <h2 className="text-3xl font-semibold tracking-tight">Create your account</h2>
            <p className="text-sm text-muted-foreground">
              Start finding answers across all your tools.
            </p>
          </div>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/login" });
            }}
          >
            <Field id="name" label="Full name" autoComplete="name" placeholder="Ada Lovelace" />
            <Field id="email" label="Work email" type="email" autoComplete="email" placeholder="ada@company.com" />
            <Field id="password" label="Password" type="password" autoComplete="new-password" placeholder="••••••••" />
            <Field id="company" label="Company name" autoComplete="organization" placeholder="Acme Inc." />

            <div className="pt-2">
              <PrimaryButton type="submit">Get started</PrimaryButton>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
