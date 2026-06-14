-- =============================================================
-- TeamMind — Questions, Answers & Feedback tables
-- Run this in Supabase: Dashboard → SQL Editor → New query → paste → Run
-- =============================================================

-- ─── Questions ───────────────────────────────────────────────
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  status text not null default 'open' check (status in ('open', 'answered', 'flagged')),
  created_at timestamptz not null default now()
);

create index if not exists questions_project_id_idx on public.questions (project_id);
create index if not exists questions_user_id_idx on public.questions (user_id);
create index if not exists questions_status_idx on public.questions (status);

alter table public.questions enable row level security;

-- Users can see questions in projects they belong to
create policy "Members can view project questions"
  on public.questions for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = questions.project_id
        and (pm.user_id = auth.uid() or pm.email = (select email from auth.users where id = auth.uid()))
    )
  );

create policy "Members can insert questions"
  on public.questions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.project_members pm
      where pm.project_id = questions.project_id
        and (pm.user_id = auth.uid() or pm.email = (select email from auth.users where id = auth.uid()))
    )
  );

create policy "Owners can update questions"
  on public.questions for update
  using (auth.uid() = user_id);

create policy "Owners can delete questions"
  on public.questions for delete
  using (auth.uid() = user_id);

-- ─── Answers ─────────────────────────────────────────────────
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  content text not null,
  confidence text not null default 'medium' check (confidence in ('high', 'medium', 'low')),
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists answers_question_id_idx on public.answers (question_id);
create index if not exists answers_project_id_idx on public.answers (project_id);

alter table public.answers enable row level security;

create policy "Members can view project answers"
  on public.answers for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = answers.project_id
        and (pm.user_id = auth.uid() or pm.email = (select email from auth.users where id = auth.uid()))
    )
  );

create policy "System can insert answers"
  on public.answers for insert
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = answers.project_id
        and (pm.user_id = auth.uid() or pm.email = (select email from auth.users where id = auth.uid()))
    )
  );

-- ─── Answer Feedback ─────────────────────────────────────────
create table if not exists public.answer_feedback (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.answers (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  vote text not null check (vote in ('up', 'down')),
  created_at timestamptz not null default now(),
  unique (answer_id, user_id)
);

create index if not exists answer_feedback_answer_id_idx on public.answer_feedback (answer_id);

alter table public.answer_feedback enable row level security;

create policy "Members can view feedback"
  on public.answer_feedback for select
  using (auth.uid() = user_id);

create policy "Users can insert own feedback"
  on public.answer_feedback for insert
  with check (auth.uid() = user_id);

create policy "Users can update own feedback"
  on public.answer_feedback for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own feedback"
  on public.answer_feedback for delete
  using (auth.uid() = user_id);
