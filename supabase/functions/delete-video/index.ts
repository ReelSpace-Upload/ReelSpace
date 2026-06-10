import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { createUserClient, getAuthenticatedUser } from '../_shared/auth.ts'
import { deleteCloudinaryAsset, parseCloudinaryAccounts } from '../_shared/cloudinary.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse('Méthode non autorisée.', 405)
  }

  try {
    await getAuthenticatedUser(req)

    const body = await req.json() as { videoId?: string }
    const videoId = body.videoId?.trim()

    if (!videoId) {
      return errorResponse('ID vidéo requis.', 400)
    }

    const supabase = createUserClient(req)

    const { data: video, error: fetchError } = await supabase
      .from('videos')
      .select('id, cloudinary_public_id, cloudinary_account_index')
      .eq('id', videoId)
      .single()

    if (fetchError || !video) {
      return errorResponse('Vidéo introuvable.', 404)
    }

    const accounts = parseCloudinaryAccounts()
    const account = accounts[video.cloudinary_account_index]

    if (account) {
      await deleteCloudinaryAsset(account, video.cloudinary_public_id)
    }

    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId)

    if (deleteError) {
      return errorResponse(deleteError.message, 500)
    }

    return jsonResponse({ success: true })
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur.'
    return errorResponse(message, 400)
  }
})
