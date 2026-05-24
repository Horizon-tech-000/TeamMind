import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

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
  const [loading, setLoading] = useState(false);
  return (
    <AuthLayout>
      <div>
        <h2 className="font-heading text-3xl font-semibold text-foreground">Welcome back</h2>
        <p className="mt-2 text-sm text-muted-foreground">Log in to continue searching your team's knowledge.</p>

        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/dashboard" });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" placeholder="jane@company.com" required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input id="password" type="password" placeholder="••••••••" required />
            <div className="flex justify-end">
              <a href="#" className="text-xs text-accent hover:underline font-medium">
                Forgot password?
              </a>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
          >
            Log in
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
