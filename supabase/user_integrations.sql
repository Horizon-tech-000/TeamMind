-- Run this in Supabase: Dashboard → SQL Editor → New query → paste → Run

create table if not exists public.user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index if not exists user_integrations_user_id_idx
  on public.user_integrations (user_id);

create index if not exists user_integrations_provider_idx
  on public.user_integrations (provider);

alter table public.user_integrations enable row level security;

create policy "Users can view own integrations"
  on public.user_integrations
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own integrations"
  on public.user_integrations
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own integrations"
  on public.user_integrations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own integrations"
  on public.user_integrations
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_user_integrations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_integrations_updated_at on public.user_integrations;

create trigger user_integrations_updated_at
  before update on public.user_integrations
  for each row
  execute function public.set_user_integrations_updated_at();
