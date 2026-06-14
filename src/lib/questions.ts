/**
 * Client-side helpers for questions & answers.
 * These use the Supabase client directly (with the user's session).
 */

import { supabase } from "./supabase";

export type Question = {
  id: string;
  project_id: string;
  user_id: string;
  text: string;
  status: "open" | "answered" | "flagged";
  created_at: string;
};

export type Answer = {
  id: string;
  question_id: string;
  project_id: string;
  content: string;
  confidence: "high" | "medium" | "low";
  sources: { tool: string; label: string; excerpt: string }[];
  created_at: string;
};

export type AnswerWithQuestion = Answer & {
  question: Question;
};

export type AnswerFeedback = {
  id: string;
  answer_id: string;
  user_id: string;
  vote: "up" | "down";
  created_at: string;
};

// ─── Answers ─────────────────────────────────────────────────

/** List all answers for a given project, most recent first. */
export async function listAnswers(projectId: string): Promise<AnswerWithQuestion[]> {
  // First get answers
  const { data: answers, error: aErr } = await supabase
    .from("answers")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (aErr) throw aErr;
  if (!answers || answers.length === 0) return [];

  // Then get corresponding questions
  const questionIds = [...new Set(answers.map((a) => a.question_id))];
  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("*")
    .in("id", questionIds);

  if (qErr) throw qErr;

  const questionMap = new Map((questions ?? []).map((q) => [q.id, q]));

  return answers.map((a) => ({
    ...a,
    sources: (a.sources ?? []) as { tool: string; label: string; excerpt: string }[],
    question: questionMap.get(a.question_id) as Question,
  }));
}

/** Get a single answer by ID with its question. */
export async function getAnswer(answerId: string): Promise<AnswerWithQuestion | null> {
  const { data: answer, error: aErr } = await supabase
    .from("answers")
    .select("*")
    .eq("id", answerId)
    .single();

  if (aErr || !answer) return null;

  const { data: question, error: qErr } = await supabase
    .from("questions")
    .select("*")
    .eq("id", answer.question_id)
    .single();

  if (qErr || !question) return null;

  return {
    ...answer,
    sources: (answer.sources ?? []) as { tool: string; label: string; excerpt: string }[],
    question: question as Question,
  };
}

// ─── Questions ───────────────────────────────────────────────

/** List open (unanswered) questions for a project. */
export async function listOpenQuestions(projectId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("project_id", projectId)
    .in("status", ["open", "flagged"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Question[];
}

/** List flagged questions across all projects the user belongs to. */
export async function listFlaggedQuestions(): Promise<(Question & { project_name?: string })[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  // Get user's project IDs
  const { data: memberships } = await supabase
    .from("project_members")
    .select("project_id")
    .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`);

  if (!memberships || memberships.length === 0) return [];

  const projectIds = memberships.map((m) => m.project_id);

  const { data: questions, error } = await supabase
    .from("questions")
    .select("*")
    .in("project_id", projectIds)
    .eq("status", "flagged")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;

  // Get project names
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .in("id", projectIds);

  const projectMap = new Map((projects ?? []).map((p) => [p.id, p.name]));

  return (questions ?? []).map((q) => ({
    ...(q as Question),
    project_name: projectMap.get(q.project_id) ?? "Unknown",
  }));
}

/** List recent answers across all projects the user belongs to (for dashboard). */
export async function listRecentAnswers(limit = 5): Promise<AnswerWithQuestion[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  // Get user's project IDs
  const { data: memberships } = await supabase
    .from("project_members")
    .select("project_id")
    .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`);

  if (!memberships || memberships.length === 0) return [];

  const projectIds = memberships.map((m) => m.project_id);

  const { data: answers, error: aErr } = await supabase
    .from("answers")
    .select("*")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (aErr) throw aErr;
  if (!answers || answers.length === 0) return [];

  const questionIds = [...new Set(answers.map((a) => a.question_id))];
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .in("id", questionIds);

  const questionMap = new Map((questions ?? []).map((q) => [q.id, q]));

  return answers.map((a) => ({
    ...a,
    sources: (a.sources ?? []) as { tool: string; label: string; excerpt: string }[],
    question: questionMap.get(a.question_id) as Question,
  }));
}

// ─── Feedback ────────────────────────────────────────────────

/** Get the user's existing feedback for an answer, if any. */
export async function getMyFeedback(answerId: string): Promise<AnswerFeedback | null> {
  const { data, error } = await supabase
    .from("answer_feedback")
    .select("*")
    .eq("answer_id", answerId)
    .maybeSingle();

  if (error) return null;
  return data as AnswerFeedback | null;
}

// ─── Stats ───────────────────────────────────────────────────

/** Get project health stats (real counts from DB). */
export async function getProjectStats(projectId: string) {
  const [
    { count: answeredCount },
    { count: openCount },
    { data: lastAnswer },
  ] = await Promise.all([
    supabase.from("answers").select("*", { count: "exact", head: true }).eq("project_id", projectId),
    supabase.from("questions").select("*", { count: "exact", head: true }).eq("project_id", projectId).in("status", ["open", "flagged"]),
    supabase.from("answers").select("created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return {
    decisionsCount: answeredCount ?? 0,
    openQuestionsCount: openCount ?? 0,
    lastActivity: lastAnswer?.created_at ?? null,
  };
}
