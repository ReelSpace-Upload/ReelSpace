-- Liens publics ReelSpace : /v/{share_slug}

alter table public.videos
  add column if not exists share_slug text;

create unique index if not exists videos_share_slug_unique_idx
  on public.videos (share_slug)
  where share_slug is not null;

-- Slugs pour les vidéos déjà uploadées
update public.videos
set share_slug = substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)
where share_slug is null;

alter table public.videos
  alter column share_slug set not null;
