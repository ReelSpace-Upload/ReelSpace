-- Résolution publique des liens /v/{slug} sans clé service côté Nuxt

create or replace function public.get_video_url_by_slug(p_slug text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select url
  from public.videos
  where share_slug = p_slug
  limit 1;
$$;

revoke all on function public.get_video_url_by_slug(text) from public;
grant execute on function public.get_video_url_by_slug(text) to anon, authenticated;
