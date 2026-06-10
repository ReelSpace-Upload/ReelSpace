import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')?.trim().toLowerCase()

  if (!slug || !/^[a-z0-9]{6,16}$/.test(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Vidéo introuvable.' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase.rpc('get_video_url_by_slug', { p_slug: slug })

  if (error || !data) {
    throw createError({ statusCode: 404, statusMessage: 'Vidéo introuvable.' })
  }

  setResponseHeader(event, 'cache-control', 'public, max-age=300')
  return sendRedirect(event, data as string, 302)
})
