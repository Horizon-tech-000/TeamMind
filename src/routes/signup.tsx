import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  return (
    <AuthLayout>
      <div>
        <h2 className="font-heading text-3xl font-semibold text-foreground">Create your account</h2>
        <p className="mt-2 text-sm text-muted-foreground">Start making your team's knowledge instantly searchable.</p>

        {confirmSent ? (
          <div className="mt-8 rounded-lg border border-border bg-card p-6">
            <p className="text-base font-medium text-foreground">Check your email</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent you a confirmation link before you can log in.
            </p>
            <Link to="/login" className="mt-4 inline-block text-sm text-accent font-medium hover:underline">
              Back to log in
            </Link>
          </div>
        ) : (
          <form
            className="mt-8 space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setLoading(true);
              const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
                  data: { full_name: name, company },
                },
              });
              setLoading(false);
              if (error) {
                setError(error.message);
                return;
              }
              setConfirmSent(true);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Jane Doe" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" placeholder="jane@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company name</Label>
              <Input id="company" placeholder="Acme Inc." required value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
            >
              {loading ? "Creating account…" : "Get started"}
            </Button>
          </form>
        )}

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
