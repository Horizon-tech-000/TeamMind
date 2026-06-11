import { ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Bell, Search, Home, Folder, Settings, Shield, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/projects", label: "My Projects", icon: Folder },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user } = useAuth();
  const email = user?.email ?? "";
  const initials = (email.slice(0, 2) || "AM").toUpperCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="fixed top-0 inset-x-0 h-16 bg-card border-b border-border z-30 flex items-center px-6 gap-6">
        <Link to="/dashboard" className="font-heading text-xl font-bold tracking-tight shrink-0">
          <span className="text-primary">Team</span>
          <span className="text-accent">Mind</span>
        </Link>
        <div className="flex-1 max-w-2xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search across all your projects…"
            className="pl-9 h-10 bg-background border-border"
          />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button className="relative h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent">
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {email && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{email}</div>
              )}
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed top-16 bottom-0 left-0 w-[220px] bg-card border-r border-border flex flex-col z-20">
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <div className="rounded-lg border border-border bg-background p-3 flex gap-2">
            <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              TeamMind only surfaces content you already have access to in your connected tools.
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="pt-16 pl-[220px]">
        <div className="p-8 max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
