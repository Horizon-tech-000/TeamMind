import { supabase } from "./supabase";

export type Project = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
};

export type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string | null;
  email: string | null;
  name: string | null;
  role: "owner" | "member";
};

export type ConnectedSource = {
  id: string;
  project_id: string;
  tool: string;
  label: string | null;
};

export type CreateProjectInput = {
  name: string;
  description: string;
  sources: { tool: string; label: string }[];
  members: { name: string; email: string }[];
};

export async function createProject(input: CreateProjectInput): Promise<string> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");
  const uid = userData.user.id;

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .insert({ name: input.name, description: input.description || null, owner_id: uid })
    .select()
    .single();
  if (pErr) throw pErr;

  const ownerEmail = userData.user.email ?? null;
  const memberRows = [
    { project_id: project.id, user_id: uid, email: ownerEmail, name: ownerEmail, role: "owner" as const },
    ...input.members.map((m) => ({
      project_id: project.id,
      user_id: null,
      email: m.email,
      name: m.name,
      role: "member" as const,
    })),
  ];
  const { error: mErr } = await supabase.from("project_members").insert(memberRows);
  if (mErr) throw mErr;

  if (input.sources.length > 0) {
    const { error: sErr } = await supabase.from("connected_sources").insert(
      input.sources.map((s) => ({ project_id: project.id, tool: s.tool, label: s.label })),
    );
    if (sErr) throw sErr;
  }

  return project.id;
}

export async function listMyProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProject(id: string) {
  const [{ data: project, error: pErr }, { data: members, error: mErr }, { data: sources, error: sErr }] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("project_members").select("*").eq("project_id", id),
      supabase.from("connected_sources").select("*").eq("project_id", id),
    ]);
  if (pErr) throw pErr;
  if (mErr) throw mErr;
  if (sErr) throw sErr;
  return {
    project: project as Project,
    members: (members ?? []) as ProjectMember[],
    sources: (sources ?? []) as ConnectedSource[],
  };
}
