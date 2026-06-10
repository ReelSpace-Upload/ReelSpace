export interface CloudinaryAccount {
  cloudName: string
  apiKey: string
  apiSecret: string
}

export interface CloudinaryUsage {
  usedBytes: number
  limitBytes: number
  freeBytes: number
}

const ALLOWED_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/ogg',
])

const ALLOWED_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'avi', 'mkv', 'ogv'])

const CLOUDINARY_SECRET_HELP =
  'Format attendu : supabase secrets set CLOUDINARY_ACCOUNTS=\'[{"cloudName":"compte","apiKey":"xxx","apiSecret":"yyy"}]\''

function unwrapQuotedJson(value: string): string {
  let current = value.trim()

  for (let i = 0; i < 3; i++) {
    if (
      (current.startsWith('"') && current.endsWith('"'))
      || (current.startsWith("'") && current.endsWith("'"))
    ) {
      current = current.slice(1, -1).trim()
      continue
    }
    break
  }

  return current
}

/** Normalise les secrets mal échappés (shell Windows, dashboard Supabase, etc.) */
function normalizeJsonSecret(value: string): string {
  let s = value.trim()
  // BOM UTF-8
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1)
  // Guillemets échappés littéraux : [{\"cloudName\":...}]
  if (s.includes('\\"')) s = s.replace(/\\"/g, '"')
  if (s.includes("\\'")) s = s.replace(/\\'/g, "'")
  return s
}

function parseCloudinaryAccountsJson(raw: string): CloudinaryAccount[] {
  const normalized = normalizeJsonSecret(raw)
  const unwrapped = unwrapQuotedJson(normalized)
  const candidates = [...new Set([raw, normalized, unwrapped, unwrapQuotedJson(unwrapped)])]

  let lastError: Error | null = null

  for (const candidate of candidates) {
    if (!candidate) continue

    try {
      const parsed = JSON.parse(candidate) as CloudinaryAccount[]
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('CLOUDINARY_ACCOUNTS doit être un tableau JSON non vide.')
      }

      return parsed.map((account, index) => {
        if (!account.cloudName || !account.apiKey || !account.apiSecret) {
          throw new Error(`Compte Cloudinary #${index + 1} incomplet.`)
        }
        return account
      })
    }
    catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }

  throw new Error(
    `CLOUDINARY_ACCOUNTS invalide : ${lastError?.message ?? 'JSON illisible'}. ${CLOUDINARY_SECRET_HELP}`,
  )
}

export function parseCloudinaryAccounts(): CloudinaryAccount[] {
  const raw = Deno.env.get('CLOUDINARY_ACCOUNTS')
  if (!raw?.trim()) {
    throw new Error(`Secret CLOUDINARY_ACCOUNTS manquant dans Supabase. ${CLOUDINARY_SECRET_HELP}`)
  }

  return parseCloudinaryAccountsJson(raw)
}

/** Quota stockage plan gratuit Cloudinary (~1 Go) */
const FREE_PLAN_STORAGE_BYTES = 1_073_741_824

interface CloudinaryUsageApiResponse {
  plan?: string
  storage?: { usage?: number, limit?: number, used_percent?: number }
}

function resolveStorageQuota(data: CloudinaryUsageApiResponse): CloudinaryUsage {
  const usedBytes = Math.max(0, data.storage?.usage ?? 0)
  const usedPercent = data.storage?.used_percent
  let limitBytes = Math.max(0, data.storage?.limit ?? 0)

  const plan = (data.plan ?? '').toLowerCase()
  const isFreePlan = plan.includes('free') || plan === ''

  // Plan gratuit : l'API renvoie souvent limit=0 alors que le quota réel est ~1 Go
  if (limitBytes <= 0 || (isFreePlan && limitBytes > FREE_PLAN_STORAGE_BYTES * 5)) {
    limitBytes = FREE_PLAN_STORAGE_BYTES
  }

  // used_percent est plus fiable quand présent
  if (usedPercent != null && usedPercent >= 0 && usedPercent <= 100) {
    if (usedBytes > 0 && usedPercent > 0) {
      const inferredLimit = Math.round(usedBytes / (usedPercent / 100))
      if (inferredLimit > 0 && inferredLimit <= FREE_PLAN_STORAGE_BYTES * 10) {
        limitBytes = inferredLimit
      }
    }
    const freeBytes = Math.floor(limitBytes * (1 - usedPercent / 100))
    return { usedBytes, limitBytes, freeBytes: Math.max(0, freeBytes) }
  }

  return {
    usedBytes,
    limitBytes,
    freeBytes: Math.max(0, limitBytes - usedBytes),
  }
}

export async function fetchCloudinaryUsage(account: CloudinaryAccount): Promise<CloudinaryUsage> {
  const credentials = btoa(`${account.apiKey}:${account.apiSecret}`)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${account.cloudName}/usage`,
    { headers: { Authorization: `Basic ${credentials}` } },
  )

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `Impossible de lire l'usage Cloudinary (${account.cloudName}). Vérifiez apiKey/apiSecret.${detail ? ` (${detail.slice(0, 80)})` : ''}`,
    )
  }

  const data = await response.json() as CloudinaryUsageApiResponse
  return resolveStorageQuota(data)
}

export async function selectCloudinaryAccount(requiredBytes: number) {
  const accounts = parseCloudinaryAccounts()
  const candidates: Array<{ account: CloudinaryAccount, index: number, usage: CloudinaryUsage }> = []
  const summaries: string[] = []

  for (let index = 0; index < accounts.length; index++) {
    const account = accounts[index]!
    const usage = await fetchCloudinaryUsage(account)
    summaries.push(
      `${account.cloudName}: ${formatBytes(usage.freeBytes)} libre / ${formatBytes(usage.limitBytes)}`,
    )
    if (usage.freeBytes >= requiredBytes) {
      candidates.push({ account, index, usage })
    }
  }

  if (candidates.length === 0) {
    throw new Error(
      `Espace insuffisant pour un fichier de ${formatBytes(requiredBytes)}. ${summaries.join(' · ')}`,
    )
  }

  candidates.sort((a, b) => b.usage.freeBytes - a.usage.freeBytes)
  return candidates[0]!
}

export function validateVideoMeta(filename: string, mimeType: string, fileSize: number, maxBytes: number) {
  const extension = filename.split('.').pop()?.toLowerCase() ?? ''
  const mimeOk = ALLOWED_MIME_TYPES.has(mimeType)
  const extOk = ALLOWED_EXTENSIONS.has(extension)

  if (!mimeOk && !extOk) {
    throw new Error('Format vidéo non supporté (MP4, WebM, MOV, AVI, MKV).')
  }

  if (fileSize <= 0) {
    throw new Error('Fichier vide.')
  }

  if (fileSize > maxBytes) {
    throw new Error(`Taille max : ${Math.round(maxBytes / (1024 * 1024))} Mo.`)
  }
}

export function buildPublicId(originalFilename: string, userId: string): string {
  const baseName = originalFilename
    .replace(/\.[^.]+$/, '')
    .replace(/[^\w.-]+/g, '_')
    .slice(0, 60)

  return `reelspace/${userId}/${Date.now()}_${baseName || 'video'}`
}

export async function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string,
): Promise<string> {
  const sorted = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')

  const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(sorted + apiSecret))
  return Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyCloudinaryAsset(account: CloudinaryAccount, publicId: string) {
  const credentials = btoa(`${account.apiKey}:${account.apiSecret}`)
  const encodedId = publicId.split('/').map(encodeURIComponent).join('/')

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${account.cloudName}/resources/video/upload/${encodedId}`,
    { headers: { Authorization: `Basic ${credentials}` } },
  )

  if (!response.ok) {
    throw new Error('Vidéo introuvable sur Cloudinary.')
  }

  return response.json() as Promise<{
    public_id: string
    secure_url: string
    bytes: number
    format: string
  }>
}

export async function deleteCloudinaryAsset(account: CloudinaryAccount, publicId: string) {
  const timestamp = Math.round(Date.now() / 1000)
  const params = { public_id: publicId, timestamp }
  const signature = await signCloudinaryParams(params, account.apiSecret)

  const body = new URLSearchParams({
    public_id: publicId,
    api_key: account.apiKey,
    timestamp: String(timestamp),
    signature,
  })

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${account.cloudName}/video/destroy`,
    { method: 'POST', body },
  )

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Suppression Cloudinary échouée: ${detail}`)
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`
}
