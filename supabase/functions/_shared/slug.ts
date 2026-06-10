const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function generateShareSlug(length = 10): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, byte => SLUG_CHARS[byte % SLUG_CHARS.length]).join('')
}
