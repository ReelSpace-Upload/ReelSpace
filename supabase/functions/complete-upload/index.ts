import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { createUserClient, getAuthenticatedUser } from '../_shared/auth.ts'
import { parseCloudinaryAccounts, verifyCloudinaryAsset } from '../_shared/cloudinary.ts'
import { generateShareSlug } from '../_shared/slug.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse('Méthode non autorisée.', 405)
  }

  try {
    const user = await getAuthenticatedUser(req)

    const body = await req.json() as {
      publicId?: string
      accountIndex?: number
      originalFilename?: string
      mimeType?: string
    }

    const publicId = body.publicId?.trim()
    const accountIndex = Number(body.accountIndex)
    const originalFilename = body.originalFilename?.trim()
    const mimeType = body.mimeType?.trim() ?? 'video/mp4'

    if (!publicId || !originalFilename || !Number.isInteger(accountIndex) || accountIndex < 0) {
      return errorResponse('Données upload invalides.', 400)
    }

    if (!publicId.startsWith(`reelspace/${user.id}/`)) {
      return errorResponse('Identifiant vidéo non autorisé.', 403)
    }

    const accounts = parseCloudinaryAccounts()
    const account = accounts[accountIndex]
    if (!account) {
      return errorResponse('Compte Cloudinary introuvable.', 400)
    }

    const asset = await verifyCloudinaryAsset(account, publicId)
    const supabase = createUserClient(req)

    let data = null
    let lastError = ''

    for (let attempt = 0; attempt < 5; attempt++) {
      const shareSlug = generateShareSlug()
      const result = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: originalFilename.replace(/\.[^.]+$/, ''),
          original_filename: originalFilename,
          file_size: asset.bytes,
          mime_type: mimeType,
          cloudinary_public_id: asset.public_id,
          cloudinary_cloud_name: account.cloudName,
          cloudinary_account_index: accountIndex,
          url: asset.secure_url,
          share_slug: shareSlug,
        })
        .select('id, share_slug, original_filename, file_size, mime_type, created_at')
        .single()

      if (!result.error) {
        data = result.data
        break
      }

      lastError = result.error.message

      if (lastError.includes('share_slug')) {
        return errorResponse(
          'Colonne share_slug manquante. Exécutez supabase/migrations/002_share_slug.sql dans Supabase.',
          500,
        )
      }

      if (!lastError.includes('videos_share_slug_unique_idx') && !lastError.includes('duplicate key')) {
        return errorResponse(lastError, 500)
      }
    }

    if (!data) {
      return errorResponse(lastError || 'Impossible de créer le lien.', 500)
    }

    return jsonResponse({ video: data })
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur.'
    return errorResponse(message, 400)
  }
})
