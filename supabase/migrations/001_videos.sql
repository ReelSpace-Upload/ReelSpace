-- ReelSpace: table videos + RLS
-- À exécuter dans Supabase SQL Editor ou via CLI

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  original_filename text not null,
  file_size bigint not null check (file_size > 0),
  mime_type text not null,
  cloudinary_public_id text not null,
  cloudinary_cloud_name text not null,
  cloudinary_account_index integer not null default 0 check (cloudinary_account_index >= 0),
  url text not null,
  created_at timestamptz not null default now()
);

create index if not exists videos_user_id_created_at_idx
  on public.videos (user_id, created_at desc);

alter table public.videos enable row level security;

drop policy if exists "Users can view own videos" on public.videos;
create policy "Users can view own videos"
  on public.videos
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own videos" on public.videos;
create policy "Users can insert own videos"
  on public.videos
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own videos" on public.videos;
create policy "Users can delete own videos"
  on public.videos
  for delete
  using (auth.uid() = user_id);

-- Pas de UPDATE côté client pour éviter la modification des URLs
