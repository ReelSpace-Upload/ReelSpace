<template>
  <div class="min-h-screen">
    <AppHeader />

    <main class="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section class="mb-10 sm:mb-14">
        <div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl">
            <div class="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
              <span class="relative flex h-2 w-2">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
                <span class="relative inline-flex h-2 w-2 rounded-full bg-indigo-400" />
              </span>
              Gratuit · {{ maxVideoSizeMb }} Mo max
            </div>
            <h1 class="gradient-text text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Vos vidéos,<br>un lien propre.
            </h1>
            <p class="mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              Uploadez, récupérez un lien ReelSpace, partagez-le partout.
              Gérez et supprimez vos fichiers depuis votre espace.
            </p>
          </div>

          <div v-if="user" class="grid grid-cols-3 gap-3 lg:w-auto">
            <div class="glass-panel rounded-2xl px-4 py-3 text-center">
              <p class="text-2xl font-semibold text-white">{{ videos.length }}</p>
              <p class="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">Vidéos</p>
            </div>
            <div class="glass-panel rounded-2xl px-4 py-3 text-center">
              <p class="text-2xl font-semibold text-white">{{ totalSizeLabel }}</p>
              <p class="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">Stockage</p>
            </div>
            <div class="glass-panel rounded-2xl px-4 py-3 text-center">
              <p class="text-2xl font-semibold text-white">{{ maxVideoSizeMb }}</p>
              <p class="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">Mo max</p>
            </div>
          </div>
        </div>
      </section>

      <div v-if="!user" class="glass-panel gradient-border mx-auto max-w-md rounded-3xl p-10 text-center">
        <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 ring-1 ring-inset ring-indigo-400/30">
          <UIcon name="i-lucide-shield-check" class="h-7 w-7 text-indigo-200" />
        </div>
        <h2 class="text-xl font-semibold text-white">Connectez-vous pour uploader</h2>
        <p class="mx-auto mt-2 max-w-xs text-sm text-slate-400">
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

const totalSizeLabel = computed(() => {
  const total = videos.value.reduce((sum, v) => sum + (v.file_size || 0), 0)
  return formatSize(total)
})

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
