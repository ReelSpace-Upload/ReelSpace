import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getAuthenticatedUser, getMaxVideoBytes } from '../_shared/auth.ts'
import {
  buildPublicId,
  selectCloudinaryAccount,
  signCloudinaryParams,
  validateVideoMeta,
} from '../_shared/cloudinary.ts'

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
      filename?: string
      fileSize?: number
      mimeType?: string
    }

    const filename = body.filename?.trim()
    const fileSize = Number(body.fileSize)
    const mimeType = body.mimeType?.trim() ?? ''

    if (!filename || !Number.isFinite(fileSize)) {
      return errorResponse('Métadonnées fichier invalides.', 400)
    }

    const maxBytes = getMaxVideoBytes()
    validateVideoMeta(filename, mimeType, fileSize, maxBytes)

    const selected = await selectCloudinaryAccount(fileSize)
    const publicId = buildPublicId(filename, user.id)
    const timestamp = Math.round(Date.now() / 1000)

    const signParams = {
      public_id: publicId,
      timestamp,
    }

    const signature = await signCloudinaryParams(signParams, selected.account.apiSecret)

    return jsonResponse({
      cloudName: selected.account.cloudName,
      apiKey: selected.account.apiKey,
      timestamp,
      signature,
      publicId,
      accountIndex: selected.index,
      uploadUrl: `https://api.cloudinary.com/v1_1/${selected.account.cloudName}/video/upload`,
      maxBytes,
      freeBytes: selected.usage.freeBytes,
    })
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur.'
    const status = message.includes('Espace Cloudinary') ? 507 : 400
    return errorResponse(message, status)
  }
})
