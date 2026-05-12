import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — TeamMind" },
      { name: "description", content: "Create your TeamMind account and unify Slack, Jira, Drive, and Confluence search." },
      { property: "og:title", content: "Sign up — TeamMind" },
      { property: "og:description", content: "Create your TeamMind account." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  return (
    <AuthLayout>
      <div>
        <h2 className="font-heading text-3xl font-semibold text-foreground">Create your account</h2>
        <p className="mt-2 text-sm text-muted-foreground">Start making your team's knowledge instantly searchable.</p>

        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/login" });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="Jane Doe" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" placeholder="jane@company.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company name</Label>
            <Input id="company" placeholder="Acme Inc." required />
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
          >
            Get started
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-accent font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
