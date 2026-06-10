<template>
  <div class="min-h-screen">
    <AppHeader />

    <main class="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <section class="mb-12 max-w-2xl">
        <UBadge color="primary" variant="subtle" size="sm" class="mb-4">
          Gratuit · 100 Mo max
        </UBadge>
        <h1 class="gradient-text text-3xl font-bold tracking-tight sm:text-5xl">
          Vos vidéos, un lien propre.
        </h1>
        <p class="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
          Uploadez, récupérez un lien ReelSpace, partagez-le partout.
          Gérez et supprimez vos fichiers depuis votre espace.
        </p>
      </section>

      <div v-if="!user" class="glass-panel mx-auto max-w-md rounded-2xl p-8 text-center">
        <UIcon name="i-lucide-shield-check" class="mx-auto mb-4 h-12 w-12 text-indigo-300" />
        <h2 class="text-xl font-semibold text-white">Connectez-vous pour uploader</h2>
        <p class="mt-2 text-sm text-slate-400">
          Vos uploads sont liés à votre compte et accessibles uniquement par vous.
        </p>
        <UButton to="/login" class="mt-6" color="primary" size="lg" icon="i-lucide-log-in" label="Se connecter" />
      </div>

      <template v-else>

        <UploadZone
          class="mb-10"
          :uploading="uploading"
          :progress="progress"
          :max-mb="maxVideoSizeMb"
          @upload="onUpload"
        />

        <VideoLibrary
          :videos="videos"
          :loading="loadingVideos"
          :deleting-id="deletingId"
          :format-size="formatSize"
          :format-date="formatDate"
          @refresh="loadVideos"
          @copy="onCopy"
          @delete="onDelete"
        />
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Video } from '~/types/database'

const toast = useToast()
const config = useRuntimeConfig()
const { user, shareUrl, fetchVideos, uploadVideo, deleteVideo, copyLink, formatSize, formatDate } = useVideos()

const maxVideoSizeMb = config.public.maxVideoSizeMb
const videos = ref<Video[]>([])
const loadingVideos = ref(false)
const uploading = ref(false)
const progress = ref(0)
const deletingId = ref<string | null>(null)

async function loadVideos() {
  if (!user.value) return
  loadingVideos.value = true
  try {
    videos.value = await fetchVideos()
  }
  catch (error) {
    toast.add({
      title: 'Erreur',
      description: error instanceof Error ? error.message : 'Chargement impossible.',
      color: 'error',
    })
  }
  finally {
    loadingVideos.value = false
  }
}

async function onUpload(file: File) {
  uploading.value = true
  progress.value = 0

  try {
    const video = await uploadVideo(file, (value) => {
      progress.value = value
    })

    videos.value = [video, ...videos.value]

    toast.add({
      title: 'En ligne',
      description: shareUrl(video.share_slug),
      color: 'success',
    })
  }
  catch (error) {
    toast.add({
      title: 'Échec de l\'envoi',
      description: error instanceof Error ? error.message : 'Une erreur est survenue.',
      color: 'error',
    })
  }
  finally {
    uploading.value = false
    progress.value = 0
  }
}

async function onCopy(slug: string) {
  try {
    await copyLink(shareUrl(slug))
    toast.add({ title: 'Lien copié', color: 'success' })
  }
  catch {
    toast.add({ title: 'Copie impossible', color: 'error' })
  }
}

async function onDelete(id: string) {
  deletingId.value = id
  try {
    await deleteVideo(id)
    videos.value = videos.value.filter(video => video.id !== id)
    toast.add({ title: 'Vidéo supprimée', color: 'success' })
  }
  catch (error) {
    toast.add({
      title: 'Suppression échouée',
      description: error instanceof Error ? error.message : 'Erreur inconnue.',
      color: 'error',
    })
  }
  finally {
    deletingId.value = null
  }
}

watch(user, async (value) => {
  if (value) await loadVideos()
  else videos.value = []
}, { immediate: true })
</script>
