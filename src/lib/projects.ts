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
  const { data: { session } } = await supabase.auth.getSession();
  console.log("[createProject] Current session:", session);
  console.log("[createProject] Current user:", session?.user);
  if (!session) throw new Error("No active session found");

  const uid = session.user.id;
  console.log("[createProject] starting as user", uid, "input:", input);

  const projectPayload = { name: input.name, description: input.description || null, owner_id: uid };
  console.log("[createProject] insert projects payload:", projectPayload);
  const { data: project, error: pErr } = await supabase
    .from("projects")
    .insert(projectPayload)
    .select()
    .single();
  if (pErr) {
    console.error("[createProject] projects insert error:", pErr);
    throw new Error(`projects insert failed: ${pErr.message}`);
  }
  console.log("[createProject] created project:", project);

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
  console.log("[createProject] insert project_members payload:", memberRows);
  const { error: mErr } = await supabase.from("project_members").insert(memberRows);
  if (mErr) {
    console.error("[createProject] project_members insert error:", mErr);
    throw new Error(`project_members insert failed: ${mErr.message}`);
  }

  if (input.sources.length > 0) {
    const sourceRows = input.sources.map((s) => ({ project_id: project.id, tool: s.tool, label: s.label }));
    console.log("[createProject] insert connected_sources payload:", sourceRows);
    const { error: sErr } = await supabase.from("connected_sources").insert(sourceRows);
    if (sErr) {
      console.error("[createProject] connected_sources insert error:", sErr);
      throw new Error(`connected_sources insert failed: ${sErr.message}`);
    }
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
