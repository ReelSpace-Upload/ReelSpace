import type { PrepareUploadResponse, StorageAccountStatus, Video } from '~/types/database'
import { parseEdgeFunctionError } from '~/utils/edgeFunctionError'

export function useVideos() {
  const supabase = useSupabaseClient<import('~/types/database').Database>()
  const user = useSupabaseUser()
  const config = useRuntimeConfig()
  const requestUrl = useRequestURL()

  const maxBytes = computed(() => config.public.maxVideoSizeMb * 1024 * 1024)

  function shareUrl(slug: string) {
    const origin = import.meta.client ? window.location.origin : requestUrl.origin
    return `${origin}/v/${slug}`
  }

  async function fetchVideos() {
    const { data, error } = await supabase
      .from('videos')
      .select('id, share_slug, original_filename, file_size, mime_type, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      if (error.message.includes('share_slug')) {
        throw new Error('Migration manquante : exécutez 002_share_slug.sql dans Supabase SQL Editor.')
      }
      throw new Error(error.message)
    }
    return data as Video[]
  }

  async function fetchStorageStatus() {
    const { data, error } = await supabase.functions.invoke<{ accounts: StorageAccountStatus[], error?: string }>('storage-status')
    if (error) throw new Error(await parseEdgeFunctionError(error, data))
    if (data?.error) throw new Error(data.error)
    return data?.accounts ?? []
  }

  async function uploadVideo(file: File, onProgress?: (percent: number) => void) {
    if (file.size > maxBytes.value) {
      throw new Error(`Taille max : ${config.public.maxVideoSizeMb} Mo.`)
    }

    onProgress?.(5)

    const { data: prepareData, error: prepareError } = await supabase.functions.invoke<PrepareUploadResponse & { error?: string }>(
      'prepare-upload',
      { body: { filename: file.name, fileSize: file.size, mimeType: file.type } },
    )

    if (prepareError) throw new Error(await parseEdgeFunctionError(prepareError, prepareData))
    if (!prepareData || prepareData.error) {
      throw new Error(prepareData?.error ?? 'Préparation upload échouée.')
    }

    onProgress?.(20)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', prepareData.apiKey)
    formData.append('timestamp', String(prepareData.timestamp))
    formData.append('signature', prepareData.signature)
    formData.append('public_id', prepareData.publicId)
    formData.append('resource_type', 'video')

    const cloudinaryResponse = await fetch(prepareData.uploadUrl, {
      method: 'POST',
      body: formData,
    })

    if (!cloudinaryResponse.ok) {
      const detail = await cloudinaryResponse.text()
      throw new Error(`Envoi du fichier échoué. ${detail.slice(0, 120)}`)
    }

    onProgress?.(85)

    const { data: completeData, error: completeError } = await supabase.functions.invoke<{ video: Video, error?: string }>(
      'complete-upload',
      {
        body: {
          publicId: prepareData.publicId,
          accountIndex: prepareData.accountIndex,
          originalFilename: file.name,
          mimeType: file.type || 'video/mp4',
        },
      },
    )

    if (completeError) throw new Error(await parseEdgeFunctionError(completeError, completeData))
    if (!completeData?.video || completeData.error) {
      throw new Error(completeData?.error ?? 'Finalisation upload échouée.')
    }

    onProgress?.(100)
    return completeData.video
  }

  async function deleteVideo(videoId: string) {
    const { data, error } = await supabase.functions.invoke<{ success?: boolean, error?: string }>('delete-video', {
      body: { videoId },
    })

    if (error) throw new Error(await parseEdgeFunctionError(error, data))
    if (data?.error) throw new Error(data.error)
    return true
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url)
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  function formatDate(iso: string) {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  }

  return {
    user,
    maxBytes,
    shareUrl,
    fetchVideos,
    fetchStorageStatus,
    uploadVideo,
    deleteVideo,
    copyLink,
    formatSize,
    formatDate,
  }
}
