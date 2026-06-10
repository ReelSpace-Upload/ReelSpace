import { FunctionsHttpError } from '@supabase/supabase-js'

export async function parseEdgeFunctionError(
  error: Error | null,
  payload?: { error?: string } | null,
): Promise<string> {
  if (payload?.error) return payload.error

  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json() as { error?: string, message?: string }
      if (body?.error) return body.error
      if (body?.message) return body.message
    }
    catch {
      // ignore JSON parse errors
    }
  }

  if (error?.message && !error.message.includes('non-2xx')) {
    return error.message
  }

  return 'Erreur serveur. Vérifiez que les Edge Functions et la base de données sont configurées.'
}
