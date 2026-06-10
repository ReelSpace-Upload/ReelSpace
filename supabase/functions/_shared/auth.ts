import { createClient, type User } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

export async function getAuthenticatedUser(req: Request): Promise<User> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('Connexion requise.')
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Session invalide ou expirée.')
  }

  return user
}

export function createUserClient(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('Connexion requise.')
  }

  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
}

export function assertUploadSecret(req: Request) {
  const configured = Deno.env.get('UPLOAD_SECRET')
  if (!configured) return

  const provided = req.headers.get('x-upload-secret')
  if (provided !== configured) {
    throw new Error('Secret upload invalide.')
  }
}

export function getMaxVideoBytes(): number {
  const mb = Number(Deno.env.get('MAX_VIDEO_SIZE_MB') ?? '100')
  return Math.max(1, mb) * 1024 * 1024
}
