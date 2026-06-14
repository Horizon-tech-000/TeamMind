import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { readServerEnv } from "@/lib/server-env";
import { generateAnswer } from "@/lib/ai-provider";

function getSupabaseConfig() {
  const url = readServerEnv("VITE_SUPABASE_URL");
  const key = readServerEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) throw new Error("Supabase is not configured on the server.");
  return { url, key };
}

async function getAuthenticatedUser(accessToken: string) {
  if (!accessToken) throw new Error("You must be logged in.");
  const { url, key } = getSupabaseConfig();
  const supabase = createClient(url, key);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Session expired. Please log in again.");
  return { user: data.user, accessToken };
}

function getAuthedSupabase(url: string, key: string, accessToken: string) {
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

// ─── Ask a question ──────────────────────────────────────────
export const askQuestion = createServerFn({ method: "POST" })
  .inputValidator((input: { projectId: string; text: string; accessToken: string }) => input)
  .handler(async ({ data }) => {
    const { user, accessToken } = await getAuthenticatedUser(data.accessToken);
    const { url, key } = getSupabaseConfig();
    const supabase = getAuthedSupabase(url, key, accessToken);

    // 1. Verify user is a member of the project
    const { data: membership } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", data.projectId)
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .limit(1)
      .single();

    if (!membership) throw new Error("You are not a member of this project.");

    // 2. Fetch project context (name, description, connected sources)
    const [{ data: project }, { data: sources }] = await Promise.all([
      supabase.from("projects").select("name, description").eq("id", data.projectId).single(),
      supabase.from("connected_sources").select("tool, label").eq("project_id", data.projectId),
    ]);

    const contextParts = [
      `Project: ${project?.name ?? "Unknown"}`,
      project?.description ? `Description: ${project.description}` : "",
      `Connected sources: ${(sources ?? []).map((s) => `${s.tool} (${s.label})`).join(", ") || "none"}`,
    ];

    // 3. Insert the question
    const { data: question, error: qErr } = await supabase
      .from("questions")
      .insert({
        project_id: data.projectId,
        user_id: user.id,
        text: data.text,
        status: "open",
      })
      .select()
      .single();

    if (qErr) throw new Error(`Failed to save question: ${qErr.message}`);

    // 4. Generate AI answer
    const aiResponse = await generateAnswer(data.text, contextParts.join("\n"));

    // 5. Save the answer
    const { data: answer, error: aErr } = await supabase
      .from("answers")
      .insert({
        question_id: question.id,
        project_id: data.projectId,
        content: aiResponse.content,
        confidence: aiResponse.confidence,
        sources: aiResponse.sources,
      })
      .select()
      .single();

    if (aErr) throw new Error(`Failed to save answer: ${aErr.message}`);

    // 6. Update question status to answered
    await supabase
      .from("questions")
      .update({ status: "answered" })
      .eq("id", question.id);

    return {
      questionId: question.id,
      answerId: answer.id,
      content: aiResponse.content,
      confidence: aiResponse.confidence,
      sources: aiResponse.sources,
    };
  });

// ─── Submit feedback ─────────────────────────────────────────
export const submitAnswerFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: { answerId: string; vote: "up" | "down"; accessToken: string }) => input)
  .handler(async ({ data }) => {
    const { user, accessToken } = await getAuthenticatedUser(data.accessToken);
    const { url, key } = getSupabaseConfig();
    const supabase = getAuthedSupabase(url, key, accessToken);

    const { error } = await supabase.from("answer_feedback").upsert(
      {
        answer_id: data.answerId,
        user_id: user.id,
        vote: data.vote,
      },
      { onConflict: "answer_id,user_id" },
    );

    if (error) throw new Error(`Failed to save feedback: ${error.message}`);
    return { success: true as const };
  });

// ─── Flag a question ─────────────────────────────────────────
export const flagQuestion = createServerFn({ method: "POST" })
  .inputValidator((input: { questionId: string; accessToken: string }) => input)
  .handler(async ({ data }) => {
    const { accessToken } = await getAuthenticatedUser(data.accessToken);
    const { url, key } = getSupabaseConfig();
    const supabase = getAuthedSupabase(url, key, accessToken);

    const { error } = await supabase
      .from("questions")
      .update({ status: "flagged" })
      .eq("id", data.questionId);

    if (error) throw new Error(`Failed to flag question: ${error.message}`);
    return { success: true as const };
  });
