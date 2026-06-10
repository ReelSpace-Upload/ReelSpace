import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getAuthenticatedUser } from '../_shared/auth.ts'
import { fetchCloudinaryUsage, formatBytes, parseCloudinaryAccounts } from '../_shared/cloudinary.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return errorResponse('Méthode non autorisée.', 405)
  }

  try {
    await getAuthenticatedUser(req)

    const accounts = parseCloudinaryAccounts()
    const statuses = []

    for (let index = 0; index < accounts.length; index++) {
      const account = accounts[index]!
      const usage = await fetchCloudinaryUsage(account)

      statuses.push({
        index,
        cloudName: account.cloudName,
        usedBytes: usage.usedBytes,
        limitBytes: usage.limitBytes,
        freeBytes: usage.freeBytes,
        usedLabel: formatBytes(usage.usedBytes),
        freeLabel: formatBytes(usage.freeBytes),
        limitLabel: formatBytes(usage.limitBytes),
        canAccept100Mb: usage.freeBytes >= 100 * 1024 * 1024,
      })
    }

    return jsonResponse({ accounts: statuses })
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur.'
    return errorResponse(message, 400)
  }
})
