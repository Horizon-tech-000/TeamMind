import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — TeamMind" },
      { name: "description", content: "Log in to TeamMind to search across your team's connected tools." },
      { property: "og:title", content: "Log in — TeamMind" },
      { property: "og:description", content: "Log in to TeamMind." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address to reset password.");
      return;
    }
    setError(null);
    setMsg(null);
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    });
    setResetLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMsg("Password reset email sent. Check your inbox.");
    }
  };

  return (
    <AuthLayout>
      <div>
        <h2 className="font-heading text-3xl font-semibold text-foreground">Welcome back</h2>
        <p className="mt-2 text-sm text-muted-foreground">Log in to continue searching your team's knowledge.</p>

        <form
          className="mt-8 space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            setLoading(false);
            if (error) {
              setError(error.message);
              return;
            }
            navigate({ to: "/dashboard" });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" placeholder="jane@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="text-xs text-accent hover:underline font-medium inline-flex items-center gap-1 disabled:opacity-50"
              >
                {resetLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Forgot password?
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {msg && <p className="text-sm text-success">{msg}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
          >
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-accent font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
